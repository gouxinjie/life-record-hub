from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.note import Note
from app.models.user import User
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate

router = APIRouter()

@router.get("/", response_model=List[NoteOut])
def read_notes(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
    category_path: Optional[str] = None,
    keyword: Optional[str] = None,
) -> Any:
    """
    获取笔记列表，支持分类筛选和关键词搜索
    """
    query = db.query(Note).filter(Note.user_id == current_user.id, Note.is_delete == 0)
    
    if category_path:
        query = query.filter(Note.category_path == category_path)
    if keyword:
        query = query.filter(Note.title.contains(keyword) | Note.content.contains(keyword))
        
    notes = query.order_by(Note.update_time.desc()).offset(skip).limit(limit).all()
    return notes

@router.post("/", response_model=NoteOut)
def create_note(
    *,
    db: Session = Depends(deps.get_db),
    note_in: NoteCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    创建新笔记
    """
    db_obj = Note(
        **note_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{note_id}", response_model=NoteOut)
def read_note(
    note_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    获取单条笔记详情
    """
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.put("/{note_id}", response_model=NoteOut)
def update_note(
    *,
    db: Session = Depends(deps.get_db),
    note_id: int,
    note_in: NoteUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    更新笔记
    """
    db_obj = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = note_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{note_id}")
def delete_note(
    *,
    db: Session = Depends(deps.get_db),
    note_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    删除笔记（软删除）
    """
    db_obj = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db_obj.is_delete = 1
    db.add(db_obj)
    db.commit()
    return {"status": "ok"}
