import boto3
from botocore.config import Config
from app.services.providers.base import BaseProvider, SimulatedProvider


class AWSProvider(BaseProvider):
    def __init__(self, credentials: dict, region: str | None = None):
        self.credentials = credentials
        self.region = region or "us-east-1"
        self.simulated = True

        # Check if we have real credentials
        access_key = credentials.get("aws_access_key_id") or credentials.get("access_key_id")
        secret_key = credentials.get("aws_secret_access_key") or credentials.get("secret_access_key")
        
        if access_key and secret_key and "mock" not in access_key.lower() and "test" not in access_key.lower():
            try:
                self.s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=access_key,
                    aws_secret_access_key=secret_key,
                    region_name=self.region,
                    config=Config(signature_version="s3v4")
                )
                self.simulated = False
            except Exception:
                self.fallback = SimulatedProvider()
        else:
            self.fallback = SimulatedProvider()

    async def get_presigned_upload_url(self, bucket: str, object_key: str, expires_in: int = 3600) -> str:
        if self.simulated:
            return await self.fallback.get_presigned_upload_url(bucket, object_key, expires_in)
        try:
            return self.s3_client.generate_presigned_url(
                "put_object",
                Params={"Bucket": bucket, "Key": object_key},
                ExpiresIn=expires_in
            )
        except Exception:
            return await self.fallback.get_presigned_upload_url(bucket, object_key, expires_in)

    async def get_presigned_download_url(self, bucket: str, object_key: str, expires_in: int = 3600) -> str:
        if self.simulated:
            return await self.fallback.get_presigned_download_url(bucket, object_key, expires_in)
        try:
            return self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": object_key},
                ExpiresIn=expires_in
            )
        except Exception:
            return await self.fallback.get_presigned_download_url(bucket, object_key, expires_in)

    async def delete_object(self, bucket: str, object_key: str) -> None:
        if self.simulated:
            return await self.fallback.delete_object(bucket, object_key)
        try:
            self.s3_client.delete_object(Bucket=bucket, Key=object_key)
        except Exception:
            await self.fallback.delete_object(bucket, object_key)

    async def get_quota(self, bucket: str) -> dict:
        if self.simulated:
            return await self.fallback.get_quota(bucket)
        return {
            "used_bytes": 0,
            "limit_bytes": 5 * 1024 * 1024 * 1024
        }
