from dataclasses import dataclass

from app.services.catalog import PROVIDERS


@dataclass(frozen=True)
class Candidate:
    connection: object
    free_bytes: int


class SmartRouter:
    """Deterministic weighted placement policy from PRD FR-001."""

    def select(self, candidates: list[Candidate], size_bytes: int) -> Candidate | None:
        eligible = [candidate for candidate in candidates if candidate.free_bytes >= size_bytes]
        if not eligible:
            return None
        max_free = max(c.free_bytes for c in eligible)

        def score(candidate: Candidate):
            spec = PROVIDERS[candidate.connection.provider]
            free_norm = candidate.free_bytes / max_free
            fit = (candidate.free_bytes - size_bytes) / candidate.free_bytes
            return (
                0.40 * free_norm + 0.30 * spec.inverse_egress
                + 0.20 * (1.0 if spec.permanent else 0.5) + 0.10 * fit
            )

        return max(eligible, key=lambda c: (score(c), str(c.connection.id)))
