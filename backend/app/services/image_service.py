import os
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status


# Directory where images will be stored
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"


def save_upload_image(file: UploadFile) -> str:
    """
    Save an uploaded image file to the uploads directory.
    
    Args:
        file: The uploaded file from FastAPI UploadFile
        
    Returns:
        The relative URL path to the saved image (e.g., "/uploads/uuid.jpg")
        
    Raises:
        HTTPException: 400 if file is not a valid image
    """
    # Validate file is an image
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Create uploads directory if it doesn't exist
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    # Get file extension from content type (e.g., "image/jpeg" -> ".jpeg")
    file_ext = file.content_type.split("/")[1]
    
    # Generate unique filename using uuid4
    unique_filename = f"{uuid4()}.{file_ext}"
    
    # Full path to save the file
    file_path = UPLOAD_DIR / unique_filename
    
    # Read and save the file
    file_content = file.file.read()
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Return relative URL path
    return f"/uploads/{unique_filename}"
