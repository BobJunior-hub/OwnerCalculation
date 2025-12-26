import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Button, Select, InputNumber, App, Spin } from 'antd';
import { CloseOutlined, SaveOutlined, LoadingOutlined } from '@ant-design/icons';
const { TextArea } = Input;
import { useTheme } from './menu';
import { apiRequest, getAuthToken } from './api';

const DeductionDrawer = ({ open, onClose, onSuccess, calculation }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingDriver, setLoadingDriver] = useState(false);
  const [driverData, setDriverData] = useState(null);
  const [allTrucks, setAllTrucks] = useState([]);
  const [loadingTrucks, setLoadingTrucks] = useState(false);
  const currentTheme = useTheme();

  useEffect(() => {
    const fetchAllTrucks = async () => {
      if (!open || !getAuthToken()) {
        return;
      }
      try {
        setLoadingTrucks(true);
        const result = await apiRequest('/calculations/all-trucks');
        
        
        let trucksList = [];
        if (Array.isArray(result)) {
          trucksList = result;
        } else if (result && typeof result === 'object') {
          trucksList = result.trucks || result.data || result.results || result.items || [];
          if (!Array.isArray(trucksList) && typeof trucksList === 'object') {
            trucksList = Object.values(trucksList);
          }
        }
        
        setAllTrucks(Array.isArray(trucksList) ? trucksList : []);
      } catch (err) {
        console.error('Error fetching trucks:', err);
        setAllTrucks([]);
      } finally {
        setLoadingTrucks(false);
      }
    };
    fetchAllTrucks();
  }, [open]);

  useEffect(() => {
    if (open && calculation) {
      form.resetFields();
      setDriverData(null);
      
      const ownerId = calculation.id || null;
      
      if (ownerId) {
        form.setFieldsValue({ owner: ownerId });
      }
    }
  }, [open, calculation, form]);

  const fetchDriverStatement = async (driverId) => {
    if (!driverId || !calculation) {
      return;
    }

    const startDate = calculation.start_date;
    const endDate = calculation.end_date;

    if (!startDate || !endDate) {
      return;
    }

    setLoadingDriver(true);
    try {
      const params = new URLSearchParams({
        driver: driverId,
        start_date: startDate,
        end_date: endDate,
      });

      const result = await apiRequest(`/calculations/statement-by-driver/?${params.toString()}`);
      
      if (result && Array.isArray(result) && result.length > 0) {
        const fetchedDriverData = result[0];
        
        let driverName = '';
        if (fetchedDriverData.driver) {
          if (typeof fetchedDriverData.driver === 'object' && fetchedDriverData.driver.name) {
            driverName = fetchedDriverData.driver.name;
          } else if (typeof fetchedDriverData.driver === 'string') {
            driverName = fetchedDriverData.driver;
          }
        } else {
          driverName = fetchedDriverData.driver_name || '';
        }
        
        const amount = fetchedDriverData.total_amount || fetchedDriverData.amount || 0;
        const escrow = fetchedDriverData.escrow || fetchedDriverData.total_escrow || 0;

        setDriverData({
          driverName: driverName,
          amount: amount,
          escrow: escrow,
        });

        form.setFieldsValue({
          driver: driverName,
          amount: amount,
          escrow: escrow,
        });

        message.success('Driver data loaded successfully!');
      } else if (result && typeof result === 'object' && !Array.isArray(result)) {
        let driverName = '';
        if (result.driver) {
          if (typeof result.driver === 'object' && result.driver.name) {
            driverName = result.driver.name;
          } else if (typeof result.driver === 'string') {
            driverName = result.driver;
          }
        } else {
          driverName = result.driver_name || '';
        }
        
        const amount = result.total_amount || result.amount || 0;
        const escrow = result.escrow || result.total_escrow || 0;

        setDriverData({
          driverName: driverName,
          amount: amount,
          escrow: escrow,
        });

        form.setFieldsValue({
          driver: driverName,
          amount: amount,
          escrow: escrow,
        });

        message.success('Driver data loaded successfully!');
      } else {
        setDriverData(null);
        message.info('No driver statement found. Please fill the fields manually.');
      }
    } catch (error) {
      console.error('Error fetching driver statement:', error);
      setDriverData(null);
      message.warning('Could not fetch driver statement. Please fill the fields manually.');
    } finally {
      setLoadingDriver(false);
    }
  };

  const handleTruckChange = async (truckId) => {
    if (!truckId) {
      setDriverData(null);
      form.setFieldsValue({ driver: '', amount: undefined, escrow: undefined });
      return;
    }

    const truck = allTrucks.find(t => {
      const tId = t.id || t._id;
      return String(tId) === String(truckId);
    });

    if (!truck) {
      return;
    }

    let driverId = null;
    if (truck.driver && Array.isArray(truck.driver) && truck.driver.length > 0) {
      driverId = truck.driver[0].id;
    } else if (truck.driver && typeof truck.driver === 'object' && truck.driver.id) {
      driverId = truck.driver.id;
    } else if (truck.driver && typeof truck.driver === 'number') {
      driverId = truck.driver;
    } else if (truck.driver_id) {
      driverId = truck.driver_id;
    }

    if (driverId) {
      await fetchDriverStatement(driverId);
    } else {
      setDriverData(null);
      form.setFieldsValue({ driver: '', amount: undefined, escrow: undefined });
    }
  };

  const handleSubmit = async (values) => {
    if (!calculation) {
      message.error('Calculation data is missing');
      return;
    }

    if (!calculation.start_date || !calculation.end_date) {
      message.error('Date range is missing from calculation');
      return;
    }

    const ownerId = calculation.id || null;
    
    if (!ownerId) {
      message.error('Owner ID is missing from calculation');
      return;
    }

    setLoading(true);
    try {
      const truck = allTrucks.find(t => {
        const tId = t.id || t._id;
        return String(tId) === String(values.truck);
      });

      if (!truck) {
        message.error('Truck not found');
        setLoading(false);
        return;
      }

      let amountValue = 0;
      if (values.amount !== null && values.amount !== undefined && values.amount !== '') {
        if (typeof values.amount === 'string') {
          const cleaned = values.amount.replace(/[^0-9.-]/g, '');
          amountValue = parseFloat(cleaned);
        } else {
          amountValue = parseFloat(values.amount);
        }
        if (isNaN(amountValue)) {
          amountValue = 0;
        }
      }

      let escrowValue = 0;
      if (values.escrow !== null && values.escrow !== undefined && values.escrow !== '') {
        if (typeof values.escrow === 'string') {
          const cleaned = values.escrow.replace(/[^0-9.-]/g, '');
          escrowValue = parseFloat(cleaned);
        } else {
          escrowValue = parseFloat(values.escrow);
        }
        if (isNaN(escrowValue)) {
          escrowValue = 0;
        }
      }

      const payload = {
        truck: Number(values.truck),
        owner: Number(ownerId),
        driver: values.driver || '',
        amount: amountValue,
        escrow: escrowValue,
        start_date: calculation.start_date,
        end_date: calculation.end_date,
      };

      if (values.note && values.note.trim()) {
        payload.note = values.note.trim();
      }

      const calculationUnitPayload = {
        truck: Number(values.truck),
        owner: Number(ownerId),
        driver: values.driver || '',
        amount: amountValue,
        escrow: escrowValue,
        start_date: calculation.start_date,
        end_date: calculation.end_date,
      };

      if (values.note && values.note.trim()) {
        calculationUnitPayload.note = values.note.trim();
      }

      console.log('=== Creating Deduction for Specific Week ===');
      console.log('Week Period:', calculation.start_date, 'to', calculation.end_date);
      console.log('Owner ID:', ownerId);
      console.log('Owner Name:', calculation.owner);
      console.log('Sending POST request to /calculations/calculation-unit/ with payload:', calculationUnitPayload);

      await apiRequest('/calculations/calculation-unit/', {
        method: 'POST',
        body: JSON.stringify(calculationUnitPayload),
      });

      console.log('Calculation unit created successfully');

      message.success('Deduction created successfully for the selected owner and period!');
      form.resetFields();
      setDriverData(null);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating deduction:', error);
      message.error(error.message || 'Failed to create deduction');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setDriverData(null);
    onClose();
  };

  const truckOptions = allTrucks.map((truck) => {
    const truckId = truck.id || truck._id;
    const unitNumber = truck.unit_number || 'N/A';
    const vin = truck.VIN || truck.vin || 'N/A';
    const label = `${unitNumber} (VIN: ${vin})`;
    
    return {
      value: truckId,
      label: label,
    };
  });

  if (!calculation) return null;

  const ownerId = calculation.owner_id || (calculation.owner && typeof calculation.owner === 'number' ? calculation.owner : null);
  
  const periodInfo = calculation.start_date && calculation.end_date 
    ? `${calculation.start_date} to ${calculation.end_date}`
    : 'Period not specified';

  return (
    <Drawer
      title={
        <div>
          <h2 className={`text-xl font-bold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
            Add Deduction
          </h2>
          <div className={`text-sm space-y-1 ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
            <p>Owner: {calculation.owner || 'N/A'} (ID: {ownerId || 'N/A'})</p>
            <p>Period: {periodInfo}</p>
          </div>
        </div>
      }
      placement="right"
      onClose={handleClose}
      open={open}
      width={600}
      className={currentTheme === 'dark' ? 'bg-white/5' : 'bg-white'}
      styles={{
        body: {
          backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        },
        header: {
          borderBottom: `1px solid ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        },
      }}
      closeIcon={<CloseOutlined />}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className={currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}
      >
        <Form.Item
          name="owner"
          label={<span className={currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}>Owner ID</span>}
          rules={[{ required: true, message: 'Owner ID is required' }]}
          initialValue={ownerId}>
          <InputNumber
            placeholder="Owner ID"
            disabled
            value={ownerId}
            style={{ width: '100%' }}
            readOnly
          />
        </Form.Item>

        <Form.Item
          name="truck"
          label={<span className={currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}>Truck ID</span>}
          rules={[{ required: true, message: 'Please select a truck' }]}
        >
          <Select
            placeholder="Select Truck"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            onChange={handleTruckChange}
            options={truckOptions}
          />
        </Form.Item>

        {loadingDriver && (
          <div className="mb-4 text-center">
            <Spin size="small" /> <span className={currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}>Loading driver data...</span>
          </div>
        )}

        <Form.Item
          name="driver"
          label={<span className={currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}>Driver</span>}
        >
          <Input
            placeholder="Enter driver name (optional)"
            disabled={!!driverData?.driverName}
          />
        </Form.Item>

        <Form.Item
          name="amount"
          label={<span className={currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}>Amount</span>}
          rules={[{ required: true, message: 'Please enter amount' }]}
        >
          <InputNumber
            placeholder="Enter amount (can be positive or negative)"
            style={{ width: '100%' }}
            step={0.01}
            formatter={(value) => {
              if (!value && value !== 0) return '';
              const num = parseFloat(value);
              if (isNaN(num)) return '';
              const sign = num < 0 ? '-' : '';
              const absValue = Math.abs(num);
              return `${sign}$ ${absValue}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }}
            parser={(value) => {
              if (!value) return '';
              return value.replace(/\$\s?|(,*)/g, '');
            }}
          />
        </Form.Item>

        <Form.Item
          name="escrow"
          label={<span className={currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}>Escrow</span>}
        >
          <InputNumber
            placeholder="Enter escrow (can be positive or negative)"
            style={{ width: '100%' }}
            step={0.01}
            formatter={(value) => {
              if (!value && value !== 0) return '';
              const num = parseFloat(value);
              if (isNaN(num)) return '';
              const sign = num < 0 ? '-' : '';
              const absValue = Math.abs(num);
              return `${sign}$ ${absValue}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }}
            parser={(value) => {
              if (!value) return '';
              return value.replace(/\$\s?|(,*)/g, '');
            }}
          />
        </Form.Item>

        <Form.Item
          name="note"
          label={<span className={currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}>Note</span>}
        >
          <TextArea
            placeholder="Enter note (optional)"
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item>
          <div className="flex gap-2 justify-end">
            <Button onClick={handleClose} className="hover:border-[#F59A6B] hover:text-[#F59A6B]">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-[#E77843] hover:bg-[#F59A6B] border-[#E77843] hover:border-[#F59A6B]"
              icon={<SaveOutlined />}
            >
              Save Deduction
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default DeductionDrawer;

