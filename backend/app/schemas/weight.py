from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime

# --- 体重记录相关 Schema ---

class WeightBase(BaseModel):
    weight: float = Field(..., ge=30, le=200, description="体重（kg），支持1位小数")
    record_date: date = Field(..., description="记录日期")
    remark: Optional[str] = Field(None, max_length=200, description="录入备注")

class WeightCreate(WeightBase):
    """创建体重记录"""
    pass

class WeightUpdate(BaseModel):
    """更新体重记录"""
    weight: Optional[float] = Field(None, ge=30, le=200)
    remark: Optional[str] = Field(None, max_length=200)

class WeightBatchDelete(BaseModel):
    """批量删除体重记录"""
    ids: List[int]

class WeightOut(WeightBase):
    """体重记录输出"""
    id: int
    user_id: int
    week_num: str
    create_time: datetime
    update_time: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- 体重目标相关 Schema ---

class WeightTargetBase(BaseModel):
    target_weight: float = Field(..., ge=30, le=200)
    start_weight: Optional[float] = Field(None, ge=30, le=200)
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    is_active: int = Field(1, description="1=活跃, 0=非活跃")

class WeightTargetCreate(WeightTargetBase):
    """创建体重目标"""
    pass

class WeightTargetOut(WeightTargetBase):
    """体重目标输出"""
    id: int
    user_id: int
    create_time: datetime
    update_time: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- 视图与统计相关 Schema ---

class WeeklyWeightData(BaseModel):
    """周视图数据"""
    week_num: str
    records: List[WeightOut]
    avg_weight: float = 0.0
    max_weight: float = 0.0
    min_weight: float = 0.0
    diff_last_week: float = 0.0  # 与上周平均体重的差值

class DailyWeightStat(BaseModel):
    """今日统计数据"""
    today_weight: Optional[float] = None
    diff_yesterday: float = 0.0  # 与昨日体重的差值
    target_diff: float = 0.0    # 与目标体重的差值
