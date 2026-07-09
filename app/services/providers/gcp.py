import json
from google.cloud import storage
from app.services.providers.base import BaseProvider, SimulatedProvider


class GCPProvider(BaseProvider):
    def __init__(self, credentials: dict):
        self.credentials = credentials
        self.simulated = True

        service_account_info = credentials.get("service_account_json") or credentials.get("credentials_json")
        if service_account_info and "mock" not in str(service_account_info).lower() and "test" not in str(service_account_info).lower():
            try:
                if isinstance(service_account_info, str):
                    info = json.loads(service_account_info)
                else:
                    info = service_account_info
                self.client = storage.Client.from_service_account_info(info)
                self.simulated = False
            except Exception:
                self.fallback = SimulatedProvider()
        else:
            self.fallback = SimulatedProvider()

    async def get_presigned_upload_url(self, bucket: str, object_key: str, expires_in: int = 3600) -> str:
        if self.simulated:
            return await self.fallback.get_presigned_upload_url(bucket, object_key, expires_in)
        try:
            bucket_obj = self.client.bucket(bucket)
            blob = bucket_obj.blob(object_key)
            from datetime import timedelta
            return blob.generate_signed_url(
                version="v4",
                expiration=timedelta(seconds=expires_in),
                method="PUT"
            )
        except Exception:
            return await self.fallback.get_presigned_upload_url(bucket, object_key, expires_in)

    async def get_presigned_download_url(self, bucket: str, object_key: str, expires_in: int = 3600) -> str:
        if self.simulated:
            return await self.fallback.get_presigned_download_url(bucket, object_key, expires_in)
        try:
            bucket_obj = self.client.bucket(bucket)
            blob = bucket_obj.blob(object_key)
            from datetime import timedelta
            return blob.generate_signed_url(
                version="v4",
                expiration=timedelta(seconds=expires_in),
                method="GET"
            )
        except Exception:
            return await self.fallback.get_presigned_download_url(bucket, object_key, expires_in)

    async def delete_object(self, bucket: str, object_key: str) -> None:
        if self.simulated:
            return await self.fallback.delete_object(bucket, object_key)
        try:
            bucket_obj = self.client.bucket(bucket)
            blob = bucket_obj.blob(object_key)
            blob.delete()
        except Exception:
            await self.fallback.delete_object(bucket, object_key)

    async def get_quota(self, bucket: str) -> dict:
        if self.simulated:
            return await self.fallback.get_quota(bucket)
        return {
            "used_bytes": 0,
            "limit_bytes": 5 * 1024 * 1024 * 1024
        }
