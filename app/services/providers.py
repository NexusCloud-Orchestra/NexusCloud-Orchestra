"""Provider-specific data-plane URL strategies. No file bytes flow through these classes."""
from __future__ import annotations

import asyncio
import json
import re
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from azure.storage.blob import BlobSasPermissions, generate_blob_sas
from google.cloud import storage
from google.oauth2 import service_account

from app.core.config import settings
from app.core.security import issue_token


class StorageProvider(ABC):
    required: tuple[str, ...] = ()

    def validate(self, credentials: dict[str, str]) -> None:
        missing = [key for key in self.required if not credentials.get(key)]
        if missing:
            raise ValueError(f"Missing credential fields: {', '.join(missing)}")

    @abstractmethod
    async def verify_connection(self, connection, credentials: dict) -> None:
        pass

    @abstractmethod
    async def upload_url(self, connection, credentials: dict, object_key: str, mime_type: str, file_id) -> tuple[str, dict[str, str]]:
        pass

    @abstractmethod
    async def download_url(self, connection, credentials: dict, object_key: str, file_id) -> str:
        pass

    @abstractmethod
    async def exists(self, connection, credentials: dict, object_key: str, file_id) -> bool:
        pass

    @abstractmethod
    async def size(self, connection, credentials: dict, object_key: str, file_id) -> int:
        pass

    @abstractmethod
    async def delete(self, connection, credentials: dict, object_key: str, file_id) -> None:
        pass


class S3Provider(StorageProvider):
    required = ("aws_access_key_id", "aws_secret_access_key")

    def endpoint(self, connection, credentials: dict) -> str | None:
        return None

    def client(self, connection, credentials: dict):
        return boto3.client(
            "s3",
            aws_access_key_id=credentials["aws_access_key_id"],
            aws_secret_access_key=credentials["aws_secret_access_key"],
            region_name=connection.region or "us-east-1",
            endpoint_url=self.endpoint(connection, credentials),
            config=Config(signature_version="s3v4"),
        )

    async def verify_connection(self, connection, credentials):
        await asyncio.to_thread(self.client(connection, credentials).head_bucket, Bucket=connection.bucket_name)

    async def upload_url(self, connection, credentials, object_key, mime_type, file_id):
        url = self.client(connection, credentials).generate_presigned_url(
            "put_object",
            Params={"Bucket": connection.bucket_name, "Key": object_key, "ContentType": mime_type},
            ExpiresIn=900,
            HttpMethod="PUT",
        )
        return url, {"Content-Type": mime_type}

    async def download_url(self, connection, credentials, object_key, file_id):
        return self.client(connection, credentials).generate_presigned_url(
            "get_object", Params={"Bucket": connection.bucket_name, "Key": object_key}, ExpiresIn=3600
        )

    async def exists(self, connection, credentials, object_key, file_id):
        try:
            await asyncio.to_thread(self.client(connection, credentials).head_object, Bucket=connection.bucket_name, Key=object_key)
            return True
        except ClientError as exc:
            if exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 404:
                return False
            raise

    async def size(self, connection, credentials, object_key, file_id):
        result = await asyncio.to_thread(self.client(connection, credentials).head_object, Bucket=connection.bucket_name, Key=object_key)
        return result["ContentLength"]

    async def delete(self, connection, credentials, object_key, file_id):
        await asyncio.to_thread(self.client(connection, credentials).delete_object, Bucket=connection.bucket_name, Key=object_key)


class R2Provider(S3Provider):
    def endpoint(self, connection, credentials):
        return f"https://{credentials['account_id']}.r2.cloudflarestorage.com"

    def validate(self, credentials):
        super().validate(credentials)
        if not re.fullmatch(r"[a-fA-F0-9]{32}", credentials.get("account_id", "")):
            raise ValueError("Invalid R2 account_id")


class B2Provider(S3Provider):
    def endpoint(self, connection, credentials):
        return f"https://s3.{connection.region}.backblazeb2.com"

    def validate(self, credentials):
        super().validate(credentials)


class IBMProvider(S3Provider):
    def endpoint(self, connection, credentials):
        return f"https://s3.{connection.region}.cloud-object-storage.appdomain.cloud"


