from fastapi import FastAPI # 导入 FastAPI 框架的核心类，用于创建应用实例。
from fastapi.middleware.cors import CORSMiddleware # 导入 CORS 中间件，用于处理跨域请求。

# 从项目内部导入路由对象。app.api.v1.api 是项目自定义的模块路径，api_router 是集中管理的路由器
from app.api.v1.api import api_router 
# 从项目内部导入配置对象。app.core.config 是项目自定义的模块路径，settings 是配置实例
from app.core.config import settings

# 创建 FastAPI 应用实例
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# 设置 CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware, # 使用 CORS 中间件
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS], # 允许的域名列表
        allow_credentials=True, # 允许携带 cookie
        allow_methods=["*"], # 允许所有 HTTP 方法
        allow_headers=["*"], # 允许所有请求头
    )

# 将集中的业务路由挂载到应用，并添加统一前缀（如 /api/v1）。
app.include_router(api_router, prefix=settings.API_V1_STR)

# 定义根路由，返回欢迎消息
@app.get("/")
def root():
    return {"message": "Welcome to Personal Note & Todo API"}
# 健康检查路由，返回状态 "ok"
@app.get("/health")
def health_check():
    return {"status": "ok"}
