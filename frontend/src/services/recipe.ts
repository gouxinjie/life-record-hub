import api from "./api";

// Recipe Services
export const getRecipes = (params?: { category?: string; keyword?: string; is_starred?: number; skip?: number; limit?: number }) => {
  return api.get("/recipes/", { params });
};

export const getRecipe = (id: number) => {
  return api.get(`/recipes/${id}`);
};

export const createRecipe = (data: any) => {
  return api.post("/recipes/", data);
};

export const updateRecipe = (id: number, data: any) => {
  return api.put(`/recipes/${id}`, data);
};

export const deleteRecipe = (id: number) => {
  return api.delete(`/recipes/${id}`);
};
