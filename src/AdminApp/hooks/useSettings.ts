import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../api/settings';
import type { SettingsResponse, UpdateSettingsInput } from '../types';

export const SETTINGS_QUERY_KEY = ['veridis-news', 'settings'] as const;

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: ({ signal }) => getSettings(signal),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => updateSettings(input),
    onSuccess: (data: SettingsResponse) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
      void queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });
}
