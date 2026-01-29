import React, { useEffect, useState } from 'react';
import { List, Card, Checkbox, Button, DatePicker, Space, Typography, Progress, Form, Input, Modal, message, Empty, Statistic, Row, Col } from 'antd';
import { PlusOutlined, SettingOutlined, CheckCircleFilled, FireFilled } from '@ant-design/icons';
import { getDailyCheckin, toggleCheckin, getCheckinItems, createCheckinItem } from '../services/checkin';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Checkin: React.FC = () => {
    const [targetDate, setTargetDate] = useState(dayjs());
    const [dailyStatus, setDailyStatus] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, [targetDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data: any = await getDailyCheckin(targetDate.format('YYYY-MM-DD'));
            setDailyStatus(data);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (item: any, checked: boolean) => {
        try {
            await toggleCheckin({
                item_id: item.item.id,
                check_date: targetDate.format('YYYY-MM-DD'),
                check_status: checked ? 1 : 0
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const onFinish = async (values: any) => {
        await createCheckinItem(values);
        message.success('添加成功');
        setIsModalOpen(false);
        fetchData();
    };

    const completedCount = dailyStatus.filter(s => s.record?.check_status === 1).length;
    const totalCount = dailyStatus.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <Space direction="vertical" size={0}>
                    <Title level={3} style={{ margin: 0 }}>日常打卡</Title>
                    <Text type="secondary">坚持是成功的唯一捷径</Text>
                </Space>
                <Space>
                    <DatePicker
                        value={targetDate}
                        onChange={val => val && setTargetDate(val)}
                        allowClear={false}
                        style={{ borderRadius: 8 }}
                    />
                    <Button
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                        style={{ borderRadius: 8 }}
                    >
                        管理打卡项
                    </Button>
                </Space>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="今日进度"
                            value={progress}
                            suffix="%"
                            valueStyle={{ color: '#00B42A' }}
                            prefix={<FireFilled />}
                        />
                        <Progress percent={progress} strokeColor="#00B42A" showInfo={false} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic title="已完成" value={completedCount} suffix={`/ ${totalCount}`} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic title="打卡日期" value={targetDate.format('MM月DD日')} />
                    </Card>
                </Col>
            </Row>

            <List
                loading={loading}
                dataSource={dailyStatus}
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
                locale={{ emptyText: <Empty description="暂无打卡项，点击右上角添加吧！" /> }}
                renderItem={item => (
                    <List.Item>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 16,
                                border: item.record?.check_status === 1 ? '1.5px solid #00B42A' : '1px solid #f0f0f0',
                                background: item.record?.check_status === 1 ? '#E8F7EF' : '#fff',
                                transition: 'all 0.3s'
                            }}
                            bodyStyle={{ padding: 20 }}
                            onClick={() => handleToggle(item, !(item.record?.check_status === 1))}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Space size={16}>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 12,
                                        background: item.record?.check_status === 1 ? '#00B42A' : '#f5f5f5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 24,
                                        color: item.record?.check_status === 1 ? '#fff' : '#8c8c8c'
                                    }}>
                                        {item.item.item_name[0]}
                                    </div>
                                    <div>
                                        <Text strong style={{ fontSize: 16 }}>{item.item.item_name}</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {item.record?.check_status === 1 ? '已打卡' : '未打卡'}
                                        </Text>
                                    </div>
                                </Space>
                                <Checkbox
                                    checked={item.record?.check_status === 1}
                                    style={{ transform: 'scale(1.5)' }}
                                />
                            </div>
                        </Card>
                    </List.Item>
                )}
            />

            <Modal
                title="管理打卡项"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="inline" onFinish={onFinish} style={{ marginBottom: 24 }}>
                    <Form.Item name="item_name" rules={[{ required: true, message: '请输入名称' }]}>
                        <Input placeholder="打卡项名称 (如: 跑步)" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<PlusOutlined />} style={{ background: '#00B42A' }}>
                            添加
                        </Button>
                    </Form.Item>
                </Form>
                <Text type="secondary">提示：点击卡片即可快速打卡。目前仅支持添加，删除功能开发中。</Text>
            </Modal>
        </div>
    );
};

export default Checkin;
