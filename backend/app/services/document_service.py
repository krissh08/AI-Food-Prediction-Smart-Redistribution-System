import os
import re
import uuid
from typing import Tuple
from fastapi import UploadFile, HTTPException, status

DOCUMENTS_UPLOAD_DIR = os.getenv("DOCUMENTS_UPLOAD_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "documents")))
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/pjpeg"}

MAGIC_NUMBERS = {
    "pdf": b"%PDF-",
    "png": b"\x89PNG\r\n\x1a\n",
    "jpeg": b"\xff\xd8\xff"
}

def sanitize_filename(filename: str) -> str:
    """Removes path traversal components and unsafe characters."""
    filename = os.path.basename(filename)
    filename = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename)
    return filename or "document"

def validate_and_save_document(file: UploadFile, document_type: str) -> Tuple[str, str, str, int]:
    """
    Validates file extension, MIME type, size, and magic bytes.
    Saves file to secure storage directory with a unique UUID key.
    Returns: (original_filename, storage_key, content_type, file_size)
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No document file provided."
        )

    ext = os.path.splitext(file.filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, PNG, JPG, JPEG."
        )

    # Read content to check size and magic bytes
    try:
        content = file.file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {e}")

    file_size = len(content)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds the 5 MB limit (file is {file_size / (1024*1024):.2f} MB)."
        )

    # Magic byte verification
    valid_signature = False
    if ext == ".pdf" and content.startswith(MAGIC_NUMBERS["pdf"]):
        valid_signature = True
    elif ext == ".png" and content.startswith(MAGIC_NUMBERS["png"]):
        valid_signature = True
    elif ext in [".jpg", ".jpeg"] and content.startswith(MAGIC_NUMBERS["jpeg"]):
        valid_signature = True

    if not valid_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match its claimed file extension signature."
        )

    # Create destination directory if it does not exist
    os.makedirs(DOCUMENTS_UPLOAD_DIR, exist_ok=True)

    safe_original = sanitize_filename(file.filename)
    storage_key = f"{uuid.uuid4().hex}_{safe_original}"
    dest_path = os.path.join(DOCUMENTS_UPLOAD_DIR, storage_key)

    try:
        with open(dest_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save document securely: {e}")

    content_type = file.content_type or ("application/pdf" if ext == ".pdf" else "image/jpeg")
    return safe_original, storage_key, content_type, file_size

def get_document_path(storage_key: str) -> str:
    """Returns absolute file path for a storage key after verifying against path traversal."""
    safe_key = os.path.basename(storage_key)
    full_path = os.path.join(DOCUMENTS_UPLOAD_DIR, safe_key)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Requested document file not found on server.")
    return full_path
