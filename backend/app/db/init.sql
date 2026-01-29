-- 个人笔记&待办管理系统 - 数据库初始化脚本
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