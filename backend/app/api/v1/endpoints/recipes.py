from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeOut, RecipeUpdate

router = APIRouter()

# Recipe Endpoints
@router.get("/", response_model=List[RecipeOut])
def read_recipes(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    is_starred: Optional[int] = None,
) -> Any:
    """
    获取菜谱列表，支持分类筛选和关键词搜索
    """
    query = db.query(Recipe).filter(Recipe.user_id == current_user.id, Recipe.is_delete == 0)
    
    if category:
        query = query.filter(Recipe.category == category)
    if is_starred is not None:
        query = query.filter(Recipe.is_starred == is_starred)
    if keyword:
        query = query.filter(
            Recipe.name.contains(keyword) | 
            Recipe.ingredients.contains(keyword) | 
            Recipe.remark.contains(keyword)
        )
        
    recipes = query.order_by(Recipe.is_starred.desc(), Recipe.update_time.desc()).offset(skip).limit(limit).all()
    return recipes

@router.post("/", response_model=RecipeOut)
def create_recipe(
    *,
    db: Session = Depends(deps.get_db),
    recipe_in: RecipeCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    创建新菜谱
    """
    db_obj = Recipe(
        **recipe_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{recipe_id}", response_model=RecipeOut)
def read_recipe(
    recipe_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    获取单条菜谱详情
    """
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id, Recipe.user_id == current_user.id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

@router.put("/{recipe_id}", response_model=RecipeOut)
def update_recipe(
    *,
    db: Session = Depends(deps.get_db),
    recipe_id: int,
    recipe_in: RecipeUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    更新菜谱
    """
    db_obj = db.query(Recipe).filter(Recipe.id == recipe_id, Recipe.user_id == current_user.id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    update_data = recipe_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{recipe_id}")
def delete_recipe(
    *,
    db: Session = Depends(deps.get_db),
    recipe_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    删除菜谱（软删除）
    """
    db_obj = db.query(Recipe).filter(Recipe.id == recipe_id, Recipe.user_id == current_user.id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    db_obj.is_delete = 1
    db.add(db_obj)
    db.commit()
    return {"status": "ok"}
