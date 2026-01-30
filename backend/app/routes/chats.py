from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongo import get_db
from app.core.security import get_current_user
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter()

class MessageCreate(BaseModel):
    text: str

@router.get("/{chat_id}")
async def get_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    """Get chat messages"""
    db = get_db()
    user_id = current_user.get("id")
    
    try:
        chat_object_id = ObjectId(chat_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid chat ID format")
    
    chat = await db["chats"].find_one({
        "_id": chat_object_id,
        "user_id": user_id
    })
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat["_id"] = str(chat["_id"])
    chat["id"] = chat["_id"]
    
    return chat

@router.post("/{chat_id}/messages")
async def send_message(
    chat_id: str,
    message: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a message in chat"""
    db = get_db()
    user_id = current_user.get("id")
    
    try:
        chat_object_id = ObjectId(chat_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid chat ID format")
    
    chat = await db["chats"].find_one({
        "_id": chat_object_id,
        "user_id": user_id
    })
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    new_message = {
        "sender": "user",
        "text": message.text,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    await db["chats"].update_one(
        {"_id": chat_object_id},
        {"$push": {"messages": new_message}}
    )
    
    return {"status": "success", "message": new_message}

@router.get("/")
async def get_user_chats(current_user: dict = Depends(get_current_user)):
    """Get all chats for current user"""
    db = get_db()
    user_id = current_user.get("id")
    
    chats = await db["chats"].find({"user_id": user_id}).to_list(100)
    for chat in chats:
        chat["_id"] = str(chat["_id"])
        chat["id"] = chat["_id"]
    
    return {"chats": chats}
