import os
import secrets
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api import deps
from app.core.config import settings
from app.models.user import User

router = APIRouter()

UPLOAD_DIR = "upload"

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    上传图片接口
    """
    # 校验文件类型
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="只能上传图片文件")
    
    # 确保用户目录存在
    user_dir = os.path.join(UPLOAD_DIR, str(current_user.id))
    if not os.path.exists(user_dir):
        os.makedirs(user_dir)
        
    # 生成随机文件名
    file_ext = os.path.splitext(file.filename)[1]
    random_name = f"{secrets.token_hex(8)}{file_ext}"
    file_path = os.path.join(user_dir, random_name)
    
    # 保存文件
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    # 返回可访问的 URL (假设后端静态文件挂载在 /upload)
    return {
        "url": f"/api/v1/images/file/{current_user.id}/{random_name}",
        "filename": random_name
    }

from fastapi.responses import FileResponse

@router.get("/file/{user_id}/{filename}")
def get_image(user_id: int, filename: str):
    """
    查看图片接口
    """
    file_path = os.path.join(UPLOAD_DIR, str(user_id), filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="图片不存在")
    return FileResponse(file_path)
