import os
from pathlib import Path
from typing import Optional
from fastapi import Cookie, HTTPException, status
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature

# Load .env file using standard library if present
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"
if ENV_FILE.exists():
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

# Admin credentials & secret from environment
ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASS", "admin123")
SECRET_KEY = os.getenv("SECRET_KEY", "comfort-lux-secret-key-2026")
SESSION_MAX_AGE = 24 * 3600  # 24 hours in seconds

serializer = URLSafeTimedSerializer(SECRET_KEY, salt="comfort-lux-session")

def create_session_token(username: str) -> str:
    return serializer.dumps({"user": username})

def verify_session_token(token: str) -> Optional[str]:
    try:
        data = serializer.loads(token, max_age=SESSION_MAX_AGE)
        return data.get("user")
    except (SignatureExpired, BadSignature):
        return None

def require_auth(session_token: Optional[str] = Cookie(None, alias="session_token")) -> str:
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Необходима авторизация"
        )
    username = verify_session_token(session_token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Сессия недействительна или истекла"
        )
    return username
