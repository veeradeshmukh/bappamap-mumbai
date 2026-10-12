import base64
import os
import uuid
from pathlib import Path

from backend.app.core.config import settings


class StorageService:
    def __init__(self):
        self.r2_enabled = bool(settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY and settings.R2_ENDPOINT_URL)
        self.local_dir = Path(settings.LOCAL_STORAGE_DIR)
        self.quarantine_dir = self.local_dir / "quarantine"
        self.public_dir = self.local_dir / "public"

        # Ensure local directories exist
        self.quarantine_dir.mkdir(parents=True, exist_ok=True)
        self.public_dir.mkdir(parents=True, exist_ok=True)

    async def save_quarantine_image(self, data_url_or_bytes: str | bytes, extension: str = "webp") -> tuple[str, str]:
        """Saves an image into the quarantine bucket or directory.

        Returns (storage_key, relative_or_public_url).
        """
        file_id = f"photo_{uuid.uuid4().hex[:12]}.{extension}"

        if isinstance(data_url_or_bytes, str) and data_url_or_bytes.startswith("data:"):
            # Strip base64 prefix
            header, encoded = data_url_or_bytes.split(",", 1)
            raw_bytes = base64.b64decode(encoded)
        elif isinstance(data_url_or_bytes, str):
            raw_bytes = base64.b64decode(data_url_or_bytes)
        else:
            raw_bytes = data_url_or_bytes

        if self.r2_enabled:
            import boto3
            s3 = boto3.client(
                "s3",
                endpoint_url=settings.R2_ENDPOINT_URL,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            )
            key = f"quarantine/{file_id}"
            s3.put_object(
                Bucket=settings.R2_QUARANTINE_BUCKET,
                Key=key,
                Body=raw_bytes,
                ContentType=f"image/{extension}",
            )
            return key, f"/api/media/quarantine/{file_id}"
        else:
            local_path = self.quarantine_dir / file_id
            with open(local_path, "wb") as f:
                f.write(raw_bytes)
            key = f"local_quarantine/{file_id}"
            return key, f"/api/media/quarantine/{file_id}"

    async def promote_to_public(self, storage_key: str) -> str:
        """Promotes a quarantined photo to the public bucket or folder on approval.

        Returns public_url.
        """
        filename = os.path.basename(storage_key)

        if self.r2_enabled:
            import boto3
            s3 = boto3.client(
                "s3",
                endpoint_url=settings.R2_ENDPOINT_URL,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            )
            public_key = f"public/{filename}"
            # Copy from quarantine to public
            s3.copy_object(
                Bucket=settings.R2_PUBLIC_BUCKET,
                CopySource={"Bucket": settings.R2_QUARANTINE_BUCKET, "Key": storage_key},
                Key=public_key,
            )
            # Delete from quarantine
            s3.delete_object(Bucket=settings.R2_QUARANTINE_BUCKET, Key=storage_key)
            return f"{settings.R2_PUBLIC_DOMAIN}/{public_key}"
        else:
            src = self.quarantine_dir / filename
            dst = self.public_dir / filename
            if src.exists():
                dst.write_bytes(src.read_bytes())
                try:
                    src.unlink()
                except Exception:
                    pass
            return f"/api/media/public/{filename}"


storage_service = StorageService()
