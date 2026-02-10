# routes/url.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import uuid

# Import the updated get_current_user dependency
from dependencies import get_current_user
from services.url_parser import fetch_text_from_url
from services.embedding_client import process_and_store_text

router = APIRouter()


class URLPayload(BaseModel):
    url: str

@router.post("/upload-url")
# Update the dependency to use the Supabase-based get_current_user
async def upload_from_url(payload: URLPayload, bot_id: str, current_user: str = Depends(get_current_user)):
    try:
        text = await fetch_text_from_url(payload.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    file_id = str(uuid.uuid4())
    # Pass the Supabase user ID (UUID) to process_and_store_text
    await process_and_store_text(text, file_id, user_id=current_user, bot_id=bot_id)

    return {"message": "Website content processed and stored successfully."}
