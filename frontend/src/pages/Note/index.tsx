import React, { useEffect, useState } from 'react';
import { List, Card, Button, Input, Space, Tag, Modal, Form, Typography, Empty, Select, Segmented, App as AntdApp } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { getNotes, createNote, updateNote, deleteNote } from '@/services/note';
import { routes } from '@/router';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './index.module.scss';
import { useTheme } from '@/context/ThemeContext';

const { Title, Paragraph, Text } = Typography;

const NoteList: React.FC = () => {
    const { primaryColor, theme } = useTheme();
    const location = useLocation();
    const { message, modal } = AntdApp.useApp(); // 使用 App hook 获取静态方法
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<any>(null);
    const [previewNote, setPreviewNote] = useState<any>(null);
    const [notesMenus, setNotesMenus] = useState<any[]>([]);
    const [contentType, setContentType] = useState<number>(0); // 0: Rich Text, 1: Markdown
    const [form] = Form.useForm();

    // 匹配当前路由对应的 category_path
    const [currentCategoryPath, setCurrentCategoryPath] = useState<string | undefined>();

    useEffect(() => {
        fetchMenus();
    }, []);

    // 关键修正：当路径变化或菜单树加载完成后，重新匹配当前的分类路径
    useEffect(() => {
        if (notesMenus.length > 0) {
            const current = notesMenus.find((c: any) => c.path === location.pathname);
            if (current) {
                setCurrentCategoryPath(current.path);
            } else {
                // 如果是根路径 /note，或者是未分配的路径
                setCurrentCategoryPath(undefined);
            }
        }
    }, [location.pathname, notesMenus]);

    useEffect(() => {
        fetchNotes();
    }, [currentCategoryPath]); // 仅在分类路径确定后再获取数据

    // 解决 useForm 未连接的问题：当弹窗打开时同步数据
    useEffect(() => {
        if (isModalOpen) {
            if (editingNote) {
                form.setFieldsValue(editingNote);
            } else {
                form.resetFields();
                form.setFieldsValue({
                    category_path: currentCategoryPath,
                    content_type: 0
                });
            }
        }
    }, [isModalOpen, editingNote, currentCategoryPath, form]);

    const fetchMenus = async () => {
        const noteCategory = routes.find((m: any) => m.module === 'note');
        if (noteCategory && noteCategory.children) {
            setNotesMenus(noteCategory.children);
        }
    };

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const data: any = await getNotes({
                category_path: currentCategoryPath,
                keyword: keyword
            });
            setNotes(data);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingNote(null);
        setContentType(0);
        setIsModalOpen(true);
    };

    const handleEdit = (note: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingNote(note);
        setContentType(note.content_type || 0);
        setIsModalOpen(true);
    };

    const handlePreview = (note: any) => {
        setPreviewNote(note);
        setIsPreviewOpen(true);
    };

    const handleDelete = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        modal.confirm({
            title: '确认删除',
            content: '确定要删除这条笔记吗？',
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                await deleteNote(id);
                message.success('已移至回收站');
                fetchNotes();
            },
        });
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = { ...values, content_type: contentType };
            if (editingNote) {
                await updateNote(editingNote.id, payload);
                message.success('更新成功');
            } else {
                await createNote(payload);
                message.success('创建成功');
            }
            setIsModalOpen(false);
            fetchNotes();
        } catch (error) {
            console.error(error);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image', 'code-block'],
            ['clean']
        ],
    };

    return (
        <div className={`${styles.notePageContainer} mx-auto`}>
            <div className="flex justify-between items-center mb-6">
                <Space direction="vertical" size={0}>
                    <Title level={3} className="!m-0">我的笔记</Title>
                    <Text type="secondary">支持富文本与 Markdown 双格式记录</Text>
                </Space>
                <Space>
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder="搜索笔记..."
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                        onPressEnter={fetchNotes}
                        className="w-[250px] rounded-lg"
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                        className="bg-primary rounded-lg"
                    >
                        新建笔记
                    </Button>
                </Space>
            </div>

            <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
                loading={loading}
                dataSource={notes}
                locale={{ emptyText: <Empty description="暂无笔记，点击新建开始记录" /> }}
                renderItem={(item: any) => (
                    <List.Item className="h-full">
                        <Card
                            hoverable
                            className="rounded-xl h-full border border-gray-100 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
                            onClick={() => handlePreview(item)}
                            actions={[
                                <div className="hover:text-primary transition-colors"><EyeOutlined key="view" /></div>,
                                <div className="hover:text-primary transition-colors"><EditOutlined key="edit" onClick={(e) => handleEdit(item, e)} /></div>,
                                <div className="hover:text-red-500 transition-colors"><DeleteOutlined key="delete" className="text-red-400 group-hover:text-red-500" onClick={(e) => handleDelete(item.id, e)} /></div>,
                            ]}
                            styles={{ body: { height: 180, display: 'flex', flexDirection: 'column', padding: '16px' } }}
                        >
                            <div className="mb-3 flex justify-between items-start">
                                <Tag color={item.content_type === 1 ? (theme === 'green' ? 'blue' : 'cyan') : primaryColor} className="rounded-md border-none px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                                    {item.content_type === 1 ? 'Markdown' : 'Rich Text'}
                                </Tag>
                                <Text className="text-gray-400 text-[11px] font-medium">
                                    {dayjs(item.update_time).format('YYYY-MM-DD')}
                                </Text>
                            </div>
                            <Title level={5} className="!mt-0 !mb-2 text-gray-800 group-hover:text-primary transition-colors leading-snug" ellipsis={{ rows: 2 }}>
                                {item.title}
                            </Title>
                            <Paragraph
                                type="secondary"
                                ellipsis={{ rows: 4 }}
                                className="flex-1 text-sm text-gray-500 mb-0 leading-relaxed"
                            >
                                {item.content_type === 1
                                    ? item.content.replace(/[#*`\n]/g, ' ').trim()
                                    : item.content.replace(/<[^>]+>/g, ' ').trim()}
                            </Paragraph>
                        </Card>
                    </List.Item>
                )}
            />

            {/* 编辑/新建弹窗 */}
            <Modal
                title={editingNote ? '编辑笔记' : '新建笔记'}
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={() => setIsModalOpen(false)}
                width={900}
                okText="保存"
                cancelText="取消"
                destroyOnClose
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <div className="flex gap-4 mb-4">
                        <Form.Item
                            name="title"
                            label="标题"
                            className="flex-1 !mb-0"
                            rules={[{ required: true, message: '请输入标题' }]}
                        >
                            <Input placeholder="笔记标题" size="large" className="rounded-lg" />
                        </Form.Item>
                        <Form.Item
                            name="category_path"
                            label="分类"
                            className="w-[200px] !mb-0"
                            rules={[{ required: true, message: '请选择分类' }]}
                        >
                            <Select placeholder="选择分类" className="rounded-lg" size="large">
                                {notesMenus.map(m => (
                                    <Select.Option key={m.path} value={m.path}>{m.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <div className="mb-4">
                        <Text type="secondary" className="mr-3">内容格式:</Text>
                        <Segmented
                            options={[
                                { label: 'Markdown', value: 1 },
                                { label: '富文本', value: 0 },
                            ]}
                            value={contentType}
                            onChange={(val) => setContentType(val as number)}
                        />
                    </div>

                    <Form.Item
                        name="content"
                        rules={[{ required: true, message: '内容不能为空' }]}
                    >
                        {contentType === 0 ? (
                            <ReactQuill
                                theme="snow"
                                modules={modules}
                                className="h-[400px] mb-12"
                                placeholder="输入内容..."
                            />
                        ) : (
                            <Input.TextArea
                                placeholder="使用 Markdown 语法书写..."
                                className="font-mono rounded-lg"
                                autoSize={{ minRows: 15, maxRows: 25 }}
                            />
                        )}
                    </Form.Item>
                </Form>
            </Modal>

            {/* 预览弹窗 */}
            <Modal
                title={previewNote?.title}
                open={isPreviewOpen}
                onCancel={() => setIsPreviewOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsPreviewOpen(false)}>关闭</Button>,
                    <Button key="edit" type="primary" className="bg-primary" onClick={(e) => {
                        setIsPreviewOpen(false);
                        handleEdit(previewNote, e as any);
                    }}>编辑</Button>
                ]}
                width={800}
                className="preview-modal"
            >
                <div className="py-4 overflow-y-auto max-h-[70vh]">
                    <div className="mb-4 text-xs text-gray-400 flex items-center gap-4">
                        <span>分类: {notesMenus.find(m => m.path === previewNote?.category_path)?.name || '未分类'}</span>
                        <span>更新于: {dayjs(previewNote?.update_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </div>
                    <hr className="mb-6 border-gray-100" />
                    <div className="prose max-w-none">
                        {previewNote?.content_type === 1 ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {previewNote.content}
                            </ReactMarkdown>
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: previewNote?.content }} />
                        )}
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default NoteList;
