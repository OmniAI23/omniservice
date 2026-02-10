# /routes/public.py
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from uuid import UUID
from postgrest.exceptions import APIError
from supabase import Client

from schemas import PublicBot, ChatMessage
from services.gemini_client import get_gemini_response_streaming_rag

router = APIRouter(
    tags=["public"]
)


@router.get("/bot/{public_bot_id}", response_model=PublicBot)
def get_public_bot(
    request: Request,
    public_bot_id: UUID,
):
    """
    Retrieve a publicly available bot by its public_id.
    """
    supabase: Client = request.app.state.supabase
    try:
        response = (
            supabase.table("bots")
            .select("id, name, description, is_published, public_id")
            .eq("public_id", str(public_bot_id))
            .eq("is_published", True)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Public bot not found"
            )

        return response.data[0]
    except APIError as e:
        raise HTTPException(
            status_code=e.code or 500,
            detail=f"Supabase API error fetching public bot: {e.message}"
        )


@router.get("/bots", response_model=list[PublicBot])
def list_public_bots(
    request: Request
):
    """
    List all published bots from Supabase.
    """
    supabase: Client = request.app.state.supabase
    try:
        response = (
            supabase.table("bots")
            .select("id, name, description, public_id")
            .eq("is_published", True)
            .execute()
        )

        return response.data or []
    except APIError as e:
        raise HTTPException(
            status_code=e.code or 500,
            detail=f"Supabase API error listing public bots: {e.message}"
        )

@router.post("/bot/{public_bot_id}/chat")
async def chat_with_public_bot(
    request: Request,
    public_bot_id: UUID,
    chat_request: ChatMessage,
):
    """
    Chat with a publicly available bot.
    """
    supabase: Client = request.app.state.supabase
    try:
        # First, retrieve the bot's internal id and user_id
        bot_response = (
            supabase.table("bots")
            .select("id, user_id")
            .eq("public_id", str(public_bot_id))
            .eq("is_published", True)
            .execute()
        )

        if not bot_response.data:
            raise HTTPException(
                status_code=404,
                detail="Public bot not found"
            )

        bot_id = bot_response.data[0]['id']
        user_id = bot_response.data[0]['user_id']

        async def event_stream():
            async for chunk in get_gemini_response_streaming_rag(chat_request.message, user_id, bot_id):
                yield chunk

        return StreamingResponse(event_stream(), media_type="text/plain")

    except APIError as e:
        raise HTTPException(
            status_code=e.code or 500,
            detail=f"Supabase API error chatting with public bot: {e.message}"
        )
