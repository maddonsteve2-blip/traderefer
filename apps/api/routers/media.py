from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
import boto3
import uuid
import os
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db
from services.auth import get_current_user, AuthenticatedUser
from utils.logging_config import general_logger, error_logger

router = APIRouter()

# API base URL for constructing Neon-served file URLs
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")

# AWS S3 / R2 Configuration
S3_BUCKET = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("S3_REGION", "auto")
S3_ENDPOINT = os.getenv("S3_ENDPOINT_URL")
S3_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
S3_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_PUBLIC_URL = os.getenv("S3_PUBLIC_URL")

# Only initialize S3 client if configured
s3_client = None
if S3_BUCKET and S3_ACCESS_KEY and S3_SECRET_KEY:
    s3_client = boto3.client(
        's3',
        region_name=S3_REGION,
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY
    )

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def _validate_file(file: UploadFile):
    ext = file.filename.split('.')[-1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Supported: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Check size by seeking to end
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0) # Reset to start
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB")
    
    return ext

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form("general"),
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
    """Uploads a file. Stores in S3 if configured, otherwise saves to Neon (PostgreSQL)."""

    if not s3_client:
        # Neon fallback: store binary data in media_files table
        try:
            ext = _validate_file(file)
            data = await file.read()
            filename = f"{uuid.uuid4().hex}.{ext}"
            content_type = file.content_type or f"image/{ext}"
            file_id = str(uuid.uuid4())

            await db.execute(
                text("""
                    INSERT INTO media_files (id, folder, filename, content_type, data, uploaded_by)
                    VALUES (:id, :folder, :filename, :content_type, :data, :uploaded_by)
                """),
                {
                    "id": file_id,
                    "folder": folder,
                    "filename": filename,
                    "content_type": content_type,
                    "data": data,
                    "uploaded_by": user.id,
                },
            )
            await db.commit()

            url = f"{API_BASE_URL}/media/serve/{file_id}"
            general_logger.info(f"[neon] Stored {folder}/{filename} ({len(data)} bytes) → {url}")
            return {"url": url}
        except HTTPException:
            raise
        except Exception as exc:
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Neon upload error: {exc}")

    # S3 path
    ext = _validate_file(file)
    filename = f"{folder}/{user.id}/{uuid.uuid4().hex}.{ext}"

    try:
        s3_client.upload_fileobj(
            file.file,
            S3_BUCKET,
            filename,
            ExtraArgs={
                "ContentType": file.content_type,
                "ACL": "public-read",
            },
        )
        url = f"{S3_PUBLIC_URL}/{filename}" if S3_PUBLIC_URL else f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{filename}"
        return {"url": url}

    except Exception as e:
        error_logger.error(f"S3 Upload Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to upload file")


@router.get("/serve/{file_id}")
async def serve_file(file_id: str, db: AsyncSession = Depends(get_db)):
    """Serve an image stored in Neon. No auth required (URLs are unguessable UUIDs)."""
    result = await db.execute(
        text("SELECT data, content_type FROM media_files WHERE id = :id"),
        {"id": file_id},
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="File not found")

    return Response(content=bytes(row.data), media_type=row.content_type)
