import api from "./api";

/**
 * 获取打卡项列表
 * @param status 状态：1=启用, 0=禁用
 */
export const getCheckinItems = (status?: number) => {
  return api.get("/checkin/item/list", { params: { status } });
};

/**
 * 新增打卡项
 */
export const addCheckinItem = (data: {
  item_name: string;
  category_path?: string;
  icon?: string;
  status?: number;
}) => {
  return api.post("/checkin/item/add", data);
};

/**
 * 更新打卡项
 */
export const updateCheckinItem = (id: number, data: any) => {
  return api.put(`/checkin/item/update/${id}`, data);
};

/**
 * 删除打卡项
 */
export const deleteCheckinItem = (id: number) => {
  return api.delete(`/checkin/item/delete/${id}`);
};

/**
 * 获取指定日期的打卡数据及统计
 * @param date 日期字符串 YYYY-MM-DD
 */
export const getDailyCheckin = (date: string) => {
  return api.get(`/checkin/record/date/${date}`);
};

/**
 * 保存/更新打卡记录
 */
export const saveCheckinRecord = (data: {
  item_id: number;
  check_date: string;
  check_status: number;
  item_remark?: string;
}) => {
  return api.post("/checkin/record/save", data);
};

/**
 * 获取打卡历史记录
 */
export const getCheckinHistory = (params: {
  item_id?: number;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}) => {
  return api.get("/checkin/record/history", { params });
};
