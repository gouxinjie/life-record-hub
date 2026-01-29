import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Space, Typography, Modal, Form, InputNumber, Input, DatePicker, message, Row, Col, Statistic } from 'antd';
import { PlusOutlined, LineChartOutlined, HistoryOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getWeightRecords, recordWeight, updateWeight, deleteWeight } from '../services/weight';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Weight: React.FC = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data: any = await getWeightRecords({
                start_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                end_date: dayjs().format('YYYY-MM-DD')
            });
            setRecords(data);
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values: any) => {
        try {
            const data = {
                ...values,
                record_date: values.record_date.format('YYYY-MM-DD')
            };
            await recordWeight(data);
            message.success('记录成功');
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            // 错误已处理
        }
    };

    const chartData = records.map(r => ({
        date: dayjs(r.record_date).format('MM-DD'),
        weight: parseFloat(r.weight),
    }));

    const latestWeight = records.length > 0 ? parseFloat(records[records.length - 1].weight) : 0;
    const prevWeight = records.length > 1 ? parseFloat(records[records.length - 2].weight) : 0;
    const diff = latestWeight - prevWeight;

    const columns = [
        { title: '日期', dataIndex: 'record_date', key: 'date', render: (text: string) => dayjs(text).format('YYYY-MM-DD') },
        { title: '体重 (kg)', dataIndex: 'weight', key: 'weight' },
        { title: '备注', dataIndex: 'remark', key: 'remark' },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: any) => (
                <Button type="link" danger onClick={async () => {
                    await deleteWeight(record.id);
                    message.success('已删除');
                    fetchData();
                }}>删除</Button>
            ),
        },
    ];

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <Space direction="vertical" size={0}>
                    <Title level={3} style={{ margin: 0 }}>体重管理</Title>
                    <Text type="secondary">关注健康，从记录开始</Text>
                </Space>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        form.resetFields();
                        form.setFieldsValue({ record_date: dayjs() });
                        setIsModalOpen(true);
                    }}
                    style={{ borderRadius: 8, background: '#00B42A' }}
                >
                    记录体重
                </Button>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="最新体重"
                            value={latestWeight}
                            precision={1}
                            suffix="kg"
                            prefix={<LineChartOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="较上次"
                            value={Math.abs(diff)}
                            precision={1}
                            suffix="kg"
                            valueStyle={{ color: diff <= 0 ? '#52c41a' : '#ff4d4f' }}
                            prefix={diff <= 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic title="本月记录次数" value={records.length} prefix={<HistoryOutlined />} />
                    </Card>
                </Col>
            </Row>

            <Card title="体重趋势图" style={{ marginBottom: 24, borderRadius: 12 }}>
                <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" />
                            <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#00B42A"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#00B42A' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card title="历史记录" style={{ borderRadius: 12 }}>
                <Table
                    columns={columns}
                    dataSource={records}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 7 }}
                />
            </Card>

            <Modal
                title="记录今日体重"
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
                okText="保存"
                cancelText="取消"
            >
                <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
                    <Form.Item name="record_date" label="日期" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="weight" label="当前体重 (kg)" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={30} max={200} step={0.1} />
                    </Form.Item>
                    <Form.Item name="remark" label="备注">
                        <Input placeholder="晨起空腹、运动后等..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Weight;
