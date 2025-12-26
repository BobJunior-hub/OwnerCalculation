import React, { useEffect, useState } from 'react';
import { Card, Select, DatePicker, Button, Spin, Empty } from 'antd';
import dayjs from 'dayjs';
import { useTheme } from '../menu';
import { apiRequest, getAuthToken } from '../api';

const { RangePicker } = DatePicker;

const Analytics = () => {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const currentTheme = useTheme();

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        if (!getAuthToken()) {
          return;
        }
        const result = await apiRequest('/calculations/analytics');
        let ownersList = [];
        if (Array.isArray(result)) {
          ownersList = result.map(item => typeof item === 'string' ? item : (item.owner || item.name || item.ownerName));
        } else if (result && typeof result === 'object') {
          if (result.owners && Array.isArray(result.owners)) {
            ownersList = result.owners.map(item => typeof item === 'string' ? item : (item.owner || item.name || item.ownerName));
          } else if (result.data && Array.isArray(result.data)) {
            ownersList = result.data.map(item => typeof item === 'string' ? item : (item.owner || item.name || item.ownerName));
          } else if (result.results && Array.isArray(result.results)) {
            ownersList = result.results.map(item => typeof item === 'string' ? item : (item.owner || item.name || item.ownerName));
          } else if (typeof result === 'object' && Object.keys(result).length > 0) {
            ownersList = Object.keys(result).filter(key => key && typeof key === 'string');
          }
        }
        const uniqueOwners = [...new Set(ownersList.filter(owner => owner))];
        setOwners(uniqueOwners);
      } catch (err) {
        const defaultOwners = ['Yulduz', 'Sohib', 'Bobur'];
        setOwners(defaultOwners);
      }
    };
    fetchOwners();
  }, []);

  useEffect(() => {
    if (selectedOwner && dateRange && dateRange[0] && dateRange[1]) {
      fetchAnalytics();
    } else {
      setAnalyticsData(null);
    }
  }, [selectedOwner, dateRange]);

  const fetchAnalytics = async () => {
    if (!selectedOwner || !dateRange || !dateRange[0] || !dateRange[1]) return;
    
    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      const ownerName = typeof selectedOwner === 'string' ? selectedOwner : (selectedOwner.name || selectedOwner.owner || selectedOwner);
      const params = new URLSearchParams({
        owner: ownerName,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
      });
      
      const result = await apiRequest(`/calculations/analytics?${params.toString()}`);
      setAnalyticsData(result);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setDateRange(null);
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

  return (
    <div className="h-full w-full flex flex-col box-border bg-transparent p-6">
      <h2 className={`mb-5 mt-0 flex-shrink-0 font-semibold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>Analytics</h2>
      
      <div className={`flex items-center gap-4 mb-6 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
        <div className="flex items-center gap-2">
          <span className="font-medium min-w-[80px]">Owner:</span>
          <Select
            placeholder="Select Owner"
            value={selectedOwner}
            onChange={setSelectedOwner}
            style={{ width: '250px' }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={owners.map((owner) => {
              const ownerValue = typeof owner === 'string' ? owner : (owner.id || owner.name || owner.ownerName || owner);
              return {
                value: ownerValue,
                label: typeof owner === 'string' ? owner : ownerValue,
              };
            })}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Date Range:</span>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
            style={{ width: '250px' }}
          />
        </div>

        {(selectedOwner || dateRange) && (
          <Button onClick={handleClearFilter} size="small">
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Spin size="large" />
        </div>
      ) : !selectedOwner || !dateRange || !dateRange[0] || !dateRange[1] ? (
        <Empty description={<span className={currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}>Please select an owner and date range to view analytics</span>} />
      ) : analyticsData ? (
        <div className="flex flex-col gap-6 flex-1 overflow-auto">
          <Card
            title={<span className={currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}>Financial Summary</span>}
            className={`${currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-md ${currentTheme === 'dark' ? 'bg-white/3 border border-white/10' : 'bg-gray-50 border border-black/10'}`}>
                  <div className={`text-sm ${currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}`}>Total Amount</div>
                  <div className={`text-2xl font-bold mt-1 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                    {formatCurrency(getFieldValue(analyticsData, ['total_amount', 'totalAmount', 'total', 'amount']) || 0)}
                  </div>
                </div>
                <div className={`p-4 rounded-md ${currentTheme === 'dark' ? 'bg-white/3 border border-white/10' : 'bg-gray-50 border border-black/10'}`}>
                  <div className={`text-sm ${currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}`}>Total Escrow</div>
                  <div className={`text-2xl font-bold mt-1 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                    {formatCurrency(getFieldValue(analyticsData, ['total_escrow', 'totalEscrow', 'escrow']) || 0)}
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`text-lg font-semibold mb-3 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                  Trucks Information ({getTrucksFromAnalytics().length} trucks)
                </h3>
                {getTrucksFromAnalytics().length > 0 ? (
                  <div className="space-y-2">
                    {getTrucksFromAnalytics().map((truck, index) => {
                      const truckUnitNumber = truck.truck__unit_number || truck.unit_number || truck.unitNumber || truck.number || `Truck ${index + 1}`;
                      const truckId = truck.truck_id || truck.id || truck._id || index;
                      const truckAmount = truck.truck_amount || truck.amount || 0;
                      const truckEscrow = truck.truck_escrow || truck.escrow || 0;
                      
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-md ${currentTheme === 'dark' ? 'bg-white/3 border border-white/10' : 'bg-gray-50 border border-black/10'}`}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                              <div className={`font-semibold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                                Unit: {truckUnitNumber}
                              </div>
                              <div className={`text-xs ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                                ID: {truckId}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                <div className={`text-xs ${currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}`}>Amount</div>
                                <div className={`text-sm font-semibold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                                  {formatCurrency(truckAmount)}
                                </div>
                              </div>
                              <div>
                                <div className={`text-xs ${currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}`}>Escrow</div>
                                <div className={`text-sm font-semibold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                                  {formatCurrency(truckEscrow)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`p-4 text-center ${currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}`}>
                    No trucks found in analytics data
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card
            title={<span className={currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}>Raw Analytics Data</span>}
            className={`${currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}
          >
            <div className={`${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
              <pre className="whitespace-pre-wrap text-xs bg-white/5 p-4 rounded max-h-96 overflow-auto">
                {JSON.stringify(analyticsData, null, 2)}
              </pre>
            </div>
          </Card>
        </div>
      ) : (
        <Empty description={<span className={currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}>No analytics data available for the selected owner and date range</span>} />
      )}
    </div>
  );
};

export default Analytics;

