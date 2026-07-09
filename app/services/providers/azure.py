from app.services.providers.base import BaseProvider, SimulatedProvider


class AzureProvider(BaseProvider):
    def __init__(self, credentials: dict):
        self.credentials = credentials
        self.fallback = SimulatedProvider()

    async def get_presigned_upload_url(self, bucket: str, object_key: str, expires_in: int = 3600) -> str:
        return await self.fallback.get_presigned_upload_url(bucket, object_key, expires_in)

    async def get_presigned_download_url(self, bucket: str, object_key: str, expires_in: int = 3600) -> str:
        return await self.fallback.get_presigned_download_url(bucket, object_key, expires_in)

    async def delete_object(self, bucket: str, object_key: str) -> None:
        await self.fallback.delete_object(bucket, object_key)

    async def get_quota(self, bucket: str) -> dict:
        return await self.fallback.get_quota(bucket)
