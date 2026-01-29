from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, SmallInteger, func
from app.db.base_class import Base

class Note(Base):
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    category_path = Column(String(100), index=True, nullable=True, comment="关联前端路由路径（分类）")
    title = Column(String(100), nullable=False, comment="笔记标题")
    content = Column(Text, nullable=False, comment="笔记内容")
    content_type = Column(SmallInteger, default=0, comment="内容格式：0=富文本, 1=Markdown")
    is_delete = Column(SmallInteger, default=0, comment="是否删除：0=未删除，1=已删除")
    create_time = Column(DateTime, server_default=func.now())
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now())
