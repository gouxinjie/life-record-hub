from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime

class CheckinItemBase(BaseModel):
    item_name: str
    icon: Optional[str] = None
    status: int = 1

class CheckinItemCreate(CheckinItemBase):
    pass

class CheckinItemOut(CheckinItemBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class CheckinRecordBase(BaseModel):
    item_id: int
    check_date: date
    check_status: int
    item_remark: Optional[str] = None

class CheckinRecordCreate(CheckinRecordBase):
    pass

class CheckinRecordOut(CheckinRecordBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

# 用于每日状态展示的复合模型
class DailyCheckinStatus(BaseModel):
    item: CheckinItemOut
    record: Optional[CheckinRecordOut] = None