class AzureProvider(StorageProvider):
    required = ("account_name", "account_key")

    def validate(self, credentials):
        super().validate(credentials)
        if not re.fullmatch(r"[a-z0-9]{3,24}", credentials["account_name"]):
            raise ValueError("Invalid Azure account_name")

    def _url(self, connection, credentials, object_key, read):
        expiry = datetime.now(timezone.utc) + timedelta(seconds=3600 if read else 900)
        sas = generate_blob_sas(
            account_name=credentials["account_name"], container_name=connection.bucket_name,
            blob_name=object_key, account_key=credentials["account_key"],
            permission=BlobSasPermissions(read=True) if read else BlobSasPermissions(write=True, create=True),
            expiry=expiry,
        )
        return f"https://{credentials['account_name']}.blob.core.windows.net/{quote(connection.bucket_name)}/{quote(object_key)}?{sas}"

    async def verify_connection(self, connection, credentials):
        from azure.storage.blob import BlobServiceClient
        client = BlobServiceClient(account_url=f"https://{credentials['account_name']}.blob.core.windows.net", credential=credentials["account_key"])
        await asyncio.to_thread(client.get_container_client(connection.bucket_name).get_container_properties)

    async def upload_url(self, connection, credentials, object_key, mime_type, file_id):
        return self._url(connection, credentials, object_key, False), {"x-ms-blob-type": "BlockBlob", "Content-Type": mime_type}

    async def download_url(self, connection, credentials, object_key, file_id):
        return self._url(connection, credentials, object_key, True)

    async def exists(self, connection, credentials, object_key, file_id):
        from azure.storage.blob import BlobServiceClient
        from azure.core.exceptions import ResourceNotFoundError
        client = BlobServiceClient(account_url=f"https://{credentials['account_name']}.blob.core.windows.net", credential=credentials["account_key"])
        try:
            await asyncio.to_thread(client.get_blob_client(connection.bucket_name, object_key).get_blob_properties)
            return True
        except ResourceNotFoundError:
            return False

    async def size(self, connection, credentials, object_key, file_id):
        from azure.storage.blob import BlobServiceClient
        client = BlobServiceClient(account_url=f"https://{credentials['account_name']}.blob.core.windows.net", credential=credentials["account_key"])
        result = await asyncio.to_thread(client.get_blob_client(connection.bucket_name, object_key).get_blob_properties)
        return result.size

    async def delete(self, connection, credentials, object_key, file_id):
        from azure.storage.blob import BlobServiceClient
        from azure.core.exceptions import ResourceNotFoundError
        client = BlobServiceClient(account_url=f"https://{credentials['account_name']}.blob.core.windows.net", credential=credentials["account_key"])
        try:
            await asyncio.to_thread(client.get_blob_client(connection.bucket_name, object_key).delete_blob)
        except ResourceNotFoundError:
            pass


class GCPProvider(StorageProvider):
    required = ("service_account_json",)

    def validate(self, credentials):
        super().validate(credentials)
        try:
            info = json.loads(credentials["service_account_json"])
        except json.JSONDecodeError as exc:
            raise ValueError("Invalid GCP service_account_json") from exc
        if (
            info.get("type") != "service_account"
            or info.get("token_uri") != "https://oauth2.googleapis.com/token"
            or not info.get("private_key") or not info.get("client_email") or not info.get("project_id")
        ):
            raise ValueError("Invalid GCP service account fields")

    def _client(self, credentials):
        info = json.loads(credentials["service_account_json"])
        creds = service_account.Credentials.from_service_account_info(info)
        return storage.Client(project=info["project_id"], credentials=creds)

    async def verify_connection(self, connection, credentials):
        exists = await asyncio.to_thread(self._client(credentials).bucket(connection.bucket_name).exists)
        if not exists:
            raise ValueError("Bucket not found or inaccessible")

    async def upload_url(self, connection, credentials, object_key, mime_type, file_id):
        blob = self._client(credentials).bucket(connection.bucket_name).blob(object_key)
        return blob.generate_signed_url(version="v4", expiration=timedelta(minutes=15), method="PUT", content_type=mime_type), {"Content-Type": mime_type}

    async def download_url(self, connection, credentials, object_key, file_id):
        blob = self._client(credentials).bucket(connection.bucket_name).blob(object_key)
        return blob.generate_signed_url(version="v4", expiration=timedelta(minutes=60), method="GET")

    async def exists(self, connection, credentials, object_key, file_id):
        return await asyncio.to_thread(self._client(credentials).bucket(connection.bucket_name).blob(object_key).exists)

    async def size(self, connection, credentials, object_key, file_id):
        blob = self._client(credentials).bucket(connection.bucket_name).blob(object_key)
        await asyncio.to_thread(blob.reload)
        return blob.size

    async def delete(self, connection, credentials, object_key, file_id):
        from google.api_core.exceptions import NotFound
        try:
            await asyncio.to_thread(self._client(credentials).bucket(connection.bucket_name).blob(object_key).delete)
        except NotFound:
            pass


