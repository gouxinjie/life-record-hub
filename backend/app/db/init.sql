-- 生活记录中心系统 - 数据库初始化脚本
-- 适配 MySQL 8.0

CREATE DATABASE IF NOT EXISTS life_record_hub DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE life_record_hub;

-- 4.1 用户表
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户唯一ID',
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '账号（手机号/邮箱）',
    `password` VARCHAR(100) NOT NULL COMMENT 'bcrypt加密后的密码',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '用户昵称',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像文件路径',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '账号创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '信息更新时间',
    INDEX `idx_username` (`username`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4.3 笔记表
CREATE TABLE IF NOT EXISTS `note` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '笔记唯一ID',
    `user_id` BIGINT NOT NULL COMMENT '关联用户ID',
    `category_path` VARCHAR(100) DEFAULT NULL COMMENT '关联前端路由路径',
    `title` VARCHAR(100) NOT NULL COMMENT '笔记标题',
    `content` TEXT NOT NULL COMMENT '富文本内容',
    `content_type` SMALLINT DEFAULT 0 COMMENT '内容格式：0=富文本, 1=Markdown',
    `is_delete` TINYINT(1) DEFAULT 0 COMMENT '是否删除：0=未删除，1=已删除',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_category_path` (`category_path`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4.5 待办表
CREATE TABLE IF NOT EXISTS `todo` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '待办唯一ID',
    `user_id` BIGINT NOT NULL COMMENT '关联用户ID',
    `category_path` VARCHAR(100) DEFAULT NULL COMMENT '关联前端路由路径',
    `title` VARCHAR(100) NOT NULL COMMENT '待办标题',
    `remark` TEXT DEFAULT NULL COMMENT '待办备注',
    `deadline` DATETIME DEFAULT NULL COMMENT '截止时间',
    `priority` TINYINT(1) DEFAULT 2 COMMENT '优先级：1=高，2=中，3=低',
    `status` TINYINT(1) DEFAULT 0 COMMENT '状态：0=未完成，1=已完成',
    `is_starred` TINYINT(1) DEFAULT 0 COMMENT '是否星标：0=否，1=是',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_category_path` (`category_path`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4.6 打卡项表
CREATE TABLE IF NOT EXISTS `checkin_item` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '打卡项唯一ID',
    `user_id` BIGINT NOT NULL COMMENT '关联用户ID',
    `category_path` VARCHAR(100) DEFAULT NULL COMMENT '关联前端路由路径（二级分类）',
    `item_name` VARCHAR(50) NOT NULL COMMENT '打卡项名称',
    `icon` VARCHAR(255) DEFAULT NULL COMMENT '打卡项图标路径',
    `status` TINYINT(1) DEFAULT 1 COMMENT '状态：1=启用，0=禁用',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_category_path` (`category_path`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4.7 打卡记录表
CREATE TABLE IF NOT EXISTS `checkin_record` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '打卡记录唯一ID',
    `user_id` BIGINT NOT NULL COMMENT '关联用户ID',
    `item_id` BIGINT NOT NULL COMMENT '关联打卡项ID',
    `check_date` DATE NOT NULL COMMENT '打卡日期',
    `check_status` TINYINT(1) DEFAULT 0 COMMENT '打卡状态：0=未完成，1=已完成',
    `item_remark` VARCHAR(200) DEFAULT NULL COMMENT '打卡备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE INDEX `uk_user_item_date` (
        `user_id`,
        `item_id`,
        `check_date`
    ),
    INDEX `idx_user_date` (`user_id`, `check_date`),
    CONSTRAINT `fk_checkin_record_item` FOREIGN KEY (`item_id`) REFERENCES `checkin_item` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4.8 体重记录表
CREATE TABLE IF NOT EXISTS `weight_record` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '体重记录唯一ID',
    `user_id` BIGINT NOT NULL COMMENT '关联用户ID',
    `weight` DECIMAL(5, 1) NOT NULL COMMENT '体重（kg）',
    `record_date` DATE NOT NULL COMMENT '记录日期',
    `week_num` VARCHAR(10) NOT NULL COMMENT '所属自然周（YYYYWW）',
    `remark` VARCHAR(200) DEFAULT NULL COMMENT '录入备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE INDEX `uk_user_date` (`user_id`, `record_date`),
    INDEX `idx_user_week` (`user_id`, `week_num`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4.9 体重目标表
CREATE TABLE IF NOT EXISTS `weight_target` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '目标唯一ID',
    `user_id` BIGINT NOT NULL COMMENT '关联用户ID',
    `target_weight` DECIMAL(5, 1) NOT NULL COMMENT '目标体重（kg）',
    `start_weight` DECIMAL(5, 1) DEFAULT NULL COMMENT '起始体重（kg）',
    `start_date` DATE DEFAULT NULL COMMENT '开始日期',
    `deadline` DATE DEFAULT NULL COMMENT '截止日期',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否当前活跃目标',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4.10 菜谱表
CREATE TABLE IF NOT EXISTS `recipe` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '菜谱唯一ID',
    `user_id` BIGINT NOT NULL COMMENT '关联用户ID',
    `name` VARCHAR(50) NOT NULL COMMENT '菜谱名称',
    `category` VARCHAR(50) NOT NULL COMMENT '所属分类',
    `ingredients` TEXT NOT NULL COMMENT '食材清单',
    `steps` TEXT NOT NULL COMMENT '烹饪步骤',
    `image_url` VARCHAR(255) DEFAULT NULL COMMENT '成品图片URL',
    `duration` INT DEFAULT NULL COMMENT '烹饪时长（分钟）',
    `difficulty` VARCHAR(20) DEFAULT '简单' COMMENT '难度等级',
    `remark` VARCHAR(200) DEFAULT NULL COMMENT '备注',
    `is_starred` TINYINT(1) DEFAULT 0 COMMENT '是否收藏：0=未收藏，1=已收藏',
    `is_delete` TINYINT(1) DEFAULT 0 COMMENT '是否删除：0=未删除，1=已删除',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_category` (`category`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- --- 模拟数据 ---

-- 1. 默认用户 (admin / 123456)
-- 密码 '123456' 的 bcrypt 哈希值（示例）: $2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57OTWzFiGvju
INSERT INTO `user` (`id`, `username`, `password`, `nickname`) VALUES (1, 'admin', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57OTWzFiGvju', '管理员') ON DUPLICATE KEY UPDATE id=id;

-- 2. 体重记录模拟数据 (近两周)
-- 假设今天是 2026-01-29 (周四)，所属周为 202605
INSERT IGNORE INTO `weight_record` (`user_id`, `weight`, `record_date`, `week_num`, `remark`) VALUES 
(1, 75.5, '2026-01-19', '202604', '周一记录'),
(1, 75.2, '2026-01-20', '202604', '空腹'),
(1, 75.8, '2026-01-21', '202604', '晚餐后'),
(1, 75.1, '2026-01-22', '202604', '晨起'),
(1, 74.9, '2026-01-23', '202604', '晨起'),
(1, 75.3, '2026-01-24', '202604', '周末'),
(1, 75.0, '2026-01-25', '202604', '周末'),
(1, 74.8, '2026-01-26', '202605', '本周一'),
(1, 74.6, '2026-01-27', '202605', '空腹'),
(1, 74.7, '2026-01-28', '202605', '晨起'),
(1, 74.5, '2026-01-29', '202605', '今日记录');

-- 3. 体重目标模拟数据
INSERT IGNORE INTO `weight_target` (`user_id`, `target_weight`, `start_weight`, `start_date`, `is_active`) VALUES
(1, 70.0, 75.5, '2026-01-19', 1);

-- 4. 菜谱的模拟数据
INSERT IGNORE INTO `recipe` (`user_id`, `name`, `category`, `ingredients`, `steps`, `image_url`, `duration`, `difficulty`, `remark`, `is_starred`) VALUES
(1, '西红柿炒鸡蛋', '素菜系列', '西红柿 2个, 鸡蛋 3个, 小葱 1根, 盐 适量, 白糖 少许', '1. 西红柿洗净切块，鸡蛋打散备用。\n2. 热锅凉油，倒入蛋液炒散后盛出。\n3. 锅中留底油，放入西红柿块中火翻炒出汁。\n4. 加入炒好的鸡蛋，调入盐和白糖，翻炒均匀。\n5. 出锅前撒上葱花即可。', 'https://images.unsplash.com/photo-1594489428504-5c0c480a15fd?q=80&w=500', 15, '简单', '家常味道，酸甜适口', 1),
(1, '红烧肉', '荤菜系列', '五花肉 500g, 冰糖 20g, 生抽 2勺, 老抽 1勺, 料酒 1勺, 八角 2个, 桂皮 1小块, 生姜 3片', '1. 五花肉切成2厘米见方的块，冷水入锅焯水捞出。\n2. 锅内放少许油，放入冰糖炒出糖色。\n3. 放入肉块翻炒均匀上色。\n4. 加入生姜、八角、桂皮、料酒、生抽、老抽和足量开水。\n5. 大火烧开转小火焖煮45-60分钟。\n6. 最后大火收汁即可。', 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=500', 60, '中等', '肉质软糯，肥而不腻', 1),
(1, '酸辣土豆丝', '素菜系列', '土豆 1个, 青椒 1个, 干辣椒 3个, 花椒 少许, 陈醋 2勺, 盐 1勺', '1. 土豆去皮切细丝，放入清水中浸泡掉淀粉。\n2. 青椒切丝，干辣椒切段。\n3. 锅中热油，爆香花椒和干辣椒。\n4. 倒入土豆丝大火快速翻炒至断生。\n5. 加入青椒丝、盐和陈醋，翻炒均匀后出锅。', 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=500', 10, '简单', '爽脆开胃', 0),
(1, '清蒸鲈鱼', '荤菜系列', '鲈鱼 1条, 小葱 2根, 生姜 20g, 蒸鱼豉油 3勺, 食用油 2勺', '1. 鲈鱼洗净，背部划几刀，塞入姜片。\n2. 蒸锅水开后，放入鲈鱼大火蒸8-10分钟。\n3. 倒掉蒸出的鱼水，去掉老姜片。\n4. 铺上葱丝，淋上蒸鱼豉油。\n5. 烧热油，趁热泼在葱丝上激发出香味。', 'https://images.unsplash.com/photo-1534604973900-c41ab46d07ba?q=80&w=500', 20, '中等', '肉质鲜美', 1),
(1, '紫菜蛋花汤', '汤羹系列', '紫菜 1块, 鸡蛋 1个, 虾皮 少许, 香油 1勺, 盐 适量', '1. 碗中放入紫菜、虾皮、盐和香油。\n2. 锅中烧开水，淋入打散的蛋液。\n3. 待蛋花成型后，直接倒入碗中冲开即可。', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=500', 5, '简单', '快手热汤', 0),
(1, '家常干炒牛河', '面食系列', '河粉 300g, 牛肉 100g, 绿豆芽 50g, 韭黄 少许, 生抽 2勺, 老抽 1勺', '1. 牛肉切薄片用生抽、淀粉腌制。\n2. 油锅烧热，将牛肉滑熟盛出。\n3. 锅中留油，放入河粉大火翻炒，加入生抽老抽调色。\n4. 加入豆芽、韭黄和牛肉，快速翻炒均匀即可。', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=500', 15, '困难', '讲究锅气', 0);