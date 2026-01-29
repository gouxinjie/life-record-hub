from sqlalchemy import Column, Integer, DateTime, ForeignKey, Date, Numeric, String, func, UniqueConstraint
from app.db.base_class import Base

class WeightRecord(Base):
    __tablename__ = "weight_record"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    weight = Column(Numeric(5, 1), nullable=False, comment="体重（kg）")
    record_date = Column(Date, nullable=False)
    week_num = Column(String(10), nullable=False, comment="YYYYWW")
    remark = Column(String(200), nullable=True)
    create_time = Column(DateTime, server_default=func.now())
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('user_id', 'record_date', name='uk_user_date'),
    )