class OracleProvider(StorageProvider):
    required = ("tenancy_id", "user_id", "fingerprint", "private_key", "namespace")

    def _client(self, connection, credentials):
        import oci
        config = {
            "user": credentials["user_id"], "key_content": credentials["private_key"],
            "fingerprint": credentials["fingerprint"], "tenancy": credentials["tenancy_id"],
            "region": connection.region,
        }
        return oci.object_storage.ObjectStorageClient(config)

    async def verify_connection(self, connection, credentials):
        await asyncio.to_thread(self._client(connection, credentials).head_bucket, credentials["namespace"], connection.bucket_name)

    async def _par(self, connection, credentials, object_key, access):
        import oci
        client = self._client(connection, credentials)
        details = oci.object_storage.models.CreatePreauthenticatedRequestDetails(
            name=f"nexuscloud-{object_key.rsplit('/', 1)[-1]}",
            access_type=access, object_name=object_key,
            time_expires=datetime.now(timezone.utc) + timedelta(minutes=15 if access == "ObjectWrite" else 60),
        )
        response = await asyncio.to_thread(client.create_preauthenticated_request, credentials["namespace"], connection.bucket_name, details)
        result = response.data
        return f"https://objectstorage.{connection.region}.oraclecloud.com{result.access_uri}"

    async def upload_url(self, connection, credentials, object_key, mime_type, file_id):
        return await self._par(connection, credentials, object_key, "ObjectWrite"), {"Content-Type": mime_type}

    async def download_url(self, connection, credentials, object_key, file_id):
        return await self._par(connection, credentials, object_key, "ObjectRead")

    async def exists(self, connection, credentials, object_key, file_id):
        import oci
        try:
            await asyncio.to_thread(self._client(connection, credentials).head_object, credentials["namespace"], connection.bucket_name, object_key)
            return True
        except oci.exceptions.ServiceError as exc:
            if exc.status == 404:
                return False
            raise

    async def size(self, connection, credentials, object_key, file_id):
        result = await asyncio.to_thread(self._client(connection, credentials).head_object, credentials["namespace"], connection.bucket_name, object_key)
        return int(result.headers["content-length"])

    async def delete(self, connection, credentials, object_key, file_id):
        import oci
        try:
            await asyncio.to_thread(self._client(connection, credentials).delete_object, credentials["namespace"], connection.bucket_name, object_key)
        except oci.exceptions.ServiceError as exc:
            if exc.status != 404:
                raise


class LocalProvider(StorageProvider):
    """Explicit development mode only. The real product uses cloud-issued URLs."""
    async def verify_connection(self, connection, credentials):
        return None

    async def _url(self, file_id, operation):
        token, _, _ = issue_token(file_id, 0, f"local-{operation}", timedelta(minutes=15 if operation == "upload" else 60))
        return f"{settings.PUBLIC_API_URL.rstrip('/')}/api/v1/local-objects/{file_id}?token={quote(token)}"

    async def upload_url(self, connection, credentials, object_key, mime_type, file_id):
        return await self._url(file_id, "upload"), {"Content-Type": mime_type}

    async def download_url(self, connection, credentials, object_key, file_id):
        return await self._url(file_id, "download")

    async def exists(self, connection, credentials, object_key, file_id):
        from pathlib import Path
        return (Path(settings.LOCAL_STORAGE_PATH) / f"{file_id}.bin").is_file()

    async def size(self, connection, credentials, object_key, file_id):
        from pathlib import Path
        return (Path(settings.LOCAL_STORAGE_PATH) / f"{file_id}.bin").stat().st_size

    async def delete(self, connection, credentials, object_key, file_id):
        from pathlib import Path
        (Path(settings.LOCAL_STORAGE_PATH) / f"{file_id}.bin").unlink(missing_ok=True)


PROVIDER_CLASSES: dict[str, type[StorageProvider]] = {
    "aws": S3Provider, "r2": R2Provider, "b2": B2Provider, "ibm": IBMProvider,
    "azure": AzureProvider, "gcp": GCPProvider, "oracle": OracleProvider,
}


def provider_for(name: str) -> StorageProvider:
    if settings.LOCAL_STORAGE_ENABLED:
        return LocalProvider()
    return PROVIDER_CLASSES[name]()
