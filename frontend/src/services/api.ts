import axios from "axios";
import { message } from "antd";

const api = axios.create({
  baseURL: "/api/v1", // 配合 Vite proxy 使用
  timeout: 10000
});

// 请求拦截器：添加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理错误
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          message.error("登录失效，请重新登录");
          localStorage.removeItem("token");
          window.location.href = "/login";
          break;
        case 403:
          message.error("权限不足");
          break;
        case 400:
          message.error(data.detail || "请求参数错误");
          break;
        case 404:
          message.error("资源不存在");
          break;
        case 500:
          message.error("服务器内部错误");
          break;
        default:
          message.error("网络错误");
      }
    } else {
      message.error("网络连接异常");
    }
    return Promise.reject(error);
  }
);

export default api;
