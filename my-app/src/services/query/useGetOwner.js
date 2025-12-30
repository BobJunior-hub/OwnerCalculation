import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api';

export const useGetOwner = ({search, start_date, end_date, page = 1, pageSize = 10}) => {
  return useQuery({
    queryKey: ['owner', search, start_date, end_date, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: search,
        start_date: start_date,
        end_date: end_date,
      });

      if (page) {
        params.append('page', page);
      }
      if (pageSize) {
        params.append('page_size', pageSize);
      
      }

      return await apiRequest(`/calculations/owner-calculation?${params.toString()}`);
    },
    enabled: !!search && !!start_date && !!end_date,
  });
};
