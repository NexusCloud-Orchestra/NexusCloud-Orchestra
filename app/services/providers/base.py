from abc import ABC, abstractmethod
from typing import Dict, Any

from app.core.config import settings



class BaseProvider(ABC):

    @abstractmethod
    async def get_presigned_upload_url(
        self, bucket: str, object_key: str, expires_in: int = 3600
    ) -> str:
        """Generate a presigned URL to upload a file directly to the bucket."""
        pass

    @abstractmethod
    async def get_presigned_download_url(
        self, bucket: str, object_key: str, expires_in: int = 3600
    ) -> str:
        """Generate a presigned URL to download a file directly from the bucket."""
        pass

    @abstractmethod
    async def delete_object(self, bucket: str, object_key: str) -> None:
        """Delete an object from the storage bucket."""
        pass

    @abstractmethod
    async def get_quota(self, bucket: str) -> Dict[str, Any]:
        """Fetch storage quota/utilization details for the bucket."""
        pass


class SimulatedProvider(BaseProvider):

    async def get_presigned_upload_url(
        self, bucket: str, object_key: str, expires_in: int = 3600
    ) -> str:
        # Mock upload route mapping to our local development backend
        return f"{settings.API_URL}/api/v1/files/mock-upload/{object_key}"

    async def get_presigned_download_url(
        self, bucket: str, object_key: str, expires_in: int = 3600
    ) -> str:
        # Mock download route mapping to our local development backend
        return f"{settings.API_URL}/api/v1/files/mock-download/{object_key}"

    async def delete_object(self, bucket: str, object_key: str) -> None:
        # Locally deletion is handled when the file record is updated, but we can print logs
        print(f"[SimulatedProvider] Deleting object {object_key} from bucket {bucket}")

    async def get_quota(self, bucket: str) -> Dict[str, Any]:
        # Return dummy used/limit information for mock accounts
        return {
            "used_bytes": 0,  # Starts at 0, updated dynamically as uploads happen
            "limit_bytes": 10 * 1024 * 1024 * 1024,
        }
