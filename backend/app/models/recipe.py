from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, SmallInteger, func, BigInteger
from app.db.base_class import Base

class Recipe(Base):
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("user.id"), index=True, nullable=False)
    name = Column(String(50), nullable=False, comment="菜谱名称")
    category = Column(String(50), nullable=False, comment="所属分类")
    ingredients = Column(Text, nullable=False, comment="食材清单")
    steps = Column(Text, nullable=False, comment="烹饪步骤")
    image_url = Column(String(255), nullable=True, comment="成品图片URL")
    duration = Column(Integer, nullable=True, comment="烹饪时长（分钟）")
    difficulty = Column(String(20), nullable=True, default="简单", comment="难度等级")
    remark = Column(String(200), nullable=True, comment="备注")
    is_starred = Column(SmallInteger, default=0, comment="是否收藏：0=未收藏，1=已收藏")
    is_delete = Column(SmallInteger, default=0, comment="是否删除：0=未删除，1=已删除")
    create_time = Column(DateTime, server_default=func.now())
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now())
