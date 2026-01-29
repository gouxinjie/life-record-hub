from sqlalchemy import Column, Integer, DateTime, ForeignKey, Date, Numeric, String, func, UniqueConstraint, SmallInteger
from app.db.base_class import Base

class WeightRecord(Base):
    """
    体重记录模型
    """
    __tablename__ = "weight_record"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="体重记录唯一ID")
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False, comment="关联用户ID")
    weight = Column(Numeric(5, 1), nullable=False, comment="体重（kg）")
    record_date = Column(Date, nullable=False, comment="记录日期")
    week_num = Column(String(10), nullable=False, comment="所属自然周（YYYYWW）")
    remark = Column(String(200), nullable=True, comment="录入备注")
    create_time = Column(DateTime, server_default=func.now(), comment="创建时间")
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    __table_args__ = (
        UniqueConstraint('user_id', 'record_date', name='uk_user_date'),
    )

class WeightTarget(Base):
    """
    体重目标模型
    """
    __tablename__ = "weight_target"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="目标唯一ID")
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False, comment="关联用户ID")
    target_weight = Column(Numeric(5, 1), nullable=False, comment="目标体重（kg）")
    start_weight = Column(Numeric(5, 1), nullable=True, comment="起始体重（kg）")
    start_date = Column(Date, nullable=True, comment="开始日期")
    deadline = Column(Date, nullable=True, comment="截止日期")
    is_active = Column(SmallInteger, default=1, comment="是否当前活跃目标：1=是, 0=否")
    create_time = Column(DateTime, server_default=func.now())
    update_time = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        # 移除 is_active 的唯一索引，允许存在多条历史记录 (is_active=0)
        # 代码层保证同一时间只有一个 is_active=1
    )
