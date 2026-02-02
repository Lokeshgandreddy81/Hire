import logging
import os
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.mongo import mongo_db, get_db
from app.routes import auth, jobs, profiles, chats, applications
from app.websocket.server import websocket_endpoint
from app.services.cleanup_service import start_cleanup_tasks, stop_cleanup_tasks

# =============================================================================
# LOGGING CONFIGURATION (Splunk/Datadog Ready)
# =============================================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("HireAppMain")

# =============================================================================
# LIFESPAN MANAGER (Modern Startup/Shutdown)
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Musk First-Principles: Manage resources explicitly.
    1. Connect DB
    2. Start Background Tasks
    3. Yield Control
    4. Clean Shutdown
    """
    # --- Startup ---
    logger.info("🚀 System Starting Up...")
    try:
        await mongo_db.connect()
        start_cleanup_tasks()  # Start background cleanup
        
        # Ensure upload directories exist (Cook Operational Discipline)
        os.makedirs("uploads/videos", exist_ok=True)
        logger.info("✅ Database & Resources Ready")
    except Exception as e:
        logger.critical(f"❌ Startup Failed: {e}")
        raise e
    
    yield
    
    # --- Shutdown ---
    logger.info("🛑 Shutting Down...")
    await stop_cleanup_tasks()
    mongo_db.close()
    logger.info("✅ Shutdown Complete")

# =============================================================================
# APP INITIALIZATION
# =============================================================================
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None, # Hide docs in Prod
    redoc_url=None
)

# =============================================================================
# MIDDLEWARE
# =============================================================================

# 1. CORS (Security)
app.add_middleware(
    CORSMiddleware,
    # In Prod, replace "*" with specific domains from settings
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. GZip (Performance - Compresses large JSON payloads)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 3. Request ID (Observability)
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    # Attach ID to logs context (conceptually)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# =============================================================================
# GLOBAL EXCEPTION HANDLERS (Safety Net)
# =============================================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches any unhandled crash, logs it, and returns safe JSON.
    Prevents server timeouts or leaking stack traces.
    """
    logger.error(f"🔥 UNHANDLED EXCEPTION: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"DEBUG ERROR: {str(exc)}"}
    )

# =============================================================================
# STATIC FILES (For Video Interviews)
# =============================================================================
# Serve files from /uploads directory at http://host/uploads/...
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# =============================================================================
# ROUTERS
# =============================================================================
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(profiles.router, prefix="/api/v1/profiles", tags=["Profiles"])
app.include_router(chats.router, prefix="/api/v1/chats", tags=["Chats"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["Applications"])

# =============================================================================
# WEBSOCKETS
# =============================================================================
@app.websocket("/ws/{room_id}")
async def websocket_route(websocket: WebSocket, room_id: str):
    await websocket_endpoint(websocket, room_id)

# =============================================================================
# HEALTH CHECKS
# =============================================================================
@app.get("/", tags=["System"])
def read_root():
    return {
        "system": "Hire App Backend",
        "status": "operational",
        "version": "1.0.0"
    }

@app.get("/health", tags=["System"])
async def health_check():
    """
    Deep Health Check.
    Validates DB connection to ensure orchestrators (K8s/AWS) know real status.
    """
    try:
        db = get_db()
        # Fast "ping" command to Mongo
        await db.command('ping')
        return {"status": "healthy", "database": "connected", "timestamp": str(uuid.uuid1().time)}
    except Exception as e:
        logger.error(f"Health Check Failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected", "error": str(e)}
        )

if __name__ == "__main__":
    # For local debugging only. In prod, use uvicorn main:app
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)