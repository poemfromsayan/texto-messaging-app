/**
 * Avatar.js — Texto. Avatar Component
 */

import { div } from '../../html.js';

/**
 * Muestra las iniciales de un usuario sobre un fondo glass.
 * Opcionalmente muestra un indicador de estado (online / away / busy / offline).
 *
 * @param {Object} props
 * @param {string}                                         props.initials  - 1–2 caracteres
 * @param {'xs'|'sm'|'md'|'lg'|'xl'}                     [props.size]    - Tamaño del avatar
 * @param {'online'|'away'|'busy'|'offline'|null}         [props.status]  - Indicador de presencia
 *
 * @returns {HTMLElement}
 */
export const Avatar = ({ initials = '?', size = 'md', status = null }) => {
  const classes = ['avatar', `avatar-${size}`];
  if (status) classes.push(`avatar-${status}`);

  return div({ className: classes }, null, initials);
};
