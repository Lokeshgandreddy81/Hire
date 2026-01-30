from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import logging
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from app.core.security import decode_token
from app.db.mongo import get_db

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_room(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            message_str = json.dumps(message)
            disconnected = []
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(message_str)
                except Exception:
                    disconnected.append(connection)
            for conn in disconnected:
                self.disconnect(conn, room_id)

manager = ConnectionManager()


async def _user_can_access_chat(chat_id: str, user_id: str) -> bool:
    """Verify user_id is allowed to access this chat (room_id = chat_id)."""
    try:
        oid = ObjectId(chat_id)
    except InvalidId:
        return False
    db = get_db()
    chat = await db["chats"].find_one({"_id": oid, "user_id": user_id})
    return chat is not None


async def websocket_endpoint(websocket: WebSocket, room_id: str):
    # Launch requirement: WebSocket auth. Token in query: ?token=JWT
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4401)
        return
    user_id = payload.get("id")
    if not user_id:
        await websocket.close(code=4401)
        return
    if not await _user_can_access_chat(room_id, user_id):
        logging.info('{"event":"ws_access_denied","room_id":"%s"}', room_id[:8])
        await websocket.close(code=4403)
        return

    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            await manager.broadcast_to_room({
                "sender": message_data.get("sender", "user"),
                "text": message_data.get("text", ""),
                "timestamp": datetime.utcnow().isoformat()
            }, room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
    except Exception as e:
        logging.error('{"event":"ws_error","error":"%s"}', str(e)[:100])
        manager.disconnect(websocket, room_id)
