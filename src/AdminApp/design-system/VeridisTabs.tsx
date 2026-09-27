import type { MouseEvent } from 'react';
import { __ } from '@wordpress/i18n';
interface Props<T extends string> { items: readonly { id: T; label: string }[]; active: T; onChange: (id: T) => void; href: (id: T) => string }
// These are page links, not ARIA tabs: ordinary link semantics support new tabs and history.
export function VeridisTabs<T extends string>({ items, active, onChange, href }: Props<T>) {
  function click(event: MouseEvent<HTMLAnchorElement>, id: T) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onChange(id);
  }
  return <nav className="vnd-tabs" aria-label={__('News Desk', 'veridis-news-desk')}>{items.map(item =>
    <a key={item.id} href={href(item.id)} aria-current={active === item.id ? 'page' : undefined} onClick={event => click(event, item.id)}>{item.label}</a>
  )}</nav>;
}
