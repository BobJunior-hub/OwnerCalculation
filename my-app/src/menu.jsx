import React, { useState, useEffect, createContext, useContext } from 'react';
import { TeamOutlined, LogoutOutlined, UserOutlined, MoonOutlined, SunOutlined, MenuFoldOutlined, MenuUnfoldOutlined, BarChartOutlined } from '@ant-design/icons';
import { Menu, Switch, Layout, Typography, Avatar, Button, Space, ConfigProvider } from 'antd';
import { theme as antdTheme } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
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
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
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
    if (location.pathname === '/menu') return '';
    return '';
  });

  useEffect(() => {
    if (location.pathname === '/owners') setCurrent('owners');
    else if (location.pathname === '/analytics') setCurrent('analytics');
    else if (location.pathname === '/menu') setCurrent('');
  }, [location.pathname]);
  
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
    removeAuthToken();
    navigate('/');
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
                    {user?.user_type || user?.type || user?.role || ''}
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

      <Layout className={`transition-all duration-200 min-h-screen ${collapsed ? 'ml-24' : 'ml-[266px]'}`} style={{ width: collapsed ? 'calc(100vw - 96px)' : 'calc(100vw - 266px)' }}>
        <Header className="px-6 bg-[#E77843] flex items-center justify-between border-b border-white/10 rounded-xl m-4 mt-4 mb-0" style={{ width: 'calc(100% - 32px)' }}>
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
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            />
          </Space>
        </Header>
        <Content className={`m-0 p-0 h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#141414]' : 'bg-gray-100'}`}>
          <div className="p-0 h-[calc(100vh-4rem)] w-full box-border overflow-hidden flex flex-col">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

const DashboardHome = () => {
  const theme = useTheme();
  
  return (
    <div className="h-[calc(100vh-4rem)] w-full p-6 flex flex-col box-border">
      <Title level={2} className={`mb-6 ${theme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
        Welcome to Dashboard
      </Title>
      <Text className={`text-base ${theme === 'dark' ? 'text-white/65' : 'text-black/65'}`}>
        Select a menu item from the sidebar to get started.
      </Text>
    </div>
  );
};

const MyMenu = () => {
  return (
    <DashboardLayout>
      <div className="h-full w-full flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold mb-4">Welcome to Dashboard</h1>
        <p className="text-lg">Select a menu item from the sidebar to get started.</p>
      </div>
    </DashboardLayout>
  );
};

export default MyMenu;
export { DashboardLayout, ThemeContext };