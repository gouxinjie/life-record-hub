/**
 * 待办列表页面（TodoList）
 * 功能概述：
 * - 左侧侧边栏：筛选待办、搜索、新建
 * - 主区卡片：展示待办、星标、完成、删除
 * - 右侧抽屉：点击卡片查看详情并进行操作
 * 交互说明：
 * - 复选框、星标、删除、完成按钮均阻止事件向上传播，避免触发卡片预览
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
    Button,
    Checkbox,
    Space,
    Tag,
    Modal,
    Form,
    Typography,
    DatePicker,
    Select,
    Input,
    Avatar,
    Tooltip,
    Empty,
    Drawer,
    App
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    CheckCircleOutlined,
    StarOutlined,
    StarFilled,
    ClockCircleOutlined,
    UserOutlined,
    TeamOutlined,
    FormOutlined,
    FileDoneOutlined,
    FireOutlined,
    MoreOutlined,
    SwapOutlined,
    FilterOutlined,
    ReloadOutlined,
    DeleteOutlined,
     BellOutlined
} from '@ant-design/icons';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../../services/todo';
import { getMe } from '../../services/auth';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import 'dayjs/locale/zh-cn';
import { useTheme } from '../../context/ThemeContext';

dayjs.extend(calendar);
dayjs.locale('zh-cn');

import styles from './index.module.scss';
import classNames from 'classnames';

const { Text } = Typography;

/**
 * 优先级映射
 * 1：紧急；2：普通；3：较低
 */
const priorityMap: any = {
    1: { label: '紧急', color: '#ff4d4f' },
    2: { label: '普通', color: '#8c8c8c' },
    3: { label: '较低', color: '#bfbfbf' },
};

/**
 * 侧边栏筛选类型
 */
type FilterType = 'todo' | 'priority' | 'starred' | 'done' | 'created' | 'involved' | 'later';

/**
 * 待办列表主组件
 */
