from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate
) -> Any:
    """
    新用户注册
    """
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="该账号已注册",
        )
    
    db_user = User(
        username=user_in.username,
        password=security.get_password_hash(user_in.password),
        nickname=user_in.nickname or user_in.username,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # 创建默认菜单
    from app.models.menu import Menu
    default_menus = [
        {"name": "工作笔记", "module": "note", "path": "/note/work", "parent": "笔记"},
        {"name": "生活随笔", "module": "note", "path": "/note/life", "parent": "笔记"},
        {"name": "日常待办", "module": "todo", "path": "/todo/daily", "parent": "待办"},
        {"name": "运动打卡", "module": "checkin", "path": "/checkin", "parent": None},
        {"name": "体重记录", "module": "weight", "path": "/weight", "parent": None},
    ]
    
    # 简单实现：先创建一级，再创建二级
    parents = {}
    for dm in default_menus:
        p_name = dm["parent"]
        if p_name and p_name not in parents:
            p_menu = Menu(
                menu_name=p_name,
                module=dm["module"],
                route_path=f"/{dm['module']}",
                user_id=db_user.id,
                parent_id=0
            )
            db.add(p_menu)
            db.commit()
            db.refresh(p_menu)
            parents[p_name] = p_menu.id
        
        m = Menu(
            menu_name=dm["name"],
            module=dm["module"],
            route_path=dm["path"],
            user_id=db_user.id,
            parent_id=parents.get(p_name, 0)
        )
        db.add(m)
    
    db.commit()
    return db_user

@router.get("/me", response_model=UserOut)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    获取当前用户信息
    """
    return current_user

@router.put("/me", response_model=UserOut)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    更新当前用户信息
    """
    if user_in.nickname is not None:
        current_user.nickname = user_in.nickname
    if user_in.password is not None:
        current_user.password = security.get_password_hash(user_in.password)
    if user_in.avatar is not None:
        current_user.avatar = user_in.avatar
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
