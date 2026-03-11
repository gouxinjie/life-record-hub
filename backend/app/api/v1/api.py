from fastapi import APIRouter

# 从项目内部导入各个业务模块的路由对象。每个模块（如 users, notes）都是独立的 Python 文件，内部定义了该业务领域的接口。
from app.api.v1.endpoints import login, users, notes, todos, checkin, weight, images, recipes

# 创建空的 APIRouter 实例，作为所有业务路由的统一容器。
api_router = APIRouter()

# 挂载各业务路由
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(todos.router, prefix="/todos", tags=["todos"])
api_router.include_router(checkin.router, prefix="/checkin", tags=["checkin"])
api_router.include_router(weight.router, prefix="/weight", tags=["weight"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
