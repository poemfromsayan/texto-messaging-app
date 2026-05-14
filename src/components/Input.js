/**
 * Input.js — Texto. Input Components
 */

import { div, label, input, span } from '../../html.js';

/**
 * Campo de formulario con etiqueta opcional.
 *
 * @param {Object}   props
 * @param {string}   props.id
 * @param {string}   [props.labelText]      - Texto de la etiqueta (omitir si no se necesita)
 * @param {string}   [props.type]           - Tipo de input HTML
 * @param {string}   [props.placeholder]
 * @param {string}   [props.value]
 * @param {boolean}  [props.pill]           - Border radius full (para buscador)
 * @param {Function} [props.onInput]        - Evento input
 * @param {Function} [props.onChange]       - Evento change
 * @param {Function} [props.onKeydown]      - Evento keydown
 *
 * @returns {HTMLElement}
 */
export const Input = ({
  id,
  labelText   = '',
  type        = 'text',
  placeholder = '',
  value       = '',
  pill        = false,
  onInput,
  onChange,
  onKeydown,
} = {}) => {
  const wrap = div({ className: 'input-wrap' });

  if (labelText) {
    label({ htmlFor: id, className: 'input-label' }, wrap, labelText);
  }

  const inputClasses = ['input'];
  if (pill) inputClasses.push('input-search');

  const attrs = { id, type, placeholder, className: inputClasses };
  if (value)    attrs.value    = value;
  if (onInput)  attrs.onInput  = onInput;
  if (onChange) attrs.onChange = onChange;
  if (onKeydown) attrs.onKeydown = onKeydown;

  input(attrs, wrap);

  return wrap;
};

/**
 * Barra de escritura de mensajes.
 * Combina el campo de texto con el botón de envío y soporte para imágenes.
 *
 * @param {Object}   props
 * @param {string}   [props.placeholder]
 * @param {Function} [props.onSend] - Callback con { text, imageData? }
 *
 * @returns {HTMLElement}
 */
export const MessageInputBar = ({ placeholder = 'Escribe un mensaje…', onSend } = {}) => {
  injectBarStyles();

  // Contenedor externo (preview + row)
  const wrap = div({ className: 'msg-input-wrap' });

  // ── Preview de imagen (oculto por defecto) ────────────────────────────────
  const preview = div({ className: 'msg-img-preview' });
  let pendingImageData = null;

  const showPreview = (dataUrl) => {
    pendingImageData = dataUrl;
    preview.innerHTML = '';

    const thumb = document.createElement('img');
    thumb.src = dataUrl;
    thumb.className = 'msg-img-thumb';
    thumb.alt = 'Vista previa';
    preview.appendChild(thumb);

    const cancelBtn = div({
      className: 'msg-img-cancel',
      role: 'button',
      tabIndex: 0,
      'aria-label': 'Cancelar imagen',
      onClick: clearPreview,
    }, preview, '✕');

    preview.classList.add('msg-img-preview--visible');
    wrap.insertBefore(preview, row);
  };

  const clearPreview = () => {
    pendingImageData = null;
    preview.classList.remove('msg-img-preview--visible');
    preview.innerHTML = '';
    fileInput.value = '';
  };

  // ── Input de archivo oculto ───────────────────────────────────────────────
  const fileInput = document.createElement('input');
  fileInput.type = 'accept';
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  fileInput.setAttribute('aria-hidden', 'true');
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => showPreview(e.target.result);
    reader.readAsDataURL(file);
  });
  wrap.appendChild(fileInput);

  // ── Fila del input ────────────────────────────────────────────────────────
  const row = div({ className: 'msg-input-row' }, wrap);

  // Campo de texto
  const field = input({
    type: 'text',
    placeholder,
    className: 'msg-input',
    'aria-label': 'Escribir mensaje',
    onKeydown: (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
  }, row);

  // Botón adjuntar
  div({
    className: 'btn btn-ghost btn-sm btn-icon',
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Adjuntar imagen',
    onClick: () => fileInput.click(),
  }, row, '📎');

  // Botón enviar
  div({
    className: 'btn btn-primary btn-sm btn-icon',
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Enviar mensaje',
    onClick: handleSend,
  }, row, '➤');

  function handleSend() {
    const text = field.value.trim();
    if (!text && !pendingImageData) return;

    onSend?.({ text, imageData: pendingImageData });

    field.value = '';
    clearPreview();
    field.focus();
  }

  return wrap;
};

const injectBarStyles = () => {
  if (document.getElementById('style-msg-input-bar')) return;
  const style = document.createElement('style');
  style.id = 'style-msg-input-bar';
  style.textContent = `
    .msg-input-wrap {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    /* Preview de imagen seleccionada */
    .msg-img-preview {
      display: none;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      background: var(--glass-2);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      animation: fadeIn 0.15s ease both;
    }
    .msg-img-preview--visible { display: flex; }

    .msg-img-thumb {
      width: 56px;
      height: 56px;
      object-fit: cover;
      border-radius: var(--radius-md);
      flex-shrink: 0;
    }

    .msg-img-cancel {
      margin-left: auto;
      cursor: pointer;
      font-size: var(--text-xs);
      color: var(--text-muted);
      background: var(--glass-3);
      border-radius: var(--radius-full);
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-fast);
      flex-shrink: 0;
    }
    .msg-img-cancel:hover { color: var(--status-danger); background: var(--glass-3); }
  `;
  document.head.appendChild(style);
};