const TodoList: React.FC = () => {
    const { message, modal } = App.useApp();
    const { primaryColor } = useTheme();
    // 状态：数据与界面
    const [todos, setTodos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('todo');
    const [searchQuery, setSearchQuery] = useState('');
    const [form] = Form.useForm();
    const [headerPriority, setHeaderPriority] = useState<number | null>(null);
    const [sortDesc, setSortDesc] = useState<boolean>(true);
    const [starOnly, setStarOnly] = useState<boolean>(false);

    /**
     * 侧边栏菜单配置
     */
    const sidebarMenus = [
        { key: 'todo', label: '待我处理', icon: <CheckCircleOutlined /> },
        { key: 'priority', label: '优先处理', icon: <FireOutlined /> },
        { key: 'starred', label: '星标', icon: <StarOutlined /> },
        { key: 'done', label: '我已处理', icon: <FileDoneOutlined /> },
        { key: 'created', label: '我创建的', icon: <FormOutlined /> },
        { key: 'involved', label: '我参与的', icon: <TeamOutlined /> },
        { key: 'later', label: '稍后处理', icon: <ClockCircleOutlined /> },
    ];

    /**
     * 获取当前用户信息
     */
    const fetchUser = async () => {
        const data = await getMe();
        setUser(data);
    };

    /**
     * 根据筛选与搜索拉取待办数据
     */
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { q: searchQuery };

            switch (activeFilter) {
                case 'todo':
                    params.status = 0;
                    break;
                case 'priority':
                    params.status = 0;
                    params.priority = 1;
                    break;
                case 'starred':
                    params.is_starred = 1;
                    break;
                case 'done':
                    params.status = 1;
                    break;
                case 'later':
                    // Just a placeholder filter
                    break;
                default:
                    break;
            }

            if (headerPriority) {
                params.priority = headerPriority;
            }
            if (starOnly) {
                params.is_starred = 1;
            }

            const data: any = await getTodos(params);
            const sorted = [...data].sort((a, b) => {
                const av = dayjs(a.create_time).valueOf();
                const bv = dayjs(b.create_time).valueOf();
                return sortDesc ? bv - av : av - bv;
            });
            setTodos(sorted);
        } finally {
            setLoading(false);
        }
    }, [activeFilter, searchQuery, headerPriority, sortDesc, starOnly]);

    /**
     * 初始化用户信息
     */
    useEffect(() => {
        fetchUser();
    }, []);

    /**
     * 依赖条件变更时刷新列表
     */
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /**
     * 切换任务完成状态
     */
    const handleToggleStatus = async (item: any) => {
        const newStatus = item.status === 1 ? 0 : 1;
        await updateTodo(item.id, { status: newStatus });
        message.success(newStatus === 1 ? '任务已完成' : '任务已撤回');
        fetchData();
    };

    /**
     * 切换星标状态（阻止事件冒泡）
     */
    const handleToggleStar = async (e: React.MouseEvent, item: any) => {
        e.stopPropagation();
        const newStarred = item.is_starred === 1 ? 0 : 1;
        await updateTodo(item.id, { is_starred: newStarred });
        fetchData();
    };

    /**
     * 删除待办（二次确认，阻止事件冒泡）
     */
    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        modal.confirm({
            title: '确认删除',
            content: '确定要删除这条待办事项吗？',
            okText: '确定',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: async () => {
                await deleteTodo(id);
                message.success('已删除');
                if (selectedTodo?.id === id) {
                    setIsDrawerOpen(false);
                    setSelectedTodo(null);
                }
                fetchData();
            },
        });
    };

    /**
     * 卡片点击打开右侧详情抽屉
     */
    const handleCardClick = (item: any) => {
        setSelectedTodo(item);
        setIsDrawerOpen(true);
    };

    /**
     * 打开新建待办弹窗并初始化默认值
     */
    const handleCreate = () => {
        form.resetFields();
        form.setFieldsValue({ priority: 2 });
        setIsModalOpen(true);
    };

    /**
     * 新建待办提交
     */
    const onFinish = async (values: any) => {
        if (values.deadline) {
            values.deadline = values.deadline.format('YYYY-MM-DD HH:mm:ss');
        }
        await createTodo(values);
        message.success('创建待办成功');
        setIsModalOpen(false);
        fetchData();
    };

    /**
     * 获取当前筛选标题文案
     */
    const getFilterTitle = () => {
        return sidebarMenus.find(m => m.key === activeFilter)?.label || '待办事项';
    };

    return (
        <div className={styles.todoWrapper}>
            {/* 侧边栏 */}
            <div className={styles.sidebar}>
                <div className={styles.searchBox}>
                    <Input
                        prefix={<SearchOutlined style={{ color: '#8f959e' }} />}
                        placeholder="搜索待办"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onPressEnter={fetchData}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        className={styles.addButton}
                        onClick={handleCreate}
                    />
                </div>

                {sidebarMenus.map(menu => (
                    <div
                        key={menu.key}
                        className={classNames(styles.menuItem, { [styles.active]: activeFilter === menu.key })}
                        onClick={() => setActiveFilter(menu.key as FilterType)}
                    >
                        <div className={styles.left}>
                            <span className={styles.icon}>{menu.icon}</span>
                            <span>{menu.label}</span>
                        </div>
                        {menu.key === 'todo' && todos.length > 0 && activeFilter === 'todo' && (
                            <span className={styles.count}>{todos.length}</span>
                        )}
                    </div>
                ))}

                <div className="mt-auto px-1 pt-4 border-t border-gray-100">
                    <div className={styles.menuItem} onClick={() => message.info('标签管理功能开发中')}>
                        <div className={styles.left}>
                            <Tag bordered={false} className="m-0 bg-gray-100 text-gray-400">#</Tag>
                            <span>标签管理</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 主内容区 */}
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <div className="flex justify-between items-center mb-4">
                        <div className={styles.titleWrapper}>
                            <div className={styles.title}>{getFilterTitle()}</div>
                            {activeFilter === 'todo' && todos.length > 0 && (
                                <span className={styles.cornerBadge}>{todos.length}</span>
                            )}
                        </div>
                        <Space size={16}>
                            <Tooltip title="更多">
                                <Button type="text" icon={<MoreOutlined />} />
                            </Tooltip>
                            <Tooltip title="批量处理">
                                <Button type="text" icon={<SwapOutlined />} />
                            </Tooltip>
                            <Tooltip title="同步">
                                <Button type="text" icon={<ReloadOutlined />} onClick={fetchData} />
                            </Tooltip>
                        </Space>
                    </div>

                    <div className={styles.filters}>
                        <span>
                            全部分类
                            <Select
                                value={headerPriority ?? 0}
                                bordered={false}
                                size="small"
                                style={{ width: 140 }}
                                onChange={(val) => setHeaderPriority(val === 0 ? null : val)}
                                suffixIcon={<FilterOutlined style={{ fontSize: 12 }} />}
                                options={[
                                    { value: 0, label: '全部' },
                                    { value: 1, label: '优先级：紧急' },
                                    { value: 2, label: '优先级：普通' },
                                    { value: 3, label: '优先级：较低' },
                                ]}
                            />
                        </span>
                        <span onClick={() => setSortDesc(!sortDesc)}>
                            创建时间 {sortDesc ? '从晚到早' : '从早到晚'} <FilterOutlined style={{ fontSize: 12 }} />
                        </span>
                        <span onClick={() => setStarOnly(!starOnly)}>
                            筛选 {starOnly ? '仅星标' : '全部'} <FilterOutlined style={{ fontSize: 12 }} />
                        </span>
                        <span onClick={() => message.info('批量处理功能开发中')}>
                            批量处理 <FilterOutlined style={{ fontSize: 12 }} />
                        </span>
                    </div>
                </div>

                {/* 待办列表 */}
                <div className={styles.todoList}>
                    {loading ? (
                        <div className="text-center py-20"><ReloadOutlined spin className="text-2xl text-primary" /></div>
                    ) : todos.length > 0 ? (
                        todos.map(item => (
                            <div key={item.id} className={styles.todoCard} onClick={() => handleCardClick(item)}>
                                <Checkbox
                                    className={styles.checkbox}
                                    checked={item.status === 1}
                                    onClick={(e) => e.stopPropagation() /* 阻止冒泡，避免触发抽屉 */}
                                    onChange={() => handleToggleStatus(item)}
                                />
                                <div className={styles.content}>
                                    <div className={classNames(styles.title, { [styles.completed]: item.status === 1 })}>
                                        {item.status === 1 && <span className="text-primary mr-2">✓</span>}
                                        {item.title}
                                    </div>
                                    <div className={styles.meta}>
                                        {item.deadline && (
                                            <div className={classNames(styles.item, styles.deadline)}>
                                                即将截止：{dayjs(item.deadline).calendar(null, {
                                                    sameDay: '[今天] HH:mm',
                                                    nextDay: '[明天] HH:mm',
                                                    nextWeek: 'MM-DD HH:mm',
                                                    lastDay: '[昨天] HH:mm',
                                                    sameElse: 'YYYY-MM-DD HH:mm'
                                                })} <BellOutlined />
                                            </div>
                                        )}
                                        <div className={styles.item}>执行人：{user?.nickname}</div>
                                        <div className={styles.item}>创建时间：{dayjs(item.create_time).format('MM-DD HH:mm')}</div>
                                        <div className={styles.item}>创建人：{user?.nickname}</div>
                                        <div className={styles.item}>来自：个人待办</div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="text"
                                            danger
                                            className={styles.actionBtn}
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => handleDelete(e, item.id) /* 阻止冒泡 + 二次确认 */}
                                        />
                                        <div
                                            className="cursor-pointer text-lg transition-transform hover:scale-110"
                                            onClick={(e) => handleToggleStar(e, item) /* 阻止冒泡 */}
                                        >
                                            {item.is_starred ? <StarFilled className="text-yellow-400" /> : <StarOutlined className="text-gray-300" />}
                                        </div>
                                    </div>
                                    {item.status === 1 ? (
                                        <div className={styles.completedBadge}>已完成</div>
                                    ) : (
                                        <Button
                                            size="small"
                                            className="rounded-full text-xs"
                                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(item); /* 阻止冒泡，避免打开抽屉 */ }}
                                        >
                                            完成待办
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <Empty description="暂无待办事项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        </div>
                    )}
                    <div className="text-center py-4 text-gray-400 text-xs">
                        - 已展示全部待办 -
                    </div>
                </div>
            </div>

            {/* 新建待办弹窗 */}
            <Modal
                title="新建待办"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
                className="todo-modal"
                centered
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <div className="mb-4 text-gray-400 text-xs flex items-center justify-between">
                        <span>归属于 {user?.nickname} <FilterOutlined /></span>
                    </div>

                    <Form.Item
                        name="title"
                        rules={[{ required: true, message: '请输入待办标题' }]}
                    >
                        <Input.TextArea
                            placeholder="我的待办"
                            bordered={false}
                            autoSize={{ minRows: 1, maxRows: 2 }}
                            style={{ fontSize: 20, fontWeight: 600, padding: 0 }}
                        />
                    </Form.Item>

                    <Form.Item name="remark">
                        <Input.TextArea
                            placeholder="我的待办事项"
                            bordered={false}
                            autoSize={{ minRows: 2, maxRows: 4 }}
                            className="bg-gray-50 p-3 rounded-lg"
                        />
                    </Form.Item>

                    <Space direction="vertical" size={16} className="w-full mt-4">
                        <div className="flex items-center gap-4 text-gray-600">
                            <UserOutlined />
                            <Space>
                                <Avatar size="small" icon={<UserOutlined />} className="bg-primary" />
                                <span>{user?.nickname}</span>
                                <Input placeholder="搜索执行人" bordered={false} className="w-40" />
                            </Space>
                        </div>

                        <Form.Item name="deadline" className="m-0">
                            <DatePicker
                                showTime
                                placeholder="添加截止时间"
                                bordered={false}
                                suffixIcon={<BellOutlined />}
                                className="hover:bg-gray-100 p-2 rounded-lg cursor-pointer"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>

                        <Form.Item name="priority" className="m-0">
                            <Select
                                bordered={false}
                                className="hover:bg-gray-100 rounded-lg"
                                style={{ width: 150 }}
                                suffixIcon={<FilterOutlined />}
                            >
                                <Select.Option value={1}><span className="text-red-500">优先级：紧急</span></Select.Option>
                                <Select.Option value={2}>优先级：普通</Select.Option>
                                <Select.Option value={3}>优先级：较低</Select.Option>
                            </Select>
                        </Form.Item>
                    </Space>

                    <div className="flex justify-end gap-3 mt-10">
                        <Button onClick={() => setIsModalOpen(false)}>取消</Button>
                        <Button type="primary" htmlType="submit" className="bg-primary px-6">新建</Button>
                    </div>
                </Form>
            </Modal>

            {/* 详情抽屉 */}
            <Drawer
                title="待办详情"
                placement="right"
                onClose={() => setIsDrawerOpen(false)}
                open={isDrawerOpen}
                width={400}
            >
                {selectedTodo && (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <Tag color={selectedTodo.status === 1 ? primaryColor : 'default'}>
                                {selectedTodo.status === 1 ? '已完成' : '进行中'}
                            </Tag>
                            <Tag color={priorityMap[selectedTodo.priority]?.color}>
                                {priorityMap[selectedTodo.priority]?.label}
                            </Tag>
                        </div>

                        <div className="text-lg font-bold">
                            {selectedTodo.title}
                        </div>

                        {selectedTodo.remark && (
                            <div className="bg-gray-50 p-3 rounded text-gray-600">
                                {selectedTodo.remark}
                            </div>
                        )}

                        <div className="space-y-4 text-gray-500 text-sm mt-4">
                            <div className="flex items-center gap-2">
                                <ClockCircleOutlined />
                                <span>截止时间: {selectedTodo.deadline ? dayjs(selectedTodo.deadline).format('YYYY-MM-DD HH:mm') : '无'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <UserOutlined />
                                <span>执行人: {user?.nickname}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ClockCircleOutlined />
                                <span>创建时间: {dayjs(selectedTodo.create_time).format('YYYY-MM-DD HH:mm')}</span>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-2">
                            <Button block onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(selectedTodo);
                                setIsDrawerOpen(false);
                            }}>
                                {selectedTodo.status === 1 ? '标记为未完成' : '标记为完成'}
                            </Button>
                            <Button block danger onClick={(e) => handleDelete(e, selectedTodo.id)}>
                                删除
                            </Button>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default TodoList;
