import { DeleteOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { App, Button, Drawer } from 'antd';
import React, { useEffect, useState } from 'react';
import { apiRequest } from './api';

const ViewOwnerCalculationDrawer = ({ open, onClose, calculation, currentTheme, onRefresh }) => {
  const { message, modal } = App.useApp();
  const [deductions, setDeductions] = useState([]);
  const [loadingDeductions, setLoadingDeductions] = useState(false);
  const [trucksMap, setTrucksMap] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [deletedUnitIds, setDeletedUnitIds] = useState(new Set());
  const [newlyAddedUnits, setNewlyAddedUnits] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const trucksResult = await apiRequest('/calculations/all-trucks');
        const trucksArray = Array.isArray(trucksResult) ? trucksResult : (trucksResult?.results || []);
        const map = {};
        trucksArray.forEach(truck => {
          if (truck.id) {
            map[truck.id] = truck;
          }
        });
        setTrucksMap(map);
        console.log('Trucks map created:', Object.keys(map).length, 'trucks');
      } catch (error) {
        console.error('Error fetching trucks:', error);
      }
    };

    if (open) {
      fetchTrucks();
    }
  }, [open]);

  const fetchDeductions = async () => {
    if (!open || !calculation) {
      setDeductions([]);
      return;
    }

      const calcStartDate = calculation.start_date;
      const calcEndDate = calculation.end_date;

      if (!calcStartDate || !calcEndDate) {
        console.warn('Calculation missing dates:', { start_date: calcStartDate, end_date: calcEndDate });
        setDeductions([]);
        return;
      }

      setLoadingDeductions(true);
      try {
        const normalizeDate = (date) => {
          if (!date) return '';
          const dateStr = String(date).trim();
          if (dateStr.includes('T')) {
            return dateStr.split('T')[0];
          }
          if (dateStr.includes(' ')) {
            return dateStr.split(' ')[0];
          }
          return dateStr;
        };

        const expectedStartDate = normalizeDate(calculation.start_date);
        const expectedEndDate = normalizeDate(calculation.end_date);

        const ownerName = calculation.owner || (calculation.calculations && calculation.calculations.length > 0 ? calculation.calculations[0].owner : null);

        if (!ownerName) {
          console.warn('Could not find owner name in calculation object. Available fields:', Object.keys(calculation));
          setDeductions([]);
          setLoadingDeductions(false);
          return;
        }

        console.log('=== Fetching Owner Calculations to Match Deductions ===');
        console.log('Raw calculation dates:', {
          start_date: calculation.start_date,
          end_date: calculation.end_date
        });
        console.log('Normalized expected dates:', {
          start_date: expectedStartDate,
          end_date: expectedEndDate
        });
        console.log('Week being viewed:', expectedStartDate, 'to', expectedEndDate);
        console.log('Owner Name:', ownerName);

        const ownerCalcResult = await apiRequest(`/calculations/owner-calculation/?search=${encodeURIComponent(ownerName)}`);

        let allOwnerCalculations = [];
        if (ownerCalcResult && Array.isArray(ownerCalcResult)) {
          allOwnerCalculations = ownerCalcResult;
        } else if (ownerCalcResult && ownerCalcResult.results && Array.isArray(ownerCalcResult.results)) {
          allOwnerCalculations = ownerCalcResult.results;
        }

        console.log('Total owner calculations fetched:', allOwnerCalculations.length);

        if (allOwnerCalculations.length === 0) {
          console.warn('No owner calculations found');
          setDeductions([]);
          setLoadingDeductions(false);
          return;
        }

        let ownerId = null;
        for (const calc of allOwnerCalculations) {
          if (calc.calculation_units && Array.isArray(calc.calculation_units) && calc.calculation_units.length > 0) {
            const firstUnit = calc.calculation_units[0];
            if (firstUnit.owner && typeof firstUnit.owner === 'number') {
              ownerId = firstUnit.owner;
              break;
            }
          }
        }

        if (!ownerId) {
          console.warn('Could not find owner ID from owner-calculation response. Using owner name as fallback.');
          ownerId = ownerName;
        }

        console.log('Using owner ID for calculation-unit query:', ownerId);

        const calculationUnitsResult = await apiRequest(`/calculations/calculation-unit/?owner=${ownerId}`);

        let allCalculationUnits = [];
        if (calculationUnitsResult && Array.isArray(calculationUnitsResult)) {
          allCalculationUnits = calculationUnitsResult;
        } else if (calculationUnitsResult && calculationUnitsResult.results && Array.isArray(calculationUnitsResult.results)) {
          allCalculationUnits = calculationUnitsResult.results;
        }

        console.log('Total calculation units fetched:', allCalculationUnits.length);

        const allDeductionsFromAPI = allCalculationUnits.filter(u => u && (u.statement === null || u.statement === undefined));
        console.log('Total deductions from API (statement === null):', allDeductionsFromAPI.length);

        const deductionIdToWeekMap = {};

        allOwnerCalculations.forEach(calc => {
          const calcStartDate = normalizeDate(calc.start_date);
          const calcEndDate = normalizeDate(calc.end_date);

          if (calc.calculation_units && Array.isArray(calc.calculation_units)) {
            calc.calculation_units.forEach(unit => {
              if (unit && unit.id && (unit.statement === null || unit.statement === undefined)) {
                if (!deductionIdToWeekMap[unit.id]) {
                  deductionIdToWeekMap[unit.id] = {
                    start_date: calcStartDate,
                    end_date: calcEndDate,
                    calculation: calc
                  };
                }
              }
            });
          }
        });

        allCalculationUnits.forEach(unit => {
          if (unit && unit.id && (unit.statement === null || unit.statement === undefined)) {
            if (unit.start_date && unit.end_date) {
              const unitStartDate = normalizeDate(unit.start_date);
              const unitEndDate = normalizeDate(unit.end_date);
              if (!deductionIdToWeekMap[unit.id]) {
                deductionIdToWeekMap[unit.id] = {
                  start_date: unitStartDate,
                  end_date: unitEndDate,
                  calculation: null
                };
              }
            }
          }
        });

        console.log('Deduction mapping after adding API units:', Object.keys(deductionIdToWeekMap).length);
        console.log('Mapping details:', Object.entries(deductionIdToWeekMap).map(([id, info]) => ({
          id: id,
          start_date: info.start_date,
          end_date: info.end_date
        })));

        console.log('Deduction to week mapping created:', Object.keys(deductionIdToWeekMap).length, 'deductions mapped');

        allDeductionsFromAPI.forEach(ded => {
          const hasOwnDates = !!(ded.start_date && ded.end_date);
          const hasWeekInfo = !!deductionIdToWeekMap[ded.id];
          console.log('Deduction from API:', {
            id: ded.id,
            owner: ded.owner,
            hasOwnDates: hasOwnDates,
            ownStartDate: hasOwnDates ? normalizeDate(ded.start_date) : null,
            ownEndDate: hasOwnDates ? normalizeDate(ded.end_date) : null,
            hasWeekInfo: hasWeekInfo,
            weekInfoDates: hasWeekInfo ? `${deductionIdToWeekMap[ded.id].start_date} to ${deductionIdToWeekMap[ded.id].end_date}` : null,
            expectedDates: `${expectedStartDate} to ${expectedEndDate}`
          });
        });
        console.log('Sample mapping:', Object.entries(deductionIdToWeekMap).slice(0, 5).map(([id, info]) => ({
          deductionId: id,
          week: `${info.start_date} to ${info.end_date}`
        })));

        console.log('=== Filtering Deductions ===');
        console.log('Expected week:', expectedStartDate, 'to', expectedEndDate);

        const filteredDeductions = allCalculationUnits.filter(unit => {
          if (!unit) {
            return false;
          }

          const isStatementNull = unit.statement === null || unit.statement === undefined;

          if (!isStatementNull) {
            return false;
          }

          const unitMatchesOwnerCalc = allOwnerCalculations.some(calc => {
            if (calc.calculation_units && Array.isArray(calc.calculation_units)) {
              return calc.calculation_units.some(cu => cu.id === unit.id);
            }
            return false;
          });

          const weekInfoForMatch = deductionIdToWeekMap[unit.id];
          const unitMatchesWeek = weekInfoForMatch &&
            String(weekInfoForMatch.start_date || '').trim() === String(expectedStartDate || '').trim() &&
            String(weekInfoForMatch.end_date || '').trim() === String(expectedEndDate || '').trim();

          if (!unitMatchesOwnerCalc && !unitMatchesWeek) {
            return false;
          }

          let unitStartDate = null;
          let unitEndDate = null;

          if (unit.start_date && unit.end_date) {
            unitStartDate = normalizeDate(unit.start_date);
            unitEndDate = normalizeDate(unit.end_date);
          }

          const weekInfo = deductionIdToWeekMap[unit.id];

          let matchesStartDate = false;
          let matchesEndDate = false;

          if (unitStartDate && unitEndDate) {
            matchesStartDate = unitStartDate === expectedStartDate;
            matchesEndDate = unitEndDate === expectedEndDate;
          } else if (weekInfo) {
            const weekStartDate = String(weekInfo.start_date || '').trim();
            const weekEndDate = String(weekInfo.end_date || '').trim();
            const expStartDate = String(expectedStartDate || '').trim();
            const expEndDate = String(expectedEndDate || '').trim();

            matchesStartDate = weekStartDate === expStartDate;
            matchesEndDate = weekEndDate === expEndDate;

            if (unit.id === 23) {
              console.log('Debugging deduction 23:', {
                weekStartDate: weekStartDate,
                weekEndDate: weekEndDate,
                expStartDate: expStartDate,
                expEndDate: expEndDate,
                startMatch: matchesStartDate,
                endMatch: matchesEndDate,
                weekInfo: weekInfo
              });
            }
          } else {
            return false;
          }

          return matchesStartDate && matchesEndDate;
        });

        const calculationDeductions = [];
        if (calculation.calculations && Array.isArray(calculation.calculations)) {
          calculation.calculations.forEach(calc => {
            const calcStartDate = normalizeDate(calc.start_date);
            const calcEndDate = normalizeDate(calc.end_date);
            const calcMatchesWeek = calcStartDate === expectedStartDate && calcEndDate === expectedEndDate;

            if (calcMatchesWeek && calc.calculation_units && Array.isArray(calc.calculation_units)) {
              calc.calculation_units.forEach(unit => {
                if (unit && unit.id && (unit.statement === null || unit.statement === undefined)) {
                  if (!calculationDeductions.find(d => d.id === unit.id)) {
                    calculationDeductions.push(unit);
                  }
                }
              });
            }
          });
        } else if (calculation.calculation_units && Array.isArray(calculation.calculation_units)) {
          const calcStartDate = normalizeDate(calculation.start_date);
          const calcEndDate = normalizeDate(calculation.end_date);
          const calcMatchesWeek = calcStartDate === expectedStartDate && calcEndDate === expectedEndDate;

          if (calcMatchesWeek) {
            calculation.calculation_units.forEach(unit => {
              if (unit && unit.id && (unit.statement === null || unit.statement === undefined)) {
                if (!calculationDeductions.find(d => d.id === unit.id)) {
                  calculationDeductions.push(unit);
                }
              }
            });
          }
        }

        const allDeductions = [...filteredDeductions];
        calculationDeductions.forEach(calcDed => {
          if (!allDeductions.find(d => d.id === calcDed.id)) {
            allDeductions.push(calcDed);
          }
        });

        allCalculationUnits.forEach(unit => {
          if (unit && unit.id && (unit.statement === null || unit.statement === undefined)) {
            const weekInfo = deductionIdToWeekMap[unit.id];
            if (weekInfo) {
              const weekStartDate = String(weekInfo.start_date || '').trim();
              const weekEndDate = String(weekInfo.end_date || '').trim();
              const expStartDate = String(expectedStartDate || '').trim();
              const expEndDate = String(expectedEndDate || '').trim();

              if (weekStartDate === expStartDate && weekEndDate === expEndDate) {
                if (!allDeductions.find(d => d.id === unit.id)) {
                  allDeductions.push(unit);
                }
              }
            }
          }
        });

        console.log('=== Deduction Filtering Results ===');
        console.log('Week being viewed:', expectedStartDate, 'to', expectedEndDate);
        console.log('Total calculation units from API:', allCalculationUnits.length);
        console.log('Filtered deductions from API (strict date match):', filteredDeductions.length);
        console.log('Deductions from calculation object:', calculationDeductions.length);
        console.log('Total combined deductions for this week:', allDeductions.length);

        if (allDeductions.length === 0) {
          console.warn('No deductions found for this week. Checking all deductions:');
          const allDeductionsCheck = allCalculationUnits.filter(u => u && (u.statement === null || u.statement === undefined));
          console.log('Total deductions from API (all weeks):', allDeductionsCheck.length);
          console.log('Expected week:', expectedStartDate, 'to', expectedEndDate);
          console.log('Calculation owner ID:', ownerId);

          allDeductionsCheck.forEach((unit, idx) => {
            const unitOwnerId = typeof unit.owner === 'number' ? unit.owner : (typeof unit.owner === 'object' && unit.owner?.id ? unit.owner.id : null);
            const unitStartDate = unit.start_date ? normalizeDate(unit.start_date) : null;
            const unitEndDate = unit.end_date ? normalizeDate(unit.end_date) : null;
            const weekInfo = deductionIdToWeekMap[unit.id];
            const finalStartDate = unitStartDate || weekInfo?.start_date || 'unknown';
            const finalEndDate = unitEndDate || weekInfo?.end_date || 'unknown';
            const ownerMatches = unitOwnerId === calcOwnerId;
            const datesMatch = (finalStartDate === expectedStartDate && finalEndDate === expectedEndDate);

            console.log(`Deduction ${idx + 1} from API:`, {
              id: unit.id,
              driver: unit.driver,
              amount: unit.amount,
              owner: unit.owner,
              unitOwnerId: unitOwnerId,
              calcOwnerId: calcOwnerId,
              ownerMatches: ownerMatches,
              unitStartDate: unitStartDate,
              unitEndDate: unitEndDate,
              weekInfo: weekInfo ? `${weekInfo.start_date} to ${weekInfo.end_date}` : 'none',
              finalStartDate: finalStartDate,
              finalEndDate: finalEndDate,
              expectedStartDate: expectedStartDate,
              expectedEndDate: expectedEndDate,
              datesMatch: datesMatch,
              wouldMatch: ownerMatches && datesMatch
            });
          });
        }

        setDeductions(allDeductions);
    } catch (error) {
      console.error('Error fetching deductions:', error);
      setDeductions([]);
    } finally {
      setLoadingDeductions(false);
    }
  };

  useEffect(() => {
    if (open && calculation) {
      fetchDeductions();
      setDeletedUnitIds(new Set());
      setNewlyAddedUnits([]);
    }
  }, [open, calculation]);

  useEffect(() => {
    if (open && calculation) {
      fetchDeductions();
    }
  }, [calculation?.calculation_units?.length]);

  if (!calculation) return null;

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '$0.00';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

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

  const isPeriodView = calculation.calculations && Array.isArray(calculation.calculations);
  const calculationsList = isPeriodView ? calculation.calculations : [calculation];

  const allCalculationUnits = [];
  calculationsList.forEach(calc => {
    if (calc.calculation_units && Array.isArray(calc.calculation_units)) {
      calc.calculation_units.forEach(unit => {
        if (unit && !deletedUnitIds.has(unit.id)) {
          allCalculationUnits.push(unit);
        }
      });
    }
  });

  newlyAddedUnits.forEach(unit => {
    if (unit && !deletedUnitIds.has(unit.id) && !allCalculationUnits.find(u => u.id === unit.id)) {
      allCalculationUnits.push(unit);
    }
  });

  const normalizeDate = (date) => {
    if (!date) return '';
    const dateStr = String(date).trim();
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    return dateStr;
  };

  const weekDeductions = deductions.filter(d => !deletedUnitIds.has(d.id));

  const handleDeleteDeduction = (deductionId) => {
    modal.confirm({
      title: 'Delete Deduction',
      content: 'Are you sure you want to delete this deduction? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setDeletingId(deductionId);
        setDeductions(prev => prev.filter(d => d.id !== deductionId));

        try {
          await apiRequest(`/calculations/calculation-unit/${deductionId}/`, {
            method: 'DELETE',
          });
          message.success('Deduction deleted successfully');

          if (onRefresh) {
            onRefresh();
          }
        } catch (error) {
          console.error('Error deleting deduction:', error);
          message.error(error.message || 'Failed to delete deduction');
          fetchDeductions();
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  return (
    <Drawer
      title={<span className={currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}>Owner Calculation Details</span>}
      placement="right"
      onClose={onClose}
      open={open}
      width={800}
      className={currentTheme === 'dark' ? 'bg-white/5' : 'bg-white'}
      styles={{
        body: {
          backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        },
      }}
    >
      <div className={`space-y-6 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
        <div className={`p-4 rounded-md ${currentTheme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-black/10'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>Period Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Owner</div>
              <div className={`font-semibold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                {calculation.owner || 'N/A'}
              </div>
            </div>
            <div>
              <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Date Range</div>
              <div className={`font-semibold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                {calculation.start_date || 'N/A'} to {calculation.end_date || 'N/A'}
              </div>
            </div>
          </div>

          <div className={`mt-4 pt-4 border-t ${currentTheme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Total Gross</div>
                <div className={`font-semibold text-xl ${currentTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  {formatCurrency(calculation.total_amount || 0)}
                </div>
              </div>
              <div>
                <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Total Escrow</div>
                <div className={`font-semibold text-xl ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  {formatCurrency(calculation.total_escrow || 0)}
                </div>
              </div>
            </div>
          </div>

          {calculationsList.some(calc => calc.note) && (
            <div className={`mt-4 pt-4 border-t ${currentTheme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
              <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Note</div>
              <div className={`font-semibold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                {calculationsList.map(calc => calc.note).filter(note => note).join(', ') || 'N/A'}
              </div>
            </div>
          )}
        </div>


        <div>
          <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>Truck Numbers & Driver Information</h3>
          {allCalculationUnits.length > 0 ? (
            <div className="space-y-3">
              {allCalculationUnits.map((unit, index) => {
                const unitNumber = unit.truck?.unit_number || 'N/A';
                const driverName = unit.driver || unit.statement?.driver || 'N/A';
                const companyName = unit.statement?.company || unit.truck?.carrier_company || 'N/A';
                const amount = typeof unit.amount === 'string' ? parseFloat(unit.amount) || 0 : (unit.amount || 0);
                const escrow = typeof unit.escrow === 'string' ? parseFloat(unit.escrow) || 0 : (unit.escrow || 0);
                const note = unit.note || '';
                const pdfUrl = unit.statement?.pdf_file || unit.statement?.pdf_file_url || null;
                const hasStatement = unit.statement !== null && unit.statement !== undefined;
                const isNegative = amount < 0;

                const handleDeleteUnit = async () => {
                  if (!unit.id) {
                    message.error('Cannot delete: Unit ID is missing');
                    return;
                  }

                  const isDeduction = unit.statement === null || unit.statement === undefined;

                  modal.confirm({
                    title: isDeduction ? 'Delete Deduction' : 'Delete Unit',
                    content: `Are you sure you want to delete this ${isDeduction ? 'deduction' : 'unit'} (${unitNumber})? This action cannot be undone.`,
                    okText: 'Delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    onOk: async () => {
                      setDeletingId(unit.id);
                      setDeletedUnitIds(prev => new Set([...prev, unit.id]));

                      if (isDeduction) {
                        setDeductions(prev => prev.filter(d => d.id !== unit.id));
                      }

                      try {
                        await apiRequest(`/calculations/calculation-unit/${unit.id}/`, {
                          method: 'DELETE',
                        });
                        message.success(`${isDeduction ? 'Deduction' : 'Unit'} deleted successfully`);
                        queryClient.invalidateQueries({ queryKey: ['owner'] });

                        if (onRefresh) {
                          onRefresh();
                        }
                      } catch (error) {
                        console.error('Error deleting unit:', error);
                        message.error(error.message || `Failed to delete ${isDeduction ? 'deduction' : 'unit'}`);
                        setDeletedUnitIds(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(unit.id);
                          return newSet;
                        });
                        if (isDeduction) {
                          fetchDeductions();
                        }
                      } finally {
                        setDeletingId(null);
                      }
                    },
                  });
                };

                return (
                  <div key={unit.id || index} className={`p-4 rounded ${currentTheme === 'dark' ? 'bg-white/5' : 'bg-white'} border ${currentTheme === 'dark' ? 'border-white/10' : 'border-black/10'} relative`}>
                    <div className="absolute top-4 right-4">
                      <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteUnit}
                        loading={deletingId === unit.id}
                        size="small"
                        className={currentTheme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Unit Number</div>
                        <div className={`font-semibold text-lg ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>{unitNumber}</div>
                      </div>
                      <div>
                        <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Company Name</div>
                        <div className={`font-semibold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>{companyName}</div>
                      </div>
                      <div>
                        <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Driver Name</div>
                        <div className={`font-semibold ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>{driverName}</div>
                      </div>
                      <div>
                        <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Amount</div>
                        <div className={`font-semibold text-lg ${hasStatement ? (currentTheme === 'dark' ? 'text-green-400' : 'text-green-600') : (isNegative ? (currentTheme === 'dark' ? 'text-red-400' : 'text-red-600') : (currentTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'))}`}>
                          {formatCurrency(amount)}
                        </div>
                      </div>
                    </div>

                    <div className={`mt-4 pt-4 border-t ${currentTheme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Escrow</div>
                          <div className={`font-semibold text-lg ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                            {formatCurrency(escrow)}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Note</div>
                          <div className="flex items-start justify-between gap-4">
                            <div className={`font-semibold flex-1 ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                              {note && note.trim() !== '' ? note : '-'}
                            </div>
                            {pdfUrl && (
                              <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex-shrink-0 inline-block px-4 py-2 rounded ${currentTheme === 'dark' ? 'bg-[#E77843] hover:bg-[#F59A6B]' : 'bg-[#E77843] hover:bg-[#F59A6B]'} text-white font-medium transition-colors text-sm`}
                              >
                                View PDF Statement
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-10 border-2 border-dashed rounded-xl ${currentTheme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className={`text-sm ${currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}`}>
                No units found for this period.
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};

export default ViewOwnerCalculationDrawer;

