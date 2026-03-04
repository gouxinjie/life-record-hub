import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, App } from 'antd';
import { UserOutlined, LockOutlined, RocketFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/auth';

const { Title, Text } = Typography;

const Login: React.FC = () => {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    // 如果已登录，直接进入首页
    React.useEffect(() => {
        if (localStorage.getItem('token')) {
            navigate('/');
        }
    }, [navigate]);

    React.useEffect(() => {
        if (isLogin) {
            form.setFieldsValue({ username: 'admin', password: '123456' });
        }
    }, [isLogin, form]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            if (isLogin) {
                const params = new URLSearchParams();
                params.append('username', values.username);
                params.append('password', values.password);

                const res: any = await login(params);
                localStorage.setItem('token', res.access_token);
                message.success('登录成功');
                // 使用硬跳转确保整个 App 重新加载并进入 AuthGuard 的受控制范围
                window.location.href = '/';
            } else {
                await register({
                    username: values.username,
                    password: values.password,
                    nickname: values.nickname,
                });
                message.success('注册成功，请登录');
                setIsLogin(true);
            }
        } catch (error: any) {
            const detail = error?.response?.data?.detail as string | undefined;
            if (!isLogin && error?.response?.status === 400 && detail && detail.includes('已注册')) {
                message.info('该账号已存在，已切换到登录');
                setIsLogin(true);
                form.setFieldsValue({ username: values.username, password: values.password });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex justify-center items-center bg-gradient-to-br from-primary-light to-[var(--scroll-thumb)]">
            <Card
                className="w-[400px] shadow-2xl rounded-2xl border border-white/50 backdrop-blur-md"
                bodyStyle={{ padding: '40px 32px' }}
            >
                <div className="text-center mb-8">
                    <Space direction="vertical" align="center">
                        <RocketFilled className="text-4xl text-primary" />
                        <Title level={2} className="!m-0 !text-primary-dark">
                            MyNote {isLogin ? '登录' : '注册'}
                        </Title>
                        <Text type="secondary">个人在线笔记 & 待办管理系统</Text>
                        {isLogin && <Text type="secondary">默认账号：admin / 密码：123456</Text>}
                        {!isLogin && <Text type="secondary">提示：默认账号已存在，请直接使用 admin / 123456 登录</Text>}
                    </Space>
                </div>

                <Form
                    form={form}
                    name="auth_form"
                    initialValues={{ username: 'admin', password: '123456' }}
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入邮箱/手机号' }]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-primary" />}
                            placeholder="账号 (邮箱/手机号)"
                            className="rounded-lg"
                        />
                    </Form.Item>

                    {!isLogin && (
                        <Form.Item
                            name="nickname"
                            rules={[{ required: true, message: '请输入昵称' }]}
                        >
                            <Input
                                placeholder="昵称"
                                className="rounded-lg"
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: '请输入密码' },
                            { min: 6, message: '密码至少6位' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-primary" />}
                            placeholder="密码"
                            className="rounded-lg"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            className="h-12 rounded-lg text-lg bg-primary shadow-lg hover:!bg-primary-dark"
                        >
                            {isLogin ? '立即登录' : '注册账户'}
                        </Button>
                    </Form.Item>

                    {isLogin && (
                        <Form.Item>
                            <Button
                                type="default"
                                onClick={() => form.submit()}
                                block
                            >
                                一键登录
                            </Button>
                        </Form.Item>
                    )}

                    <div className="text-center">
                        <Button
                            type="link"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-primary-dark hover:text-primary"
                        >
                            {isLogin ? '没有账号？立即注册' : '已有账号？返回登录'}
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
