import api from "./api";

export const getWeightRecords = (params?: { start_date?: string; end_date?: string }) => {
  return api.get("/weight/", { params });
};

export const recordWeight = (data: any) => {
  return api.post("/weight/", data);
};

export const updateWeight = (id: number, data: any) => {
  return api.put(`/weight/${id}`, data);
};

export const deleteWeight = (id: number) => {
  return api.delete(`/weight/${id}`);
};
