from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dependencies import get_current_user
from services.gemini_client import get_gemini_response_streaming_rag

router = APIRouter()

class ChatRequest(BaseModel):
    user_input: str

@router.post("/chat", )
async def chat_endpoint(request: ChatRequest, bot_id: str, current_user: str = Depends(get_current_user)):
    async def event_stream():
        async for chunk in get_gemini_response_streaming_rag(request.user_input, current_user, bot_id):
            yield chunk

    return StreamingResponse(event_stream(), media_type="text/plain")
