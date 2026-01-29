import React, { useEffect, useState } from "react";
import { Layout, Menu, Button, theme, Typography, Space, Dropdown, Avatar } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { getMe } from "../services/auth";
import { routes } from "../router";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userData: any = await getMe();
      setUser(userData);
    } catch (error) {
      // 错误已在拦截器处理
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const menuItems = routes.map((item) => ({
    key: item.path,
    icon: item.icon || <BookOutlined />,
    label: item.name,
    children:
      item.children?.length && item.module !== "todo"
        ? item.children.map((child) => ({
            key: child.path,
            label: child.name
          }))
        : null
  }));

  const userMenuItems = [
    {
      key: "profile",
      label: "个人信息",
      icon: <UserOutlined />
    },
    {
      key: "logout",
      label: "退出登录",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout
    }
  ];

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light" className="shadow-xl z-10 h-full">
        <div className="h-16 flex items-center justify-center px-4 overflow-hidden border-b border-gray-100 mb-2">
          <Space>
            <Avatar size="small" className="bg-primary" icon={<BookOutlined />} />
            {!collapsed && (
              <Title level={4} className="!m-0 !text-primary whitespace-nowrap">
                life-record-hub
              </Title>
            )}
          </Space>
        </div>
        <Menu mode="inline" selectedKeys={[location.pathname]} className="border-r-0" items={menuItems} onClick={({ key }) => navigate(key)} />
      </Sider>
      <Layout className="h-full flex flex-col">
        <Header className="px-6 bg-white flex items-center justify-between shadow-sm z-[9] h-16 flex-shrink-0">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-lg w-10 h-10 flex items-center justify-center"
          />
          <Space size={16}>
            <Dropdown menu={{ items: userMenuItems }}>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                <Avatar className="bg-primary-light text-primary">{user?.nickname?.[0]?.toUpperCase() || <UserOutlined />}</Avatar>
                <span className="font-medium text-gray-700">{user?.nickname}</span>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content className="m-3 p-6 bg-white rounded-xl shadow-sm overflow-y-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
