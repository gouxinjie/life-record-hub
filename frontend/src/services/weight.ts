import api from "./api";

/**
 * 获取体重历史记录 (支持筛选和分页)
 */
export const getWeightHistory = (params: {
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}) => {
  return api.get("/weight/record/history", { params });
};

/**
 * 获取今日体重记录
 */
export const getTodayWeight = () => {
  return api.get("/weight/record/today");
};

/**
 * 获取指定周的体重数据及统计
 * @param week_num 格式 YYYYWW
 */
export const getWeeklyWeight = (week_num?: string) => {
  return api.get("/weight/record/week", { params: { week_num } });
};

/**
 * 获取指定月的体重数据及统计
 */
export const getMonthlyWeight = (year: number, month: number) => {
  return api.get("/weight/record/month", { params: { year, month } });
};

/**
 * 新增体重记录
 */
export const addWeightRecord = (data: {
  weight: number;
  record_date: string;
  remark?: string;
}) => {
  return api.post("/weight/record/add", data);
};

/**
 * 编辑体重记录
 */
export const updateWeightRecord = (id: number, data: {
  weight?: number;
  remark?: string;
}) => {
  return api.put(`/weight/record/update/${id}`, data);
};

/**
 * 删除体重记录
 */
export const deleteWeightRecord = (id: number) => {
  return api.delete(`/weight/record/delete/${id}`);
};

/**
 * 获取当前活跃的体重目标
 */
export const getWeightTarget = () => {
  return api.get("/weight/target/get");
};

/**
 * 设置体重目标
 */
export const setWeightTarget = (data: {
  target_weight: number;
  start_weight?: number;
  start_date?: string;
  deadline?: string;
}) => {
  return api.post("/weight/target/set", data);
};

/**
 * 获取今日统计数据
 */
export const getTodayWeightStat = () => {
  return api.get("/weight/stat/today");
};

/**
 * 批量删除体重记录
 */
export const batchDeleteWeightRecords = (ids: number[]) => {
  return api.post("/weight/record/batch-delete", { ids });
};

/**
 * 导出体重记录 (返回 Blob)
 */
export const exportWeightRecords = () => {
  return api.get("/weight/record/export", { responseType: "blob" });
};

// 兼容旧接口 (Dashboard 可能在使用)
export const getWeightRecords = (params?: { 
  start_date?: string; 
  end_date?: string;
  skip?: number;
  limit?: number;
}) => {
  return api.get("/weight/record/history", { params });
};
