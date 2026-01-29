import api from "./api";

export const login = (data: FormData) => {
  return api.post("/login/access-token", data);
};

export const register = (data: any) => {
  return api.post("/register", data);
};

export const getMe = () => {
  return api.get("/users/me");
};
