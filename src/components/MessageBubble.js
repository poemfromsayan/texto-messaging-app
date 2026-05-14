/**
 * MessageBubble.js — Texto. Message Bubble Component
 */

import { div, span, time, button } from '../../html.js';
import { Avatar }                  from './Avatar.js';
import { formatTime }              from '../utils.js';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

/* ── CSS de imágenes en burbuja ── */
(() => {
  if (document.getElementById('style-bubble-img')) return;
  const s = document.createElement('style');
  s.id = 'style-bubble-img';
  s.textContent = `
    .bubble-img {
      display: block;
      max-width: 100%;
      max-height: 280px;
      width: auto;
      border-radius: var(--radius-md);
      object-fit: cover;
      margin-bottom: 2px;
    }
    .bubble-text {
      margin: 0;
      line-height: var(--leading-relaxed);
      white-space: pre-wrap;
      word-break: break-word;
    }
    /* ── Mensaje reenviado ── */
    .bubble-forwarded {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: var(--space-1);
      padding-bottom: var(--space-1);
      border-bottom: 1px solid rgba(128,128,128,0.2);
    }
    .bubble-forwarded-icon {
      font-size: 11px;
      opacity: 0.6;
    }
    .bubble-forwarded-name {
      font-size: 11px;
      font-weight: var(--weight-semibold);
      color: var(--accent-primary);
      opacity: 0.85;
    }

    .bubble-e2e-lock {
      font-size: 8px;
      opacity: 0.4;
      margin-right: 1px;
      line-height: 1;
      display: inline;
    }

    /* ── Multi-select ── */
    .msg-row--selectable {
      cursor: pointer;
      border-radius: var(--radius-lg);
      transition: background 0.15s ease;
    }
    .msg-row--selectable:hover { background: var(--glass-1); }
    .msg-row--selected         { background: var(--glass-2); }

    .bubble-checkbox {
      width: 20px;
      height: 20px;
      border-radius: var(--radius-full);
      border: 2px solid var(--glass-border-strong);
      background: transparent;
      flex-shrink: 0;
      margin: auto 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      transition: var(--transition-fast);
    }
    .bubble-checkbox--checked {
      background: var(--accent-primary);
      border-color: var(--accent-primary);
      color: var(--accent-on-primary);
      font-weight: var(--weight-bold);
    }
  `;
  document.head.appendChild(s);
})();

/**
 * Burbuja de mensaje individual.
 *
 * @param {Object}   props
 * @param {string}   props.text
 * @param {boolean}  [props.sent]
 * @param {Date}     [props.time]
 * @param {boolean}  [props.delivered]
 * @param {string}   [props.senderInitials]
 * @param {string}   [props.senderStatus]
 * @param {string}   [props.msgId]           - ID del mensaje (para reacciones)
 * @param {Object}   [props.reactions]       - { emoji: { count, mine } }
 * @param {Function} [props.onReact]         - (emoji) => void
 *
 * @returns {HTMLElement}
 */
