import ipaddress

from fastapi import Request

from app.core.config import settings


def _is_trusted(address: str, networks) -> bool:
    try:
        ip = ipaddress.ip_address(address)
    except ValueError:
        return False
    return any(ip in network for network in networks)


def client_ip(request: Request) -> str:
    """Peer address, or the right-most untrusted X-Forwarded-For entry when the peer is a trusted proxy."""
    peer = request.client.host if request.client else "unknown"
    networks = settings.trusted_networks
    if not _is_trusted(peer, networks):
        return peer
    forwarded = [part.strip() for part in request.headers.get("x-forwarded-for", "").split(",") if part.strip()]
    for entry in reversed(forwarded):
        if not _is_trusted(entry, networks):
            return entry
    return peer
