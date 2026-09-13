from abc import ABC, abstractmethod
from typing import Dict, Any

from app.core.config import settings



class BaseProvider(ABC):
    @abstractmethod
    def __init__(self, bucket_name: str, credentials: dict, region: str | None = None):
        self.bucket_name = bucket_name
        self.credentials = credentials
        self.region = region

    @abstractmethod
    def validate_credentials(self) -> bool:
        """Validate that the provided credentials can access the bucket."""
        pass

    @abstractmethod
    def get_used_bytes(self) -> int:
        """Calculate and return the total size of the bucket in bytes."""
        pass

    @abstractmethod
    def generate_upload_url(self, object_key: str, expires_in: int = 3600) -> str:
        """Generate a presigned URL to upload a file directly to the bucket."""
        pass

    @abstractmethod
    def generate_download_url(self, object_key: str, expires_in: int = 3600) -> str:
        """Generate a presigned URL to download a file directly from the bucket."""
        pass

    @abstractmethod
    def delete_object(self, object_key: str) -> bool:
        """Delete an object from the storage bucket."""
        pass


class SimulatedProvider(BaseProvider):
    def __init__(self, bucket_name: str, credentials: dict, region: str | None = None):
        super().__init__(bucket_name, credentials, region)

    def validate_credentials(self) -> bool:
        return True

    def get_used_bytes(self) -> int:
        return 0

    def generate_upload_url(self, object_key: str, expires_in: int = 3600) -> str:
        return f"{settings.API_URL}/api/v1/files/mock-upload/{object_key}"

    def generate_download_url(self, object_key: str, expires_in: int = 3600) -> str:
        return f"{settings.API_URL}/api/v1/files/mock-download/{object_key}"

    def delete_object(self, object_key: str) -> bool:
        print(f"[SimulatedProvider] Deleting object {object_key} from bucket {self.bucket_name}")
        return True
