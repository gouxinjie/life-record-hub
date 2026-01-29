from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date, datetime

# --- 打卡项相关 Schema ---

class CheckinItemBase(BaseModel):
    item_name: str = Field(..., max_length=50, description="打卡项名称")
    category_path: Optional[str] = Field(None, description="关联二级分类路径")
    icon: Optional[str] = Field(None, description="图标路径")
    status: int = Field(1, description="状态：1=启用, 0=禁用")

class CheckinItemCreate(CheckinItemBase):
    """创建打卡项"""
    pass

class CheckinItemUpdate(BaseModel):
    """更新打卡项"""
    item_name: Optional[str] = Field(None, max_length=50)
    category_path: Optional[str] = None
    icon: Optional[str] = None
    status: Optional[int] = None

class CheckinItemOut(CheckinItemBase):
    """打卡项输出"""
    id: int
    user_id: int
    create_time: datetime
    update_time: datetime
    complete_count: Optional[int] = Field(0, description="累计完成次数")

    model_config = {
        "from_attributes": True
    }

# --- 打卡记录相关 Schema ---

class CheckinRecordBase(BaseModel):
    item_id: int
    check_date: date
    check_status: int = Field(0, description="0=未完成, 1=已完成")
    item_remark: Optional[str] = Field(None, max_length=200, description="打卡备注")

class CheckinRecordCreate(CheckinRecordBase):
    """创建/更新打卡记录"""
    pass

class CheckinRecordOut(CheckinRecordBase):
    """打卡记录输出"""
    id: int
    user_id: int
    create_time: datetime
    update_time: datetime

    model_config = {
        "from_attributes": True
    }

# --- 复合展示相关 Schema ---

class DailyCheckinItem(BaseModel):
    """每日打卡列表中的单项数据"""
    id: int = Field(..., description="打卡项ID")
    item_name: str
    category_path: Optional[str] = None
    icon: Optional[str] = None
    status: int
    check_status: int = Field(0, description="当日打卡状态")
    item_remark: Optional[str] = None
    record_id: Optional[int] = None

class DailyCheckinStat(BaseModel):
    """每日统计数据"""
    total_items: int = Field(0, description="总启用打卡项数")
    completed_count: int = Field(0, description="已完成数")
    completion_rate: float = Field(0.0, description="当日完成率")

class DailyCheckinResponse(BaseModel):
    """每日打卡页面的完整响应数据"""
    date: date
    stat: DailyCheckinStat
    items: List[DailyCheckinItem]

class HistoryRecordGroup(BaseModel):
    """按日期分组的历史记录"""
    date: date
    records: List[CheckinRecordOut]
