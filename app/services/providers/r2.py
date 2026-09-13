import boto3
from botocore.exceptions import ClientError
from app.services.providers.base import BaseProvider


class R2Provider(BaseProvider):
    def __init__(self, bucket_name: str, credentials: dict, region: str | None = None):
        super().__init__(bucket_name, credentials, region)
        
        self.account_id = self.credentials.get("account_id")
        self.access_key = self.credentials.get("access_key")
        self.secret_key = self.credentials.get("secret_key")
        
        self.endpoint_url = f"https://{self.account_id}.r2.cloudflarestorage.com"
        
        self.client = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region or "auto"
        )

    def validate_credentials(self) -> bool:
        """Validate by attempting to list the bucket."""
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            return True
        except ClientError as e:
            print(f"R2 validation error: {e}")
            return False

    def get_used_bytes(self) -> int:
        """Sum all object sizes in the bucket."""
        try:
            paginator = self.client.get_paginator('list_objects_v2')
            total_size = 0
            for page in paginator.paginate(Bucket=self.bucket_name):
                if 'Contents' in page:
                    for obj in page['Contents']:
                        total_size += obj.get('Size', 0)
            return total_size
        except ClientError:
            return 0

    def generate_upload_url(self, object_key: str, expires_in: int = 3600) -> str:
        """Generate a signed URL for PUT."""
        try:
            return self.client.generate_presigned_url(
                'put_object',
                Params={'Bucket': self.bucket_name, 'Key': object_key},
                ExpiresIn=expires_in
            )
        except ClientError as e:
            print(f"R2 presigned upload error: {e}")
            return ""

    def generate_download_url(self, object_key: str, expires_in: int = 3600) -> str:
        """Generate a signed URL for GET."""
        try:
            return self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_key},
                ExpiresIn=expires_in
            )
        except ClientError as e:
            print(f"R2 presigned download error: {e}")
            return ""

    def delete_object(self, object_key: str) -> bool:
        """Delete an object from R2 bucket."""
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=object_key)
            return True
        except ClientError as e:
            print(f"R2 delete error for {object_key}: {e}")
            return False
