import { CloseOutlined, DeleteOutlined, LoadingOutlined, PlusOutlined, SaveOutlined, TruckOutlined } from '@ant-design/icons';
import { App, Button, DatePicker, Drawer, Input, InputNumber, Select } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useOwner } from '../../hooks/useOwner';
import { useTheme } from '../../menu';
import { owners } from './helpers/owners';

const { TextArea } = Input;

export const OwerForm = ({ open, onClose, onSuccess }) => {
  const { message } = App.useApp();
  const currentTheme = useTheme();
  const {
    Options,
    addTruck,
    removeTruck,
    updateTruckData,
    setStart_date,
    setEnd_date,
    startDateForPicker,
    endDateForPicker,
    trucksData,
    loadingDrivers,
    selectedOwner,
    setSelectedOwner,
    isSubmitting,
    handleSubmit,
    resetForm,
  } = useOwner();

  const handleFormSubmit = async () => {
    await handleSubmit(
      (successMsg) => {
        message.success(successMsg);
        if (onSuccess) onSuccess();
        onClose();
      },
      (errorMsg) => {
        message.error(errorMsg);
      }
    );
  };

  const handleClose = () => {
    onClose();
  };

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
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentTheme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-orange-100 text-orange-600'
                }`}>
                1
              </span>
              <span className={currentTheme === 'dark' ? 'text-white/70' : 'text-orange-600'}>Configuration</span>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border ${currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-sm'
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
                  }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={owners}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
                  Period Start
                </label>
                <DatePicker
                  className="w-full"
                  format="YYYY-MM-DD"
                  value={startDateForPicker}
                  onChange={(date) => setStart_date(date ? dayjs(date).format('YYYY-MM-DD') : null)}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
                  Period End
                </label>
                <DatePicker
                  className="w-full"
                  format="YYYY-MM-DD"
                  onChange={(date) => setEnd_date(date ? dayjs(date).format('YYYY-MM-DD') : null)}
                  value={endDateForPicker}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentTheme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-orange-100 text-orange-600'
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
                <div className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center text-center ${currentTheme === 'dark' ? 'border-white/10 bg-white/5' : 'border-black/10 bg-gray-50'
                  }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${currentTheme === 'dark' ? 'bg-white/10 text-white/30' : 'bg-white text-gray-300 shadow-sm'
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
                    className={`border rounded-lg p-4 transition-all ${currentTheme === 'dark'
                      ? 'border-white/10 bg-white/5'
                      : 'border-black/10 bg-white shadow-sm'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentTheme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'
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
                        {data.status === 'fetched' && (
                          <span className={`text-xs px-2 py-1 rounded-full ${currentTheme === 'dark' ? 'bg-green-500/10 text-green-500' : 'bg-green-100 text-green-600'}`}>
                            Fetched
                          </span>
                        )}
                        <button
                          onClick={() => removeTruck(data.truckId)}
                          className={`transition-colors ${currentTheme === 'dark' ? 'text-white/30 hover:text-red-500' : 'text-gray-300 hover:text-red-500'
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
                            value={data.totalAmount}
                            onChange={(value) => updateTruckData(data.truckId, 'totalAmount', value ? String(value) : '')}
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
                        {data.pdf && (
                          <div>
                            <label className={`text-xs font-medium mb-1 block ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                              PDF Statement
                            </label>
                            <a
                              href={data.pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-xs px-3 py-2 rounded border inline-block ${currentTheme === 'dark' ? 'border-white/20 text-white/70 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                              View PDF
                            </a>
                          </div>
                        )}
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
            </div>
          </section>

          <section className={`space-y-4 pt-6 border-t ${currentTheme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'
              }`}>
              <PlusOutlined style={{ fontSize: '16px', color: '#E77843' }} /> Add Available Fleet Unit
            </h3>

            <Select
              className="w-full"
              placeholder="Search and select a unit..."
              showSearch
              options={Options}
              onChange={addTruck}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </section>
        </div>

        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${currentTheme === 'dark' ? 'border-white/10 bg-white/5' : 'border-black/10 bg-gray-50'
          }`}>
          <Button onClick={handleClose} className="hover:border-[#F59A6B] hover:text-[#F59A6B]">
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleFormSubmit}
            loading={isSubmitting}
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
