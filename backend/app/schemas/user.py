from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# 共享属性
class UserBase(BaseModel):
    username: Optional[str] = Field(None, description="手机号或邮箱")
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = None

# 注册请求
class UserCreate(UserBase):
    username: str
    password: str = Field(..., min_length=6, description="密码，长度至少6位")

# 更新请求
class UserUpdate(UserBase):
    password: Optional[str] = None

# API 响应模型
class UserOut(UserBase):
    id: int
    username: str
    
    model_config = {
        "from_attributes": True
    }

# Token 响应
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None
