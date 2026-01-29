from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date
from app.api import deps
from app.models.checkin import CheckinItem, CheckinRecord
from app.models.user import User
from app.schemas.checkin import CheckinItemCreate, CheckinItemOut, CheckinRecordCreate, DailyCheckinStatus

router = APIRouter()

@router.get("/items", response_model=List[CheckinItemOut])
def read_checkin_items(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return db.query(CheckinItem).filter(CheckinItem.user_id == current_user.id).all()

@router.post("/items", response_model=CheckinItemOut)
def create_checkin_item(
    *,
    db: Session = Depends(deps.get_db),
    item_in: CheckinItemCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    db_obj = CheckinItem(**item_in.model_dump(), user_id=current_user.id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/daily", response_model=List[DailyCheckinStatus])
def get_daily_status(
    target_date: date = Query(default=date.today()),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    获取指定日期的所有打卡项及完成状态
    """
    items = db.query(CheckinItem).filter(
        CheckinItem.user_id == current_user.id,
        CheckinItem.status == 1
    ).all()
    
    records = db.query(CheckinRecord).filter(
        CheckinRecord.user_id == current_user.id,
        CheckinRecord.check_date == target_date
    ).all()
    
    record_map = {r.item_id: r for r in records}
    
    result = []
    for item in items:
        result.append({
            "item": item,
            "record": record_map.get(item.id)
        })
    return result

@router.post("/toggle")
def toggle_checkin(
    record_in: CheckinRecordCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    切换打卡状态
    """
    db_obj = db.query(CheckinRecord).filter(
        CheckinRecord.user_id == current_user.id,
        CheckinRecord.item_id == record_in.item_id,
        CheckinRecord.check_date == record_in.check_date
    ).first()
    
    if db_obj:
        db_obj.check_status = record_in.check_status
        db_obj.item_remark = record_in.item_remark
    else:
        db_obj = CheckinRecord(
            **record_in.model_dump(),
            user_id=current_user.id
        )
    
    db.add(db_obj)
    db.commit()
    return {"status": "ok"}
