import json
import shutil
import uuid
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, Response, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.auth import (
    ADMIN_USER,
    ADMIN_PASS,
    create_session_token,
    require_auth,
    SESSION_MAX_AGE
)

BASE_DIR = Path(__file__).resolve().parent.parent
CONTENT_FILE = BASE_DIR / "content.json"
ADMIN_FILE = BASE_DIR / "admin.html"
UPLOAD_DIR = BASE_DIR / "assets" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Comfort Lux Backend")

class LoginPayload(BaseModel):
    login: str
    password: str

@app.post("/api/login")
async def login(payload: LoginPayload, response: Response):
    if payload.login == ADMIN_USER and payload.password == ADMIN_PASS:
        token = create_session_token(payload.login)
        response.set_cookie(
            key="session_token",
            value=token,
            httponly=True,
            max_age=SESSION_MAX_AGE,
            samesite="lax",
            path="/"
        )
        return {"status": "ok", "message": "Авторизация успешна"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверный логин или пароль"
    )

@app.post("/api/logout")
async def logout(response: Response):
    response.delete_cookie(key="session_token", path="/")
    return {"status": "ok", "message": "Сессия завершена"}

@app.get("/api/content")
async def get_content(user: str = Depends(require_auth)):
    if not CONTENT_FILE.exists():
        raise HTTPException(status_code=404, detail="Файл content.json не найден")
    with open(CONTENT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@app.post("/api/content")
async def update_content(data: Dict[str, Any], user: str = Depends(require_auth)):
    try:
        with open(CONTENT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return {"status": "ok", "message": "Контент успешно сохранен"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения: {str(e)}")

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), user: str = Depends(require_auth)):
    try:
        ext = Path(file.filename).suffix.lower()
        allowed_extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov", ".svg"]
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Неподдерживаемый формат файла. Разрешены: {', '.join(allowed_extensions)}"
            )

        filename = f"{uuid.uuid4().hex[:10]}_{Path(file.filename).name}"
        file_path = UPLOAD_DIR / filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {"status": "ok", "url": f"./assets/uploads/{filename}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")

@app.get("/admin")
async def serve_admin():
    if not ADMIN_FILE.exists():
        raise HTTPException(status_code=404, detail="admin.html не найден")
    return FileResponse(ADMIN_FILE)

# Mount static files at root for landing page
app.mount("/", StaticFiles(directory=str(BASE_DIR), html=True), name="static")
