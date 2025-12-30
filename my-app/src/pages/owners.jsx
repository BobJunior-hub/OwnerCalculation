import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, DatePicker, Empty, Pagination, Select, Spin } from 'antd';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { OwerForm } from '../components/OwerComponent/OwerForm';
import { Owner } from '../components/OwerComponent/Owner';
import DeductionDrawer from '../DeductionDrawer';
import { useTheme } from '../menu';
import ViewOwnerCalculationDrawer from '../ViewOwnerCalculationDrawer';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;

const Owners = () => {
  const { message } = App.useApp();
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs(), dayjs().add(6, 'day')]);
      const [ownerData, setOwnerData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [ownerCalculationData, setOwnerCalculationData] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [deductionDrawerOpen, setDeductionDrawerOpen] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const currentTheme = useTheme();

  console.log('ownerData', ownerData);

  useEffect(() => {
        const defaultOwners = ['Yulduz', 'Sohib', 'Bobur'];
        setOwners(defaultOwners);
    if (!selectedOwner && defaultOwners.length > 0) {
      setSelectedOwner(defaultOwners[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedOwner) {
      setCurrentPage(1); // Reset to first page when owner or date range changes
      fetchOwnerData();
    } else {
      setOwnerData(null);
    }
  }, [selectedOwner, dateRange]);


  const fetchOwnerData = async () => {
    if (!selectedOwner) return;

    setLoadingData(true);
    try {
      const ownerName = typeof selectedOwner === 'string' ? selectedOwner : (selectedOwner.name || selectedOwner.owner || selectedOwner);
      const ownerCalcParams = new URLSearchParams({
        search: ownerName,
      });

      if (dateRange && dateRange[0] && dateRange[1]) {
        const [startDate, endDate] = dateRange;
        ownerCalcParams.append('start_date', startDate.format('YYYY-MM-DD'));
        ownerCalcParams.append('end_date', endDate.format('YYYY-MM-DD'));
      }

      console.log('Fetching data for owner:', ownerName, 'with params:', ownerCalcParams.toString());

      const ownerCalcResult = await apiRequest(`/calculations/owner-calculation/?${ownerCalcParams.toString()}`).catch(err => {
        console.error('Error fetching owner calculation:', err);
        return null;
      });

      console.log('Owner calculation API response:', ownerCalcResult);
      console.log('Owner calculation API response type:', typeof ownerCalcResult);
      console.log('Owner calculation API response isArray:', Array.isArray(ownerCalcResult));

      let dataToProcess = null;

      if (ownerCalcResult) {
        if (ownerCalcResult.results && Array.isArray(ownerCalcResult.results)) {
          console.log('Using ownerCalcResult.results, length:', ownerCalcResult.results.length);
          dataToProcess = ownerCalcResult.results;
        } else if (Array.isArray(ownerCalcResult)) {
          console.log('Using ownerCalcResult directly as array, length:', ownerCalcResult.length);
          dataToProcess = ownerCalcResult;
        } else {
          console.log('ownerCalcResult structure:', Object.keys(ownerCalcResult || {}));
        }
      } else {
        console.log('ownerCalcResult is null or undefined');
      }

      console.log('Data to process before filtering:', dataToProcess);
      console.log('Data to process type:', typeof dataToProcess);
      console.log('Data to process isArray:', Array.isArray(dataToProcess));

      if (dataToProcess && Array.isArray(dataToProcess)) {
        const filteredData = dataToProcess.filter(item => {
          if (!item) return false;

          const itemOwner = item.owner ? String(item.owner).trim() : '';
          const selectedOwnerStr = String(ownerName).trim();

          const ownerMatches = itemOwner.toLowerCase() === selectedOwnerStr.toLowerCase() ||
                         itemOwner === selectedOwnerStr;

          if (!ownerMatches) {
            console.log('Owner mismatch:', { itemOwner, selectedOwnerStr });
            return false;
          }

          return ownerMatches;
        });

        console.log('Filtered data:', filteredData);
        dataToProcess = filteredData;
      }

      console.log('Final data to set:', dataToProcess);
      setOwnerData({ ownerCalculation: dataToProcess });
      setOwnerCalculationData(dataToProcess);
    } catch (err) {
      console.error('Error fetching owner data:', err);
      setOwnerData(null);
    } finally {
      setLoadingData(false);
    }
  };



  const handleClearFilter = () => {
    setDateRange(null);
    setSelectedOwner(null);
    setOwnerData(null);
  };


  const extractTruckNumber = (item) => {
    if (!item) return 'N/A';

    if (item.truck && typeof item.truck === 'object' && item.truck.unit_number) {
      return String(item.truck.unit_number);
      }

    if (item.unit_number) {
      return String(item.unit_number);
    }

    return 'N/A';
  };


  const extractDriverInfo = (item) => {
    if (!item) {
      return {
        id: 'N/A',
        name: 'N/A',
        phone: null,
        email: null,
        company: null,
        carrier: null,
      };
    }

    let driverName = 'N/A';
    if (item.statement && item.statement.driver) {
      driverName = String(item.statement.driver);
    } else if (item.driver) {
      driverName = typeof item.driver === 'string' ? item.driver : 'N/A';
    }

    const driverId = item.driver_id || 'N/A';

    return {
      id: driverId,
      name: driverName,
      phone: null,
      email: null,
      company: null,
      carrier: null,
    };
  };

  const extractCalculationInfo = (item) => {
    if (!item) return null;

    const id = item.id || 'N/A';
    const startDate = item.start_date || 'N/A';
    const endDate = item.end_date || 'N/A';

    let unitNumber = 'N/A';
    if (item.truck && item.truck.unit_number) {
      unitNumber = String(item.truck.unit_number);
    } else if (item.unit_number) {
      unitNumber = String(item.unit_number);
    }

    let driverName = 'N/A';
    if (item.statement && item.statement.driver) {
      driverName = String(item.statement.driver);
    } else if (item.driver) {
      driverName = typeof item.driver === 'string' ? item.driver : 'N/A';
      }

    let companyName = 'N/A';
    if (item.statement && item.statement.company) {
      companyName = String(item.statement.company);
    } else if (item.truck && item.truck.carrier_company) {
      companyName = String(item.truck.carrier_company);
    }

    const amount = item.amount || 0;
    const escrow = item.escrow || 0;

    const driverInfo = {
      id: item.driver_id || 'N/A',
      name: driverName,
      phone: null,
      email: null,
      company: companyName !== 'N/A' ? companyName : null,
      carrier: null,
    };

    return {
      id,
      unitNumber,
      startDate,
      endDate,
      companyName,
      driverName,
      driverInfo,
      amount: typeof amount === 'string' ? parseFloat(amount) || 0 : amount,
      escrow: typeof escrow === 'string' ? parseFloat(escrow) || 0 : escrow,
      rawData: item,
    };
  };

  const getTrucksAndDriversFromOwnerCalculation = (data) => {
    if (!data) return [];

    const results = [];

    let dataArray = [];

    if (Array.isArray(data)) {
      dataArray = data;
    } else if (data && typeof data === 'object' && data.calculation_units && Array.isArray(data.calculation_units)) {
      dataArray = [data];
    } else if (data && typeof data === 'object' && data.results && Array.isArray(data.results)) {
      dataArray = data.results;
    }

    dataArray.forEach((calculationItem) => {
      if (!calculationItem || !calculationItem.calculation_units || !Array.isArray(calculationItem.calculation_units)) {
        return;
      }

      calculationItem.calculation_units.forEach((calculationUnit, index) => {
        if (!calculationUnit) return;

        let truckNumber = 'N/A';
        if (calculationUnit.truck && calculationUnit.truck.unit_number) {
          truckNumber = String(calculationUnit.truck.unit_number);
          }

        let driverName = 'N/A';
        if (calculationUnit.statement && calculationUnit.statement.driver) {
          driverName = String(calculationUnit.statement.driver);
        } else if (calculationUnit.driver) {
          driverName = String(calculationUnit.driver);
        }

        const amount = calculationUnit.amount || 0;
        const escrow = calculationUnit.escrow || 0;

        const startDate = calculationItem.start_date || dateRange?.[0]?.format('YYYY-MM-DD') || 'N/A';
        const endDate = calculationItem.end_date || dateRange?.[1]?.format('YYYY-MM-DD') || 'N/A';

        let companyName = 'N/A';
        if (calculationUnit.statement && calculationUnit.statement.company) {
          companyName = String(calculationUnit.statement.company);
        } else if (calculationUnit.truck && calculationUnit.truck.carrier_company) {
          companyName = String(calculationUnit.truck.carrier_company);
          }

        const driverInfo = {
          id: calculationUnit.driver_id || 'N/A',
          name: driverName,
          phone: null,
          email: null,
          company: companyName !== 'N/A' ? companyName : null,
          carrier: null,
        };

        results.push({
          id: calculationUnit.id || calculationItem.id || `calc-${index}`,
          unitNumber: truckNumber,
          startDate: startDate,
          endDate: endDate,
          companyName: companyName,
          driverName: driverName,
          driverInfo: driverInfo,
          amount: typeof amount === 'string' ? parseFloat(amount) || 0 : amount,
          escrow: typeof escrow === 'string' ? parseFloat(escrow) || 0 : escrow,
          rawData: calculationUnit,
        });
      });
    });

    if (results.length > 0) {
      return results;
    }

    return results;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '$0.00';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const getOwnerName = (owner) => {
    if (typeof owner === 'string') return owner;
    if (owner && owner.name) return owner.name;
    if (owner && owner.owner) return owner.owner;
    return 'Unknown Owner';
  };





  return (
    <div className="h-full w-full flex flex-col box-border bg-transparent p-6">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className={`mt-0 flex-shrink-0 font-semibold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>Owners</h2>
        </div>

        <div className={`flex flex-col gap-4 mb-6 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
        <div className="flex items-center justify-between flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
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
                  label: typeof owner === 'string' ? owner : getOwnerName(owner),
                };
              })}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Date Range:</span>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0]) {
                  const startDate = dates[0];
                  if (dates[1]) {
                    setDateRange([startDate, dates[1]]);
                  } else {
                    const endDate = startDate.clone().add(6, 'day');
                    setDateRange([startDate, endDate]);
                  }
                } else {
                  setDateRange(null);
                }
              }}
              onCalendarChange={(dates) => {
                if (dates && dates[0]) {
                  const startDate = dates[0];
                  if (dates[1]) {
                    setDateRange([startDate, dates[1]]);
                  } else {
                    const endDate = startDate.clone().add(6, 'day');
                    setDateRange([startDate, endDate]);
                  }
                } else {
                  setDateRange(null);
                }
              }}
              format="YYYY-MM-DD"
              style={{ width: '250px' }}
            />
          </div>


        </div>

        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
            className={currentTheme === 'dark' ? 'bg-[#E77843] hover:bg-[#F59A6B]' : 'bg-[#E77843] hover:bg-[#F59A6B]'}
          >
            Create
          </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      {loadingData ? (
        <div className="flex justify-center items-center h-full">
          <Spin size="large" />
        </div>
      ) : !selectedOwner ? (
        <Empty description={<span className={currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}>Please select an owner to view calculations</span>} />
      ) : ownerData ? (
        <div className="flex flex-col gap-6 flex-1 overflow-y-auto min-h-0">
                    {(() => {
                      const dataToUse = ownerCalculationData || ownerData?.ownerCalculation;
            console.log('Display - ownerCalculationData:', ownerCalculationData);
            console.log('Display - ownerData?.ownerCalculation:', ownerData?.ownerCalculation);
            console.log('Display - dataToUse:', dataToUse);

            let calculationsList = [];

            if (dataToUse && Array.isArray(dataToUse)) {
              calculationsList = dataToUse;
            }

            console.log('Display - calculationsList:', calculationsList);
            console.log('Display - calculationsList.length:', calculationsList.length);

            const validCalculations = calculationsList.filter(calc => {
              const hasCalculationUnits = calc.calculation_units && Array.isArray(calc.calculation_units) && calc.calculation_units.length > 0;
              const hasTotalAmount = calc.total_amount && parseFloat(calc.total_amount) > 0;
              const hasTotalEscrow = calc.total_escrow && parseFloat(calc.total_escrow) !== 0;

              return hasCalculationUnits || hasTotalAmount || hasTotalEscrow;
            });

            console.log('Display - validCalculations:', validCalculations);
            console.log('Display - validCalculations.length:', validCalculations.length);

            const ownerName = validCalculations[0]?.owner || selectedOwner || 'N/A';

            let globalOwnerId = 'N/A';
            for (const calc of validCalculations) {
              if (calc.id) {
                globalOwnerId = String(calc.id);
                break;
              }
            }

            if (globalOwnerId === 'N/A' && selectedOwner) {
              const ownerFromList = owners.find(o => {
                const ownerValue = typeof o === 'string' ? o : (o.name || o.owner);
                return String(ownerValue) === String(selectedOwner);
              });
              if (ownerFromList && typeof ownerFromList === 'object' && ownerFromList.id) {
                globalOwnerId = String(ownerFromList.id);
              }
            }

            const uniqueCalculations = [];
            const seenCalculationIds = new Set();
            validCalculations.forEach(calc => {
              if (calc.id && !seenCalculationIds.has(calc.id)) {
                seenCalculationIds.add(calc.id);
                uniqueCalculations.push(calc);
              } else if (!calc.id) {
                uniqueCalculations.push(calc);
              }
            });

            const groupedByPeriod = {};
            uniqueCalculations.forEach(calc => {
              const periodKeyString = `${calc.start_date || 'N/A'}_${calc.end_date || 'N/A'}`;
              if (!groupedByPeriod[periodKeyString]) {
                groupedByPeriod[periodKeyString] = [];
              }
              const exists = groupedByPeriod[periodKeyString].some(existingCalc => existingCalc.id === calc.id);
              if (!exists) {
                groupedByPeriod[periodKeyString].push(calc);
              }
            });

            const periods = Object.keys(groupedByPeriod)
              .filter(periodKeyString => {
                const periodCalcs = groupedByPeriod[periodKeyString];
                if (!periodCalcs || periodCalcs.length === 0) {
                  return false;
                }

                const hasData = periodCalcs.some(calc => {
                  const hasCalculationUnits = calc.calculation_units && Array.isArray(calc.calculation_units) && calc.calculation_units.length > 0;
                  const hasTotalAmount = calc.total_amount && parseFloat(calc.total_amount) > 0;
                  const hasTotalEscrow = calc.total_escrow && parseFloat(calc.total_escrow) !== 0;

                  return hasCalculationUnits || hasTotalAmount || hasTotalEscrow;
                });

                return hasData;
              })
              .map(periodKeyString => {
                const periodCalcs = groupedByPeriod[periodKeyString];
                const firstCalc = periodCalcs[0];
                return {
                  id: firstCalc.id,
                  start_date: firstCalc.start_date,
                  end_date: firstCalc.end_date,
                  key: periodKeyString
                };
              })
              .sort((a, b) => {
                if (a.start_date && b.start_date) {
                  return b.start_date.localeCompare(a.start_date);
                }
                return 0;
              });

            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedPeriods = periods.slice(startIndex, endIndex);

                              return (
              <div className="space-y-4">
                {paginatedPeriods.map((periodKey, periodIndex) => {
                  const periodCalcs = groupedByPeriod[periodKey.key];
                  if (!periodCalcs || periodCalcs.length === 0) {
                    return null;
                  }

                  const firstCalc = periodCalcs[0];
                  const periodStartDate = firstCalc?.start_date || 'N/A';
                  const periodEndDate = firstCalc?.end_date || 'N/A';

                  let totalPeriodGross = 0;
                  let totalPeriodEscrow = 0;
                  let totalPrevAmount = 0;
                  let createdByNames = new Set();

                  periodCalcs.forEach(calc => {
                    totalPeriodGross += parseFloat(calc.total_amount || 0);
                    totalPeriodEscrow += parseFloat(calc.total_escrow || 0);
                    totalPrevAmount += parseFloat(calc.prev_amount || 0);

                    if (calc.created_by) {
                      let createdByName = 'N/A';
                      if (typeof calc.created_by === 'string') {
                        createdByName = calc.created_by;
                      } else if (calc.created_by.first_name || calc.created_by.last_name) {
                        createdByName = `${calc.created_by.first_name || ''} ${calc.created_by.last_name || ''}`.trim() || calc.created_by.username || 'N/A';
                      } else {
                        createdByName = calc.created_by.username || 'N/A';
                      }
                      if (createdByName !== 'N/A') {
                        createdByNames.add(createdByName);
                      }
                    }
                  });

                  const createdByDisplay = Array.from(createdByNames).join(', ') || 'N/A';

                  const getCreatedByName = (calc) => {
                    if (calc.created_by) {
                      if (typeof calc.created_by === 'string') {
                        return calc.created_by;
                      }
                      if (calc.created_by.first_name || calc.created_by.last_name) {
                        return `${calc.created_by.first_name || ''} ${calc.created_by.last_name || ''}`.trim() || calc.created_by.username || 'N/A';
                      }
                      return calc.created_by.username || 'N/A';
                    }
                    return 'N/A';
                  };

                  const findPreviousWeek = (currentStartDate, currentEndDate) => {
                    if (!currentStartDate || !currentEndDate) return null;

                    const currentStart = dayjs(currentStartDate);
                    const prevEnd = currentStart.subtract(1, 'day');
                    const prevStart = prevEnd.subtract(6, 'day');

                    const prevStartStr = prevStart.format('YYYY-MM-DD');
                    const prevEndStr = prevEnd.format('YYYY-MM-DD');

                    return validCalculations.find(calc => {
                      const calcStart = calc.start_date ? dayjs(calc.start_date).format('YYYY-MM-DD') : null;
                      const calcEnd = calc.end_date ? dayjs(calc.end_date).format('YYYY-MM-DD') : null;
                      return calcStart === prevStartStr && calcEnd === prevEndStr && calc.owner === (firstCalc.owner || ownerName);
                    });
                  };


                        const uniqueCalcs = [];
                        const seenCalcIds = new Set();
                        periodCalcs.forEach(calc => {
                          if (calc.id && !seenCalcIds.has(calc.id)) {
                            seenCalcIds.add(calc.id);
                            uniqueCalcs.push(calc);
                          }
                        });

                        if (uniqueCalcs.length === 0) {
                          return null;
                        }

                        return (
                          <div key={periodKey.id || periodKey.key} className="space-y-3">
                            {uniqueCalcs.map((calc, calcIndex) => {
                              const calcCreatedBy = getCreatedByName(calc);

                              return (
                                <Card
                                  key={calc.id || calcIndex}
                                  title={<span className={currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}>Owner Calculation - {periodStartDate} to {periodEndDate}</span>}
                                  className={`${currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}
                                >
                                  <div className={`p-4 rounded ${currentTheme === 'dark' ? 'bg-white/5' : 'bg-white'} border ${currentTheme === 'dark' ? 'border-white/10' : 'border-black/10'} flex items-center justify-between mb-4`}>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div>
                                        <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Owner Name</div>
                                        <div className={`font-semibold text-lg ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>{calc.owner || ownerName}</div>
                                        <div className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                                          {calc.start_date} to {calc.end_date}
                                    </div>
                                    </div>
                                    <div>
                                        <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Total Amount</div>
                                        <div className={`font-semibold text-xl ${currentTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                          {formatCurrency(calc.total_amount || 0)}
                                    </div>
                                    </div>
                                      <div>
                                        <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Total Escrow</div>
                                        <div className={`font-semibold text-xl ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                          {formatCurrency(calc.total_escrow || 0)}
                                      </div>
                                      </div>
                                      <div>
                                        <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Previous Amount</div>
                                        <div className={`font-semibold text-xl ${currentTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                                          {formatCurrency(calc.prev_amount || 0)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Created By</div>
                                        <div className={`font-semibold text-lg ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                                          {calcCreatedBy}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                      <Button
                                        type="primary"
                                        icon={<EyeOutlined />}
                                        onClick={() => {
                                          setSelectedCalculation({
                                            ...calc,
                                            calculations: [calc],
                                            owner: calc.owner || ownerName,
                                            start_date: calc.start_date,
                                            end_date: calc.end_date,
                                            total_amount: calc.total_amount,
                                            total_escrow: calc.total_escrow
                                          });
                                          setViewDrawerOpen(true);
                                        }}
                                        className={currentTheme === 'dark' ? 'bg-[#E77843] hover:bg-[#F59A6B]' : 'bg-[#E77843] hover:bg-[#F59A6B]'}
                                      >
                                        View
                                      </Button>
                                      <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={() => {
                                          if (!selectedOwner) {
                                            message.warning('Please select an owner first.');
                                            return;
                                          }

                                          let ownerId = null;
                                          if (calc.calculation_units && Array.isArray(calc.calculation_units) && calc.calculation_units.length > 0) {
                                            const firstUnit = calc.calculation_units[0];
                                            if (firstUnit.owner && typeof firstUnit.owner === 'number') {
                                              ownerId = firstUnit.owner;
                                            }
                                          }

                                          setSelectedCalculation({
                                            ...calc,
                                            calculations: [calc],
                                            owner: calc.owner || ownerName,
                                            owner_id: ownerId || calc.id,
                                            start_date: calc.start_date,
                                            end_date: calc.end_date,
                                            total_amount: calc.total_amount,
                                            total_escrow: calc.total_escrow
                                          });
                                          setDeductionDrawerOpen(true);
                                        }}
                                        className={currentTheme === 'dark' ? 'bg-[#E77843] hover:bg-[#F59A6B]' : 'bg-[#E77843] hover:bg-[#F59A6B]'}
                                      >
                                        Edit
                                      </Button>
                                  </div>
                                </div>
                                </Card>
                              );
                            })}
                          </div>
                        );
                })}

                {periods.length > 0 && (
                  <div className="flex justify-center mt-6 pb-4">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={periods.length}
                      onChange={(page, size) => {
                        setCurrentPage(page);
                        if (size !== pageSize) {
                          setPageSize(size);
                          setCurrentPage(1);
                        }
                      }}
                      onShowSizeChange={(current, size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      showSizeChanger
                      showTotal={(total, range) => (
                        <span className={currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}>
                          Showing {range[0]}-{range[1]} of {total} {total === 1 ? 'period' : 'periods'}
                        </span>
                      )}
                      pageSizeOptions={['5', '10', '20', '50', '100']}
                      className={currentTheme === 'dark' ? 'text-white' : ''}
                    />
                              </div>
                            )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
        <Empty description={<span className={currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}>No data available for the selected owner and date range</span>} />
                )}

      <ViewOwnerCalculationDrawer
        open={viewDrawerOpen}
        onClose={() => {
          setViewDrawerOpen(false);
          setSelectedCalculation(null);
        }}
        calculation={selectedCalculation}
        currentTheme={currentTheme}
        selectedOwner={selectedOwner}
        onRefresh={() => {
          if (selectedOwner) {
            fetchOwnerData();
          }
        }}
        onEditUnit={() => {
          message.info('Edit functionality for Truck Numbers & Driver Information coming soon');
        }}
        onEditDeduction={() => {
          if (!selectedOwner) {
            message.warning('Please select an owner first.');
            return;
          }
          const ownerName = selectedCalculation?.owner || selectedOwner;
          const ownerId = selectedCalculation?.owner_id || selectedCalculation?.id;
          setSelectedCalculation({
            ...selectedCalculation,
            owner: ownerName,
            owner_id: ownerId,
            start_date: selectedCalculation?.start_date,
            end_date: selectedCalculation?.end_date,
            total_amount: selectedCalculation?.total_amount,
            total_escrow: selectedCalculation?.total_escrow
          });
          setDeductionDrawerOpen(true);
        }}
      />


      <Owner   selectedOwner={selectedOwner} setViewDrawerOpen={setViewDrawerOpen} setDeductionDrawerOpen={setDeductionDrawerOpen} setSelectedCalculation={setSelectedCalculation} currentTheme={currentTheme} search={selectedOwner} start_date={dateRange[0].format('YYYY-MM-DD')} end_date={dateRange[1].format('YYYY-MM-DD')} onRefresh={fetchOwnerData} />

      <OwerForm
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <DeductionDrawer
        open={deductionDrawerOpen}
        onClose={() => {
          setDeductionDrawerOpen(false);
          setSelectedCalculation(null);
        }}
        onSuccess={(newDeduction) => {
          if (selectedCalculation && newDeduction) {
            const updatedCalculation = {
              ...selectedCalculation,
              calculation_units: [
                ...(selectedCalculation.calculation_units || []),
                newDeduction
              ]
            };
            setSelectedCalculation(updatedCalculation);
          }
          if (selectedOwner) {
            setTimeout(() => {
              fetchOwnerData();
            }, 300);
          }
        }}
        calculation={selectedCalculation}
      />
      </div>
    </div>
  );
};
export default Owners;

