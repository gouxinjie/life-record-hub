from sqlalchemy import Column, Integer, String, DateTime, Text, SmallInteger, func
from app.db.base_class import Base

class Todo(Base):
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=False)
    category_path = Column(String(100), index=True, nullable=True, comment="关联前端路由路径（分类）")
    title = Column(String(100), nullable=False, comment="待办标题")
    remark = Column(Text, nullable=True, comment="待办备注")
    deadline = Column(DateTime, nullable=True, comment="截止时间")
    priority = Column(SmallInteger, default=2, comment="优先级：1=高，2=中，3=低")
    status = Column(SmallInteger, default=0, comment="状态：0=未完成，1=已完成")
    is_starred = Column(SmallInteger, default=0, comment="是否星标：0=否，1=是")
    create_time = Column(DateTime, server_default=func.now())
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now())
