from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class TodoBase(BaseModel):
    category_path: Optional[str] = None
    title: str
    remark: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: int = 2
    status: int = 0
    is_starred: int = 0

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    category_path: Optional[str] = None
    title: Optional[str] = None
    remark: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[int] = None
    status: Optional[int] = None
    is_starred: Optional[int] = None

class TodoOut(TodoBase):
    id: int
    user_id: int
    create_time: datetime
    update_time: datetime
    
    class Config:
        from_attributes = True
