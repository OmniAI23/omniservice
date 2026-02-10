# /dependencies.py
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from supabase import Client
from gotrue.errors import AuthApiError

# OAuth2PasswordBearer expects your login endpoint (/auth/token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
    """
    Dependency that retrieves the current user's ID from a Supabase JWT.
    Works with supabase==2.19.0 (sync client).
    """
    supabase: Client = request.app.state.supabase
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase client not initialized"
        )

    try:
        # ✅ Sync call (no await)
        resp = supabase.auth.get_user(token)

        if not resp or not resp.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # FIX: Return only the user's ID, not the whole object
        return resp.user.id

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Auth error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
