import asyncio
import httpx
import os

BASE_URL = os.getenv("API_URL", "http://localhost:7575")
if not BASE_URL.endswith("/api/v1"):
    BASE_URL = f"{BASE_URL.rstrip('/')}/api/v1"



async def main():
    async with httpx.AsyncClient() as client:
        print("=== 1. Registering user ===")
        # Generate a unique email to avoid conflict
        import random
        email = f"test_{random.randint(1000, 9999)}@example.com"
        reg_payload = {
            "first_name": "Test",
            "last_name": "User",
            "email": email,
            "password": "SecurePassword123!"
        }
        res = await client.post(f"{BASE_URL}/auth/register", json=reg_payload)
        print(f"Status: {res.status_code}")
        assert res.status_code == 201, res.text
        user_data = res.json()
        print(f"Registered user: {user_data['first_name']} {user_data['last_name']} ({user_data['email']})")

        print("\n=== 2. Logging in ===")
        login_payload = {
            "email": email,
            "password": "SecurePassword123!"
        }
        res = await client.post(f"{BASE_URL}/auth/login", json=login_payload)
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, res.text
        tokens = res.json()
        token = tokens["access_token"]
        print("Logged in successfully. Access token retrieved.")

        headers = {"Authorization": f"Bearer {token}"}

        print("\n=== 3. Getting User Profile ===")
        res = await client.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, res.text
        profile = res.json()
        print(f"Verified profile: {profile['first_name']} {profile['last_name']}, Plan: {profile['plan']}")

        print("\n=== 4. Adding Cloud Connection (AWS S3) ===")
        conn_payload = {
            "provider": "aws",
            "display_name": "My Personal AWS Vault",
            "bucket_name": "my-mock-aws-bucket",
            "region": "us-east-1",
            "credentials": {
                "aws_access_key_id": "mock_access_key",
                "aws_secret_access_key": "mock_secret_key"
            }
        }
        res = await client.post(f"{BASE_URL}/connections", json=conn_payload, headers=headers)
        print(f"Status: {res.status_code}")
        assert res.status_code == 201, res.text
        conn_data = res.json()
        connection_id = conn_data["id"]
        print(f"Linked Connection: {conn_data['display_name']} (ID: {connection_id})")

        print("\n=== 5. Listing Connections ===")
        res = await client.get(f"{BASE_URL}/connections", headers=headers)
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, res.text
        conns = res.json()
        print(f"Found {len(conns)} active connection(s)")
        assert len(conns) >= 1

        print("\n=== 6. Getting Quota Summary ===")
        res = await client.get(f"{BASE_URL}/quota/summary", headers=headers)
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, res.text
        quota = res.json()
        print(f"Unified storage pool: Used: {quota['total_used_bytes']} bytes, Free: {quota['total_free_bytes']} bytes, Limit: {quota['total_limit_bytes']} bytes")
        assert quota["total_used_bytes"] == 0
        assert quota["total_free_bytes"] == quota["total_limit_bytes"]

        print("\n=== 7. Requesting Upload (Smart Route should select AWS S3) ===")
        file_size = 120  # bytes
        upload_req = {
            "original_name": "test_upload.txt",
            "size_bytes": file_size,
            "mime_type": "text/plain"
        }
        res = await client.post(f"{BASE_URL}/files/upload-request", json=upload_req, headers=headers)
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, res.text
        upload_details = res.json()
        file_id = upload_details["file_id"]
        upload_url = upload_details["upload_url"]
        print(f"Router selected provider: {upload_details['provider']} (Bucket: {upload_details['bucket_name']})")
        print(f"File ID: {file_id}")
        print(f"Upload URL: {upload_url}")

        print("\n=== 8. Uploading file binary content (PUT to upload URL) ===")
        file_content = b"Welcome to NexusCloud unified multi-cloud storage orchestrator. This content is stored on our mock local server."
        res = await client.put(upload_url, content=file_content)
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, res.text
        print("File content successfully transferred.")

        print("\n=== 9. Confirming upload ===")
        res = await client.post(f"{BASE_URL}/files/confirm-upload/{file_id}", headers=headers)
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, res.text
        confirmed_file = res.json()
        print(f"File confirmed. Status is: {confirmed_file['status']}")
        assert confirmed_file["status"] == "active"

        print("\n=== 10. Verification of updated storage quota ===")
        res = await client.get(f"{BASE_URL}/quota/summary", headers=headers)
        print(f"Status: {res.status_code}")
        quota = res.json()
        print(f"Unified pool: Used: {quota['total_used_bytes']} bytes, Free: {quota['total_free_bytes']} bytes")
        assert quota["total_used_bytes"] == file_size

        print("\n=== 11. Listing files ===")
        res = await client.get(f"{BASE_URL}/files", headers=headers)
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, res.text
        files_list = res.json()
        print(f"Found {len(files_list)} active file(s)")
        assert len(files_list) == 1
        assert files_list[0]["original_name"] == "test_upload.txt"

        print("\n=== 12. Downloading file (Getting signed URL) ===")
        res = await client.get(f"{BASE_URL}/files/download/{file_id}", headers=headers)
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, res.text
        download_data = res.json()
        download_url = download_data["download_url"]
        print(f"Download URL: {download_url}")

        print("\n=== 13. Fetching downloaded content ===")
        res = await client.get(download_url)
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, res.text
        print(f"Downloaded content: '{res.read().decode()}'")
        assert res.content == file_content

        print("\n=== 14. Deleting file ===")
        res = await client.delete(f"{BASE_URL}/files/{file_id}", headers=headers)
        print(f"Status: {res.status_code}")
        assert res.status_code == 204

        print("\n=== 15. Listing files after deletion ===")
        res = await client.get(f"{BASE_URL}/files", headers=headers)
        print(f"Status: {res.status_code}")
        files_list = res.json()
        print(f"Found {len(files_list)} active file(s)")
        assert len(files_list) == 0

        print("\n=== 16. Verification of released storage quota ===")
        res = await client.get(f"{BASE_URL}/quota/summary", headers=headers)
        print(f"Status: {res.status_code}")
        quota = res.json()
        print(f"Unified pool: Used: {quota['total_used_bytes']} bytes, Free: {quota['total_free_bytes']} bytes")
        assert quota["total_used_bytes"] == 0

        print("\n=== 17. Testing Forgot Password ===")
        forgot_payload = {"email": email}
        res = await client.post(f"{BASE_URL}/auth/forgot-password", json=forgot_payload)
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, res.text
        print("Forgot password request completed.")

        print("\n🎉 ALL BACKEND API FLOW TESTS PASSED SUCCESSFULLY! 🎉")


if __name__ == "__main__":
    asyncio.run(main())
