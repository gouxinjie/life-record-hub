import sys
import os
from sqlalchemy.orm import Session

# 将当前目录添加到 python 路径
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy import text, create_engine
from app.core.config import settings
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.core import security
from app.models.user import User

def run_init_sql() -> None:
    """读取并执行 init.sql 脚本"""
    sql_file = os.path.join(os.path.dirname(__file__), "init.sql")
    if not os.path.exists(sql_file):
        print(f"警告: 未找到 SQL 初始化文件 {sql_file}, 跳过原生 SQL 执行。")
        return

    print(f"正在读取并执行 SQL 脚本: {sql_file}...")
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # 从 settings.DATABASE_URL 获取不带数据库名称的连接字符串
    # 例如: mysql+pymysql://root:pass@localhost:3306/life_record_hub -> mysql+pymysql://root:pass@localhost:3306/
    db_url = settings.DATABASE_URL
    base_url = db_url.rsplit('/', 1)[0] + '/'
    
    # 使用不指定数据库的 engine 来执行初始化脚本 (因为脚本里包含 CREATE DATABASE 和 USE)
    temp_engine = create_engine(base_url)

    # 简单的 SQL 语句分割（处理注释和分号）
    lines = sql_content.split('\n')
    filtered_lines = [line for line in lines if line.strip() and not line.strip().startswith('--')]
    sql_statements = '\n'.join(filtered_lines).split(';')

    with temp_engine.connect() as conn:
        for statement in sql_statements:
            stmt = statement.strip()
            if stmt:
                try:
                    conn.execute(text(stmt))
                    conn.commit()
                except Exception as e:
                    # 忽略已存在的报错
                    if "already exists" in str(e).lower():
                        continue
                    print(f"执行 SQL 语句出错: {stmt[:50]}... \n错误信息: {e}")
    
    temp_engine.dispose()

def drop_database() -> None:
    """删除数据库"""
    db_url = settings.DATABASE_URL
    db_name = db_url.split('/')[-1].split('?')[0] # 从 URL 中提取数据库名
    base_url = db_url.rsplit('/', 1)[0] + '/'
    
    temp_engine = create_engine(base_url)
    with temp_engine.connect() as conn:
        print(f"正在删除数据库 '{db_name}' (如果存在)...")
        conn.execute(text(f"DROP DATABASE IF EXISTS `{db_name}`"))
        conn.commit()
    temp_engine.dispose()

def init_db() -> None:
    # 0. 删除数据库 (确保完全重新初始化)
    drop_database()

    # 1. 优先执行原生 SQL 初始化 (包含创建库和表逻辑)
    run_init_sql()
    
    # 2. 确保 ORM 模型表也已同步创建
    print("正在同步 ORM 模型表...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 2. 检查并创建初始演示用户
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("正在创建默认演示账号: admin / 123456")
            user = User(
                username="admin",
                password=security.get_password_hash("123456"),
                nickname="管理员",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            print("数据库初始化完成！")
        else:
            print("数据库已存在初始化数据，跳过。")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
