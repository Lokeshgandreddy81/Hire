import logging
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId
from bson.errors import InvalidId

from app.db.mongo import get_db
from app.core.security import get_current_user
from app.services.rate_limiter import check_chat_message_limit

# =============================================================================
# CONFIGURATION & LOGGING
# =============================================================================
router = APIRouter()
logger = logging.getLogger("ChatsRouter")

# =============================================================================
# SCHEMAS
# =============================================================================

class MessageCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    role: str = "employee"  # Optional input from frontend

# =============================================================================
# UTILITIES
# =============================================================================

def safe_oid(oid_str: str) -> ObjectId:
    try:
        return ObjectId(oid_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Chat ID format")

# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/", response_model=List[dict])
async def get_user_chats(current_user: dict = Depends(get_current_user)):
    """
    Get all active chats for the logged-in user.
    Optimized: Excludes full message history for list view.
    """
    db = get_db()
    user_id = current_user["id"]

    try:
        cursor = db["chats"].find(
            {
                "$or": [
                    {"user_id": user_id},
                    {"employer_id": user_id}
                ]
            },
            {"messages": 0}  # Exclude messages for list view
        ).sort("updated_at", -1).limit(100)

        chats = await cursor.to_list(length=100)

        for chat in chats:
            chat["id"] = str(chat["_id"])
            chat["_id"] = str(chat["_id"])

        return chats

    except Exception as e:
        logger.error(f"Chat List Error: {e}")
        return []


@router.get("/{chat_id}")
async def get_chat_detail(
    chat_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get full chat history.
    Access restricted to participants only.
    """
    db = get_db()
    user_id = current_user["id"]
    oid = safe_oid(chat_id)

    try:
        chat = await db["chats"].find_one({"_id": oid})

        if not chat:
            raise HTTPException(404, "Chat not found")

        if chat.get("user_id") != user_id and chat.get("employer_id") != user_id:
            raise HTTPException(403, "Access denied")

        chat["id"] = str(chat["_id"])
        chat["_id"] = str(chat["_id"])

        return chat

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat Detail Error: {e}")
        raise HTTPException(500, "Could not load chat")


@router.post("/{chat_id}/messages")
async def send_message(
    chat_id: str,
    message: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message in a chat.
    Atomic update: pushes message and updates last_message metadata.
    """
    db = get_db()
    user_id = current_user["id"]
    oid = safe_oid(chat_id)

    try:
        chat = await db["chats"].find_one(
            {"_id": oid},
            {"user_id": 1, "employer_id": 1}
        )

        if not chat:
            raise HTTPException(404, "Chat not found")

        if chat.get("user_id") != user_id and chat.get("employer_id") != user_id:
            raise HTTPException(403, "You cannot reply to this chat")


        # 🔒 ROLE RESOLUTION LOGIC
        # 1. Determine actual relationships
        is_employer = (chat.get("employer_id") == user_id)
        is_seeker = (chat.get("user_id") == user_id)
        
        # 2. Determine final role
        final_role = "employee" # Default
        
        if is_employer and is_seeker:
            # Self-Chat / Demo Mode: Trust the frontend claimed role
            final_role = message.role if message.role in ["employer", "employee"] else "employer"
        elif is_employer:
            final_role = "employer"
        elif is_seeker:
            final_role = "employee"
        else:
            raise HTTPException(403, "Access Denied")

        # 3. Create Message
        timestamp = datetime.utcnow().isoformat()
        new_message = {
            "id": str(ObjectId()),
            "sender_id": user_id,
            "role": final_role, 
            "text": message.text,
            "timestamp": timestamp
        }

        await db["chats"].update_one(
            {"_id": oid},
            {
                "$push": {"messages": new_message},
                "$set": {
                    "updated_at": timestamp,
                    "last_message": (
                        message.text[:50] + "..."
                        if len(message.text) > 50
                        else message.text
                    )
                }
            }
        )

        return {
            "status": "success",
            "message": new_message
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send Message Error: {e}")
        raise HTTPException(500, "Message delivery failed")