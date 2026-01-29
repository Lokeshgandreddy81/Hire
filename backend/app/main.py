from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongo import mongo_db
from app.routes import auth, jobs, profiles, chats, applications
from app.websocket.server import websocket_endpoint

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    mongo_db.connect()

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
