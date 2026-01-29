from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.api import deps
from app.models.todo import Todo
from app.models.user import User
from app.schemas.todo import TodoCreate, TodoOut, TodoUpdate

router = APIRouter()

@router.get("/", response_model=List[TodoOut])
def read_todos(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    category_path: Optional[str] = None,
    status: Optional[int] = None,
    is_starred: Optional[int] = None,
    priority: Optional[int] = None,
    q: Optional[str] = None,
) -> Any:
    """
    获取待办列表
    """
    query = db.query(Todo).filter(Todo.user_id == current_user.id)
    if category_path:
        query = query.filter(Todo.category_path == category_path)
    if status is not None:
        query = query.filter(Todo.status == status)
    if is_starred is not None:
        query = query.filter(Todo.is_starred == is_starred)
    if priority is not None:
        query = query.filter(Todo.priority == priority)
    if q:
        query = query.filter(or_(Todo.title.contains(q), Todo.remark.contains(q)))
        
    return query.order_by(Todo.status.asc(), Todo.priority.asc(), Todo.deadline.asc()).all()

@router.post("/", response_model=TodoOut)
def create_todo(
    *,
    db: Session = Depends(deps.get_db),
    todo_in: TodoCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    创建待办
    """
    db_obj = Todo(
        **todo_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{todo_id}", response_model=TodoOut)
def update_todo(
    *,
    db: Session = Depends(deps.get_db),
    todo_id: int,
    todo_in: TodoUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    更新待办
    """
    db_obj = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == current_user.id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    update_data = todo_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{todo_id}")
def delete_todo(
    *,
    db: Session = Depends(deps.get_db),
    todo_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    删除待办
    """
    db_obj = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == current_user.id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    db.delete(db_obj)
    db.commit()
    return {"status": "ok"}
