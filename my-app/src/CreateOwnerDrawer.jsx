import React, { useState, useEffect, useRef } from 'react';
import { Drawer, Form, Input, DatePicker, Button, Select, InputNumber, App, Spin, Empty, Modal } from 'antd';
import { TruckOutlined, CloseOutlined, SaveOutlined, DeleteOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTheme } from './menu';
import { apiRequest, getAuthToken } from './api';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const CreateOwnerDrawer = ({ open, onClose, onSuccess, owners }) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [loadingTrucks, setLoadingTrucks] = useState(false);
  const [allTrucks, setAllTrucks] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [selectedTruckIds, setSelectedTruckIds] = useState(new Set());
  const [trucksData, setTrucksData] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState({});
  const currentTheme = useTheme();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetchAllTrucks();
    setSelectedOwner('');
    setDateRange(null);
    setSelectedTruckIds(new Set());
    setTrucksData([]);
    setLoadingDrivers({});
    }
  }, [open]);

  const fetchAllTrucks = async () => {
    if (!getAuthToken()) {
      return;
    }

    setLoadingTrucks(true);
    try {
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
      message.error('Failed to load trucks. Please try again.');
      setAllTrucks([]);
    } finally {
      setLoadingTrucks(false);
    }
  };

  const addTruck = async (truckIdStr) => {
    if (!truckIdStr) return;

    if (!selectedOwner) {
      message.warning('Please select an owner first.');
      return;
    }

    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('Please select Start Date and End Date before adding units.');
      return;
    }

    const truckId = parseInt(truckIdStr);
    const truck = allTrucks.find(t => {
      const tId = t.id || t._id;
      return String(tId) === String(truckId);
    });

    if (!truck) return;

    if (selectedTruckIds.has(truck.id || truck._id)) {
      message.warning('This unit is already added.');
      return;
    }

    const newSelection = new Set(selectedTruckIds);
    const truckIdValue = truck.id || truck._id;
    newSelection.add(truckIdValue);
    setSelectedTruckIds(newSelection);

    const unitNumber = truck.unit_number || 'N/A';
    const vin = truck.VIN || truck.vin || 'N/A';

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

    const newItem = {
      truckId: truckIdValue,
      unitNumber: unitNumber,
      vin: vin,
      driverId: driverId,
      driverName: '',
      amount: '',
      escrow: '',
      note: '',
      status: 'loading',
      company: '',
      statementId: null,
    };

    setTrucksData(prev => [...prev, newItem]);

    if (driverId) {
      await fetchDriverData(newItem, driverId);
    } else {
      setTrucksData(prev => prev.map(item =>
        item.truckId === newItem.truckId
          ? { ...item, status: 'manual' }
          : item
      ));
      message.info(`No driver assigned to Unit ${unitNumber}. Please fill the fields manually.`);
    }

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const extractDriverInfo = (data) => {
    let driverName = '';
    if (data.driver) {
      if (typeof data.driver === 'object' && data.driver.name) {
        driverName = data.driver.name;
      } else if (typeof data.driver === 'string') {
        driverName = data.driver;
      }
    } else {
      driverName = data.driver_name || '';
    }

    let companyName = '';
    if (data.company) {
      if (typeof data.company === 'object' && data.company.name) {
        companyName = data.company.name;
      } else if (typeof data.company === 'string') {
        companyName = data.company;
      }
    } else {
      companyName = data.company_name || data.carrier_company || '';
    }

    return {
      driverName,
      companyName,
      amount: data.total_amount || data.amount || 0,
      note: data.note || '',
      statementId: data.id || null,
    };
  };

  const fetchDriverData = async (item, driverId) => {
    if (!driverId || !dateRange || !dateRange[0] || !dateRange[1]) {
      setTrucksData(prev => prev.map(current =>
        current.truckId === item.truckId
          ? { ...current, status: 'manual' }
          : current
      ));
      return;
    }

    setLoadingDrivers(prev => ({ ...prev, [item.truckId]: true }));

    try {
      const params = new URLSearchParams({
        driver: String(driverId),
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      });

      const result = await apiRequest(`/calculations/statement-by-driver/?${params.toString()}`);

      let driverData = null;
      if (result && Array.isArray(result) && result.length > 0) {
        driverData = result[0];
      } else if (result && typeof result === 'object' && !Array.isArray(result)) {
        driverData = result;
      }

      if (driverData) {
        const { driverName, companyName, amount, note, statementId } = extractDriverInfo(driverData);

        setTrucksData(prev => prev.map(current =>
          current.truckId === item.truckId
            ? {
                ...current,
                status: 'fetched',
                driverName,
                company: companyName,
                amount: String(amount),
                escrow: current.escrow || '',
                note,
                statementId,
              }
            : current
        ));

        message.success(`Driver statement data loaded for Unit ${item.unitNumber}`);
      } else {
        setTrucksData(prev => prev.map(current =>
          current.truckId === item.truckId
            ? { ...current, status: 'manual' }
            : current
        ));
        message.info(`No driver statement found for Unit ${item.unitNumber}. Please fill the fields manually.`);
      }
    } catch (error) {
      setTrucksData(prev => prev.map(current =>
        current.truckId === item.truckId
          ? { ...current, status: 'manual' }
          : current
      ));
      message.warning(`Could not fetch driver statement for Unit ${item.unitNumber}. Please fill the fields manually.`);
    } finally {
      setLoadingDrivers(prev => {
        const newState = { ...prev };
        delete newState[item.truckId];
        return newState;
      });
    }
  };

  const removeTruck = (truckId) => {
    const newSelection = new Set(selectedTruckIds);
    newSelection.delete(truckId);
    setSelectedTruckIds(newSelection);
    setTrucksData(prev => prev.filter(d => d.truckId !== truckId));
  };

  const updateTruckData = (truckId, field, value) => {
    setTrucksData(prev => prev.map(item =>
      item.truckId === truckId ? { ...item, [field]: value } : item
    ));
  };

  const formatExistingUnits = (existingUnits) => {
    return existingUnits.map(unit => {
      const truckId = unit.truck?.id || unit.truck || unit.truck_id;
      const statementId = unit.statement?.id || unit.statement || unit.statement_id;
      const amount = typeof unit.amount === 'string' ? unit.amount : String(unit.amount || '0.00');
      const escrow = typeof unit.escrow === 'string' ? unit.escrow : String(unit.escrow || '0.00');

      const formattedUnit = {
        truck: Number(truckId),
        amount,
        escrow,
      };

      if (unit.driver && unit.driver.trim()) {
        formattedUnit.driver = unit.driver.trim();
      }
      if (statementId) {
        formattedUnit.statement = Number(statementId);
      }
      if (unit.note && unit.note.trim()) {
        formattedUnit.note = unit.note.trim();
      } else {
        formattedUnit.note = '';
      }

      return formattedUnit;
    });
  };

  const fetchExistingCalculation = async (owner, startDate, endDate) => {
    try {
      const checkParams = new URLSearchParams({
        search: owner,
        start_date: startDate,
        end_date: endDate,
      });
      const existingCalculations = await apiRequest(`/calculations/owner-calculation/?${checkParams.toString()}`);

      if (!existingCalculations) return null;

      const calculations = Array.isArray(existingCalculations)
        ? existingCalculations
        : (existingCalculations.results || []);

      return calculations.find(
        (c) =>
          (c.owner === owner || c.owner?.id === owner) &&
          c.start_date === startDate &&
          c.end_date === endDate
      ) || null;
    } catch (error) {
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!selectedOwner) {
      message.error('Please select an owner.');
      return;
    }

    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.error('Please select a date range.');
      return;
    }

    if (trucksData.length === 0) {
      message.error('Please add at least one unit.');
      return;
    }

    const hasLoading = trucksData.some(t => t.status === 'loading' || loadingDrivers[t.truckId]);
    if (hasLoading) {
      message.warning('Please wait for driver data to load.');
      return;
    }

    try {
      setLoading(true);

      const startDateStr = dateRange[0].format('YYYY-MM-DD');
      const endDateStr = dateRange[1].format('YYYY-MM-DD');

      const existingCalculation = await fetchExistingCalculation(selectedOwner, startDateStr, endDateStr);

      const payloadUnits = trucksData.map((item) => {
        const truck = allTrucks.find(t => {
          const tId = t.id || t._id;
          return String(tId) === String(item.truckId);
        });

        if (!truck) {
          return null;
        }

        const truckId = Number(truck.id || truck._id);

        let amountValue = 0;
        if (item.amount) {
          if (typeof item.amount === 'string') {
            const cleaned = item.amount.replace(/[^0-9.-]/g, '');
            amountValue = parseFloat(cleaned) || 0;
          } else {
            amountValue = parseFloat(item.amount) || 0;
          }
        }

        let escrowValue = 0;
        if (item.escrow !== null && item.escrow !== undefined && item.escrow !== '') {
          if (typeof item.escrow === 'string') {
            const cleaned = item.escrow.replace(/[^0-9.-]/g, '');
            escrowValue = parseFloat(cleaned) || 0;
          } else {
            escrowValue = parseFloat(item.escrow) || 0;
          }
        }

        const unitPayload = {
          truck: truckId,
          amount: amountValue.toFixed(2),
          escrow: escrowValue.toFixed(2),
        };

        if (item.driverName && item.driverName.trim()) {
          unitPayload.driver = item.driverName.trim();
        }

        if (item.driverId) {
          unitPayload.driver_id = Number(item.driverId);
        }

        if (item.statementId) {
          unitPayload.statement = Number(item.statementId);
        }

        if (item.note && item.note.trim()) {
          unitPayload.note = item.note.trim();
        } else {
          unitPayload.note = '';
        }

        return unitPayload;
      }).filter(unit => unit !== null);

      if (payloadUnits.length === 0) {
        message.error('No valid units to save.');
        setLoading(false);
        return;
      }

      let response;

      if (!existingCalculation) {
        const existingUnits = existingCalculation.calculation_units || existingCalculation.units || [];
        const newUnits = payloadUnits.filter(
          (unit) =>
            !existingUnits.some(
              (eu) => String(eu.truck?.id || eu.truck || eu.truck_id) === String(unit.truck)
            )
        );

        if (newUnits.length === 0) {
          message.warning(
            'All units already exist in this calculation. Nothing to add.'
          );
          setLoading(false);
          return;
        }

        const formattedExistingUnits = formatExistingUnits(existingUnits);

        const updatePayload = {
          owner: selectedOwner,
          start_date: startDateStr,
          end_date: endDateStr,
          units: [...formattedExistingUnits, ...newUnits],
        };

        response = await apiRequest(
          `/calculations/owner-calculation/${existingCalculation.id}/`,
          {
            method: 'PATCH',
            body: JSON.stringify(updatePayload),
          }
        );

        message.success(
          `Calculation updated! Added ${newUnits.length} new unit(s).`
        );
      } else {
        const postPayload = {
        owner: selectedOwner,
          start_date: startDateStr,
          end_date: endDateStr,
          units: payloadUnits,
        };

        try {
          response = await apiRequest('/calculations/owner-calculation/', {
        method: 'POST',
            body: JSON.stringify(postPayload),
          });

          message.success('Calculation created successfully!');
        } catch (postError) {
          const isAlreadyExistsError = postError?.message?.includes('already exists') ||
                                     postError?.response?.error?.includes('already exists') ||
                                     postError?.response?.detail?.includes('already exists');

          if (isAlreadyExistsError) {
            const fetchedCalculation = await fetchExistingCalculation(selectedOwner, startDateStr, endDateStr);

            if (fetchedCalculation) {
              const existingUnits = fetchedCalculation.calculation_units || fetchedCalculation.units || [];
              const newUnits = payloadUnits.filter(
                (unit) =>
                  !existingUnits.some(
                    (eu) => String(eu.truck?.id || eu.truck || eu.truck_id) === String(unit.truck)
                  )
              );

              if (newUnits.length === 0) {
                message.warning('All units already exist in this calculation. Nothing to add.');
                setLoading(false);
                return;
              }

              const formattedExistingUnits = formatExistingUnits(existingUnits);

              const updatePayload = {
                owner: selectedOwner,
                start_date: startDateStr,
                end_date: endDateStr,
                units: [...formattedExistingUnits, ...newUnits],
              };

              response = await apiRequest(
                `/calculations/owner-calculation/`,
                {
                  method: 'POST',
                  body: JSON.stringify(updatePayload),
                }
              );


              message.success(`Calculation updated! Added ${newUnits.length} new unit(s) in batch.`);
            } else {
              throw postError;
            }
          } else {
            throw postError;
          }
        }
      }

      setSelectedOwner('');
      setDateRange(null);
      setSelectedTruckIds(new Set());
      setTrucksData([]);
      setLoadingDrivers({});

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      const errorMsg =
        err?.message ||
        err?.response?.error ||
        err?.response?.detail ||
        'Something went wrong while creating/updating calculation.';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedOwner('');
    setDateRange(null);
    setSelectedTruckIds(new Set());
    setTrucksData([]);
    setLoadingDrivers({});
    onClose();
  };

  const filteredTrucks = allTrucks.filter(truck => {
    const truckId = truck.id || truck._id;
    return !selectedTruckIds.has(truckId);
  });

  return (
    <Drawer
      title={
        <div>
          <h2 className={`text-xl font-bold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
            Create New Owner Calculation
          </h2>
          <p className={`text-sm ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
            Calculate statements for specific trucks
          </p>
        </div>
      }
      placement="right"
      onClose={handleClose}
      open={open}
      width={900}
      className={currentTheme === 'dark' ? 'bg-white/5' : 'bg-white'}
      styles={{
        body: {
          backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
          padding: 0,
        },
        header: {
          borderBottom: `1px solid ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        },
      }}
      closeIcon={<CloseOutlined />}
    >
      <div className={`flex flex-col h-full ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    currentTheme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-orange-100 text-orange-600'
                  }`}>
                    1
                  </span>
                  <span className={currentTheme === 'dark' ? 'text-white/70' : 'text-orange-600'}>Configuration</span>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border ${
                  currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-sm'
                }`}>
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-semibold mb-1.5 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
                      Fleet Owner
                    </label>
            <Select
              className="w-full"
              placeholder="Choose owner..."
              value={selectedOwner}
                      onChange={(value) => {
                        setSelectedOwner(value);
                        setSelectedTruckIds(new Set());
                        setTrucksData([]);
                      }}
              showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={owners.map((owner) => ({
                        value: typeof owner === 'string' ? owner : owner.name || owner.owner,
                        label: typeof owner === 'string' ? owner : owner.name || owner.owner,
                      }))}
                    />
                  </div>

              <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
                      Period Start
                    </label>
                <DatePicker
                  className="w-full"
                      format="YYYY-MM-DD"
                      value={dateRange ? dateRange[0] : null}
                      onChange={(date) => {
                        if (date) {
                          const endDate = date.clone().add(6, 'day');
                          setDateRange([date, endDate]);
                        } else {
                          setDateRange(null);
                        }
                      }}
                />
              </div>

              <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
                      Period End
                    </label>
                <DatePicker
                  className="w-full"
                      format="YYYY-MM-DD"
                      value={dateRange ? dateRange[1] : null}
                      onChange={(date) => {
                        if (date && dateRange && dateRange[0]) {
                          setDateRange([dateRange[0], date]);
                        }
                      }}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentTheme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-orange-100 text-orange-600'
                    }`}>
                      2
                    </span>
                    <span className={currentTheme === 'dark' ? 'text-white/70' : 'text-orange-600'}>Calculation Units</span>
                  </div>
                  <div className={`text-xs font-medium ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                    {trucksData.length} Unit(s) selected
                  </div>
                </div>

                <div className="space-y-4">
                  {trucksData.length === 0 ? (
                    <div className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center text-center ${
                      currentTheme === 'dark' ? 'border-white/10 bg-white/5' : 'border-black/10 bg-gray-50'
                    }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                        currentTheme === 'dark' ? 'bg-white/10 text-white/30' : 'bg-white text-gray-300 shadow-sm'
                      }`}>
                        <PlusOutlined style={{ fontSize: '24px' }} />
                      </div>
                      <p className={`font-medium ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
                        No units added to this calculation yet.
                      </p>
                      <p className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                        Select units below to start calculations.
                      </p>
                    </div>
                  ) : (
                    trucksData.map((data) => (
                      <div
                        key={data.truckId}
                        className={`border rounded-lg p-4 transition-all ${
                          currentTheme === 'dark'
                            ? 'border-white/10 bg-white/5'
                            : 'border-black/10 bg-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              currentTheme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <TruckOutlined style={{ fontSize: '16px' }} />
                            </div>
                            <div>
                              <span className={`font-bold text-sm block ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                                Unit {data.unitNumber}
                              </span>
                              <span className={`text-xs block ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                                VIN: {data.vin}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {(data.status === 'loading' || loadingDrivers[data.truckId]) && (
                              <LoadingOutlined style={{ fontSize: '16px', color: '#E77843' }} spin />
                            )}
                            <button
                              onClick={() => removeTruck(data.truckId)}
                              className={`transition-colors ${
                                currentTheme === 'dark' ? 'text-white/30 hover:text-red-500' : 'text-gray-300 hover:text-red-500'
                              }`}
                            >
                              <DeleteOutlined style={{ fontSize: '16px' }} />
                            </button>
                          </div>
                        </div>

                        {data.status !== 'loading' && !loadingDrivers[data.truckId] && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={`text-xs font-medium mb-1 block ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                                Driver Name
                              </label>
                              <Input
                                className="w-full"
                                value={data.driverName}
                                onChange={(e) => updateTruckData(data.truckId, 'driverName', e.target.value)}
                                placeholder="Enter driver name"
                                disabled={data.status === 'fetched' && data.driverName}
                              />
                            </div>
                            <div>
                              <label className={`text-xs font-medium mb-1 block ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                                Company
                              </label>
                              <Input
                                className="w-full"
                                value={data.company}
                                onChange={(e) => updateTruckData(data.truckId, 'company', e.target.value)}
                                placeholder="Enter company"
                              />
                            </div>
                            <div>
                              <label className={`text-xs font-medium mb-1 block ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                                Total Amount
                              </label>
                              <InputNumber
                                className="w-full"
                                value={data.amount}
                                onChange={(value) => updateTruckData(data.truckId, 'amount', value ? String(value) : '')}
                                placeholder="Enter amount"
                                min={0}
                                step={0.01}
                                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                style={{ color: currentTheme === 'dark' ? '#4ade80' : '#16a34a' }}
                              />
                            </div>
                            <div>
                              <label className={`text-xs font-medium mb-1 block ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                                Escrow
                              </label>
                              <InputNumber
                                className="w-full"
                                value={data.escrow}
                                onChange={(value) => updateTruckData(data.truckId, 'escrow', value !== null && value !== undefined ? String(value) : '')}
                                placeholder="Enter escrow (can be positive or negative)"
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
                                style={{ color: currentTheme === 'dark' ? '#60a5fa' : '#2563eb' }}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className={`text-xs font-medium mb-1 block ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                                Note
                              </label>
                              <TextArea
                                rows={2}
                                value={data.note}
                                onChange={(e) => updateTruckData(data.truckId, 'note', e.target.value)}
                                placeholder="Enter note"
                              />
                            </div>
                          </div>
                        )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
                </div>
          </section>

              <section className={`space-y-4 pt-6 border-t ${currentTheme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${
                  currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'
                }`}>
                  <PlusOutlined style={{ fontSize: '16px', color: '#E77843' }} /> Add Available Fleet Unit
                </h3>

            {selectedOwner ? (
                  loadingTrucks ? (
                    <div className={`flex items-center gap-2 p-4 rounded-xl border ${
                      currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'
                    }`}>
                      <Spin size="small" />
                      <span className={`text-sm ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
                        Loading trucks...
                      </span>
                    </div>
                  ) : filteredTrucks.length > 0 ? (
                <Select
                      className="w-full"
                      placeholder="Search and select a unit..."
                      value=""
                      onChange={addTruck}
                  showSearch
                      loading={loadingTrucks}
                  filterOption={(input, option) => {
                        const label = option?.label ?? '';
                        const searchText = input.toLowerCase();
                        return label.toLowerCase().includes(searchText) ||
                               (option?.vin && option.vin.toLowerCase().includes(searchText)) ||
                               (option?.unitNumber && option.unitNumber.toLowerCase().includes(searchText));
                  }}
                  options={filteredTrucks.map(truck => {
                    const truckId = truck.id || truck._id;
                    const unitNumber = truck.unit_number || 'N/A';
                    const vin = truck.VIN || truck.vin || 'N/A';
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
                        return {
                          value: String(truckId),
                          label: `Unit ${unitNumber} (VIN: ${vin})${driverId ? ' - Driver Assigned' : ' - No Driver'}`,
                          unitNumber: unitNumber,
                          vin: vin,
                        };
                      })}
                      notFoundContent={
                        <div className={`text-center py-4 ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                          No units found
                        </div>
                      }
                    />
                  ) : (
                    <div className={`text-sm p-4 rounded-xl italic ${
                      currentTheme === 'dark' ? 'bg-white/5 text-white/50' : 'bg-gray-50 text-gray-500'
                    }`}>
                      {allTrucks.length === 0 ? 'No trucks available.' : 'All available trucks have been added.'}
                    </div>
                  )
                ) : (
                  <div className={`text-sm p-4 rounded-xl italic ${
                    currentTheme === 'dark' ? 'bg-white/5 text-white/50' : 'bg-gray-50 text-gray-500'
                  }`}>
                    Select an owner to see fleet availability.
                  </div>
                )}
          </section>
        </div>

        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${
          currentTheme === 'dark' ? 'border-white/10 bg-white/5' : 'border-black/10 bg-gray-50'
        }`}>
          <Button onClick={handleClose} className="hover:border-[#F59A6B] hover:text-[#F59A6B]">
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={!selectedOwner || trucksData.length === 0 || trucksData.some(t => t.status === 'loading' || loadingDrivers[t.truckId])}
            className="bg-[#E77843] hover:bg-[#F59A6B] border-[#E77843] hover:border-[#F59A6B]"
            icon={<SaveOutlined />}
          >
            Create Calculation
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default CreateOwnerDrawer;
