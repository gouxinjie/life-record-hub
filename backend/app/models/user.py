from sqlalchemy import Column, Integer, String, DateTime, func
from app.db.base_class import Base

class User(Base):
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False, comment="账号（手机号/邮箱）")
    password = Column(String(100), nullable=False, comment="bcrypt加密后的密码")
    nickname = Column(String(50), nullable=True, comment="用户昵称")
    avatar = Column(String(255), nullable=True, comment="头像文件路径")
    create_time = Column(DateTime, server_default=func.now(), comment="账号创建时间")
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="信息更新时间")
