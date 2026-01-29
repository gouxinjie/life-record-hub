# life-record-hub 生活记录中心

一个基于 FastAPI + React (Vite) + MySQL 驱动的现代化个人事务管理效率助手。支持模块化的笔记记录、待办清单、打卡习惯和健康(体重)追踪。

---

## 🚀 快速开始

本项目采用前后端分离的结构进行开发与管理。

### 1. 环境准备

- **Python 3.8+**
- **Node.js 18+**
- **MySQL 8.0+** (确保已创建数据库 `life_record_hub` 没有的话需要执行 `python app/db/init_db.py` 初始化数据库)

### 2. 项目结构

```text
life-record-hub/  # 仓库根目录（对应GitHub仓库名）
├── frontend/    # 前端所有代码（React+TS+Vite+AntD）
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...（前端工程原有文件）
├── backend/     # 后端所有代码（FastAPI+SQLAlchemy+Python3.9+）
│   ├── app/     # 后端核心代码（路由、模型、工具类）
│   ├── config/  # 配置文件（数据库、JWT、文件存储）
│   ├── requirements.txt  # 后端依赖清单
│   ├── .env     # 环境变量（数据库密码、密钥等，不上传）
│   └── ...（后端工程原有文件）
├── .gitignore   # 仓库全局忽略文件（核心，必配）
├── README.md    # 项目说明（部署步骤、技术栈、目录结构）
└── LICENSE      # 开源协议（个人项目可选，如MIT）
```

### 3. 配置与启动

#### 方式一：命令行一键启动 (最推荐)
在根目录下直接执行：
```powershell
pnpm install:all  # 首次运行安装所有依赖
pnpm dev          # 同时启动前后端服务
```

#### 方式二：脚本一键启动
双击根目录下的 **`run_all.bat`** 或者终端中执行`.\run_all.bat` 文件，它将自动打开两个窗口分别启动前后端服务。

#### 方式三：手动分步启动

**后端启动**:
```powershell
cd backend
pip install -r requirements.txt

# 配置 .env 文件后执行
python app/db/init_db.py
uvicorn app.main:app --reload --port 8000
```

**前端启动**:
```powershell
cd frontend
pnpm install
pnpm dev
```

---

## 🔐 演示账号

- **登录地址**: [http://localhost:5178](http://localhost:5178)
- **账号**: `admin`
- **密码**: `123456`

---

## ✨ 核心特性

- **智能笔记**: 支持 **富文本 (Quill)** 与 **Markdown** 双格式，具备实时预览功能。
- **分层菜单**: 联动后端的动态侧边栏，支持多级笔记分类。
- **待办管理**: 任务优先级区分，清晰掌控项目进度。
- **习惯打卡**: 可视化的每日打卡进度条，助力习惯养成。
- **健康追踪**: 体重趋势记录与简易数据分析。
- **响应式 UI**: 基于 **Tailwind CSS** + **Ant Design 5.0** 打造的高颜值极简设计。

---

## 🛠️ 技术栈

- **后端**: FastAPI, SQLAlchemy, MySQL, Pydantic, OAuth2 (JWT)
- **前端**: React 18, Vite, TypeScript, Tailwind CSS, Ant Design 5.0, SCSS
- **编辑器**: React-Quill, React-Markdown

---

## 💡 常见问题与说明

### 1. 为什么使用 `concurrently` 启动项目？

在根目录的 `package.json` 中，我们使用了 `concurrently` 来并行运行前后端脚本。

- **跨平台并行**: 在 Windows 环境下，直接使用 `&` 会导致命令按顺序执行（第一个命令不结束，第二个就不开始）。`concurrently` 解决了这一限制，确保在 Windows、macOS 和 Linux 上都能同时启动多个服务。
- **统一日志管理**: 它会将不同服务的日志汇聚在一个终端窗口，并通过 `[0]`, `[1]` 前缀进行区分，方便调试。
- **进程自动清理**: 当你按下 `Ctrl+C` 停止 `pnpm dev` 时，`concurrently` 会确保前后端的所有子进程都被正确关闭，避免后台残留。

### 2. 后端启动入口

后端服务的入口文件是 **`backend/app/main.py`**。使用 `uvicorn app.main:app` 启动时，它会加载 FastAPI 实例、配置中间件并挂载所有路由。

### 3. 数据库初始化脚本

项目中包含一个综合初始化脚本 **`app/db/init_db.py`**（需手动执行一次）：

- **工作机制**:
  1. 它会首先读取并执行同目录下的 **`init.sql`**，通过原生 SQL 确保数据库和基础表结构创建成功。
  2. 随后通过 SQLAlchemy ORM 同步模型表结构。
  3. 最后自动预置演示账号 (`admin`) 以及默认的业务菜单分类数据。

**执行建议**: 首次部署项目时，请务必运行一次 `python app/db/init_db.py` 以完成环境准备。
