import React, { useEffect, useState } from 'react';
import { Drawer, Input, DatePicker, Button, Select, InputNumber, Spin } from 'antd';
import { TruckOutlined, CloseOutlined, SaveOutlined, DeleteOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTheme } from '../../menu';
import { owners } from './helpers/owners';

// const { TextArea } = Input;

export const OwerForm = ({ open, onClose }) => {
    const currentTheme = useTheme();
    const [allTrucks, setAllTrucks] = useState([]);

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
    useEffect(() => {
        if (open) {
            fetchAllTrucks();
        }
    }, []);
    console.log(allTrucks, "allTrucks");
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
            onClose={onClose}
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
                                    value={null}
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
                                    value={null}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-semibold mb-1.5 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
                                    Period End
                                </label>
                                <DatePicker
                                    className="w-full"
                                    format="YYYY-MM-DD"
                                    value={null}
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
                                0 Unit(s) selected
                            </div>
                        </div>

                        <div className="space-y-4">
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
                            value=""
                            showSearch
                        />
                    </section>
                </div>

                <div className={`px-6 py-4 border-t flex justify-end gap-3 ${currentTheme === 'dark' ? 'border-white/10 bg-white/5' : 'border-black/10 bg-gray-50'
                    }`}>
                    <Button onClick={onClose} className="hover:border-[#F59A6B] hover:text-[#F59A6B]">
                        Cancel
                    </Button>
                    <Button
                        type="primary"
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
