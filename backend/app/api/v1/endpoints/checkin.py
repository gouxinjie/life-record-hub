from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from datetime import date, datetime
from app.api import deps
from app.models.checkin import CheckinItem, CheckinRecord
from app.models.user import User
from app.schemas.checkin import (
    CheckinItemCreate, CheckinItemUpdate, CheckinItemOut,
    CheckinRecordCreate, CheckinRecordOut,
    DailyCheckinResponse, DailyCheckinItem, DailyCheckinStat
)

router = APIRouter()

# --- 打卡项管理接口 ---

@router.get("/item/list", response_model=List[CheckinItemOut])
def get_checkin_items(
    status: Optional[int] = Query(None, description="按状态筛选：1=启用, 0=禁用"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """获取打卡项列表，包含累计完成次数统计"""
    # 使用 case 表达式进行跨数据库兼容的计数（MySQL 不支持 .filter() 传给聚合函数）
    query = db.query(
        CheckinItem,
        func.coalesce(func.sum(case((CheckinRecord.check_status == 1, 1), else_=0)), 0).label("complete_count")
    ).outerjoin(
        CheckinRecord, CheckinItem.id == CheckinRecord.item_id
    ).filter(CheckinItem.user_id == current_user.id)
    
    if status is not None:
        query = query.filter(CheckinItem.status == status)
        
    results = query.group_by(CheckinItem.id).all()
    
    out_items = []
    for item, count in results:
        item_out = CheckinItemOut.model_validate(item)
        item_out.complete_count = count
        out_items.append(item_out)
    
    return out_items

@router.post("/item/add", response_model=CheckinItemOut)
def create_checkin_item(
    *,
    db: Session = Depends(deps.get_db),
    item_in: CheckinItemCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """新增打卡项"""
    db_obj = CheckinItem(**item_in.model_dump(), user_id=current_user.id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/item/update/{item_id}", response_model=CheckinItemOut)
def update_checkin_item(
    *,
    db: Session = Depends(deps.get_db),
    item_id: int = Path(...),
    item_in: CheckinItemUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """编辑打卡项"""
    db_obj = db.query(CheckinItem).filter(CheckinItem.id == item_id, CheckinItem.user_id == current_user.id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="打卡项不存在")
    
    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/item/delete/{item_id}")
def delete_checkin_item(
    *,
    db: Session = Depends(deps.get_db),
    item_id: int = Path(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """删除打卡项（级联删除相关记录）"""
    db_obj = db.query(CheckinItem).filter(CheckinItem.id == item_id, CheckinItem.user_id == current_user.id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="打卡项不存在")
    
    db.delete(db_obj)
    db.commit()
    return {"status": "ok", "msg": "删除成功"}

# --- 每日打卡操作接口 ---

@router.get("/record/date/{target_date}", response_model=DailyCheckinResponse)
def get_daily_checkin(
    target_date: date = Path(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """获取指定日期的打卡列表及当日统计数据"""
    # 1. 获取所有启用的打卡项
    items = db.query(CheckinItem).filter(
        CheckinItem.user_id == current_user.id,
        CheckinItem.status == 1
    ).all()
    
    # 2. 获取该日期的打卡记录
    records = db.query(CheckinRecord).filter(
        CheckinRecord.user_id == current_user.id,
        CheckinRecord.check_date == target_date
    ).all()
    
    record_map = {r.item_id: r for r in records}
    
    # 3. 构造返回列表
    daily_items = []
    completed_count = 0
    for item in items:
        record = record_map.get(item.id)
        is_completed = record.check_status if record else 0
        if is_completed == 1:
            completed_count += 1
            
        daily_items.append(DailyCheckinItem(
            id=item.id,
            item_name=item.item_name,
            category_path=item.category_path,
            icon=item.icon,
            status=item.status,
            check_status=is_completed,
            item_remark=record.item_remark if record else None,
            record_id=record.id if record else None
        ))
    
    # 4. 计算统计数据
    total_items = len(items)
    stat = DailyCheckinStat(
        total_items=total_items,
        completed_count=completed_count,
        completion_rate=round(completed_count / total_items * 100, 2) if total_items > 0 else 0.0
    )
    
    return DailyCheckinResponse(date=target_date, stat=stat, items=daily_items)

@router.post("/record/save")
def save_checkin_record(
    record_in: CheckinRecordCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """新增或更新打卡记录（防呆逻辑）"""
    db_obj = db.query(CheckinRecord).filter(
        CheckinRecord.user_id == current_user.id,
        CheckinRecord.item_id == record_in.item_id,
        CheckinRecord.check_date == record_in.check_date
    ).first()
    
    if db_obj:
        # 更新
        db_obj.check_status = record_in.check_status
        db_obj.item_remark = record_in.item_remark
    else:
        # 新增
        db_obj = CheckinRecord(
            **record_in.model_dump(),
            user_id=current_user.id
        )
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return {"status": "ok", "record_id": db_obj.id}

# --- 历史记录查看接口 ---

@router.get("/record/history", response_model=List[CheckinRecordOut])
def get_checkin_history(
    item_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """获取打卡历史记录，支持筛选和分页"""
    query = db.query(CheckinRecord).filter(CheckinRecord.user_id == current_user.id)
    
    if item_id:
        query = query.filter(CheckinRecord.item_id == item_id)
    if start_date:
        query = query.filter(CheckinRecord.check_date >= start_date)
    if end_date:
        query = query.filter(CheckinRecord.check_date <= end_date)
        
    return query.order_by(desc(CheckinRecord.check_date)).offset(skip).limit(limit).all()
