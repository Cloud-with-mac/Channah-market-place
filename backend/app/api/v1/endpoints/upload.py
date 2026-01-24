from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
import uuid
import os
from pydantic import BaseModel

from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter()


class UploadResponse(BaseModel):
    url: str
    filename: str
    size: int
    content_type: str


class MultipleUploadResponse(BaseModel):
    files: List[UploadResponse]


ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_DOCUMENT_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_file_locally(file: UploadFile, folder: str) -> str:
    """Save file to local storage (for development)"""
    # Create uploads directory if it doesn't exist
    upload_dir = f"uploads/{folder}"
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else ""
    filename = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
    filepath = f"{upload_dir}/{filename}"

    # Save file
    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/{folder}/{filename}"


async def upload_to_s3(file: UploadFile, folder: str) -> str:
    """Upload file to S3"""
    import boto3
    from botocore.exceptions import ClientError

    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )

    ext = file.filename.split(".")[-1] if "." in file.filename else ""
    filename = f"{folder}/{uuid.uuid4()}.{ext}" if ext else f"{folder}/{uuid.uuid4()}"

    try:
        contents = await file.read()
        s3_client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=filename,
            Body=contents,
            ContentType=file.content_type
        )

        return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a single image"""
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )

    # Validate file size
    contents = await file.read()
    await file.seek(0)  # Reset file pointer

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Upload file
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        url = await upload_to_s3(file, "images")
    else:
        url = await save_file_locally(file, "images")

    return UploadResponse(
        url=url,
        filename=file.filename,
        size=len(contents),
        content_type=file.content_type
    )


@router.post("/images", response_model=MultipleUploadResponse)
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload multiple images"""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed")

    uploaded = []

    for file in files:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            continue  # Skip invalid files

        contents = await file.read()
        await file.seek(0)

        if len(contents) > MAX_FILE_SIZE:
            continue  # Skip oversized files

        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            url = await upload_to_s3(file, "images")
        else:
            url = await save_file_locally(file, "images")

        uploaded.append(UploadResponse(
            url=url,
            filename=file.filename,
            size=len(contents),
            content_type=file.content_type
        ))

    return MultipleUploadResponse(files=uploaded)


@router.post("/document", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a document"""
    if file.content_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_DOCUMENT_TYPES)}"
        )

    contents = await file.read()
    await file.seek(0)

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        url = await upload_to_s3(file, "documents")
    else:
        url = await save_file_locally(file, "documents")

    return UploadResponse(
        url=url,
        filename=file.filename,
        size=len(contents),
        content_type=file.content_type
    )


@router.post("/avatar", response_model=UploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload user avatar"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid image type"
        )

    contents = await file.read()
    await file.seek(0)

    # Smaller size limit for avatars (2MB)
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Avatar too large. Maximum size: 2MB"
        )

    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        url = await upload_to_s3(file, f"avatars/{current_user.id}")
    else:
        url = await save_file_locally(file, f"avatars/{current_user.id}")

    return UploadResponse(
        url=url,
        filename=file.filename,
        size=len(contents),
        content_type=file.content_type
    )


@router.post("/vendor/logo", response_model=UploadResponse)
async def upload_vendor_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload vendor logo"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid image type"
        )

    contents = await file.read()
    await file.seek(0)

    if len(contents) > 5 * 1024 * 1024:  # 5MB for logos
        raise HTTPException(
            status_code=400,
            detail="Logo too large. Maximum size: 5MB"
        )

    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        url = await upload_to_s3(file, "vendor-logos")
    else:
        url = await save_file_locally(file, "vendor-logos")

    return UploadResponse(
        url=url,
        filename=file.filename,
        size=len(contents),
        content_type=file.content_type
    )


@router.post("/vendor/banner", response_model=UploadResponse)
async def upload_vendor_banner(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload vendor banner"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid image type"
        )

    contents = await file.read()
    await file.seek(0)

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Banner too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        url = await upload_to_s3(file, "vendor-banners")
    else:
        url = await save_file_locally(file, "vendor-banners")

    return UploadResponse(
        url=url,
        filename=file.filename,
        size=len(contents),
        content_type=file.content_type
    )
