/**
 * Dialog.js — Texto. Dialog / Modal Component
 */

import { dialog, div, h3, p, button } from '../../html.js';
import { Button } from './Button.js';

/**
 * Modal de confirmación o información.
 * Usa el elemento HTML <dialog> nativo para accesibilidad correcta.
 *
 * @param {Object}   props
 * @param {string}   props.title
 * @param {string}   [props.message]
 * @param {string}   [props.confirmText]   - Texto del botón de confirmar
 * @param {string}   [props.cancelText]    - Texto del botón de cancelar
 * @param {'danger'|'warning'|'primary'} [props.variant]  - Variante del botón de confirmar
 * @param {Function} [props.onConfirm]
 * @param {Function} [props.onCancel]
 *
 * @returns {{ el: HTMLDialogElement, open: Function, close: Function }}
 *   Retorna el elemento y métodos para controlarlo desde fuera.
 */
export const Dialog = ({
  title       = '',
  message     = '',
  confirmText = 'Confirmar',
  cancelText  = 'Cancelar',
  variant     = 'primary',
  onConfirm,
  onCancel,
} = {}) => {

  const el = dialog({
    className: 'dialog-el',
    'aria-modal': 'true',
    'aria-labelledby': 'dialog-title',
  });

  // Panel glass
  const panel = div({ className: 'dialog-panel glass-modal rounded-2xl shadow-lg' }, el);

  // Título
  h3({ id: 'dialog-title', className: 'dialog-title' }, panel, title);

  // Mensaje
  if (message) {
    p({ className: 'dialog-message' }, panel, message);
  }

  // Acciones
  const actions = div({ className: 'dialog-actions' }, panel);

  // Botón cancelar
  actions.appendChild(Button({
    text: cancelText,
    variant: 'ghost',
    onClick: () => {
      close();
      onCancel?.();
    },
  }));

  // Botón confirmar
  actions.appendChild(Button({
    text: confirmText,
    variant,
    onClick: () => {
      close();
      onConfirm?.();
    },
  }));

  // Cerrar al hacer click en el backdrop
  el.addEventListener('click', (e) => {
    if (e.target === el) {
      close();
      onCancel?.();
    }
  });

  // Cerrar con Escape (ya lo maneja <dialog> nativamente,
  // pero añadimos el callback de onCancel)
  el.addEventListener('cancel', () => {
    onCancel?.();
  });

  const open  = () => el.showModal();
  const close = () => el.close();

  return { el, open, close };
};
