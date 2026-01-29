from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.api import deps
from app.models.weight import WeightRecord
from app.models.user import User
from app.schemas.weight import WeightCreate, WeightOut, WeightUpdate

router = APIRouter()

def get_week_num(d: date) -> str:
    # 获取年份和周号 (ISO标准)
    isoyear, week, _ = d.isocalendar()
    return f"{isoyear}{week:02d}"

@router.get("/", response_model=List[WeightOut])
def read_weight_records(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    query = db.query(WeightRecord).filter(WeightRecord.user_id == current_user.id)
    if start_date:
        query = query.filter(WeightRecord.record_date >= start_date)
    if end_date:
        query = query.filter(WeightRecord.record_date <= end_date)
    return query.order_by(WeightRecord.record_date.asc()).all()

@router.post("/", response_model=WeightOut)
def record_weight(
    *,
    db: Session = Depends(deps.get_db),
    weight_in: WeightCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # 检查当日是否已记录
    existing = db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id,
        WeightRecord.record_date == weight_in.record_date
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="今日已记录体重，请通过编辑修改")
    
    db_obj = WeightRecord(
        **weight_in.model_dump(),
        user_id=current_user.id,
        week_num=get_week_num(weight_in.record_date)
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{record_id}", response_model=WeightOut)
def update_weight(
    *,
    db: Session = Depends(deps.get_db),
    record_id: int,
    weight_in: WeightUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    db_obj = db.query(WeightRecord).filter(
        WeightRecord.id == record_id, 
        WeightRecord.user_id == current_user.id
    ).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db_obj.weight = weight_in.weight
    db_obj.remark = weight_in.remark
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{record_id}")
def delete_weight(
    *,
    db: Session = Depends(deps.get_db),
    record_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    db_obj = db.query(WeightRecord).filter(
        WeightRecord.id == record_id, 
        WeightRecord.user_id == current_user.id
    ).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(db_obj)
    db.commit()
    return {"status": "ok"}
