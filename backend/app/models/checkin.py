from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, SmallInteger, func, UniqueConstraint
from app.db.base_class import Base

class CheckinItem(Base):
    __tablename__ = "checkin_item"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    item_name = Column(String(50), nullable=False)
    icon = Column(String(255), nullable=True)
    status = Column(SmallInteger, default=1, comment="1=启用, 0=禁用")
    create_time = Column(DateTime, server_default=func.now())
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now())

class CheckinRecord(Base):
    __tablename__ = "checkin_record"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    item_id = Column(Integer, ForeignKey("checkin_item.id"), index=True, nullable=False)
    check_date = Column(Date, nullable=False)
    check_status = Column(SmallInteger, default=0, comment="1=完成, 0=未完成")
    item_remark = Column(String(200), nullable=True)
    create_time = Column(DateTime, server_default=func.now())
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('user_id', 'item_id', 'check_date', name='uk_user_item_date'),
    )
