import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFollowUp } from '../api/followups';
import type { CreateFollowUpInput } from '../types';

export function useCreateFollowUp(postId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFollowUpInput) => createFollowUp(postId, input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['veridis-news'] });
    },
  });
}
