from fastapi import APIRouter
from app.api.v1.endpoints import login, users, notes, todos, checkin, weight, images, recipes

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(todos.router, prefix="/todos", tags=["todos"])
api_router.include_router(checkin.router, prefix="/checkin", tags=["checkin"])
api_router.include_router(weight.router, prefix="/weight", tags=["weight"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
