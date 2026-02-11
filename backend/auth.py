# /backend/auth.py
from fastapi import APIRouter, HTTPException, status, Request, Form
from supabase import Client
from postgrest.exceptions import APIError
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging

router = APIRouter(tags=["auth"])

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class ForgotPassword(BaseModel):
    email: EmailStr
    redirect_to: Optional[str] = None

class ResetPassword(BaseModel):
    new_password: str

@router.post("/register")
def register_user(
    request: Request,
    payload: UserRegister
):
    """
    Register a new user with Supabase.
    """
    supabase: Client = request.app.state.supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    try:
        resp = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password
        })
        
        if not resp or not resp.user:
            raise HTTPException(
                status_code=400,
                detail="Registration failed"
            )

        # Updated message for instant login
        return {"message": "Account created successfully! You can now log in.", "user": resp.user.model_dump()}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/token")
def login_for_access_token(
    request: Request,
    username: str = Form(...),
    password: str = Form(...)
):
    """
    Authenticate user with Supabase (sync client).
    """
    supabase: Client = request.app.state.supabase
    if not supabase:
        logging.error("Supabase client not initialized in app.state")
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    logging.info(f"Attempting login for user: {username}")

    try:
        # Sync call in supabase-py 2.x
        resp = supabase.auth.sign_in_with_password(
            {"email": username, "password": password}
        )

        if not resp or not resp.session:
            logging.warning(f"Login failed for user: {username} - No session returned")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        logging.info(f"Login successful for user: {username}")
        return {
            "access_token": resp.session.access_token,
            "refresh_token": resp.session.refresh_token,
            "token_type": "bearer",
            "user": resp.user.model_dump() if resp.user else None,
        }

    except APIError as e:
        logging.error(f"Supabase APIError for {username}: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Auth API error: {e.message}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except Exception as e:
        logging.error(f"Unexpected error during login for {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@router.post("/forgot-password")
def forgot_password(
    request: Request,
    payload: ForgotPassword
):
    """
    Request a password reset email from Supabase.
    """
    supabase: Client = request.app.state.supabase
    try:
        # Default fallback if redirect_to is not provided
        redirect = payload.redirect_to or "http://localhost:3000/reset-password"
        options = {"redirect_to": redirect}
        supabase.auth.reset_password_for_email(payload.email, options)
        return {"message": "Password reset email sent."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reset-password")
def reset_password(
    request: Request,
    payload: ResetPassword
):
    """
    Update password (authenticated via recovery link).
    """
    supabase: Client = request.app.state.supabase
    
    auth_header = request.headers.get("Authorization")
    if not auth_header:
         raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        supabase.auth.set_session(token, "")
        resp = supabase.auth.update_user({"password": payload.new_password})
        return {"message": "Password updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
