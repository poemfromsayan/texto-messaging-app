/**
 * Badge.js — Texto. Badge & BadgeCount Components
 */

import { span } from '../../html.js';

/**
 * Etiqueta de estado o categoría.
 *
 * @param {Object} props
 * @param {string}                                                    props.text
 * @param {'strong'|'mid'|'subtle'|'outline'|'warning'|'danger'}    [props.variant]
 *
 * @returns {HTMLElement}
 */
export const Badge = ({ text, variant = 'mid' }) => {
  return span({ className: ['badge', `badge-${variant}`] }, null, text);
};

/**
 * Contador de mensajes no leídos.
 * Muestra el número o "99+" si supera 99.
 *
 * @param {Object} props
 * @param {number} props.count
 *
 * @returns {HTMLElement}
 */
export const BadgeCount = ({ count }) => {
  const display = count > 99 ? '99+' : String(count);
  return span({ className: 'badge-count' }, null, display);
};
