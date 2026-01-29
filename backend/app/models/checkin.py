from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, SmallInteger, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class CheckinItem(Base):
    """
    打卡项模型
    """
    __tablename__ = "checkin_item"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="打卡项唯一ID")
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False, comment="关联用户ID")
    category_path = Column(String(100), index=True, nullable=True, comment="关联前端路由路径（二级分类）")
    item_name = Column(String(50), nullable=False, comment="打卡项名称")
    icon = Column(String(255), nullable=True, comment="打卡项图标路径")
    status = Column(SmallInteger, default=1, comment="状态：1=启用, 0=禁用")
    create_time = Column(DateTime, server_default=func.now(), comment="创建时间")
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关联打卡记录，级联删除
    records = relationship("CheckinRecord", back_populates="item", cascade="all, delete-orphan")

class CheckinRecord(Base):
    """
    每日打卡记录模型
    """
    __tablename__ = "checkin_record"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="打卡记录唯一ID")
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False, comment="关联用户ID")
    item_id = Column(Integer, ForeignKey("checkin_item.id", ondelete="CASCADE"), index=True, nullable=False, comment="关联打卡项ID")
    check_date = Column(Date, nullable=False, comment="打卡日期")
    check_status = Column(SmallInteger, default=0, comment="打卡状态：0=未完成, 1=已完成")
    item_remark = Column(String(200), nullable=True, comment="打卡备注")
    create_time = Column(DateTime, server_default=func.now(), comment="创建时间")
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关联打卡项
    item = relationship("CheckinItem", back_populates="records")

    __table_args__ = (
        UniqueConstraint('user_id', 'item_id', 'check_date', name='uk_user_item_date'),
    )
