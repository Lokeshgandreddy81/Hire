import random
from datetime import datetime, timedelta
import asyncio

# In-memory OTP storage for demo/simplicity (Can be Redis in prod)
otp_storage = {}
cleanup_task = None

async def cleanup_expired_otps():
    """Run every 5 minutes to clean up expired OTPs"""
    while True:
        await asyncio.sleep(300)  # 5 minutes
        now = datetime.utcnow()
        expired = [k for k, v in otp_storage.items() if now > v["expires_at"]]
        for key in expired:
            del otp_storage[key]
        if expired:
            print(f"🧹 Cleaned up {len(expired)} expired OTPs")

def start_cleanup_task():
    """Start the background cleanup task"""
    global cleanup_task
    if cleanup_task is None:
        cleanup_task = asyncio.create_task(cleanup_expired_otps())
        print("✅ OTP cleanup task started")

def generate_otp(identifier: str) -> str:
    otp = f"{random.randint(100000, 999999)}"
    otp_storage[identifier] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    }
    # Simulate sending OTP (In prod, integrate Twilio/SendGrid here)
    print(f"\n📧 OTP for {identifier}: {otp}\n")
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
