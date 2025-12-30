import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Pagination, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { useGetOwner } from '../../services/query/useGetOwner';

export const Owner = ({ currentTheme, search, start_date, end_date, setViewDrawerOpen, setDeductionDrawerOpen, setSelectedCalculation, selectedOwner, onRefresh }) => {
  const { message, modal } = App.useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [calculations, setCalculations] = useState([]);
  const [deletingId, setDeletingId] = useState(null);


  const { data: ownerData, isLoading, isError } = useGetOwner({
    search: search,
    start_date,
    end_date,
    page: currentPage,
    pageSize: pageSize
  });

  console.log('ownerData.js', ownerData?.results);

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '$0.00';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const getCreatedByName = (owner) => {
    if (owner.created_by) {
      if (typeof owner.created_by === 'string') {
        return owner.created_by;
      }
      if (owner.created_by.first_name || owner.created_by.last_name) {
        return `${owner.created_by.first_name || ''} ${owner.created_by.last_name || ''}`.trim() || owner.created_by.username || 'N/A';
      }
      return owner.created_by.username || 'N/A';
    }
    return 'N/A';
  };

  const results = ownerData?.results || [];
  const total = ownerData?.count || results.length;

  useEffect(() => {
    if (ownerData?.results) {
      setCalculations(ownerData.results);
    }
  }, [ownerData?.results]);

  const displayCalculations = calculations.length > 0 ? calculations : results;

  const handleDeleteCalculation = (owner) => {
    modal.confirm({
      title: 'Delete Owner Calculation',
      content: `Are you sure you want to delete this owner calculation for ${
        owner.owner || search || 'N/A'
      } (${owner.start_date} to ${owner.end_date})? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        if (!owner?.id) {
          message.error('Cannot delete: Calculation ID is missing');
          return;
        }

        setDeletingId(owner.id);

        try {
          await apiRequest(`/calculations/owner-calculation/${owner.id}/`, {
            method: 'DELETE',
          });

          message.success('Owner calculation deleted successfully');

          setCalculations(prev =>
            prev.filter(item => item.id !== owner.id)
          );

        } catch (error) {
          console.error('Error deleting owner calculation:', error);
          message.error(error.message || 'Failed to delete owner calculation');
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto min-h-0'>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
          </div>
        ) : displayCalculations.length === 0 ? (
          <Card
            title={<span className={currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}>Owner Calculation</span>}
            className={`${currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}
          >
            <Empty description={<span className={currentTheme === 'dark' ? 'text-white/65' : 'text-black/65'}>No owner calculations found for the selected criteria</span>} />
          </Card>
        ) : (
          <div className="space-y-4">
            {displayCalculations.map((owner) => (
              <Card
                key={owner.id}
                title={<span className={currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}>Owner Calculation - {start_date} to {end_date}</span>}
                className={`${currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}>

                <div className={`p-4 rounded ${currentTheme === 'dark' ? 'bg-white/5' : 'bg-white'} border ${currentTheme === 'dark' ? 'border-white/10' : 'border-black/10'} flex items-center justify-between mb-4`}>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Owner Name</div>
                      <div className={`font-semibold text-lg ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>{owner.owner || search || 'N/A'}</div>
                      <div className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                        {owner.start_date} to {owner.end_date}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Total Amount</div>
                      <div className={`font-semibold text-xl ${currentTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                        {formatCurrency(owner.total_amount || 0)}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Total Escrow</div>
                      <div className={`font-semibold text-xl ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        {formatCurrency(owner.total_escrow || 0)}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Previous Amount</div>
                      <div className={`font-semibold text-xl ${currentTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                        {formatCurrency(owner.prev_amount || 0)}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs font-medium mb-1 ${currentTheme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Created By</div>
                      <div className={`font-semibold text-lg ${currentTheme === 'dark' ? 'text-white/85' : 'text-black/85'}`}>
                        {getCreatedByName(owner)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setSelectedCalculation({
                          ...owner,
                          calculations: [owner],
                          owner: owner.owner || search || 'N/A',
                          start_date: owner.start_date,
                          end_date: owner.end_date,
                          total_amount: owner.total_amount,
                          total_escrow: owner.total_escrow
                        });
                        setViewDrawerOpen(true);}}className={currentTheme === 'dark' ? 'bg-[#E77843] hover:bg-[#F59A6B]' : 'bg-[#E77843] hover:bg-[#F59A6B]'}>
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
                        if (owner.calculation_units && Array.isArray(owner.calculation_units) && owner.calculation_units.length > 0) {
                          const firstUnit = owner.calculation_units[0];
                          if (firstUnit.owner && typeof firstUnit.owner === 'number') {
                            ownerId = firstUnit.owner;
                          }
                        }

                        setSelectedCalculation({
                          ...owner,
                          calculations: [owner],
                          owner: owner.owner || search || 'N/A',
                          owner_id: ownerId || owner.id,
                          start_date: owner.start_date,
                          end_date: owner.end_date,
                          total_amount: owner.total_amount,
                          total_escrow: owner.total_escrow
                        });
                        setDeductionDrawerOpen(true);
                      }}
                       className={currentTheme === 'dark' ? 'bg-[#E77843] hover:bg-[#F59A6B]' : 'bg-[#E77843] hover:bg-[#F59A6B]'}>
                      Add
                    </Button>
                    <Button
                      type="primary"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteCalculation(owner)}
                      loading={deletingId === owner.id}
                      className={
                        currentTheme === 'dark'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-red-500 hover:bg-red-600'
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {displayCalculations.length > 0 && (
        <div className="flex-shrink-0 flex justify-center pt-4 border-t bg-inherit">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
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
                Showing {range[0]}-{range[1]} of {total} {total === 1 ? 'item' : 'items'}
              </span>
            )}
            pageSizeOptions={['5', '10', '20', '50', '100']}
            className={currentTheme === 'dark' ? 'text-white' : ''}
          />
        </div>
      )}
    </div>
  );
};
