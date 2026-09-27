import { apiGet, apiPatch } from './client';
import type { SettingsResponse, UpdateSettingsInput } from '../types';

export async function getSettings(signal?: AbortSignal): Promise<SettingsResponse> {
  return apiGet<SettingsResponse>('settings', signal);
}

export async function updateSettings(input: UpdateSettingsInput, signal?: AbortSignal): Promise<SettingsResponse> {
  return apiPatch<SettingsResponse>('settings', input, signal);
}
