from datetime import datetime, timedelta, timezone
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from azure.core.exceptions import AzureError
from app.services.providers.base import BaseProvider


class AzureProvider(BaseProvider):
    def __init__(self, bucket_name: str, credentials: dict, region: str | None = None):
        super().__init__(bucket_name, credentials, region)
        
        # 'bucket_name' represents the 'container_name' in Azure terminology
        self.connection_string = self.credentials.get("connection_string")
        
        if self.connection_string:
            self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
            self.container_client = self.blob_service_client.get_container_client(self.bucket_name)
        else:
            self.blob_service_client = None
            self.container_client = None

    def validate_credentials(self) -> bool:
        """Validate by attempting to get container properties."""
        if not self.container_client:
            return False
            
        try:
            self.container_client.get_container_properties()
            return True
        except AzureError as e:
            print(f"Azure validation error: {e}")
            return False

    def get_used_bytes(self) -> int:
        """Sum all blob sizes in the container."""
        if not self.container_client:
            return 0
            
        try:
            blob_list = self.container_client.list_blobs()
            total_size = sum(blob.size for blob in blob_list if blob.size is not None)
            return total_size
        except AzureError:
            return 0

    def generate_upload_url(self, object_key: str, expires_in: int = 3600) -> str:
        """Generate a SAS URL for PUT."""
        if not self.blob_service_client:
            return ""
            
        try:
            sas_token = generate_blob_sas(
                account_name=self.blob_service_client.account_name,
                container_name=self.bucket_name,
                blob_name=object_key,
                account_key=self.blob_service_client.credential.account_key,
                permission=BlobSasPermissions(write=True),
                expiry=datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            )
            blob_client = self.container_client.get_blob_client(object_key)
            return f"{blob_client.url}?{sas_token}"
        except AzureError as e:
            print(f"Azure presigned upload error: {e}")
            return ""

    def generate_download_url(self, object_key: str, expires_in: int = 3600) -> str:
        """Generate a SAS URL for GET."""
        if not self.blob_service_client:
            return ""
            
        try:
            sas_token = generate_blob_sas(
                account_name=self.blob_service_client.account_name,
                container_name=self.bucket_name,
                blob_name=object_key,
                account_key=self.blob_service_client.credential.account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            )
            blob_client = self.container_client.get_blob_client(object_key)
            return f"{blob_client.url}?{sas_token}"
        except AzureError as e:
            print(f"Azure presigned download error: {e}")
            return ""

    def delete_object(self, object_key: str) -> bool:
        """Delete a blob from the container."""
        if not self.container_client:
            return False
            
        try:
            blob_client = self.container_client.get_blob_client(object_key)
            blob_client.delete_blob()
            return True
        except AzureError as e:
            print(f"Azure delete error for {object_key}: {e}")
            return False
