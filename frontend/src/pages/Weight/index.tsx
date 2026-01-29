import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Table,
  Space,
  Typography,
  Modal,
  Form,
  InputNumber,
  Input,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tabs,
  Popconfirm,
  Tag,
  Tooltip,
  App
} from "antd";
import {
  PlusOutlined,
  LineChartOutlined,
  HistoryOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  LeftOutlined,
  ArrowRightOutlined,
  EditOutlined,
  DeleteOutlined,
  AimOutlined,
  RightOutlined
} from "@ant-design/icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import {
  getWeeklyWeight,
  addWeightRecord,
  updateWeightRecord,
  deleteWeightRecord,
  getWeightHistory,
  getWeightTarget,
  setWeightTarget,
  getTodayWeightStat,
  batchDeleteWeightRecords,
  exportWeightRecords,
  getMonthlyWeight
} from "../../services/weight";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import styles from "./index.module.scss";
import { DownloadOutlined, CalendarOutlined } from "@ant-design/icons";
import { useTheme } from "../../context/ThemeContext";

dayjs.extend(isoWeek);

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const Weight: React.FC = () => {
  const { message } = App.useApp();
  const { primaryColor } = useTheme();
  // --- 状态管理 ---
  const [activeTab, setActiveTab] = useState("weekly");
  const [currentWeek, setCurrentWeek] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [weeklyData, setWeeklyData] = useState<any>({ records: [] });
  const [monthlyData, setMonthlyData] = useState<any>({ records: [] });
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [historyFilters, setHistoryFilters] = useState<any>({
    start_date: null,
    end_date: null,
  });
  const [target, setTarget] = useState<any>(null);
  const [todayStat, setTodayStat] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // 弹窗相关
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [recordForm] = Form.useForm();
  const [targetForm] = Form.useForm();

  // --- 数据获取 ---

  const fetchWeeklyData = async () => {
    setLoading(true);
    try {
      const weekNum = `${currentWeek.year()}${currentWeek.isoWeek().toString().padStart(2, "0")}`;
      const res: any = await getWeeklyWeight(weekNum);
      setWeeklyData(res);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const res: any = await getMonthlyWeight(currentMonth.year(), currentMonth.month() + 1);
      setMonthlyData(res);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (historyFilters.start_date) params.start_date = historyFilters.start_date;
      if (historyFilters.end_date) params.end_date = historyFilters.end_date;
      const res: any = await getWeightHistory(params);
      setHistoryRecords(res);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherData = async () => {
    try {
      const [targetRes, statRes] = await Promise.all([getWeightTarget(), getTodayWeightStat()]);
      setTarget(targetRes);
      setTodayStat(statRes);
    } catch (e) {
      console.error("Fetch basic data error", e);
    }
  };

  useEffect(() => {
    if (activeTab === "weekly") fetchWeeklyData();
    if (activeTab === "monthly") fetchMonthlyData();
    if (activeTab === "history") fetchHistoryData();
    fetchOtherData();
  }, [activeTab, currentWeek, currentMonth, historyFilters]);

  // --- 操作处理 ---

  const handleExport = async () => {
    try {
      const blob: any = await exportWeightRecords();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `体重记录_${dayjs().format("YYYYMMDD")}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error("导出失败");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await batchDeleteWeightRecords(selectedRowKeys as number[]);
      message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
      setSelectedRowKeys([]);
      fetchHistoryData();
      fetchWeeklyData();
      fetchOtherData();
    } catch (error) {}
  };

  const handleRecordSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        record_date: values.record_date.format("YYYY-MM-DD")
      };
      if (editingRecord) {
        await updateWeightRecord(editingRecord.id, data);
        message.success("更新成功");
      } else {
        await addWeightRecord(data);
        message.success("记录成功");
      }
      setIsRecordModalOpen(false);
      fetchWeeklyData();
      fetchOtherData();
    } catch (error) {
      // 错误已由拦截器处理
    }
  };

  const handleTargetSubmit = async (values: any) => {
    try {
      await setWeightTarget({
        ...values,
        start_date: values.start_date?.format("YYYY-MM-DD"),
        deadline: values.deadline?.format("YYYY-MM-DD")
      });
      message.success("目标设置成功");
      setIsTargetModalOpen(false);
      fetchOtherData();
    } catch (error) {}
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWeightRecord(id);
      message.success("已删除");
      fetchWeeklyData();
      fetchHistoryData();
      fetchOtherData();
    } catch (error) {}
  };

  // --- 渲染辅助 ---

  const getChartData = (records: any[]) => records.map((r: any) => ({
    name: dayjs(r.record_date).format("MM-DD"),
    weight: parseFloat(r.weight),
    date: dayjs(r.record_date).format("YYYY-MM-DD"),
    remark: r.remark
  }));

  const columns = [
    { title: "日期", dataIndex: "record_date", key: "date", render: (text: string) => dayjs(text).format("MM-DD (ddd)") },
    {
      title: "体重 (kg)",
      dataIndex: "weight",
      key: "weight",
      render: (val: number) => (
        <Text strong className={val === weeklyData.max_weight ? "text-red-500" : val === weeklyData.min_weight ? "text-primary" : ""}>
          {val}
        </Text>
      )
    },
    {
      title: "备注",
      dataIndex: "remark",
      key: "remark",
      render: (text: string) => (
        <Text type="secondary" className="text-xs">
          {text || "-"}
        </Text>
      )
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record);
              recordForm.setFieldsValue({ ...record, record_date: dayjs(record.record_date) });
              setIsRecordModalOpen(true);
            }}
          />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // --- 视图组件 ---

  const renderDataView = (data: any, title: string) => (
    <Row gutter={[24, 24]}>
      {/* 左侧表格 */}
      <Col xs={24} lg={10}>
        <Card title={title} className="h-full">
          <Table dataSource={data.records} columns={columns} rowKey="id" pagination={false} loading={loading} size="small" />
        </Card>
      </Col>
      {/* 右侧图表 */}
      <Col xs={24} lg={14}>
        <Card title="趋势图" className={styles.chartCard}>
          <div style={{ height: 320, width: "100%", minHeight: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData(data.records)}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8c8c8c", fontSize: 12 }} />
                <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                <ChartTooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-100">
                          <div className="text-xs text-gray-400 mb-1">{payload[0].payload.date}</div>
                          <div className="text-lg font-bold" style={{ color: primaryColor }}>{payload[0].value} kg</div>
                          {payload[0].payload.remark && <div className="text-xs text-gray-500 mt-1 italic">"{payload[0].payload.remark}"</div>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke={primaryColor}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorWeight)"
                  dot={{ r: 4, fill: primaryColor, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>
    </Row>
  );

  const renderWeeklyView = () => renderDataView(weeklyData, "本周明细");
  const renderMonthlyView = () => renderDataView(monthlyData, "本月明细");

  const renderHistoryView = () => (
    <Card>
      <div className="mb-4 flex justify-between items-center">
        <Space size="middle">
          <RangePicker 
            onChange={(dates) => {
              if (dates) {
                setHistoryFilters({
                  start_date: dates[0]?.format("YYYY-MM-DD"),
                  end_date: dates[1]?.format("YYYY-MM-DD"),
                });
              } else {
                setHistoryFilters({ start_date: null, end_date: null });
              }
            }}
          />
          {selectedRowKeys.length > 0 && (
            <Popconfirm title={`确定删除选中的 ${selectedRowKeys.length} 条记录？`} onConfirm={handleBatchDelete}>
              <Button danger icon={<DeleteOutlined />}>
                批量删除 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
        </Space>
        <Text type="secondary">共 {historyRecords.length} 条记录</Text>
      </div>
      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        dataSource={historyRecords}
        columns={[
          { title: "日期", dataIndex: "record_date", key: "date", render: (text: string) => dayjs(text).format("YYYY-MM-DD (ddd)") },
          { title: "体重 (kg)", dataIndex: "weight", key: "weight", render: (val: number) => <Text strong>{val}</Text> },
          { title: "备注", dataIndex: "remark", key: "remark", render: (text: string) => <Text type="secondary">{text || "-"}</Text> },
          { title: "所属周", dataIndex: "week_num", key: "week", render: (text: string) => <Tag color="blue">{text}</Tag> },
          {
            title: "操作",
            key: "action",
            render: (_: any, record: any) => (
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            )
          }
        ]}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15, showSizeChanger: true }}
      />
    </Card>
  );

  return (
    <div className={styles.weightContainer}>
      {/* 顶部标题与操作 */}
      <div className={styles.header}>
        <div>
          <Title level={2} className="!mb-1 text-gray-800">
            体重记录
          </Title>
          <Text type="secondary">关注每一克的变化，见证更好的自己</Text>
          {target && (
            <div className={styles.targetInfo}>
              <AimOutlined /> 当前目标：<strong>{target.target_weight} kg</strong>
              {todayStat.target_diff !== undefined && (
                <span className="ml-2">
                  (还差{" "}
                  <Text strong className="text-orange-500">
                    {todayStat.target_diff}
                  </Text>{" "}
                  kg)
                </span>
              )}
            </div>
          )}
        </div>
        <Space size="middle">
          <div className={styles.weekPicker}>
            {activeTab === "weekly" ? (
              <>
                <Button type="text" icon={<LeftOutlined />} onClick={() => setCurrentWeek(currentWeek.subtract(1, "week"))} />
                <DatePicker picker="week" value={currentWeek} onChange={(val) => val && setCurrentWeek(val)} allowClear={false} format="YYYY年 第ww周" />
                <Button type="text" icon={<RightOutlined />} onClick={() => setCurrentWeek(currentWeek.add(1, "week"))} />
              </>
            ) : activeTab === "monthly" ? (
              <>
                <Button type="text" icon={<LeftOutlined />} onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))} />
                <DatePicker picker="month" value={currentMonth} onChange={(val) => val && setCurrentMonth(val)} allowClear={false} format="YYYY年MM月" />
                <Button type="text" icon={<RightOutlined />} onClick={() => setCurrentMonth(currentMonth.add(1, "month"))} />
              </>
            ) : null}
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRecord(null);
              recordForm.resetFields();
              // 记忆上一次的备注
              const lastRemark = historyRecords.length > 0 ? historyRecords[0].remark : (weeklyData.records.length > 0 ? weeklyData.records[weeklyData.records.length - 1].remark : "");
              recordForm.setFieldsValue({ 
                record_date: dayjs(),
                remark: lastRemark
              });
              setIsRecordModalOpen(true);
            }}
            className="bg-primary h-10 px-6 rounded-xl"
          >
            记录体重
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            className="h-10 rounded-xl"
          >
            导出
          </Button>
          <Tooltip title="设置体重目标">
            <Button
              icon={<AimOutlined />}
              onClick={() => {
                if (target) {
                    targetForm.setFieldsValue({
                        ...target,
                        start_date: target.start_date ? dayjs(target.start_date) : null,
                        deadline: target.deadline ? dayjs(target.deadline) : null
                    });
                } else {
                    targetForm.resetFields();
                }
                setIsTargetModalOpen(true);
              }}
              className="h-10 rounded-xl"
            />
          </Tooltip>
        </Space>
      </div>

      {/* 统计数据卡片 */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={12} sm={8}>
          <Card className="h-full">
            <Statistic title="最新体重" value={todayStat.today_weight || "-"} suffix="kg" />
            <div className={`mt-1 ${styles.diffTag} ${todayStat.diff_yesterday > 0 ? styles.up : styles.down}`}>
              {todayStat.diff_yesterday > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(todayStat.diff_yesterday || 0)} kg 较昨日
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="h-full">
            <Statistic title="本周平均" value={weeklyData.avg_weight || "-"} suffix="kg" />
            <div className={`mt-1 ${styles.diffTag} ${weeklyData.diff_last_week > 0 ? styles.up : styles.down}`}>
              {weeklyData.diff_last_week > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(weeklyData.diff_last_week || 0)} kg 较上周
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="h-full">
            <div className="flex flex-col h-full justify-between gap-4">
              <div className="flex justify-between items-center">
                <Text type="secondary">本周最高</Text>
                <Statistic value={weeklyData.max_weight || "-"} suffix="kg" valueStyle={{ color: "#ff4d4f", fontSize: 20 }} />
              </div>
              <div className="flex justify-between items-center">
                <Text type="secondary">本周最低</Text>
                <Statistic value={weeklyData.min_weight || "-"} suffix="kg" valueStyle={{ color: primaryColor, fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 内容切换 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        size="large" 
        className="custom-tabs"
        destroyOnHidden
        items={[
          {
            key: 'weekly',
            label: (
              <span>
                <LineChartOutlined style={{ marginRight: 8 }} />
                周视图
              </span>
            ),
            children: renderWeeklyView()
          },
          {
            key: 'monthly',
            label: (
              <span>
                <CalendarOutlined style={{ marginRight: 8 }} />
                月视图
              </span>
            ),
            children: renderMonthlyView()
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined style={{ marginRight: 8 }} />
                历史记录
              </span>
            ),
            children: renderHistoryView()
          }
        ]}
      />

      {/* 记录弹窗 */}
      <Modal
        title={editingRecord ? "修改记录" : "记录今日体重"}
        open={isRecordModalOpen}
        onOk={() => recordForm.submit()}
        onCancel={() => setIsRecordModalOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden={true}
      >
        <Form form={recordForm} layout="vertical" onFinish={handleRecordSubmit} className="mt-4">
          <Form.Item name="record_date" label="记录日期" rules={[{ required: true }]}>
            <DatePicker 
              className="w-full" 
              disabled={!!editingRecord} 
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>
          <Form.Item name="weight" label="当前体重 (kg)" rules={[{ required: true, type: "number", min: 30, max: 200 }]}>
            <InputNumber className="w-full" step={0.1} placeholder="30.0 - 200.0" />
          </Form.Item>
          <Form.Item name="remark" label="备注" rules={[{ max: 200 }]}>
            <Input placeholder="例如：晨起空腹、运动后" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 目标设置弹窗 */}
      <Modal
        title="设置体重目标"
        open={isTargetModalOpen}
        onOk={() => targetForm.submit()}
        onCancel={() => setIsTargetModalOpen(false)}
        okText="设定目标"
        destroyOnHidden={true}
      >
        <Form form={targetForm} layout="vertical" onFinish={handleTargetSubmit} className="mt-4">
          <Form.Item name="target_weight" label="目标体重 (kg)" rules={[{ required: true, type: "number", min: 30, max: 200 }]}>
            <InputNumber className="w-full" step={0.1} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_weight" label="起始体重 (kg)">
                <InputNumber className="w-full" step={0.1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="start_date" label="开始日期">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="deadline" label="预期达成日期">
            <DatePicker 
              className="w-full" 
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Weight;
