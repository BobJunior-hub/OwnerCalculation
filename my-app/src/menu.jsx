import { BarChartOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, MoonOutlined, SunOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { theme as antdTheme, Avatar, Button, ConfigProvider, Layout, Menu, Modal, Space, Switch, Typography } from 'antd';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { removeAuthToken } from './api';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const ThemeContext = createContext('light');

export const useTheme = () => useContext(ThemeContext);

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState('light');
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUserData = () => {
      const userData = sessionStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser && parsedUser.username) {
            setUser(parsedUser);
          }
        } catch (e) {
          setUser(null);
        }
      }
    };
    loadUserData();
  }, [location.pathname]);
  const [current, setCurrent] = useState(() => {
    if (location.pathname === '/owners') return 'owners';
    if (location.pathname === '/analytics') return 'analytics';
    return 'analytics';
  });

  useEffect(() => {
    if (location.pathname === '/owners') {
      setCurrent('owners');
    } else if (location.pathname === '/analytics') {
      setCurrent('analytics');
    } else if (location.pathname === '/menu') {
      navigate('/analytics');
    }
  }, [location.pathname, navigate]);

  const changeTheme = (checked) => {
    setTheme(checked ? 'dark' : 'light');
  };

      const onClick = (e) => {
        setCurrent(e.key);

        if (e.key === 'owners') {
          navigate('/owners');
        } else if (e.key === 'analytics') {
          navigate('/analytics');
        }
      };

  const handleLogout = () => {
    Modal.confirm({
      title: 'Confirm Logout',
      content: 'Are you sure you want to logout?',
      okText: 'Logout',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        removeAuthToken();
        navigate('/');
      },
    });
  };

  const items = [
    {
      key: 'owners',
      label: 'Owners',
      icon: <TeamOutlined />,
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: <BarChartOutlined />,
    },
  ];

  const menuStyle = { height: '100%', borderRight: 0, overflowY: 'auto', flex: 1 };
  const antdConfigTheme = { algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm };

  return (
    <ThemeContext.Provider value={theme}>
      <ConfigProvider theme={antdConfigTheme}>
      <Layout className="min-h-screen w-screen">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="bg-[#E77843] overflow-hidden fixed left-4 top-4 bottom-4 rounded-xl flex flex-col"
          style={{ height: 'calc(100vh - 32px)' }}
          width={250}
          theme="light"
        >
        <div className={`${collapsed ? 'p-4' : 'p-6'} ${collapsed ? 'text-center' : 'text-left'} border-b border-white/10 min-h-16 flex items-center ${collapsed ? 'justify-center' : 'justify-start'} rounded-t-xl overflow-hidden`}>
          {!collapsed && (
            <Title level={4} className="m-0 text-white">
              Dashboard
            </Title>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center text-white font-bold">D</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <ConfigProvider theme={{
            components: {
              Menu: {
                itemBg: 'transparent',
                subMenuItemBg: 'transparent',
                itemSelectedBg: 'rgba(255, 255, 255, 0.2)',
                itemHoverBg: 'rgba(255, 255, 255, 0.1)',
                itemColor: 'rgba(255, 255, 255, 0.9)',
                itemSelectedColor: '#fff',
                itemHoverColor: '#fff',
                colorBgContainer: '#E77843',
                colorText: 'rgba(255, 255, 255, 0.9)',
              }
            }
          }}>
            <Menu
              onClick={onClick}
              selectedKeys={[current]}
              mode="inline"
              items={items}
              className="h-full border-r-0 overflow-y-auto flex-1 bg-[#E77843] text-white"
            />
          </ConfigProvider>
        </div>

        <div className="p-4 border-t border-white/10 absolute bottom-0 left-0 right-0 rounded-b-xl overflow-hidden">
          <Space direction="vertical" size="middle" className="w-full">
            <div className="flex items-center gap-3 p-2 rounded bg-white/10">
              <Avatar icon={<UserOutlined />} />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <Text strong className="text-white block">
                    {user?.username || 'User'}
                  </Text>
                  <Text type="secondary" className="text-xs text-white/70">
                    {user?.department || ''}
                  </Text>
                </div>
              )}
            </div>
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              block
              className="text-white text-left h-auto py-2 px-3"
            >
              {!collapsed && 'Logout'}
            </Button>
          </Space>
        </div>
      </Sider>

      <Layout className={`transition-all duration-200 fixed top-0 right-0 bottom-0 ${collapsed ? 'left-24' : 'left-[266px]'}`} style={{ width: collapsed ? 'calc(100vw - 96px)' : 'calc(100vw - 266px)' }}>
        <Header className="px-6 bg-[#E77843] flex items-center justify-between border-b border-white/10 rounded-xl m-4 mt-4 mb-0 flex-shrink-0" style={{ width: 'calc(100% - 32px)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-base w-16 h-16 text-white"
          />
          <Space>
            <Text className="text-white">
              {theme === 'dark' ? <MoonOutlined /> : <SunOutlined />}
            </Text>
            <Switch
              checked={theme === 'dark'}
              onChange={changeTheme}
              checkedChildren={<SunOutlined />}
              unCheckedChildren={ <MoonOutlined />}
            />
          </Space>
        </Header>
        <Content className={`m-0 p-0 overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-[#141414]' : 'bg-gray-100'}`} style={{ height: 'calc(100vh - 4rem - 32px)', marginTop: '0' }}>
          <div className="p-0 h-full w-full box-border overflow-hidden flex flex-col">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export { DashboardLayout, ThemeContext };

