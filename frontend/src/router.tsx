import React from 'react';
import {
    BookOutlined,
    CheckSquareOutlined,
    CalendarOutlined,
    DashboardOutlined,
    LineChartOutlined
} from '@ant-design/icons';

export interface RouteConfig {
    path: string;
    name: string;
    icon?: React.ReactNode;
    module?: string;
    children?: RouteConfig[];
}

export const routes: RouteConfig[] = [
    {
        path: '/',
        name: '仪表盘',
        icon: <DashboardOutlined />,
        module: 'dashboard'
    },
    {
        path: '/note',
        name: '我的笔记',
        icon: <BookOutlined />,
        module: 'note',
        children: [
            {
                path: '/note/life',
                name: '生活感悟',
                module: 'note'
            },
            {
                path: '/note/work',
                name: '工作记录',
                module: 'note'
            },
            {
                path: '/note/study',
                name: '学习资料',
                module: 'note'
            },
            {
                path: '/note/tech',
                name: '技术文档',
                module: 'note'
            }
        ]
    },
    {
        path: '/todo',
        name: '待办事项',
        icon: <CheckSquareOutlined />,
        module: 'todo'
    },
    {
        path: '/checkin',
        name: '每日打卡',
        icon: <CalendarOutlined />,
        module: 'checkin'
    },
    {
        path: '/weight',
        name: '体重记录',
        icon: <LineChartOutlined />,
        module: 'weight'
    }
];
