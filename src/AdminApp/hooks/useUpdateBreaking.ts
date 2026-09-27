import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBreaking } from '../api/breaking';
import type { UpdateBreakingInput } from '../types';
export function useUpdateBreaking(id: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBreakingInput) => updateBreaking(id, input),
    onSuccess: article => {
      client.setQueryData(['veridis-news', 'article', id], article);
      void client.invalidateQueries({ queryKey: ['veridis-news'] });
    },
  });
}
