# routes/bots.py
from fastapi import APIRouter, Request, Header, HTTPException
from supabase import Client
from typing import Optional
import uuid
from pydantic import BaseModel
import logging
from datetime import datetime

router = APIRouter()

class CreateBotPayload(BaseModel):
    name: Optional[str] = "New Bot"

class UpdateBotPayload(BaseModel):
    is_published: Optional[bool] = None
    name: Optional[str] = None

@router.get("/bots")
def get_bots(request: Request, authorization: str = Header(...)):
    supabase: Client = request.app.state.supabase
    token = authorization.replace("Bearer ", "").strip()
    
    try:
        if not token or token == "null" or token == "undefined":
             raise HTTPException(status_code=401, detail="No token provided")

        user_response = supabase.auth.get_user(token)
        user = user_response.user
        
        if not user:
            raise HTTPException(status_code=401, detail="Session expired or invalid")
        
        res = supabase.table("bots").select("*").eq("user_id", user.id).execute()
        return {"bots": res.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bots")
def create_bot(request: Request, payload: CreateBotPayload, authorization: str = Header(...)):
    supabase: Client = request.app.state.supabase
    token = authorization.replace("Bearer ", "").strip()

    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid user")

        bot_id = str(uuid.uuid4())
        # Also generate a public_id by default for future publishing
        public_id = str(uuid.uuid4())
        
        insert_response = supabase.table("bots").insert({
            "id": bot_id,
            "user_id": user.id,
            "name": payload.name,
            "public_id": public_id
        }).execute()
        return {"bot": insert_response.data[0]}
    except Exception as e:
        logging.error(f"Create bot error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/bots/{bot_id}")
def update_bot(bot_id: str, request: Request, payload: UpdateBotPayload, authorization: str = Header(...)):
    supabase: Client = request.app.state.supabase
    token = authorization.replace("Bearer ", "").strip()

    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid user")

        # Verify ownership
        bot_check = supabase.table("bots").select("user_id", "public_id").eq("id", bot_id).execute()
        if not bot_check.data or bot_check.data[0]['user_id'] != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this bot")

        update_data = payload.dict(exclude_none=True)
        
        # Ensure public_id exists if we are publishing
        if update_data.get("is_published") and not bot_check.data[0].get("public_id"):
            update_data["public_id"] = str(uuid.uuid4())

        update_response = supabase.table("bots").update(update_data).eq("id", bot_id).execute()
        return {"bot": update_response.data[0]}
    except Exception as e:
        logging.error(f"Update bot error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/bots/{bot_id}")
def delete_bot(bot_id: str, request: Request, authorization: str = Header(...)):
    supabase: Client = request.app.state.supabase
    token = authorization.replace("Bearer ", "").strip()

    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid user")

        # Verify ownership
        bot_check = supabase.table("bots").select("user_id").eq("id", bot_id).execute()
        if not bot_check.data or bot_check.data[0]['user_id'] != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this bot")

        supabase.table("bots").delete().eq("id", bot_id).execute()
        return {"message": "Bot deleted successfully"}
    except Exception as e:
        logging.error(f"Delete bot error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
