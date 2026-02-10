
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
import uuid
import logging

# Corrected service imports
from services.local_file_parser import process_uploaded_file
from services.embedding_client import process_and_store_text
from dependencies import get_current_user

router = APIRouter()

@router.post("/upload/audio")
async def upload_audio_file(
    bot_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not bot_id:
        raise HTTPException(status_code=400, detail="Bot ID is required")

    # Allow a more flexible list of content types
    allowed_content_types = ["audio/mpeg", "video/mp4", "application/octet-stream"]

    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type '{file.content_type}'. Only MP3 and MP4 are supported."
        )

    try:
        # 1. Process the uploaded file to get the transcript
        transcript = await process_uploaded_file(file)

        # 2. Generate a unique ID for this document
        file_id = str(uuid.uuid4())

        # 3. Use the correct service to process and store the transcript text
        await process_and_store_text(transcript, file_id, current_user, bot_id)

        return {"message": "Audio file processed and content added to bot successfully", "file_id": file_id}

    except Exception as e:
        print(f"Error processing audio file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process audio file: {e}")
