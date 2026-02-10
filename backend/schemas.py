# /schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

# ---------- AUTH SCHEMAS ---------- #

class UserCreate(BaseModel):
    """Schema for registering a new user."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema returned when logging in."""
    access_token: str
    token_type: str = "bearer"


# ---------- BOT SCHEMAS ---------- #

class BotBase(BaseModel):
    """Base schema for bot info."""
    name: str
    description: Optional[str] = None
    # Example: add optional initial_message later if needed
    # initial_message: Optional[str] = None


class BotCreate(BotBase):
    """Schema for creating a new bot."""
    pass


class BotUpdate(BaseModel):
    """Schema for updating an existing bot."""
    bot_name: str


class Bot(BotBase):
    """Schema representing a bot in the database."""
    id: UUID                 # Bot ID (UUID from Supabase/Postgres)
    user_id: UUID            # Owner ID (UUID from Supabase Auth users)
    is_published: bool = False
    public_id: Optional[UUID] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ---------- PUBLIC BOT SCHEMA ---------- #

class PublicBot(BaseModel):
    """Schema for bots exposed to the public API."""
    name: str
    description: Optional[str] = None
    public_id: Optional[UUID] = None
    # Add other fields you want visible to the public


# ---------- CHAT SCHEMAS ---------- #

class ChatMessage(BaseModel):
    """Schema for a message sent to the bot."""
    message: str


class BotResponse(BaseModel):
    """Schema for a bot's reply."""
    response: str
    # Optional: add conversation tracking if needed
    # conversation_id: UUID
