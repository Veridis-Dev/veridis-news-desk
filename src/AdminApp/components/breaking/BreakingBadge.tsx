import { useEffect, useState } from 'react';
import type { BreakingMetadata } from '../../types';
import { VeridisBadge } from '../../design-system/VeridisBadge';
export function useBreakingActive(breaking: BreakingMetadata) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!breaking.expiresAt) return;
    const delay = Date.parse(breaking.expiresAt) - Date.now();
    if (delay <= 0) return;
    const timer = window.setTimeout(() => tick(n => n + 1), Math.min(delay + 20, 2147483647));
    return () => window.clearTimeout(timer);
  }, [breaking.expiresAt]);
  return breaking.active && (!breaking.expiresAt || Date.parse(breaking.expiresAt) > Date.now());
}
export function BreakingBadge({ breaking }: { breaking: BreakingMetadata }) {
  const active = useBreakingActive(breaking);
  return active ? <VeridisBadge tone={breaking.priority === 'critical' ? 'error' : breaking.priority === 'high' ? 'warning' : 'neutral'}>{breaking.label}</VeridisBadge> : null;
}
