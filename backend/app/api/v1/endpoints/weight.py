from typing import Any, List, Optional
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import date, timedelta, datetime
from app.api import deps
from app.models.weight import WeightRecord, WeightTarget
from app.models.user import User
from app.schemas.weight import (
    WeightCreate, WeightUpdate, WeightOut,
    WeightTargetCreate, WeightTargetOut,
    WeeklyWeightData, DailyWeightStat,
    WeightBatchDelete
)

router = APIRouter()

def get_week_num(d: date) -> str:
    """获取日期所属自然周 (ISO标准)"""
    isoyear, week, _ = d.isocalendar()
    return f"{isoyear}{week:02d}"

# --- 体重记录接口 ---

@router.get("/record/history", response_model=List[WeightOut])
def get_weight_history(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """获取体重历史记录，支持筛选和分页"""
    query = db.query(WeightRecord).filter(WeightRecord.user_id == current_user.id)
    if start_date:
        query = query.filter(WeightRecord.record_date >= start_date)
    if end_date:
        query = query.filter(WeightRecord.record_date <= end_date)
    return query.order_by(desc(WeightRecord.record_date)).offset(skip).limit(limit).all()

@router.get("/record/today", response_model=Optional[WeightOut])
def get_today_weight(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """获取今日体重记录"""
    return db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id,
        WeightRecord.record_date == date.today()
    ).first()

@router.get("/record/week", response_model=WeeklyWeightData)
def get_weekly_weight(
    week_num: Optional[str] = Query(None, description="格式 YYYYWW，默认当前周"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """获取指定周的体重数据及统计"""
    if not week_num:
        week_num = get_week_num(date.today())
    
    records = db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id,
        WeightRecord.week_num == week_num
    ).order_by(WeightRecord.record_date.asc()).all()
    
    if not records:
        return WeeklyWeightData(week_num=week_num, records=[])
    
    weights = [float(r.weight) for r in records]
    avg_weight = round(sum(weights) / len(weights), 1)
    
    # 获取上周平均体重用于对比
    year = int(week_num[:4])
    week = int(week_num[4:])
    last_week_date = date.fromisocalendar(year, week, 1) - timedelta(days=7)
    last_week_num = get_week_num(last_week_date)
    
    last_week_records = db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id,
        WeightRecord.week_num == last_week_num
    ).all()
    
    diff_last_week = 0.0
    if last_week_records:
        last_avg = sum([float(r.weight) for r in last_week_records]) / len(last_week_records)
        diff_last_week = round(avg_weight - last_avg, 1)
        
    return WeeklyWeightData(
        week_num=week_num,
        records=records,
        avg_weight=avg_weight,
        max_weight=max(weights),
        min_weight=min(weights),
        diff_last_week=diff_last_week
    )

@router.get("/record/month", response_model=WeeklyWeightData)
def get_monthly_weight(
    year: int = Query(..., ge=2000),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """获取指定月的体重数据及统计 (复用 WeeklyWeightData 结构)"""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
        
    records = db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id,
        WeightRecord.record_date >= start_date,
        WeightRecord.record_date <= end_date
    ).order_by(WeightRecord.record_date.asc()).all()
    
    if not records:
        return WeeklyWeightData(week_num=f"{year}{month:02d}", records=[])
    
    weights = [float(r.weight) for r in records]
    avg_weight = round(sum(weights) / len(weights), 1)
    
    # 获取上月平均体重用于对比
    if month == 1:
        last_month_start = date(year - 1, 12, 1)
        last_month_end = date(year, 1, 1) - timedelta(days=1)
    else:
        last_month_start = date(year, month - 1, 1)
        last_month_end = date(year, month, 1) - timedelta(days=1)
        
    last_month_records = db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id,
        WeightRecord.record_date >= last_month_start,
        WeightRecord.record_date <= last_month_end
    ).all()
    
    diff_last_week = 0.0 # 这里复用字段名，实际表示较上月
    if last_month_records:
        last_avg = sum([float(r.weight) for r in last_month_records]) / len(last_month_records)
        diff_last_week = round(avg_weight - last_avg, 1)
        
    return WeeklyWeightData(
        week_num=f"{year}{month:02d}",
        records=records,
        avg_weight=avg_weight,
        max_weight=max(weights),
        min_weight=min(weights),
        diff_last_week=diff_last_week
    )

