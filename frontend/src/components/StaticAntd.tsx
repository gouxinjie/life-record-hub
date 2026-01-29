import { App } from 'antd';
import { useEffect } from 'react';
import { setMessageInstance } from '../services/api';

/**
 * 这是一个不可见组件，仅用于获取 App 上下文中的 message 实例
 * 并将其注入到非组件环境（如 api service）中
 */
const StaticAntd = () => {
  const { message } = App.useApp();
  
  useEffect(() => {
    setMessageInstance(message);
  }, [message]);
  
  return null;
};

export default StaticAntd;
