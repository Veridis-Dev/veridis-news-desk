import { useState, useEffect, useCallback } from 'react';

// Clean up obsolete localStorage preference from previous custom wide workspace implementation
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('veridis-news-desk-wide-workspace');
  } catch {
    // Ignore storage quota or security restrictions
  }
}

/**
 * Checks whether WordPress's native admin menu sidebar is currently folded (collapsed).
 */
export function isWordPressSidebarFolded(): boolean {
  if (typeof document === 'undefined' || !document.body) {
    return false;
  }
  return document.body.classList.contains('folded');
}

/**
 * Controls and synchronizes with WordPress's native admin menu collapse/expand mechanism.
 * Uses WordPress's native #collapse-button and body.folded class as the single source of truth.
 */
export function useWideWorkspace() {
  const [isWide, setIsWide] = useState<boolean>(() => isWordPressSidebarFolded());

  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) {
      return;
    }

    const updateState = () => {
      setIsWide(isWordPressSidebarFolded());
    };

    // Synchronize immediately on mount
    updateState();

    // Observe changes to body class attribute (native WP common.js adds/removes .folded)
    const observer = new MutationObserver(updateState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Also observe window resize for WordPress responsive threshold changes
    window.addEventListener('resize', updateState, { passive: true });

    // Listen to native WordPress jQuery events if available
    const jQuery = (window as unknown as { jQuery?: (doc: Document) => { on: (event: string, fn: () => void) => void; off: (event: string, fn: () => void) => void } }).jQuery;
    if (typeof jQuery === 'function') {
      try {
        jQuery(document).on('wp-collapse-menu.vnd wp-menu-state-set.vnd', updateState);
      } catch {
        // Fallback to observer
      }
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateState);
      if (typeof jQuery === 'function') {
        try {
          jQuery(document).off('wp-collapse-menu.vnd wp-menu-state-set.vnd', updateState);
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const toggleWide = useCallback(() => {
    // Single source of truth: trigger WordPress's native collapse control
    const collapseBtn = document.getElementById('collapse-button');
    if (collapseBtn) {
      collapseBtn.click();
    } else if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('folded');
    }
  }, []);

  return { isWide, toggleWide };
}
