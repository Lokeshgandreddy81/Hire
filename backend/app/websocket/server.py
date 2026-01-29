from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
from datetime import datetime

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
                except:
                    disconnected.append(connection)
            
            # Clean up disconnected clients
            for conn in disconnected:
                self.disconnect(conn, room_id)

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Broadcast to room
            await manager.broadcast_to_room({
                "sender": message_data.get("sender", "user"),
                "text": message_data.get("text", ""),
                "timestamp": datetime.utcnow().isoformat()
            }, room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