export const MessageBubble = ({
  text            = '',
  imageData       = null,
  replyTo         = null,
  sent            = false,
  time: timestamp = new Date(),
  delivered       = false,
  senderInitials  = '?',
  senderStatus    = null,
  msgId           = null,
  reactions       = {},
  onReact         = null,
  onReply         = null,
  onDelete        = null,
  onPin           = null,
  pinned          = false,
  deleted         = false,
  selectable      = false,
  selected        = false,
  onSelect        = null,
  onForward       = null,
  forwardedFrom   = null,
} = {}) => {

  // ── Fila contenedora ──────────────────────────────────────────────────────
  const row = div({
    className: [
      'msg-row',
      sent ? 'msg-row-sent' : '',
      selectable ? 'msg-row--selectable' : '',
      selected   ? 'msg-row--selected'   : '',
    ].filter(Boolean),
  });

  // En modo selección, clic en la fila completa activa toggle
  if (selectable && onSelect) {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelect(msgId);
    });
  }

  // Mensaje eliminado: versión simplificada sin contenido ni interacciones
  if (deleted) {
    if (!sent) {
      row.appendChild(Avatar({ initials: senderInitials, size: 'sm', status: senderStatus }));
    }
    const wrapper = div({ className: 'bubble-wrapper' }, row);
    div({
      className: ['bubble', 'bubble-deleted', sent ? 'bubble-sent' : 'bubble-received'].join(' '),
    }, wrapper, '🚫  Mensaje eliminado');
    const meta = div({ className: 'bubble-time' }, wrapper);
    time({ dateTime: '' }, meta, formatTime(timestamp));
    return row;
  }

  // Avatar del remitente (solo mensajes recibidos)
  if (!sent) {
    row.appendChild(Avatar({ initials: senderInitials, size: 'sm', status: senderStatus }));
  }

  // Checkbox de selección (solo en modo multi-select)
  if (selectable) {
    const checkbox = div({
      className: ['bubble-checkbox', selected ? 'bubble-checkbox--checked' : ''].filter(Boolean).join(' '),
      'aria-hidden': 'true',
    }, row);
    if (selected) checkbox.textContent = '✓';
  }

  // ── Wrapper: burbuja + meta + reacciones ──────────────────────────────────
  const wrapper = div({ className: 'bubble-wrapper' }, row);

  // ── Picker de emojis (hover) ──────────────────────────────────────────────
  if (onReact && !selectable) {
    const picker = div({ className: ['reaction-picker', sent ? 'reaction-picker-sent' : 'reaction-picker-received'].join(' ') }, wrapper);
    REACTION_EMOJIS.forEach(emoji => {
      button({
        className: 'reaction-picker-btn',
        'aria-label': `Reaccionar con ${emoji}`,
        onClick: (e) => {
          e.stopPropagation();
          onReact(emoji);
        },
      }, picker, emoji);
    });

    if (onReply) {
      span({ className: 'reaction-picker-divider' }, picker);
      button({
        className: 'reaction-picker-btn reaction-reply-btn',
        'aria-label': 'Responder mensaje',
        onClick: (e) => {
          e.stopPropagation();
          onReply();
        },
      }, picker, '↩');
    }

    if (onDelete && sent) {
      span({ className: 'reaction-picker-divider' }, picker);
      button({
        className: 'reaction-picker-btn reaction-delete-btn',
        'aria-label': 'Eliminar mensaje',
        onClick: (e) => {
          e.stopPropagation();
          onDelete();
        },
      }, picker, '🗑');
    }

    if (onPin) {
      span({ className: 'reaction-picker-divider' }, picker);
      button({
        className: ['reaction-picker-btn reaction-pin-btn', pinned ? 'reaction-pin-btn--active' : ''].filter(Boolean).join(' '),
        'aria-label': pinned ? 'Desfijar mensaje' : 'Fijar mensaje',
        onClick: (e) => {
          e.stopPropagation();
          onPin();
        },
      }, picker, pinned ? '📌' : '📍');
    }

    if (onSelect) {
      span({ className: 'reaction-picker-divider' }, picker);
      button({
        className: 'reaction-picker-btn reaction-select-btn',
        'aria-label': 'Seleccionar mensaje',
        onClick: (e) => {
          e.stopPropagation();
          onSelect(msgId);
        },
      }, picker, '☑');
    }

    if (onForward && !deleted) {
      span({ className: 'reaction-picker-divider' }, picker);
      button({
        className: 'reaction-picker-btn reaction-forward-btn',
        'aria-label': 'Reenviar mensaje',
        onClick: (e) => {
          e.stopPropagation();
          onForward();
        },
      }, picker, '↗');
    }
  }

  // ── Burbuja (texto y/o imagen) ───────────────────────────────────────────
  const bubble = div({
    className: ['bubble', sent ? 'bubble-sent' : 'bubble-received'].filter(Boolean),
  }, wrapper);

  // ── Cita del mensaje respondido ──────────────────────────────────────────
  if (replyTo) {
    const quote = div({ className: ['bubble-quote', sent ? 'bubble-quote-sent' : 'bubble-quote-received'].join(' ') }, bubble);
    if (replyTo.senderName) {
      span({ className: 'bubble-quote-author' }, quote, replyTo.senderName);
    }
    if (replyTo.imageData) {
      const qImg = document.createElement('img');
      qImg.src = replyTo.imageData;
      qImg.className = 'bubble-quote-img';
      qImg.alt = '📷';
      quote.appendChild(qImg);
    }
    span({ className: 'bubble-quote-text' }, quote,
      replyTo.imageData && !replyTo.text ? '📷 Imagen' : (replyTo.text ?? '')
    );
  }

  // ── Header de mensaje reenviado ──────────────────────────────────────────
  if (forwardedFrom) {
    const fwdHeader = div({ className: 'bubble-forwarded' }, bubble);
    span({ className: 'bubble-forwarded-icon' }, fwdHeader, '↗');
    span({ className: 'bubble-forwarded-name' }, fwdHeader,
      `Reenviado de ${forwardedFrom.name}`
    );
  }

  if (imageData) {
    const img = document.createElement('img');
    img.src = imageData;
    img.className = 'bubble-img';
    img.alt = 'Imagen';
    img.loading = 'lazy';
    // Abrir en nueva pestaña al hacer clic
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => window.open(imageData, '_blank'));
    bubble.appendChild(img);
  }

  if (text) {
    const textEl = document.createElement('p');
    textEl.className = 'bubble-text';
    textEl.textContent = text;
    bubble.appendChild(textEl);
  }

  // ── Metadatos (hora + entrega) ────────────────────────────────────────────
  const meta = div({ className: 'bubble-time' }, wrapper);
  // Icono de cifrado E2E en mensajes enviados
  if (sent) {
    span({ className: 'bubble-e2e-lock', 'aria-hidden': 'true' }, meta, '🔒');
  }
  time(
    { dateTime: timestamp instanceof Date ? timestamp.toISOString() : '' },
    meta,
    formatTime(timestamp),
  );
  if (sent && delivered) {
    span({ className: 'bubble-checkmark' }, meta, '✓✓');
  }

  // ── Badges de reacciones ──────────────────────────────────────────────────
  const reactionEntries = Object.entries(reactions);
  if (reactionEntries.length > 0) {
    const reactionRow = div({ className: 'reaction-row' }, wrapper);
    reactionEntries.forEach(([emoji, { count, mine }]) => {
      const badge = button({
        className: ['reaction-badge', mine ? 'reaction-badge-mine' : ''].filter(Boolean).join(' '),
        'aria-label': `${emoji} ${count}`,
        'aria-pressed': String(mine),
        onClick: () => onReact?.(emoji),
      }, reactionRow);
      span({}, badge, emoji);
      if (count > 1) span({ className: 'reaction-count' }, badge, String(count));
    });
  }

  return row;
};
