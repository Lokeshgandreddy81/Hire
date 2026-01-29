import random
from datetime import datetime, timedelta

# In-memory OTP storage for demo/simplicity (Can be Redis in prod)
# Structure: { "email_or_phone": { "otp": "123456", "expires_at": datetime } }
otp_storage = {}

def generate_otp(identifier: str) -> str:
    otp = f"{random.randint(100000, 999999)}"
    otp_storage[identifier] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    }
    # Simulate sending OTP (In prod, integrate Twilio/SendGrid here)
    print(f"\nAPI LOG: SENT OTP for {identifier}: {otp}\n")
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
