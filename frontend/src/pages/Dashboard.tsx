import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Typography, Space, Button, Progress, Tag } from 'antd';
import {
    EditOutlined,
    CheckCircleOutlined,
    LineChartOutlined,
    PlusOutlined,
    RightOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getNotes } from '../services/note';
import { getTodos } from '../services/todo';
import { getDailyCheckin } from '../services/checkin';
import { getWeightRecords } from '../services/weight';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        notes: [],
        todos: [],
        checkinProgress: 0,
        checkinStats: { completed: 0, total: 0 },
        latestWeight: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [notes, todos, dailyCheckin, weightRecords]: any = await Promise.all([
                getNotes({ limit: 3 }),
                getTodos({ status: 0 }),
                getDailyCheckin(),
                getWeightRecords()
            ]);

            const completedCheckin = dailyCheckin.filter((s: any) => s.record?.check_status === 1).length;
            const totalCheckin = dailyCheckin.length;

            setStats({
                notes: notes,
                todos: todos.slice(0, 3),
                checkinProgress: totalCheckin > 0 ? Math.round((completedCheckin / totalCheckin) * 100) : 0,
                checkinStats: { completed: completedCheckin, total: totalCheckin },
                latestWeight: weightRecords.length > 0 ? weightRecords[weightRecords.length - 1].weight : 0
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto">
            <div className="mb-8">
                <Title level={2} className="!m-0">早安！开始高效的一天</Title>
                <Text type="secondary">今天是 {dayjs().format('YYYY年MM月DD日')}，看看你的生活概览</Text>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable className="rounded-2xl">
                        <Statistic
                            title="今日打卡进度"
                            value={stats.checkinProgress}
                            suffix="%"
                            valueStyle={{ color: '#00B42A' }}
                            prefix={<CheckCircleOutlined />}
                        />
                        <Progress percent={stats.checkinProgress} strokeColor="#00B42A" showInfo={false} />
                        <Text type="secondary" className="text-xs">已完成 {stats.checkinStats.completed}/{stats.checkinStats.total}</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable className="rounded-2xl">
                        <Statistic
                            title="待办事项"
                            value={stats.todos.length}
                            suffix="项待办"
                            valueStyle={{ color: '#faad14' }}
                            prefix={<ArrowRightOutlined />}
                        />
                        <Button type="link" onClick={() => navigate('/todo')} className="p-0">去完成 <RightOutlined className="text-[10px]" /></Button>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable className="rounded-2xl">
                        <Statistic
                            title="当前体重"
                            value={stats.latestWeight}
                            precision={1}
                            suffix="kg"
                            prefix={<LineChartOutlined />}
                        />
                        <Text type="secondary" className="text-xs">保持健康生活习惯</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        className="rounded-2xl bg-primary flex flex-col justify-center h-full min-h-[110px]"
                        bodyStyle={{ color: '#fff' }}
                        onClick={() => navigate('/note')}
                    >
                        <Space direction="vertical" size={4}>
                            <PlusOutlined className="text-2xl" />
                            <Text className="!text-white text-base font-medium">快速记录笔记</Text>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} className="mt-6">
                <Col xs={24} lg={12}>
                    <Card
                        title={<Space><EditOutlined /> 最近笔记</Space>}
                        extra={<Button type="link" onClick={() => navigate('/note')}>全部</Button>}
                        className="rounded-2xl"
                    >
                        <List
                            loading={loading}
                            dataSource={stats.notes}
                            renderItem={(item: any) => (
                                <List.Item onClick={() => navigate('/note')} className="cursor-pointer">
                                    <List.Item.Meta
                                        title={item.title}
                                        description={dayjs(item.update_time).format('MM-DD HH:mm')}
                                    />
                                    <Tag color="green">笔记</Tag>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card
                        title={<Space><CheckCircleOutlined /> 待办预告</Space>}
                        extra={<Button type="link" onClick={() => navigate('/todo')}>全部</Button>}
                        className="rounded-2xl"
                    >
                        <List
                            loading={loading}
                            dataSource={stats.todos}
                            renderItem={(item: any) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={item.title}
                                        description={item.deadline ? `截止日期：${dayjs(item.deadline).format('MM-DD HH:mm')}` : '无截止日期'}
                                    />
                                    <Tag bordered={false}>{item.priority === 1 ? '重要' : '普通'}</Tag>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
