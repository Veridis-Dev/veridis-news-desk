import type { ReactNode } from 'react';
import type { Tone } from '../types';
export function VeridisBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`vnd-badge vnd-tone--${tone}`}>{children}</span>;
}
