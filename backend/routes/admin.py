import os
from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client
from dependencies import oauth2_scheme
from typing import List, Optional
from pydantic import BaseModel
from gotrue.errors import AuthApiError

router = APIRouter(prefix="/admin", tags=["admin"])

# --- Schemas ---

class BotInfo(BaseModel):
    id: str
    name: str
    is_published: bool
    user_id: str
    created_at: Optional[str] = None

class UserAdminStats(BaseModel):
    user_id: str
    email: Optional[str] = None
    total_bots: int
    published_bots: int
    bots: List[BotInfo]

class AdminDashboardStats(BaseModel):
    total_users: int
    total_bots: int
    total_published_bots: int

# --- Helper: Verify Admin ---

def get_admin_user(request: Request, token: str = Depends(oauth2_scheme)):
    supabase: Client = request.app.state.supabase
    admin_email_env = os.getenv("ADMIN_EMAIL", "placidusagukwe21@gmail.com")
    
    try:
        # Get the user associated with the token
        resp = supabase.auth.get_user(token)
        if not resp or not resp.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if the user's email matches the admin email
        if resp.user.email != admin_email_env:
            raise HTTPException(status_code=403, detail="Access denied: Admin privileges required")
        
        return resp.user
    except AuthApiError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")

# --- Endpoints ---

@router.get("/dashboard-stats", response_model=AdminDashboardStats)
def get_dashboard_stats(request: Request, admin=Depends(get_admin_user)):
    """
    Get high-level stats for the admin dashboard.
    """
    supabase: Client = request.app.state.supabase
    
    try:
        # 1. Fetch all bots to calculate stats
        # Using the anon key, this depends on RLS allowing the admin to see all bots.
        # Ideally, this would use a service_role client.
        bots_response = supabase.table("bots").select("id, is_published, user_id").execute()
        bots_data = bots_response.data
        
        total_bots = len(bots_data)
        total_published_bots = len([b for b in bots_data if b.get("is_published")])
        
        # 2. Estimate total users by counting unique user_ids in the bots table
        unique_users = set(b.get("user_id") for b in bots_data)
        total_users = len(unique_users)
        
        return {
            "total_users": total_users,
            "total_bots": total_bots,
            "total_published_bots": total_published_bots
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

@router.get("/search-user", response_model=UserAdminStats)
def search_user_by_email(email: str, request: Request, admin=Depends(get_admin_user)):
    """
    Search for a user by email and return their bot statistics.
    Note: This assumes a 'profiles' table exists that maps email to user_id.
    """
    supabase: Client = request.app.state.supabase
    
    try:
        # Step 1: Find the user_id from the profiles table
        profile_res = supabase.table("profiles").select("id, email").eq("email", email).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User with this email not found in profiles.")
        
        user_id = profile_res.data['id']
        
        # Step 2: Fetch all bots for this user
        bots_res = supabase.table("bots").select("*").eq("user_id", user_id).execute()
        bots = bots_res.data
        
        return {
            "user_id": user_id,
            "email": email,
            "total_bots": len(bots),
            "published_bots": len([b for b in bots if b.get("is_published")]),
            "bots": bots
        }
    except Exception as e:
        if "PGRST116" in str(e): # Supabase code for 'no rows returned'
            raise HTTPException(status_code=404, detail=f"User {email} not found.")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/users/{user_id}/bots", response_model=UserAdminStats)
def get_user_bots(user_id: str, request: Request, admin=Depends(get_admin_user)):
    """
    Get all bots for a specific user ID.
    """
    supabase: Client = request.app.state.supabase
    
    try:
        bots_res = supabase.table("bots").select("*").eq("user_id", user_id).execute()
        bots = bots_res.data
        
        return {
            "user_id": user_id,
            "total_bots": len(bots),
            "published_bots": len([b for b in bots if b.get("is_published")]),
            "bots": bots
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user bots: {str(e)}")

@router.get("/bots/all", response_model=List[BotInfo])
def list_all_bots(request: Request, admin=Depends(get_admin_user)):
    """
    List every bot in the system.
    """
    supabase: Client = request.app.state.supabase
    try:
        response = supabase.table("bots").select("id, name, is_published, user_id, created_at").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching all bots: {str(e)}")
