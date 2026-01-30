import uuid
import logging
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.core.config import settings
from app.db.mongo import mongo_db, get_db
from app.routes import auth, jobs, profiles, chats, applications
from app.websocket.server import websocket_endpoint
from app.services.otp_service import start_cleanup_task

logging.basicConfig(level=logging.INFO, format="%(message)s")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await mongo_db.connect()
    start_cleanup_task()

@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_db.close()

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(profiles.router, prefix="/api/v1/profiles", tags=["profiles"])
app.include_router(chats.router, prefix="/api/v1/chats", tags=["chats"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["applications"])

@app.websocket("/ws/{room_id}")
async def websocket_route(websocket: WebSocket, room_id: str):
    await websocket_endpoint(websocket, room_id)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Hire App Backend Running"}

@app.get("/health")
async def health_check():
    """Health check with database validation"""
    try:
        db = get_db()
        await db.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
