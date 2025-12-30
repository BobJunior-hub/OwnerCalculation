import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api';

export const useGetStatement = ({driverId ,start_date ,end_date}) => {
  return useQuery({
    queryKey: ['statement', driverId, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (driverId) {
        params.append('driver', driverId);
      }
      if (start_date) {
        params.append('start_date', start_date);
      }
      if (end_date) {
        params.append('end_date', end_date);
      }

      const queryString = params.toString();
      const url = queryString
        ? `/calculations/statement-by-driver?${queryString}`
        : '/calculations/statement-by-driver';

      return await apiRequest(url);
    },
  });
};
