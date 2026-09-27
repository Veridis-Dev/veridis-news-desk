import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateFollowUp } from '../api/followups';
import type { UpdateFollowUpInput } from '../types';

export function useUpdateFollowUp() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateFollowUpInput }) => updateFollowUp(id, input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['veridis-news'] });
    },
  });
}
