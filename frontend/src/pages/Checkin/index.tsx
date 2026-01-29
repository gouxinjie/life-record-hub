import React, { useEffect, useState } from "react";
import {
  List,
  Card,
  Checkbox,
  Button,
  DatePicker,
  Space,
  Typography,
  Progress,
  Form,
  Input,
  Modal,
  message,
  Empty,
  Statistic,
  Row,
  Col,
  Tabs,
  Table,
  Tag,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  FireFilled,
  HistoryOutlined,
  SettingOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import {
  getDailyCheckin,
  saveCheckinRecord,
  getCheckinItems,
  addCheckinItem,
  updateCheckinItem,
  deleteCheckinItem,
  getCheckinHistory
} from "../../services/checkin";
import dayjs from "dayjs";
import "./index.module.scss";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Checkin: React.FC = () => {
  // --- 状态管理 ---
  const [activeTab, setActiveTab] = useState("daily");
  const [targetDate, setTargetDate] = useState(dayjs());
  const [dailyData, setDailyData] = useState<any>({ stat: {}, items: [] });
  const [allItems, setAllItems] = useState<any[]>([]);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 弹窗相关
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm] = Form.useForm();

  // --- 数据获取 ---

  // 获取每日打卡数据
  const fetchDailyData = async () => {
    if (!targetDate || !targetDate.format) {
      console.error("targetDate is invalid:", targetDate);
      return;
    }
    const dateStr = targetDate.format("YYYY-MM-DD");
    if (dateStr === "Invalid Date") {
      console.error("targetDate is an Invalid Date object");
      return;
    }
    
    setLoading(true);
    try {
      const res: any = await getDailyCheckin(dateStr);
      setDailyData(res);
    } catch (error) {
      console.error("fetchDailyData error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 获取打卡项列表 (管理页使用)
  const fetchItemsData = async () => {
    setLoading(true);
    try {
      const res: any = await getCheckinItems();
      setAllItems(res);
    } finally {
      setLoading(false);
    }
  };

  // 获取历史记录
  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const res: any = await getCheckinHistory({ limit: 50 });
      setHistoryRecords(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "daily") fetchDailyData();
    if (activeTab === "manage") fetchItemsData();
    if (activeTab === "history") fetchHistoryData();
  }, [activeTab, targetDate]);

  // --- 操作处理 ---

  // 切换打卡状态
  const handleToggle = async (item: any) => {
    try {
      const newStatus = item.check_status === 1 ? 0 : 1;
      await saveCheckinRecord({
        item_id: item.id,
        check_date: targetDate.format("YYYY-MM-DD"),
        check_status: newStatus,
        item_remark: item.item_remark
      });
      fetchDailyData();
    } catch (error) {
      message.error("操作失败");
    }
  };

  // 保存备注
  const handleRemarkChange = async (item: any, remark: string) => {
    try {
      await saveCheckinRecord({
        item_id: item.id,
        check_date: targetDate.format("YYYY-MM-DD"),
        check_status: item.check_status,
        item_remark: remark
      });
      fetchDailyData();
    } catch (error) {
      message.error("备注保存失败");
    }
  };

  // 打卡项 增/删/改
  const handleItemSubmit = async (values: any) => {
    try {
      if (editingItem) {
        await updateCheckinItem(editingItem.id, values);
        message.success("更新成功");
      } else {
        await addCheckinItem(values);
        message.success("创建成功");
      }
      setIsItemModalOpen(false);
      fetchItemsData();
    } catch (error) {
      message.error("操作失败");
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await deleteCheckinItem(id);
      message.success("已删除");
      fetchItemsData();
    } catch (error) {
      message.error("删除失败");
    }
  };

  // --- 子组件渲染 ---

  // 1. 每日打卡视图
  const renderDailyView = () => (
    <>
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card className="rounded-xl shadow-sm border-none">
            <Statistic
              title="今日完成率"
              value={dailyData.stat.completion_rate || 0}
              suffix="%"
              prefix={<FireFilled className="text-orange-500" />}
            />
            <Progress percent={dailyData.stat.completion_rate || 0} strokeColor="#00B42A" showInfo={false} className="mt-2" />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="rounded-xl shadow-sm border-none">
            <Statistic title="已完成 / 总项" value={dailyData.stat.completed_count || 0} suffix={`/ ${dailyData.stat.total_items || 0}`} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="rounded-xl shadow-sm border-none">
            <Statistic title="当前选择日期" value={targetDate.format("MM-DD")} prefix={<HistoryOutlined />} />
          </Card>
        </Col>
      </Row>

      <List
        loading={loading}
        dataSource={dailyData.items}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3 }}
        locale={{ emptyText: <Empty description="今日暂无打卡项，请先去管理页创建" /> }}
        renderItem={(item: any) => (
          <List.Item>
            <Card
              className={`rounded-2xl transition-all duration-300 ${item.check_status === 1 ? "bg-green-50 border-green-200" : "bg-white"}`}
              hoverable
              styles={{ body: { padding: "16px" } }}
            >
              <div className="flex items-center justify-between mb-4">
                <Space size={12}>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      item.check_status === 1 ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {item.item_name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{item.item_name}</div>
                    <div className="text-xs text-gray-400">{item.category_path || "默认分类"}</div>
                  </div>
                </Space>
                <Checkbox checked={item.check_status === 1} onChange={() => handleToggle(item)} className="scale-150" />
              </div>
              <Input
                placeholder="添加打卡备注..."
                defaultValue={item.item_remark}
                variant="borderless"
                className="bg-black/5 rounded-lg text-sm px-3 py-1.5"
                onPressEnter={(e: any) => handleRemarkChange(item, e.target.value)}
                onBlur={(e: any) => handleRemarkChange(item, e.target.value)}
              />
            </Card>
          </List.Item>
        )}
      />
    </>
  );

  // 2. 打卡项管理视图
  const renderManageView = () => {
    const columns = [
      { title: "名称", dataIndex: "item_name", key: "name", render: (text: string) => <Text strong>{text}</Text> },
      { title: "分类", dataIndex: "category_path", key: "category", render: (text: string) => <Tag color="blue">{text || "未分类"}</Tag> },
      {
        title: "状态",
        dataIndex: "status",
        key: "status",
        render: (status: number) => <Tag color={status === 1 ? "green" : "default"}>{status === 1 ? "启用中" : "已禁用"}</Tag>
      },
      {
        title: "累计打卡",
        dataIndex: "complete_count",
        key: "count",
        render: (count: number) => <Text className="text-green-600 font-bold">{count} 次</Text>
      },
      {
        title: "操作",
        key: "action",
        render: (_: any, record: any) => (
          <Space size="middle">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingItem(record);
                itemForm.setFieldsValue(record);
                setIsItemModalOpen(true);
              }}
            />
            <Popconfirm
              title="确定删除吗？"
              description="删除后历史记录将永久丢失"
              onConfirm={() => handleDeleteItem(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ];

    return (
      <Card className="rounded-xl border-none shadow-sm">
        <div className="flex justify-between mb-4">
          <Title level={4}>打卡项管理</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingItem(null);
              itemForm.resetFields();
              setIsItemModalOpen(true);
            }}
            className="bg-green-500"
          >
            新增打卡项
          </Button>
        </div>
        <Table dataSource={allItems} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
      </Card>
    );
  };

  // 3. 历史记录视图
  const renderHistoryView = () => (
    <Card className="rounded-xl border-none shadow-sm">
      <Title level={4} className="mb-4">
        最近打卡记录
      </Title>
      <List
        loading={loading}
        dataSource={historyRecords}
        renderItem={(record: any) => (
          <List.Item className="px-4 hover:bg-gray-50 rounded-lg transition-colors">
            <List.Item.Meta
              avatar={<CheckCircleFilled className={record.check_status === 1 ? "text-green-500" : "text-gray-300"} />}
              title={
                <Space>
                  <Text strong>{record.check_date}</Text>
                  <Tag color="green">已完成</Tag>
                </Space>
              }
              description={
                <div>
                  <Text type="secondary">打卡备注：</Text>
                  <Text>{record.item_remark || "无"}</Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  return (
    <div className="mx-auto">
      {/* 顶部标题与日期切换 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} className="!mb-1">
            每日打卡
          </Title>
          <Text type="secondary">保持热爱，坚持记录每一天的进步</Text>
        </div>

        {activeTab === "daily" && (
          <div className="flex items-center bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setTargetDate(targetDate.subtract(1, "day"))} />
            <DatePicker
              value={targetDate}
              onChange={(val) => val && setTargetDate(val)}
              allowClear={false}
              variant="borderless"
              className="font-medium text-center"
              format="YYYY-MM-DD"
            />
            <Button type="text" icon={<ArrowRightOutlined />} onClick={() => setTargetDate(targetDate.add(1, "day"))} />
          </div>
        )}
      </div>

      {/* 功能切换标签页 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        className="custom-tabs" 
        size="large"
        items={[
          {
            key: 'daily',
            label: (
              <span>
                <CheckCircleFilled style={{ marginRight: 8 }} />
                每日打卡
              </span>
            ),
            children: renderDailyView()
          },
          {
            key: 'manage',
            label: (
              <span>
                <SettingOutlined style={{ marginRight: 8 }} />
                项管理
              </span>
            ),
            children: renderManageView()
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined style={{ marginRight: 8 }} />
                记录
              </span>
            ),
            children: renderHistoryView()
          }
        ]}
      />

      {/* 新增/编辑打卡项弹窗 */}
      <Modal
        title={editingItem ? "编辑打卡项" : "新增打卡项"}
        open={isItemModalOpen}
        onCancel={() => setIsItemModalOpen(false)}
        onOk={() => itemForm.submit()}
        destroyOnHidden={true}
      >
        <Form form={itemForm} layout="vertical" onFinish={handleItemSubmit} initialValues={{ status: 1 }}>
          <Form.Item name="item_name" label="项目名称" rules={[{ required: true, message: "请输入打卡项名称" }, { max: 50 }]}>
            <Input placeholder="例如：每日晨跑、阅读30分钟" />
          </Form.Item>
          <Form.Item name="category_path" label="分类（可选）">
            <Input placeholder="例如：运动、学习" />
          </Form.Item>
          <Form.Item
            name="status"
            label="是否启用"
            valuePropName="checked"
            getValueProps={(value) => ({ checked: value === 1 })}
            getValueFromEvent={(e) => (e.target.checked ? 1 : 0)}
          >
            <Checkbox>启用（不启用将不在每日列表展示）</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Checkin;