@router.post("/record/add", response_model=WeightOut)
def create_weight_record(
    *,
    db: Session = Depends(deps.get_db),
    weight_in: WeightCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """新增体重记录 (单日防重复)"""
    existing = db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id,
        WeightRecord.record_date == weight_in.record_date
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="今日已记录体重，请前往历史记录编辑修改")
    
    db_obj = WeightRecord(
        **weight_in.model_dump(),
        user_id=current_user.id,
        week_num=get_week_num(weight_in.record_date)
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/record/update/{record_id}", response_model=WeightOut)
def update_weight_record(
    *,
    db: Session = Depends(deps.get_db),
    record_id: int,
    weight_in: WeightUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """编辑体重记录"""
    db_obj = db.query(WeightRecord).filter(
        WeightRecord.id == record_id, 
        WeightRecord.user_id == current_user.id
    ).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    update_data = weight_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/record/delete/{record_id}")
def delete_weight_record(
    *,
    db: Session = Depends(deps.get_db),
    record_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """删除体重记录"""
    db_obj = db.query(WeightRecord).filter(
        WeightRecord.id == record_id, 
        WeightRecord.user_id == current_user.id
    ).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(db_obj)
    db.commit()
    return {"status": "ok"}

@router.post("/record/batch-delete")
def batch_delete_weight_records(
    *,
    db: Session = Depends(deps.get_db),
    data: WeightBatchDelete,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """批量删除体重记录"""
    db.query(WeightRecord).filter(
        WeightRecord.id.in_(data.ids),
        WeightRecord.user_id == current_user.id
    ).delete(synchronize_session=False)
    db.commit()
    return {"status": "ok", "deleted_count": len(data.ids)}

@router.get("/record/export")
def export_weight_records(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """导出所有体重记录为 CSV"""
    records = db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id
    ).order_by(desc(WeightRecord.record_date)).all()
    
    output = io.StringIO()
    # 写入 BOM 以支持 Excel 打开中文
    output.write('\ufeff')
    writer = csv.writer(output)
    writer.writerow(["日期", "体重(kg)", "备注", "所属周", "录入时间"])
    
    for r in records:
        writer.writerow([
            r.record_date,
            r.weight,
            r.remark or "",
            r.week_num,
            r.create_time.strftime("%Y-%m-%d %H:%M:%S")
        ])
    
    output.seek(0)
    
    filename = f"weight_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
    )

# --- 体重目标接口 ---

@router.get("/target/get", response_model=Optional[WeightTargetOut])
def get_active_target(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """获取当前活跃的体重目标"""
    return db.query(WeightTarget).filter(
        WeightTarget.user_id == current_user.id,
        WeightTarget.is_active == 1
    ).first()

@router.post("/target/set", response_model=WeightTargetOut)
def set_weight_target(
    *,
    db: Session = Depends(deps.get_db),
    target_in: WeightTargetCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """设置体重目标 (自动处理旧目标的 active 状态)"""
    try:
        # 将旧目标设为非活跃
        db.query(WeightTarget).filter(
            WeightTarget.user_id == current_user.id,
            WeightTarget.is_active == 1
        ).update({"is_active": 0}, synchronize_session=False)
        
        db_obj = WeightTarget(
            **target_in.model_dump(exclude={"is_active"}),
            user_id=current_user.id,
            is_active=1
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    except Exception as e:
        print(f"Error in set_weight_target: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# --- 统计接口 ---

@router.get("/stat/today", response_model=DailyWeightStat)
def get_today_stat(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """获取今日体重统计 (与昨日对比、与目标对比)"""
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    today_rec = db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id,
        WeightRecord.record_date == today
    ).first()
    
    yesterday_rec = db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id,
        WeightRecord.record_date == yesterday
    ).first()
    
    target = db.query(WeightTarget).filter(
        WeightTarget.user_id == current_user.id,
        WeightTarget.is_active == 1
    ).first()
    
    diff_yesterday = 0.0
    if today_rec and yesterday_rec:
        diff_yesterday = round(float(today_rec.weight) - float(yesterday_rec.weight), 1)
        
    target_diff = 0.0
    if today_rec and target:
        target_diff = round(float(today_rec.weight) - float(target.target_weight), 1)
        
    return DailyWeightStat(
        today_weight=float(today_rec.weight) if today_rec else None,
        diff_yesterday=diff_yesterday,
        target_diff=target_diff
    )
