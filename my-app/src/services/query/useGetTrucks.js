import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api';

export const useGetTrucks = () => {
  return useQuery({
    queryKey: ['trucks'],
    queryFn: async () => await apiRequest('/calculations/all-trucks'),
  });
};
