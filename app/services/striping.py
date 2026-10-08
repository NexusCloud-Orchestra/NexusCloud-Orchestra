"""Deterministic content index and cross-provider placement for striped files."""

import hashlib
import re
from collections import defaultdict
from uuid import UUID

from app.services.catalog import PROVIDERS
from app.services.router import Candidate, SmartRouter

CHUNK_BYTES = 16 * 1024**2
MAX_CHUNKS = 320
HASH_PATTERN = re.compile(r"^[0-9a-f]{64}$")


def index_hash(chunks: list[tuple[int, str]]) -> str:
    """Legacy v1 content index, retained for files created before v2."""
    digest = hashlib.sha256(b"nexuscloud-stripe-v1\0")
    for size, sha256 in chunks:
        digest.update(size.to_bytes(8, "big"))
        digest.update(bytes.fromhex(sha256))
    return digest.hexdigest()


def manifest_index_hash(
    size_bytes: int,
    chunks: list[tuple[int, str, UUID, UUID, str]],
) -> str:
    """v2 index commits to ordered content and the exact BYOC placement map."""
    digest = hashlib.sha256(b"nexuscloud-stripe-v2\0")
    digest.update(size_bytes.to_bytes(8, "big"))
    digest.update(len(chunks).to_bytes(4, "big"))
    for size, sha256, chunk_id, connection_id, provider in chunks:
        encoded_provider = provider.encode("ascii")
        digest.update(size.to_bytes(8, "big"))
        digest.update(bytes.fromhex(sha256))
        digest.update(chunk_id.bytes)
        digest.update(connection_id.bytes)
        digest.update(len(encoded_provider).to_bytes(1, "big"))
        digest.update(encoded_provider)
    return digest.hexdigest()


def validate_manifest(manifest) -> list:
    """Reject inconsistent stored indexes before issuing any object URL."""
    ordered = sorted(manifest.chunks, key=lambda chunk: chunk.chunk_index if chunk.chunk_index is not None else -1)
    if len(ordered) != manifest.chunk_count or not 2 <= len(ordered) <= MAX_CHUNKS:
        raise ValueError("Chunk count differs from manifest")
    if manifest.size_bytes <= CHUNK_BYTES or manifest.size_bytes > MAX_CHUNKS * CHUNK_BYTES:
        raise ValueError("Invalid manifest size")
    if sum(chunk.size_bytes for chunk in ordered) != manifest.size_bytes:
        raise ValueError("Chunk sizes differ from manifest")
    for index, chunk in enumerate(ordered):
        if (
            chunk.chunk_index != index
            or chunk.size_bytes != min(CHUNK_BYTES, manifest.size_bytes - index * CHUNK_BYTES)
            or not chunk.sha256
            or not HASH_PATTERN.fullmatch(chunk.sha256)
            or chunk.user_id != manifest.user_id
            or chunk.manifest_id != manifest.id
            or chunk.connection is None
            or chunk.connection.id != chunk.connection_id
            or chunk.connection.user_id != manifest.user_id
            or chunk.connection.provider not in PROVIDERS
            or not chunk.connection.is_active
            or (
                manifest.status in ("pending", "active", "cleanup_pending")
                and chunk.status != manifest.status
            )
        ):
            raise ValueError("Invalid chunk entry")
    if len({chunk.connection.provider for chunk in ordered}) < 2:
        raise ValueError("Manifest is not cross-provider")
    if manifest.index_version == 1:
        expected = index_hash([(chunk.size_bytes, chunk.sha256) for chunk in ordered])
    elif manifest.index_version == 2:
        expected = manifest_index_hash(manifest.size_bytes, [
            (chunk.size_bytes, chunk.sha256, chunk.id, chunk.connection_id, chunk.connection.provider)
            for chunk in ordered
        ])
    else:
        raise ValueError("Unsupported index version")
    if expected != manifest.index_hash:
        raise ValueError("Manifest index hash mismatch")
    return ordered


def place_chunks(connections: list, used_bytes: dict[UUID, int], sizes: list[int]) -> list | None:
    """Round-robin among distinct providers, using router scores within each provider."""
    free = {
        connection.id: max(0, PROVIDERS[connection.provider].free_bytes - used_bytes.get(connection.id, 0))
        for connection in connections
    }
    groups = defaultdict(list)
    for connection in connections:
        groups[connection.provider].append(connection)
    if len(groups) < 2:
        return None
    router = SmartRouter()
    first = sizes[0]
    provider_order = sorted(
        groups,
        key=lambda provider: max(
            (evaluation.score or 0.0)
            for evaluation in router.evaluate(
                [Candidate(connection, free[connection.id]) for connection in groups[provider]], first
            )
        ),
        reverse=True,
    )
    chosen = []
    used_providers = set()
    for index, size in enumerate(sizes):
        selected = None
        for offset in range(len(provider_order)):
            provider = provider_order[(index + offset) % len(provider_order)]
            candidates = [Candidate(connection, free[connection.id]) for connection in groups[provider]]
            candidate = router.select(candidates, size)
            if candidate:
                selected = candidate.connection
                break
        if selected is None:
            return None
        chosen.append(selected)
        used_providers.add(selected.provider)
        free[selected.id] -= size
    if len(used_providers) < 2:
        # Greedy rotation can miss a second provider that only fits the tail.
        for index in sorted(range(len(sizes)), key=lambda position: sizes[position]):
            for provider in provider_order:
                if provider in used_providers:
                    continue
                candidate = router.select(
                    [Candidate(connection, free[connection.id]) for connection in groups[provider]],
                    sizes[index],
                )
                if candidate:
                    chosen[index] = candidate.connection
                    used_providers.add(provider)
                    break
            if len(used_providers) >= 2:
                break
    return chosen if len(used_providers) >= 2 else None
