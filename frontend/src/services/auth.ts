import api from "./api";

export const login = (data: any) => {
  return api.post("/login/access-token", data);
};

export const register = (data: any) => {
  return api.post("/users/register", data);
};

export const getMe = () => {
  return api.get("/users/me");
};
