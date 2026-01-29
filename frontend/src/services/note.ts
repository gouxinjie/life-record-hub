import api from "./api";

export const getNotes = (params?: { category_path?: string; keyword?: string; skip?: number; limit?: number }) => {
  return api.get("/notes/", { params });
};

export const getNote = (id: number) => {
  return api.get(`/notes/${id}`);
};

export const createNote = (data: any) => {
  return api.post("/notes/", data);
};

export const updateNote = (id: number, data: any) => {
  return api.put(`/notes/${id}`, data);
};

export const deleteNote = (id: number) => {
  return api.delete(`/notes/${id}`);
};
