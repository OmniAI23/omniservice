# routes/upload.py

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
import shutil
import os
import uuid

# Import the updated get_current_user dependency
from dependencies import get_current_user
from services.file_parser import process_file
from services.embedding_client import process_and_store_text

# Define the router
router = APIRouter()

# Define the upload directory
UPLOAD_DIR = "/tmp/uploads"

# Create the upload directory if it doesn't exist
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    bot_id: str = Form(...), 
    current_user: str = Depends(get_current_user)
):
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save the uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Process the file to extract text
        # FIX: Added await for the async function
        text = await process_file(file_path, file.content_type)
        # Asynchronously process and store the text
        await process_and_store_text(text, file_id, current_user, bot_id)
    except Exception as e:
        # Clean up the file and re-raise the exception
        os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process file: {e}")
    finally:
        # Ensure the file is cleaned up
        if os.path.exists(file_path):
            os.remove(file_path)

    return {"message": "File uploaded and processed successfully", "file_id": file_id}
