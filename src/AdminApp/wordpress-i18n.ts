/**
 * Vite aliases @wordpress/i18n to this bridge at runtime. WordPress owns the
 * singleton so strings injected by wp_set_script_translations() are visible.
 */
import type * as WordPressI18n from '@wordpress/i18n';

const wordpress = (window as unknown as { wp?: { i18n?: typeof WordPressI18n } }).wp;

if (!wordpress?.i18n) {
  throw new Error('The WordPress internationalization runtime is unavailable.');
}

export const { __, _n, _nx, _x, isRTL, sprintf } = wordpress.i18n;
