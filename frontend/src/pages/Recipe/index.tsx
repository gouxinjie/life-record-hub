import React, { useEffect, useState, useCallback } from "react";
import { List, Card, Button, Input, Space, Tag, Modal, Form, Typography, Empty, Select, Row, Col, InputNumber, App, Tooltip, Tabs, Skeleton } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
  ClockCircleOutlined
} from "@ant-design/icons";
import { getRecipes, createRecipe, updateRecipe, deleteRecipe } from "../../services/recipe";
import styles from "./index.module.scss";
import { useTheme } from "../../context/ThemeContext";

const { Title, Paragraph, Text } = Typography;

const categories = ["全部", "素菜系列", "荤菜系列", "汤羹系列", "面食系列", "早餐系列"];

const RecipeList: React.FC = () => {
  const { primaryColor, theme } = useTheme();
  const { message: messageApi, modal } = App.useApp();

  // State
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const LIMIT = 12; // 增加到12个（3行），大部分屏幕首屏能铺满

  const [keyword, setKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [previewRecipe, setPreviewNote] = useState<any>(null);
  const [form] = Form.useForm();
  const [currentCategory, setCurrentCategory] = useState<string>("全部");

  const difficultyColors: any = {
    简单: "green",
    中等: "orange",
    困难: "red"
  };

  const loadingRef = React.useRef(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);

  const fetchRecipes = useCallback(async (isRefresh = false) => {
    if (loadingRef.current || (!hasMore && !isRefresh)) return;
    
    loadingRef.current = true;
    setLoading(true);
    const currentSkip = isRefresh ? 0 : skip;
    
    try {
      const data: any = await getRecipes({
        category: currentCategory === "全部" ? undefined : currentCategory,
        keyword: keyword,
        skip: currentSkip,
        limit: LIMIT
      });
      
      if (isRefresh) {
        setRecipes(data);
        setSkip(LIMIT);
        setHasMore(data.length === LIMIT);
      } else {
        setRecipes(prev => [...prev, ...data]);
        setSkip(prev => prev + LIMIT);
        setHasMore(data.length === LIMIT);
      }
    } catch (error) {
      console.error(error);
      messageApi.error("加载失败");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [currentCategory, keyword, skip, hasMore]);

  useEffect(() => {
    fetchRecipes(true);
  }, [currentCategory, keyword]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loadingRef.current && hasMore) {
          fetchRecipes();
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0
      }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [fetchRecipes, hasMore]);

  const handleCreate = () => {
    setEditingRecipe(null);
    form.resetFields();
    form.setFieldsValue({ category: currentCategory !== "全部" ? currentCategory : "素菜系列", difficulty: "简单" });
    setIsModalOpen(true);
  };

  const handleEdit = (recipe: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRecipe(recipe);
    form.setFieldsValue(recipe);
    setIsModalOpen(true);
  };

  const handlePreview = (recipe: any) => {
    setPreviewNote(recipe);
    setIsPreviewOpen(true);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    modal.confirm({
      title: "确认删除",
      content: "确定要删除这条菜谱吗？删除后不可恢复。",
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        await deleteRecipe(id);
        messageApi.success("已删除");
        fetchRecipes(true);
      }
    });
  };

  const handleToggleStar = async (recipe: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateRecipe(recipe.id, { is_starred: recipe.is_starred ? 0 : 1 });
      // 局部更新状态，不触发全量刷新
      setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, is_starred: recipe.is_starred ? 0 : 1 } : r));
    } catch (error) {
      messageApi.error("操作失败");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, values);
        messageApi.success("更新成功");
      } else {
        await createRecipe(values);
        messageApi.success("创建成功");
      }
      setIsModalOpen(false);
      fetchRecipes(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={`${styles.recipePageContainer} mx-auto`}>
      <div className="flex justify-between items-center mb-6">
        <Space direction="vertical" size={0}>
          <Title level={3} className="!m-0">
            我的食谱
          </Title>
          <Text type="secondary">记录你的美食心得</Text>
        </Space>
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索菜谱..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => fetchRecipes(true)}
            className="w-[250px] rounded-lg"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} className="bg-primary rounded-lg">
            新增菜谱
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={currentCategory}
        onChange={setCurrentCategory}
        className={styles.customTabs}
        items={categories.map((cat) => ({
          key: cat,
          label: cat
        }))}
      />

      {loading && skip === 0 ? (
        <Row gutter={[12, 12]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Col key={i} xs={24} sm={12} md={8} lg={6}>
              <Card className="h-full">
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <List
          grid={{ gutter: 12, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 }}
          dataSource={recipes}
          locale={{ emptyText: <Empty description="暂无菜谱，点击新增开始记录" /> }}
          loadMore={
            loading && skip === 0 ? null : (
              <div className="text-center my-8">
                {loading && <div className="text-gray-400 animate-pulse">正在加载更多...</div>}
                {!loading && hasMore && recipes.length > 0 && (
                  <Button
                    type="link"
                    onClick={() => fetchRecipes()}
                    className="text-gray-400 hover:text-primary"
                  >
                    加载更多
                  </Button>
                )}
                {!hasMore && recipes.length > 0 && <div className="text-gray-300">—— 已经到底啦 ——</div>}
                <div ref={sentinelRef} className="h-1" />
              </div>
            )
          }
          renderItem={(item: any) => (
            <List.Item className="h-full">
              <Card
                hoverable
                className="h-full group"
                onClick={() => handlePreview(item)}
                cover={
                  <div className="ant-card-cover">
                    <div className="card-star" onClick={(e) => handleToggleStar(item, e)}>
                      {item.is_starred ? <StarFilled className="text-yellow-400" /> : <StarOutlined className="text-gray-300 hover:text-yellow-400" />}
                    </div>
                    <img
                      alt={item.name}
                      src={item.image_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=500&auto=format&fit=crop"}
                    />
                  </div>
                }
                actions={[
                  <Tooltip title="查看详情" key="view">
                    <div className="flex items-center justify-center w-full h-full py-2 hover:bg-blue-50 transition-colors group/btn">
                      <EyeOutlined className="text-lg text-gray-400 group-hover/btn:text-primary" />
                    </div>
                  </Tooltip>,
                  <Tooltip title="编辑菜谱" key="edit">
                    <div
                      className="flex items-center justify-center w-full h-full py-2 hover:bg-green-50 transition-colors group/btn"
                      onClick={(e) => handleEdit(item, e)}
                    >
                      <EditOutlined className="text-lg text-gray-400 group-hover/btn:text-green-500" />
                    </div>
                  </Tooltip>,
                  <Tooltip title="删除菜谱" key="delete">
                    <div
                      className="flex items-center justify-center w-full h-full py-2 hover:bg-red-50 transition-colors group/btn"
                      onClick={(e) => handleDelete(item.id, e)}
                    >
                      <DeleteOutlined className="text-lg text-gray-400 group-hover/btn:text-red-500" />
                    </div>
                  </Tooltip>
                ]}
              >
                <Title level={5} className="!m-0 mb-2 truncate text-sm" title={item.name}>
                  {item.name}
                </Title>

                <div className={styles.recipeCardInfo}>
                  <div className={styles.infoItem}>
                    <ClockCircleOutlined />
                    <span>{item.duration || 0} 分钟</span>
                  </div>
                  <div className={styles.infoItem}>
                    <Tag
                      color={difficultyColors[item.difficulty] || "blue"}
                      className="m-0 border-none px-2 py-0 text-[11px] font-bold leading-5 h-5 rounded"
                    >
                      {item.difficulty}
                    </Tag>
                  </div>
                </div>

                <div className={styles.ingredientSummary}>
                  <Paragraph ellipsis={{ rows: 2 }} className="!m-0 text-gray-500">
                    {item.ingredients}
                  </Paragraph>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Recipe Edit Modal */}
      <Modal
        title={editingRecipe ? "编辑菜谱" : "新增菜谱"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="菜谱名称" rules={[{ required: true, message: "请输入菜谱名称" }]}>
                <Input placeholder="如：番茄炒蛋" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="所属分类" rules={[{ required: true, message: "请选择分类" }]}>
                <Select>
                  <Select.Option value="素菜系列">素菜系列</Select.Option>
                  <Select.Option value="荤菜系列">荤菜系列</Select.Option>
                  <Select.Option value="汤羹系列">汤羹系列</Select.Option>
                  <Select.Option value="面食系列">面食系列</Select.Option>
                  <Select.Option value="早餐系列">早餐系列</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="duration" label="烹饪时长 (分钟)">
                <InputNumber className="w-full" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="difficulty" label="难度等级">
                <Select>
                  <Select.Option value="简单">简单</Select.Option>
                  <Select.Option value="中等">中等</Select.Option>
                  <Select.Option value="困难">困难</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="ingredients" label="食材清单" rules={[{ required: true, message: "请输入食材" }]}>
            <Input.TextArea placeholder="如：番茄2个，鸡蛋3个，盐少许" autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item name="steps" label="烹饪步骤" rules={[{ required: true, message: "请输入步骤" }]}>
            <Input.TextArea placeholder="1. 番茄切块\n2. 鸡蛋打散炒熟..." autoSize={{ minRows: 4 }} />
          </Form.Item>
          <Form.Item name="image_url" label="成品图片 URL">
            <Input placeholder="请输入图片链接 (后续可集成上传功能)" />
          </Form.Item>
          <Form.Item name="remark" label="备注/心得">
            <Input.TextArea placeholder="个人做菜心得..." autoSize={{ minRows: 2 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Recipe Preview Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <Title level={4} className="!m-0">
              {previewRecipe?.name}
            </Title>
            <Tag color={primaryColor} className="border-none rounded-md px-2 py-0.5 text-xs">
              {previewRecipe?.category}
            </Tag>
          </div>
        }
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsPreviewOpen(false)} className="rounded-lg">
            关闭
          </Button>,
          <Button
            key="edit"
            type="primary"
            className="bg-primary rounded-lg"
            onClick={(e) => {
              setIsPreviewOpen(false);
              handleEdit(previewRecipe, e as any);
            }}
          >
            编辑菜谱
          </Button>
        ]}
        width={650}
        centered
        className="recipe-preview-modal"
      >
        {previewRecipe && (
          <div className="py-4">
            <div className="flex items-center gap-6 mb-6 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-gray-400" />
                <span className="text-gray-600 font-medium">{previewRecipe.duration || 0} 分钟</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">难度:</span>
                <Tag color={difficultyColors[previewRecipe.difficulty]} className="m-0 border-none rounded-md px-3">
                  {previewRecipe.difficulty}
                </Tag>
              </div>
              {previewRecipe.is_starred === 1 && (
                <div className="flex items-center gap-2 ml-auto">
                  <StarFilled className="text-yellow-400" />
                  <span className="text-yellow-600 text-sm font-medium">已收藏</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <section>
                <Title level={5} className="flex items-center gap-2 !mb-4 text-gray-800">
                  <div className="w-1 h-5 bg-orange-400 rounded-full" />
                  食材清单
                </Title>
                <div className="bg-orange-50/20 p-2 rounded-xl border border-orange-100/30">
                  <div className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">{previewRecipe.ingredients}</div>
                </div>
              </section>

              <section>
                <Title level={5} className="flex items-center gap-2 !mb-4 text-gray-800">
                  <div className="w-1 h-5 bg-blue-400 rounded-full" />
                  烹饪步骤
                </Title>
                <div className="space-y-4">
                  {previewRecipe.steps
                    .split("\n")
                    .filter((s: string) => s.trim())
                    .map((step: string, index: number) => (
                      <div key={index} className="flex gap-4 group">
                        <div className="flex-shrink-0 w-7 h-7 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center font-bold text-sm border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          {index + 1}
                        </div>
                        <div className="pt-0.5 text-gray-700 text-[15px] leading-relaxed flex-1">{step.replace(/^\d+[.、\s]*/, "")}</div>
                      </div>
                    ))}
                </div>
              </section>

              {previewRecipe.remark && (
                <section className="pt-4">
                  <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 relative">
                    <Title level={5} className="!mb-2 text-gray-400 text-xs uppercase tracking-wider">
                      备注 / 心得
                    </Title>
                    <div className="text-gray-600 text-sm leading-relaxed">{previewRecipe.remark}</div>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecipeList;
