"""Exercise one real provider through the public API and direct signed URLs.

Set NEXUS_API_URL, NEXUS_PROVIDER, NEXUS_BUCKET, and
NEXUS_PROVIDER_CREDENTIALS_JSON. NEXUS_REGION is optional.
The script creates and removes a temporary account.
"""

import asyncio
import json
import os
import secrets
import sys
from uuid import uuid4

import httpx


def required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise ValueError(f"{name} is required")
    return value


def checked(response: httpx.Response, *statuses: int) -> dict:
    if response.status_code not in statuses:
        raise RuntimeError(f"{response.request.method} {response.request.url.path}: HTTP {response.status_code}: {response.text}")
    return response.json() if response.content else {}


async def main() -> None:
    base = required_env("NEXUS_API_URL").rstrip("/")
    api = base if base.endswith("/api/v1") else f"{base}/api/v1"
    provider = required_env("NEXUS_PROVIDER")
    bucket = required_env("NEXUS_BUCKET")
    credentials = json.loads(required_env("NEXUS_PROVIDER_CREDENTIALS_JSON"))
    if not isinstance(credentials, dict) or not credentials:
        raise ValueError("NEXUS_PROVIDER_CREDENTIALS_JSON must be a nonempty object")
    email = f"nexus-smoke-{uuid4().hex}@example.com"
    password = secrets.token_urlsafe(32)
    content = secrets.token_bytes(1024)
    file_id = None
    connection_id = None
    active = False
    headers = {}
    cleanup_errors = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            checked(await client.post(f"{api}/auth/register", json={
                "first_name": "Cloud", "last_name": "Smoke", "email": email, "password": password,
            }), 201)
            print(f"Temporary account: {email}")
            login = checked(await client.post(f"{api}/auth/login", json={
                "email": email, "password": password,
            }), 200)
            headers = {"Authorization": f"Bearer {login['access_token']}"}
            connection = checked(await client.post(f"{api}/connections", headers=headers, json={
                "provider": provider,
                "display_name": f"Smoke {provider}",
                "bucket_name": bucket,
                "region": os.environ.get("NEXUS_REGION") or None,
                "credentials": credentials,
            }), 201)
            connection_id = connection["id"]
            before = checked(await client.get(f"{api}/quota/summary", headers=headers), 200)
            ticket = checked(await client.post(f"{api}/files/upload-request", headers=headers, json={
                "original_name": "nexus-smoke.bin",
                "size_bytes": len(content),
                "mime_type": "application/octet-stream",
            }), 200)
            file_id = ticket["file_id"]
            if ticket["connection_id"] != connection_id:
                raise RuntimeError("Router selected an unexpected connection")
            pending = checked(await client.get(f"{api}/quota/summary", headers=headers), 200)
            if pending["total_reserved_bytes"] != len(content):
                raise RuntimeError("Upload reservation was not reflected in quota")

            put = await client.put(ticket["upload_url"], content=content, headers=ticket["required_headers"])
            checked(put, 200, 201, 204)
            for attempt in range(5):
                confirmation = await client.post(f"{api}/files/confirm-upload/{file_id}", headers=headers, json={})
                if confirmation.status_code == 200:
                    active = True
                    break
                if confirmation.status_code != 409 or attempt == 4:
                    checked(confirmation, 200)
                await asyncio.sleep(1)
            uploaded = checked(await client.get(f"{api}/quota/summary", headers=headers), 200)
            if uploaded["total_used_bytes"] != before["total_used_bytes"] + len(content):
                raise RuntimeError("Confirmed upload was not charged to quota")
            download = checked(await client.get(f"{api}/files/download/{file_id}", headers=headers), 200)
            raw = await client.get(download["download_url"])
            if raw.status_code != 200:
                raise RuntimeError(f"Signed download failed: HTTP {raw.status_code}")
            if raw.content != content:
                raise RuntimeError("Downloaded bytes differ from uploaded bytes")

            checked(await client.delete(f"{api}/files/{file_id}", headers=headers), 204)
            file_id = None
            active = False
            after = checked(await client.get(f"{api}/quota/summary", headers=headers), 200)
            if after["total_used_bytes"] != before["total_used_bytes"]:
                raise RuntimeError("File deletion did not reclaim quota")
            checked(await client.delete(f"{api}/connections/{connection_id}", headers=headers), 204)
            connection_id = None
            print(f"{provider}: upload, download, quota, deletion, and disconnect passed")
        finally:
            if file_id and headers:
                path = f"/files/{file_id}" if active else f"/files/cancel-upload/{file_id}"
                try:
                    if active:
                        response = await client.delete(f"{api}{path}", headers=headers)
                    else:
                        response = await client.post(f"{api}{path}", headers=headers, json={})
                    if response.status_code != 204:
                        cleanup_errors.append(f"file {file_id}: HTTP {response.status_code}")
                except httpx.HTTPError as exc:
                    cleanup_errors.append(f"file {file_id}: {exc.__class__.__name__}")
            if connection_id and headers:
                try:
                    response = await client.delete(f"{api}/connections/{connection_id}", headers=headers)
                    if response.status_code != 204:
                        cleanup_errors.append(f"connection {connection_id}: HTTP {response.status_code}")
                except httpx.HTTPError as exc:
                    cleanup_errors.append(f"connection {connection_id}: {exc.__class__.__name__}")
            if headers:
                try:
                    response = await client.post(f"{api}/auth/delete-account", headers=headers, json={"password": password})
                    if response.status_code != 204:
                        cleanup_errors.append(f"account {email}: HTTP {response.status_code}")
                except httpx.HTTPError as exc:
                    cleanup_errors.append(f"account {email}: {exc.__class__.__name__}")
            if cleanup_errors:
                print("Manual cleanup required: " + "; ".join(cleanup_errors), file=sys.stderr)
                raise RuntimeError("Smoke test left temporary resources behind")


if __name__ == "__main__":
    asyncio.run(main())
