from typing import Optional
from pydantic import BaseModel
from datetime import date, datetime

class WeightBase(BaseModel):
    weight: float
    record_date: date
    remark: Optional[str] = None

class WeightCreate(WeightBase):
    pass

class WeightOut(WeightBase):
    id: int
    user_id: int
    week_num: str
    class Config:
        from_attributes = True

class WeightUpdate(BaseModel):
    weight: float
    remark: Optional[str] = None
