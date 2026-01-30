import random
from datetime import datetime, timedelta
import asyncio
import logging

# In-memory OTP storage for demo/simplicity (Can be Redis in prod)
otp_storage = {}
cleanup_task = None

def start_cleanup_task():
    """Start the background cleanup task"""
    global cleanup_task
    if cleanup_task is None:
        cleanup_task = asyncio.create_task(cleanup_expired_otps())
        logging.info('{"event":"otp_cleanup_task_started"}')

async def cleanup_expired_otps():
    """Run every 5 minutes to clean up expired OTPs"""
    while True:
        await asyncio.sleep(300)  # 5 minutes
        now = datetime.utcnow()
        expired = [k for k, v in otp_storage.items() if now > v["expires_at"]]
        for key in expired:
            del otp_storage[key]
        if expired:
            logging.info('{"event":"otp_cleanup","count":%d}', len(expired))

def generate_otp(identifier: str) -> str:
    otp = f"{random.randint(100000, 999999)}"
    otp_storage[identifier] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    }
    # No PII in logs. In dev, OTP is in memory only; use delivery channel (SMS/email) in prod.
    return otp

def verify_otp(identifier: str, otp: str) -> bool:
    data = otp_storage.get(identifier)
    if not data:
        return False
    # Check expiry
    if datetime.utcnow() > data["expires_at"]:
        del otp_storage[identifier]
        return False
    if data["otp"] == otp:
        del otp_storage[identifier]
        return True
    return False
