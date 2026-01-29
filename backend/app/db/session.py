from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True, # 检查连接是否可用
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
