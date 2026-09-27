import { __ } from '@wordpress/i18n';
import type { TermOption } from '../types';

export type CategoryTone =
  | 'blue'
  | 'violet'
  | 'teal'
  | 'green'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'indigo'
  | 'slate';

const PALETTE: CategoryTone[] = [
  'blue',
  'teal',
  'violet',
  'amber',
  'rose',
  'cyan',
  'indigo',
  'green',
];

export function getCategoryTone(category?: { id?: number; name?: string; slug?: string } | null): CategoryTone {
  if (!category || !category.name || category.name.toLowerCase() === 'uncategorized' || category.id === 1) {
    return 'slate';
  }
  if (typeof category.id === 'number' && category.id > 1) {
    return PALETTE[Math.abs(category.id) % PALETTE.length];
  }
  const str = category.slug || category.name;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export interface CategoryBadgeProps {
  category?: TermOption | null;
  fallback?: string;
  className?: string;
}

export function CategoryBadge({ category, fallback, className = '' }: CategoryBadgeProps) {
  const name = category?.name || fallback || __('Uncategorized', 'veridis-news-desk');
  const tone = getCategoryTone(category);

  return (
    <span className={`vnd-category-label vnd-category-label--${tone} ${className}`}>
      <span className="vnd-category-dot" aria-hidden="true" />
      <span className="vnd-category-text">{name}</span>
    </span>
  );
}
