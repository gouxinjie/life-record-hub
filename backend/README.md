# 个人笔记&待办管理系统 - 后端

## 技术栈

- Python 3.8+
- FastAPI
- SQLAlchemy 2.x (ORM)
- Pydantic 2.x (数据校验)
- MySQL 8.0
- Uvicorn
- PyMySQL
- Alembic

## 目录结构

- `app/api`: API 路由接口
- `app/core`: 核心配置、安全鉴权
- `app/db`: 数据库连接、Session 管理
- `app/models`: SQLAlchemy 模型
- `app/schemas`: Pydantic 数据模型 (DTO)
- `app/utils`: 工具函数

## 快速开始

1. **创建虚拟环境**

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. **安装依赖**

```bash
pip install -r requirements.txt
```

3. **配置环境变量**

修改 `.env` 文件中的数据库连接信息。

4. **初始化数据库（首次运行）**

```bash
python app/db/init_db.py
```

5. **启动应用**

```bash
uvicorn app.main:app --reload --port 8000
```
