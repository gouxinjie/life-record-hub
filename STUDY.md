**项目概览**

- 后端采用 FastAPI + SQLAlchemy + Pydantic + MySQL，JWT 做鉴权，Uvicorn 启动服务
- 入口与路由装配在 FastAPI 应用中，开放 CORS 并以版本前缀组织 API
- 数据层用 SQLAlchemy ORM 建模，Pydantic v2 进行请求/响应模型校验与序列化
- 鉴权使用 OAuth2 密码模式与 Bearer Token，令牌由 jose + passlib 生成与校验
- 数据库连接与会话集中管理，支持初始化脚本执行与 ORM 表同步
- 推荐从“请求-响应-鉴权-数据库”的完整链路开始掌握

参考文件

- 应用入口与路由挂载: [main.py](file:///d:/MyNote/life-record-hub/backend/app/main.py)
- 路由集合: [api.py](file:///d:/MyNote/life-record-hub/backend/app/api/v1/api.py)
- 配置与环境变量: [config.py](file:///d:/MyNote/life-record-hub/backend/app/core/config.py)
- 鉴权工具: [security.py](file:///d:/MyNote/life-record-hub/backend/app/core/security.py)
- 依赖与当前用户解析: [deps.py](file:///d:/MyNote/life-record-hub/backend/app/api/deps.py)
- 会话与引擎: [session.py](file:///d:/MyNote/life-record-hub/backend/app/db/session.py)
- ORM 基类与聚合: [base_class.py](file:///d:/MyNote/life-record-hub/backend/app/db/base_class.py), [base.py](file:///d:/MyNote/life-record-hub/backend/app/db/base.py)
- 数据库初始化: [init_db.py](file:///d:/MyNote/life-record-hub/backend/app/db/init_db.py)
- 典型路由实现: [notes](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/notes.py), [todos](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/todos.py), [checkin](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/checkin.py), [weight](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/weight.py), [login](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/login.py), [images](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/images.py), [recipes](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/recipes.py)

**入门级技术点**

- FastAPI 基础
  - 应用创建、标题与版本设置、OpenAPI 地址配置: [main.py:L1-L12](file:///d:/MyNote/life-record-hub/backend/app/main.py#L1-L12)
  - 路由分组与统一前缀: [api.py](file:///d:/MyNote/life-record-hub/backend/app/api/v1/api.py), [main.py:L20](file:///d:/MyNote/life-record-hub/backend/app/main.py#L20)
  - CORS 中间件的来源域配置: [main.py:L13-L19](file:///d:/MyNote/life-record-hub/backend/app/main.py#L13-L19), [config.py:L6-L18](file:///d:/MyNote/life-record-hub/backend/app/core/config.py#L6-L18)
- Pydantic v2 模型
  - 请求/响应模型、字段校验与 from_attributes: [user.py](file:///d:/MyNote/life-record-hub/backend/app/schemas/user.py), [note.py](file:///d:/MyNote/life-record-hub/backend/app/schemas/note.py), [todo.py](file:///d:/MyNote/life-record-hub/backend/app/schemas/todo.py)
  - model_dump/exclude_unset 用于部分更新: [notes.py:L45-L50](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/notes.py#L45-L50), [recipes.py:L88-L96](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/recipes.py#L88-L96)
- SQLAlchemy ORM 基础
  - 基类与自动表名: [base_class.py](file:///d:/MyNote/life-record-hub/backend/app/db/base_class.py)
  - 简单模型定义与时间戳: [user.py](file:///d:/MyNote/life-record-hub/backend/app/models/user.py), [note.py](file:///d:/MyNote/life-record-hub/backend/app/models/note.py), [todo.py](file:///d:/MyNote/life-record-hub/backend/app/models/todo.py)
  - 会话获取与关闭的依赖注入: [deps.py:L15-L23](file:///d:/MyNote/life-record-hub/backend/app/api/deps.py#L15-L23)
- OAuth2 + JWT 登录
  - OAuth2PasswordRequestForm 获取账号密码: [login.py:L1-L18](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/login.py#L1-L18)
  - jose 生成/解析 JWT，passlib-bcrypt 验证口令: [security.py](file:///d:/MyNote/life-record-hub/backend/app/core/security.py), [deps.py:L24-L40](file:///d:/MyNote/life-record-hub/backend/app/api/deps.py#L24-L40)
- 路由与 CRUD 模式
  - 典型的创建-查询-更新-删除流程，结合当前用户过滤: [notes.py](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/notes.py), [todos.py](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/todos.py)

**进阶技术点**

- Pydantic Settings 管理配置
  - 统一读取 .env、CORS/DB/JWT 等参数: [config.py](file:///d:/MyNote/life-record-hub/backend/app/core/config.py)
  - 项目内硬编码默认值与环境覆盖的权衡
- 依赖注入与当前用户态
  - OAuth2PasswordBearer 统一获取 Bearer Token: [deps.py:L12-L14](file:///d:/MyNote/life-record-hub/backend/app/api/deps.py#L12-L14)
  - get_current_user 统一鉴权与用户查找: [deps.py:L24-L40](file:///d:/MyNote/life-record-hub/backend/app/api/deps.py#L24-L40)
- 约束与关系
  - 唯一约束与记录防重复: [weight.py 模型](file:///d:/MyNote/life-record-hub/backend/app/models/weight.py#L1-L20) 与 [weight 接口](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/weight.py#L163-L171)
  - 关系与级联删除: [checkin.py 模型](file:///d:/MyNote/life-record-hub/backend/app/models/checkin.py#L1-L21)
- 统计与聚合
  - 基于自然周/月做聚合分析与对比，展示数据分析思路: [weight 接口](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/weight.py#L56-L154)
  - 今日统计对比昨日/目标，组合查询与业务逻辑: [weight 接口](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/weight.py#L322-L358)
- 文件上传与静态访问
  - 受控保存用户图片并返回可访问路径: [images.py](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/images.py)
  - FileResponse 输出静态文件；生产环境建议挂载静态目录或对象存储
- 统一路由注册
  - 分模块 endpoints 并集中 include_router，便于扩展/禁用: [api.py](file:///d:/MyNote/life-record-hub/backend/app/api/v1/api.py)

**高级技术点**

- 初始化脚本与 ORM 表同步
  - 原生 SQL 初始化 + ORM create_all 双保险，且支持删除数据库重建（仅开发/演示场景）: [init_db.py](file:///d:/MyNote/life-record-hub/backend/app/db/init_db.py)
  - create_engine 的“裸库”连接与 text 执行 SQL，值得理解 SQLAlchemy 的连接管理
- 事务边界与错误回滚
  - set_weight_target 使用 try/except + rollback 保证一致性: [weight 接口](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/weight.py#L296-L318)
  - 更新旧目标 + 新建目标的事务性操作，适合引入乐观锁或唯一约束策略
- 数据建模的可维护性
  - BigInteger 与 Integer 的选择（如 Recipe 使用 BigInteger）: [recipe.py 模型](file:///d:/MyNote/life-record-hub/backend/app/models/recipe.py)
  - 统一的时间戳字段、软删除标记 is_delete 的通用化
- 架构改进方向
  - Alembic 版本迁移已在依赖中，但仓库未见迁移目录；可引入规范的迁移流程
  - 统一异常处理与响应格式，中间层抽象（Service/Repository）分离业务与持久层
  - images 的静态文件访问建议使用 StaticFiles 挂载或 CDN
  - users.register 引用 Menu 模型，但当前未找到 models/menu.py，需补充模型或调整逻辑: [users.py:L41-L75](file:///d:/MyNote/life-record-hub/backend/app/api/v1/endpoints/users.py#L41-L75)

**学习路径（由浅入深）**

- 基础掌握
  - 跑通登录流程：OAuth2PasswordRequestForm → JWT → 受保护接口
  - 完成一个简单 CRUD：以笔记为例从 Schema → Model → Endpoint → DB
  - 理解依赖注入：get_db 与 get_current_user 的作用域与生命周期
- 进阶练习
  - 给待办添加“分页与筛选”参数，结合 SQLAlchemy 查询构建与排序
  - 为 images 接口增加文件大小/类型校验与统一错误响应
  - 在 weight 模块中增加“周均体重阈值预警”接口，体验聚合与业务规则
- 高阶提升
  - 引入 Alembic 并创建首个迁移，完成模型变更的版本化管理
  - 提取 Service 层，统一处理业务逻辑与事务；提取 Repository 层，集中持久化访问
  - 增加全局异常处理器与统一响应结构，中间件记录审计日志

**为什么适合新手学习**

- 框架清晰：FastAPI 的路由、依赖、响应模型组织直观，适合从零搭建完整后端
- 技术闭环：登录鉴权、数据库操作、文件上传、统计分析，覆盖常见后端功能
- 代码现代：Pydantic v2 的 model_dump/from_attributes、pydantic-settings 管理环境，符合当前主流实践
- 可扩展性：模块化 endpoints 与 ORM 建模便于增加新功能与实体