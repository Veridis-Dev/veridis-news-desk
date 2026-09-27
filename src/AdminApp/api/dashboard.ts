import { apiGet } from './client';
import type { DashboardData } from '../types';
export const getDashboard = (signal?: AbortSignal) => apiGet<DashboardData>('dashboard', signal);
