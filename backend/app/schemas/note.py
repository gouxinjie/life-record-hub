from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class NoteBase(BaseModel):
    category_path: Optional[str] = None
    title: str
    content: str
    content_type: int = 0

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    category_path: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    content_type: Optional[int] = None

class NoteOut(NoteBase):
    id: int
    user_id: int
    is_delete: int
    create_time: datetime
    update_time: datetime
    
    class Config:
        from_attributes = True
