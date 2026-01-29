import api from "./api";

export const getCheckinItems = () => {
  return api.get("/checkin/items");
};

export const createCheckinItem = (data: any) => {
  return api.post("/checkin/items", data);
};

export const getDailyCheckin = (target_date?: string) => {
  return api.get("/checkin/daily", { params: { target_date } });
};

export const toggleCheckin = (data: any) => {
  return api.post("/checkin/toggle", data);
};
