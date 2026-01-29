import api from "./api";

export const getTodos = (params?: { category_path?: string; status?: number; is_starred?: number; priority?: number; q?: string }) => {
  return api.get("/todos/", { params });
};

export const createTodo = (data: any) => {
  return api.post("/todos/", data);
};

export const updateTodo = (id: number, data: any) => {
  return api.put(`/todos/${id}`, data);
};

export const deleteTodo = (id: number) => {
  return api.delete(`/todos/${id}`);
};
