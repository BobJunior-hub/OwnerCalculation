import { DollarOutlined, TruckOutlined, WalletOutlined, ClearOutlined, BarChartOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Select, Spin, Statistic, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest, getAuthToken } from '../api';
import { useTheme } from '../menu';
import { owners } from '../components/OwerComponent/helpers/owners';

const Analytics = () => {
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const currentTheme = useTheme();

  const getCurrentUser = () => {
    try {
      const userStr =  sessionStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
    return null;
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const isOwnerDepartment = currentUser?.department?.toLowerCase() === 'owner';
  const ownerUsername = currentUser?.username || null;

  console.log('currentUser:', currentUser);
  console.log('currentUser?.department:', currentUser?.department);
  console.log('currentUser?.department?.toLowerCase():', currentUser?.department?.toLowerCase());
  console.log('isOwnerDepartment:', isOwnerDepartment);
  console.log('ownerUsername:', ownerUsername);


  const getSharedDateRange = () => {
    try {
      const stored = localStorage.getItem('sharedDateRange');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed[0] && parsed[1]) {
          return [dayjs(parsed[0]), dayjs(parsed[1])];
        }
      }
    } catch (e) {
      console.error('Error loading date range from localStorage:', e);
    }
    return null;
  };

  useEffect(() => {
    if (currentUser?.department?.toLowerCase() === 'owner' && currentUser?.username) {
      setSelectedOwner(currentUser.username);
    } else if (currentUser && currentUser?.department?.toLowerCase() !== 'owner') {
      setSelectedOwner('Yulduz');
    }
  }, [currentUser]);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedOwner) return;

    setLoading(true);
    try {
      const ownerName = typeof selectedOwner === 'string' ? selectedOwner : (selectedOwner.name || selectedOwner.owner || selectedOwner);
      const params = new URLSearchParams({
        owner: ownerName,
      });

      const dateRange = getSharedDateRange();
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('start_date', dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', dateRange[1].format('YYYY-MM-DD'));
      }

      const result = await apiRequest(`/calculations/analytics?${params.toString()}`);
      setAnalyticsData(result);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedOwner]);

  useEffect(() => {
    if (selectedOwner) {
      fetchAnalytics();
    } else {
      setAnalyticsData(null);
    }
  }, [selectedOwner, fetchAnalytics]);

  useEffect(() => {
    const handleStorageChange = () => {
      if (selectedOwner) {
        fetchAnalytics();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dateRangeChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dateRangeChanged', handleStorageChange);
    };
  }, [selectedOwner, fetchAnalytics]);

  const handleClearFilter = () => {
    setSelectedOwner(null);
    setAnalyticsData(null);
  };

  const getFieldValue = (obj, fieldNames) => {
    if (!obj) return null;
    for (const field of fieldNames) {
      if (obj[field] !== undefined && obj[field] !== null && obj[field] !== '') {
        return obj[field];
      }
    }
    return null;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '$0.00';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const getTrucksFromAnalytics = () => {
    if (!analyticsData) return [];
    const trucks = analyticsData.trucks || [];
    if (Array.isArray(trucks)) return trucks;
    if (typeof trucks === 'object') return Object.values(trucks);
    return [];
  };

  const dateRange = getSharedDateRange();
  const dateRangeDisplay = dateRange && dateRange[0] && dateRange[1]
    ? `${dateRange[0].format('MMM DD, YYYY')} - ${dateRange[1].format('MMM DD, YYYY')}`
    : null;

  return (
    <div className="h-full w-full flex flex-col box-border bg-transparent p-6 overflow-hidden">
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChartOutlined className={`text-2xl ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`} />
            <h2 className={`mb-0 mt-0 font-bold text-2xl ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
              Analytics Dashboard
            </h2>
          </div>
        </div>

        <div className={`flex items-center gap-4 flex-wrap ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
          {!isOwnerDepartment && (
            <>
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <span className={`font-semibold text-sm ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Owner:</span>
                <Select
                  placeholder="Select Owner"
                  value={selectedOwner}
                  onChange={setSelectedOwner}
                  style={{ width: '200px' }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={owners}
                />
              </div>

              {selectedOwner && (
                <Button
                  onClick={handleClearFilter}
                  icon={<ClearOutlined />}
                  size="small"
                  className="flex items-center gap-1"
                >
                  Clear Filter
                </Button>
              )}
            </>
          )}
          {dateRangeDisplay && (
            <Tag color={currentTheme === 'dark' ? 'blue' : 'default'} className="ml-auto">
              {dateRangeDisplay}
            </Tag>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
          </div>
        ) : !selectedOwner ? (
          <Empty
            description={<span className={currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}>Please select an owner to view analytics</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : analyticsData ? (
          <div className="flex flex-col gap-6">
            <Card
              title={
                <div className="flex items-center gap-2">
                  <BarChartOutlined className={currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'} />
                  <span className={currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}>
                    Analytics for {analyticsData.owner || selectedOwner}
                  </span>
                </div>
              }
              className={`${currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-sm'}`}
            >
              <div className="space-y-8">
                <div>
                  <h3 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                    <DollarOutlined />
                    Total Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card
                      className={`${currentTheme === 'dark' ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30' : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'} shadow-md hover:shadow-lg transition-shadow`}
                      bordered
                    >
                      <Statistic
                        title={<span className={currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}>Total Amount</span>}
                        value={analyticsData.total_amount || 0}
                        precision={2}
                        prefix="$"
                        valueStyle={{
                          color: analyticsData.total_amount >= 0
                            ? (currentTheme === 'dark' ? '#4ade80' : '#16a34a')
                            : (currentTheme === 'dark' ? '#f87171' : '#dc2626'),
                          fontSize: '28px',
                          fontWeight: 'bold'
                        }}
                      />
                    </Card>
                    <Card
                      className={`${currentTheme === 'dark' ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'} shadow-md hover:shadow-lg transition-shadow`}
                      bordered
                    >
                      <Statistic
                        title={<span className={currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}>Total Escrow</span>}
                        value={analyticsData.total_escrow || 0}
                        precision={2}
                        prefix="$"
                        valueStyle={{
                          color: currentTheme === 'dark' ? '#60a5fa' : '#2563eb',
                          fontSize: '28px',
                          fontWeight: 'bold'
                        }}
                      />
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                    <TruckOutlined />
                    Breakdown by Truck
                    <Tag color={currentTheme === 'dark' ? 'blue' : 'default'} className="ml-2">
                      {getTrucksFromAnalytics().length} {getTrucksFromAnalytics().length === 1 ? 'truck' : 'trucks'}
                    </Tag>
                  </h3>
                  {getTrucksFromAnalytics().length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getTrucksFromAnalytics().map((truck, index) => {
                        const truckUnitNumber = truck.truck__unit_number || truck.unit_number || truck.unitNumber || truck.number || 'N/A';
                        const truckId = truck.truck_id || truck.id || truck._id;
                        const truckAmount = typeof truck.truck_amount === 'number' ? truck.truck_amount : parseFloat(truck.truck_amount || 0);
                        const truckEscrow = typeof truck.truck_escrow === 'number' ? truck.truck_escrow : parseFloat(truck.truck_escrow || 0);
                        const isAmountNegative = truckAmount < 0;

                        return (
                          <Card
                            key={index}
                            className={`${currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'} hover:shadow-lg transition-all duration-200 hover:scale-[1.02]`}
                            bordered
                          >
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-lg ${currentTheme === 'dark' ? 'bg-white/10' : 'bg-orange-100'}`}>
                                    <TruckOutlined className={currentTheme === 'dark' ? 'text-white/85' : 'text-orange-600'} />
                                  </div>
                                  <div>
                                    <div className={`font-bold text-lg ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                                      Unit {truckUnitNumber}
                                    </div>
                                    {truckId && (
                                      <div className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                                        ID: {truckId}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className={`grid grid-cols-2 gap-4 pt-3 border-t ${currentTheme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
                                <div>
                                  <div className={`text-xs font-medium mb-2 flex items-center gap-1 ${currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}`}>
                                    <DollarOutlined />
                                    Amount
                                  </div>
                                  <div className={`text-xl font-bold ${isAmountNegative ? (currentTheme === 'dark' ? 'text-red-400' : 'text-red-600') : (currentTheme === 'dark' ? 'text-green-400' : 'text-green-600')}`}>
                                    {formatCurrency(truckAmount)}
                                  </div>
                                </div>
                                <div>
                                  <div className={`text-xs font-medium mb-2 flex items-center gap-1 ${currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}`}>
                                    <WalletOutlined />
                                    Escrow
                                  </div>
                                  <div className={`text-xl font-bold ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                    {formatCurrency(truckEscrow)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className={`${currentTheme === 'dark' ? 'bg-white/3 border-white/10' : 'bg-gray-50 border-black/10'}`}>
                      <Empty
                        description={<span className={currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}>No trucks found in analytics data</span>}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </Card>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Empty
            description={<span className={currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}>No analytics data available for the selected owner</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </div>
  );
};

export default Analytics;

