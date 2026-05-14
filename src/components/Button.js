/**
 * Button.js — Texto. Button Component
 */

import { button } from '../../html.js';

/**
 * Botón de acción general.
 *
 * @param {Object}   props
 * @param {string}                                              [props.text]       - Texto del botón
 * @param {'primary'|'secondary'|'ghost'|'danger'|'warning'}  [props.variant]    - Variante visual
 * @param {'sm'|''}                                            [props.size]       - Tamaño compacto
 * @param {boolean}                                            [props.iconOnly]   - Solo ícono (padding cuadrado)
 * @param {string}                                             [props.ariaLabel]  - Accesibilidad
 * @param {'button'|'submit'|'reset'}                          [props.type]
 * @param {Function}                                           [props.onClick]
 *
 * @returns {HTMLElement}
 */
export const Button = ({
  text      = '',
  variant   = 'secondary',
  size      = '',
  iconOnly  = false,
  ariaLabel = '',
  type      = 'button',
  onClick,
} = {}) => {
  const classes = ['btn', `btn-${variant}`];
  if (size)     classes.push(`btn-${size}`);
  if (iconOnly) classes.push('btn-icon');

  const attrs = { className: classes, type };
  if (ariaLabel) attrs['aria-label'] = ariaLabel;
  if (onClick)   attrs.onClick = onClick;

  return button(attrs, null, text);
};
