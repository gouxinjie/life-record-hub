from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

# Recipe Schemas
class RecipeBase(BaseModel):
    name: str
    category: str
    ingredients: str
    steps: str
    image_url: Optional[str] = None
    duration: Optional[int] = None
    difficulty: Optional[str] = "简单"
    remark: Optional[str] = None
    is_starred: int = 0

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    ingredients: Optional[str] = None
    steps: Optional[str] = None
    image_url: Optional[str] = None
    duration: Optional[int] = None
    difficulty: Optional[str] = None
    remark: Optional[str] = None
    is_starred: Optional[int] = None

class RecipeOut(RecipeBase):
    id: int
    user_id: int
    is_delete: int
    create_time: datetime
    update_time: datetime
    
    model_config = {
        "from_attributes": True
    }
