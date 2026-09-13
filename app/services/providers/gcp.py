import json
import datetime
from google.cloud import storage
from google.api_core.exceptions import GoogleAPIError
from app.services.providers.base import BaseProvider


class GCPProvider(BaseProvider):
    def __init__(self, bucket_name: str, credentials: dict, region: str | None = None):
        super().__init__(bucket_name, credentials, region)
        
        # Credentials can be a JSON string or a dict.
        service_account_info = self.credentials
        if isinstance(service_account_info, str):
            try:
                service_account_info = json.loads(service_account_info)
            except json.JSONDecodeError:
                pass
                
        self.client = storage.Client.from_service_account_info(service_account_info)
        self.bucket = self.client.bucket(self.bucket_name)

    def validate_credentials(self) -> bool:
        """Validate by trying to check if the bucket exists or list a single blob."""
        try:
            self.bucket.exists()
            return True
        except GoogleAPIError as e:
            print(f"GCP validation error: {e}")
            return False
        except Exception as e:
            print(f"GCP init error: {e}")
            return False

    def get_used_bytes(self) -> int:
        """Sum all blob sizes in the bucket."""
        try:
            blobs = self.client.list_blobs(self.bucket_name)
            return sum(blob.size for blob in blobs if blob.size is not None)
        except GoogleAPIError:
            return 0

    def generate_upload_url(self, object_key: str, expires_in: int = 3600) -> str:
        """Generate a signed URL for PUT."""
        blob = self.bucket.blob(object_key)
        return blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(seconds=expires_in),
            method="PUT"
        )

    def generate_download_url(self, object_key: str, expires_in: int = 3600) -> str:
        """Generate a signed URL for GET."""
        blob = self.bucket.blob(object_key)
        return blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(seconds=expires_in),
            method="GET"
        )

    def delete_object(self, object_key: str) -> bool:
        """Delete an object from GCP bucket."""
        try:
            blob = self.bucket.blob(object_key)
            blob.delete()
            return True
        except GoogleAPIError as e:
            print(f"GCP delete error for {object_key}: {e}")
            return False
