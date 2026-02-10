# /backend/main.py
import os
import sys
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

# --- Add Project Root to sys.path ---
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions

# --- Router Imports ---
from auth import router as auth_router
from routes.bots import router as bots_router
from routes.chat import router as chat_router
from routes.public import router as public_router
from routes.upload import router as upload_router
from routes.url import router as url_router
from routes.audio import router as audio_router
from routes.admin import router as admin_router 

load_dotenv()

# --- Lifespan Event Handler ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    if not url or not key:
        print("ERROR: SUPABASE_URL or SUPABASE_KEY missing.")

    app.state.supabase: Client = create_client(
        url,
        key,
        options=ClientOptions(
            postgrest_client_timeout=10,
            persist_session=False
        )
    )
    yield

# --- FastAPI App Initialization ---
app = FastAPI(lifespan=lifespan)

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routers (Prefix /api) ---
# We use /api prefix to avoid conflicts with static files
app.include_router(auth_router, prefix="/api/auth")
app.include_router(bots_router, prefix="/api")
app.include_router(chat_router, prefix="/api/chat")
app.include_router(public_router, prefix="/api/public")
app.include_router(upload_router, prefix="/api")
app.include_router(url_router, prefix="/api")
app.include_router(audio_router, prefix="/api")
app.include_router(admin_router, prefix="/api") 

# --- Serve Frontend Static Files ---
# Mount the static directory (built from Next.js)
static_path = os.path.join(PROJECT_ROOT, "static")
if os.path.exists(static_path):
    app.mount("/_next", StaticFiles(directory=os.path.join(static_path, "_next")), name="next-assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # If it's an API route, let FastAPI handle it (though prefix usually handles this)
        if full_path.startswith("api/"):
            return None 
            
        # Try to find the file in the static directory
        file_path = os.path.join(static_path, full_path)
        
        # If it's a directory or doesn't exist, serve index.html (Next.js routing)
        if not os.path.isfile(file_path):
            # Try appending .html (for clean URLs like /dashboard)
            html_path = file_path + ".html"
            if os.path.isfile(html_path):
                return FileResponse(html_path)
            return FileResponse(os.path.join(static_path, "index.html"))
            
        return FileResponse(file_path)

# Root Endpoint fallback if static files aren't found
@app.get("/api/health")
def health_check():
    return {"status": "ok"}
