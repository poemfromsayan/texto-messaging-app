/**
 * ChatListItem.js — Texto. Chat List Item Component
 */

import { div, span } from '../../html.js';
import { Avatar }     from './Avatar.js';
import { BadgeCount } from './Badge.js';
import { formatDate, truncate } from '../utils.js';
import { isBlocked } from '../store.js';

/**
 * Fila de conversación en la lista de chats.
 *
 * @param {Object}   props
 * @param {string}   props.id              - ID del chat
 * @param {string}   props.name            - Nombre del contacto
 * @param {string}   props.initials        - Iniciales para el avatar
 * @param {string}   [props.status]        - Estado de presencia del contacto
 * @param {string}   [props.lastMessage]   - Preview del último mensaje
 * @param {Date}     [props.lastTime]      - Timestamp del último mensaje
 * @param {number}   [props.unread]        - Cantidad de mensajes no leídos
 * @param {boolean}  [props.active]        - ¿Es el chat actualmente abierto?
 * @param {Function} [props.onClick]       - Callback al hacer clic
 *
 * @returns {HTMLElement}
 */
export const ChatListItem = ({
  id,
  name         = '',
  initials     = '?',
  status       = null,
  lastMessage  = '',
  lastTime     = new Date(),
  unread       = 0,
  active       = false,
  onClick,
} = {}) => {

  const item = div({
    className: ['chat-item', active ? 'active' : ''].filter(Boolean),
    role: 'listitem',
    tabIndex: 0,
    'aria-current': active ? 'true' : undefined,
    'aria-label': `Chat con ${name}${unread ? `, ${unread} mensajes sin leer` : ''}`,
    onClick,
    onKeydown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    },
  });

  // Avatar
  item.appendChild(Avatar({ initials, size: 'sm', status }));

  // Info central
  const info = div({ className: 'chat-item-info' }, item);

  // Fila superior: nombre + tiempo
  const top = div({ className: 'chat-item-top' }, info);
  span({ className: 'chat-item-name' }, top, name);
  span({ className: 'chat-item-time' }, top, formatDate(lastTime));

  // Preview del último mensaje
  span({ className: 'chat-item-preview' }, info, truncate(lastMessage, 50));

  // Badge de no leídos
  if (unread > 0) {
    item.appendChild(BadgeCount({ count: unread }));
  }

  // Badge de bloqueado
  if (isBlocked(id)) {
    const blockedBadge = document.createElement('span');
    blockedBadge.className = 'chat-item-blocked';
    blockedBadge.textContent = '🚫';
    blockedBadge.title = 'Usuario bloqueado';
    blockedBadge.setAttribute('aria-label', 'Usuario bloqueado');
    item.appendChild(blockedBadge);
  }

  return item;
};
