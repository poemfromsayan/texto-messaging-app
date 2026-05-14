/**
 * ConversationView.js — Texto. Conversation View
 *
 * Se monta dentro del área de contenido de ChatListView (desktop)
 * o reemplaza toda la pantalla (mobile).
 */

import { div, header, main, footer, span, h3, p, button } from '../../html.js';
import { MessageBubble }    from '../components/MessageBubble.js';
import { MessageInputBar }  from '../components/Input.js';
import { Avatar }           from '../components/Avatar.js';
import { Button }           from '../components/Button.js';
import { getChat, getMessages, sendMessage, receiveMessage, toggleReaction, deleteMessage, pinMessage, unpinMessage, getPinnedMessageId, setDisappearTimer, getDisappearTimer, DISAPPEAR_OPTIONS, getState, subscribe, blockUser, unblockUser, isBlocked, forwardMessage } from '../store.js';
import { navigate } from '../navigation.js';
import { scrollToBottom, formatDateSeparator, isGhostMode } from '../utils.js';

/**
 * @param {Object} props
 * @param {string} props.chatId - ID del chat a mostrar
 * @returns {HTMLElement}
 */
export const ConversationView = ({ chatId } = {}) => {

  injectStyles();

  const chat = getChat(chatId);

  // Chat no encontrado
  if (!chat) {
    const err = div({ className: 'conv-error' });
    p({}, err, 'Conversación no encontrada.');
    return err;
  }

  // ── Shell ──────────────────────────────────────────────────────────────────
  const view = div({ className: 'conv-view anim-fade-in' });

  // ── Header ─────────────────────────────────────────────────────────────────
  const head = header({ className: 'conv-header glass' }, view);

  // Botón volver (visible solo en mobile)
  head.appendChild(Button({
    text: '←',
    variant: 'ghost',
    size: 'sm',
    iconOnly: true,
    ariaLabel: 'Volver a chats',
    onClick: () => navigate('/chats'),
  }));

  // Info del contacto
  const contactInfo = div({ className: 'conv-contact' }, head);
  contactInfo.appendChild(Avatar({
    initials: chat.initials,
    size: 'sm',
    status: chat.status,
  }));

  const contactText = div({ className: 'conv-contact-text' }, contactInfo);
  h3({ className: 'conv-contact-name' }, contactText, chat.name);

  const statusLabels = {
    online:  'En línea',
    away:    'Ausente',
    busy:    'No molestar',
    offline: 'Desconectado',
  };
  const statusColors = {
    online:  'var(--status-online)',
    away:    'var(--status-warning)',
    busy:    'var(--status-danger)',
    offline: 'var(--text-muted)',
  };

  span({
    className: 'conv-contact-status',
    style: { color: statusColors[chat.status] ?? 'var(--text-muted)' },
  }, contactText, statusLabels[chat.status] ?? 'Desconectado');

  // ── Botón de temporizador de autodestrucción ─────────────────────────────
  const timerBtn = div({
    className: 'conv-timer-btn',
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Temporizador de mensajes',
    title: 'Mensajes que se autodestruyen',
  }, head);

  const updateTimerBtn = () => {
    const secs = getDisappearTimer(chatId);
    timerBtn.textContent = secs ? '💣' : '⏱';
    timerBtn.classList.toggle('conv-timer-btn--active', !!secs);
    timerBtn.title = secs
      ? `Autodestrucción: ${DISAPPEAR_OPTIONS.find(o => o.value === secs)?.label ?? secs + 's'}`
      : 'Mensajes que se autodestruyen (desactivado)';
  };

  updateTimerBtn();

  // Menú desplegable de opciones
  const buildTimerMenu = () => {
    const existing = document.getElementById('timer-menu');
    if (existing) { existing.remove(); return; }

    const menu = div({ className: 'conv-timer-menu glass-strong' });
    menu.id = 'timer-menu';

    DISAPPEAR_OPTIONS.forEach(opt => {
      const current = getDisappearTimer(chatId);
      const item = div({
        className: ['conv-timer-item', current === opt.value ? 'conv-timer-item--active' : ''].filter(Boolean).join(' '),
        role: 'menuitem',
        tabIndex: 0,
        onClick: () => {
          setDisappearTimer(chatId, opt.value);
          updateTimerBtn();
          menu.remove();
        },
      }, menu, opt.label);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); item.click(); }
      });
    });

    // Posicionar bajo el botón
    const rect = timerBtn.getBoundingClientRect();
    menu.style.position  = 'fixed';
    menu.style.top       = (rect.bottom + 4) + 'px';
    menu.style.right     = (window.innerWidth - rect.right) + 'px';

    document.body.appendChild(menu);

    // Cerrar al hacer clic fuera
    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target !== timerBtn) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  };

  timerBtn.addEventListener('click', buildTimerMenu);
  timerBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buildTimerMenu(); }
  });

  // ── Badge de cifrado E2E ─────────────────────────────────────────────────
  const e2eBadge = div({
    className: 'conv-e2e-badge',
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Cifrado de extremo a extremo',
    title: 'Cifrado de extremo a extremo',
  }, head, '🔒');

  const buildE2eTooltip = () => {
    const existing = document.getElementById('e2e-tooltip');
    if (existing) { existing.remove(); return; }

    const tip = div({ className: 'e2e-tooltip glass-strong' });
    tip.id = 'e2e-tooltip';
    tip.setAttribute('role', 'tooltip');

    span({ className: 'e2e-tooltip-title' }, tip, '🔒 Cifrado de extremo a extremo');
    span({ className: 'e2e-tooltip-body' }, tip,
      'Los mensajes están cifrados de extremo a extremo. Solo tú y ' + chat.name + ' pueden leerlos.'
    );

    const rect = e2eBadge.getBoundingClientRect();
    tip.style.position = 'fixed';
    tip.style.top      = (rect.bottom + 6) + 'px';
    tip.style.right    = (window.innerWidth - rect.right) + 'px';

    document.body.appendChild(tip);
    // Animar entrada
    requestAnimationFrame(() => tip.classList.add('e2e-tooltip--visible'));

    const close = (e) => {
      if (!tip.contains(e.target) && e.target !== e2eBadge) {
        tip.remove();
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 0);
  };

  e2eBadge.addEventListener('click', buildE2eTooltip);
  e2eBadge.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buildE2eTooltip(); }
  });

  // ── Menú de opciones ⋯ (bloquear / desbloquear) ──────────────────────────
  const optBtn = div({
    className: 'conv-opt-btn',
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Opciones',
    title: 'Opciones',
  }, head, '⋯');

  const buildOptMenu = () => {
    const existing = document.getElementById('opt-menu');
    if (existing) { existing.remove(); return; }

    const blocked = isBlocked(chatId);
    const menu = div({ className: 'conv-timer-menu glass-strong' });
    menu.id = 'opt-menu';

    const blockItem = div({
      className: 'conv-timer-item',
      role: 'menuitem',
      tabIndex: 0,
    }, menu, blocked ? '✓  Desbloquear usuario' : '🚫  Bloquear usuario');

    blockItem.addEventListener('click', () => {
      blocked ? unblockUser(chatId) : blockUser(chatId);
      menu.remove();
      updateBlockedState();
    });
    blockItem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); blockItem.click(); }
    });

    const rect = optBtn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top      = (rect.bottom + 4) + 'px';
    menu.style.right    = (window.innerWidth - rect.right) + 'px';
    document.body.appendChild(menu);

    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target !== optBtn) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  };

  optBtn.addEventListener('click', buildOptMenu);
  optBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buildOptMenu(); }
  });

  // Banner de usuario bloqueado (se muestra sobre el input cuando está bloqueado)
  const blockedBanner = div({ className: 'blocked-banner' });

  const updateBlockedState = () => {
    const blocked = isBlocked(chatId);

    // Actualizar el banner
    blockedBanner.innerHTML = '';
    if (blocked) {
      span({ className: 'blocked-banner-icon' }, blockedBanner, '🚫');
      const txt = span({ className: 'blocked-banner-text' }, blockedBanner);
      txt.textContent = `Has bloqueado a ${chat.name}.`;
      const unblockBtn = button({
        className: 'blocked-banner-btn',
        onClick: () => { unblockUser(chatId); updateBlockedState(); },
      }, blockedBanner, 'Desbloquear');
    }

    blockedBanner.classList.toggle('blocked-banner--visible', blocked);

    // Mostrar/ocultar el input bar
    bar.style.display = blocked ? 'none' : '';

    // Insertar/retirar el banner antes del input bar
    if (blocked) {
      if (!view.contains(blockedBanner)) view.insertBefore(blockedBanner, bar);
    } else {
      blockedBanner.remove();
    }
  };

  // ── Modal de reenvío ─────────────────────────────────────────────────────
  let fwdModalEl = null;

  const openForwardModal = (message) => {
    if (fwdModalEl) return;

    const overlay = div({
      className: 'modal-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Reenviar mensaje',
    });

    const panel = div({ className: 'modal-panel glass-strong anim-scale-in' }, overlay);

    // Header
    const modalHeader = div({ className: 'modal-header' }, panel);
    span({ className: 'modal-title' }, modalHeader, '↗  Reenviar mensaje');
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.addEventListener('click', closeFwdModal);
    modalHeader.appendChild(closeBtn);

    // Toggle: reenviar sin nombre
    const anonRow = div({ className: 'fwd-anon-row' }, panel);
    const anonLabel = span({ className: 'fwd-anon-label' }, anonRow, 'Reenviar sin nombre');
    let anonymous = false;
    const anonToggle = div({
      className: 'profile-sound-toggle',
      role: 'switch',
      tabIndex: 0,
      'aria-checked': 'false',
      'aria-label': 'Reenviar sin nombre',
    }, anonRow);
    div({ className: 'profile-sound-thumb' }, anonToggle);
    anonToggle.addEventListener('click', () => {
      anonymous = !anonymous;
      anonToggle.classList.toggle('profile-sound-toggle--on', anonymous);
      anonToggle.setAttribute('aria-checked', String(anonymous));
    });
    anonToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); anonToggle.click(); }
    });

    // Lista de chats (excluyendo el actual)
    const chatListEl = div({ className: 'modal-contact-list' }, panel);
    const allChats = getState().chats.filter(c => c.id !== chatId);

    if (allChats.length === 0) {
      const empty = div({ className: 'search-empty' }, chatListEl);
      span({ className: 'search-empty-icon' }, empty, '💬');
      p({ className: 'search-empty-text' }, empty, 'No hay otros chats');
    } else {
      allChats.forEach(c => {
        const item = div({ className: 'modal-contact-item', role: 'button', tabIndex: 0 }, chatListEl);
        item.prepend(Avatar({ initials: c.initials, size: 'sm', status: c.status }));
        div({ className: 'modal-contact-name' }, item, c.name);
        div({ className: 'modal-contact-status' }, item, '↗ Reenviar aquí');

        const doForward = () => {
          forwardMessage(c.id, message, anonymous);
          closeFwdModal();
        };
        item.addEventListener('click', doForward);
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doForward(); }
        });
      });
    }

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeFwdModal(); });
    const handleKey = (e) => { if (e.key === 'Escape') closeFwdModal(); };
    document.addEventListener('keydown', handleKey);
    overlay._cleanup = () => document.removeEventListener('keydown', handleKey);

    document.body.appendChild(overlay);
    fwdModalEl = overlay;
    setTimeout(() => fwdModalEl?.querySelector('.profile-sound-toggle')?.focus(), 50);
  };

  const closeFwdModal = () => {
    if (!fwdModalEl) return;
    fwdModalEl._cleanup?.();
    fwdModalEl.classList.add('modal-closing');
    fwdModalEl.addEventListener('animationend', () => {
      fwdModalEl?.remove();
      fwdModalEl = null;
    }, { once: true });
  };

  // ── Banner de mensaje fijado ──────────────────────────────────────────────
  const pinnedBanner = div({ className: 'pinned-banner' }, view);

  const updatePinnedBanner = () => {
    const pinnedId = getPinnedMessageId(chatId);
    pinnedBanner.innerHTML = '';

    if (!pinnedId) {
      pinnedBanner.classList.remove('pinned-banner--visible');
      return;
    }

    const msgs    = getMessages(chatId);
    const pinned  = msgs.find(m => m.id === pinnedId);
    if (!pinned) {
      pinnedBanner.classList.remove('pinned-banner--visible');
      return;
    }

    const icon    = span({ className: 'pinned-banner-icon' }, pinnedBanner, '📌');
    const info    = div({ className: 'pinned-banner-info' }, pinnedBanner);
    span({ className: 'pinned-banner-title' }, info, 'Mensaje fijado');
    span({ className: 'pinned-banner-text'  }, info,
      pinned.imageData && !pinned.text ? '📷 Imagen' : (pinned.text ?? '')
    );

    const closeBtn = button({
      className: 'pinned-banner-close',
      'aria-label': 'Desfijar',
      onClick: (e) => { e.stopPropagation(); unpinMessage(chatId); },
    }, pinnedBanner, '✕');

    // Clic en el banner (no en el ✕) → scroll al mensaje
    pinnedBanner.addEventListener('click', (e) => {
      if (e.target === closeBtn || closeBtn.contains(e.target)) return;
      const msgEl = messagesArea.querySelector(`[data-msg-id="${pinnedId}"]`);
      if (msgEl) msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    pinnedBanner.classList.add('pinned-banner--visible');
  };

  // ── Área de mensajes ───────────────────────────────────────────────────────
  const messagesArea = main({
    className: 'conv-messages',
    'aria-live': 'polite',
    'aria-label': `Mensajes con ${chat.name}`,
  }, view);

  // Helper: comprueba si dos fechas son del mismo día calendario
  const sameDay = (a, b) => {
    const da = a instanceof Date ? a : new Date(a);
    const db = b instanceof Date ? b : new Date(b);
    return da.getDate()     === db.getDate()  &&
           da.getMonth()    === db.getMonth() &&
           da.getFullYear() === db.getFullYear();
  };

  // Crea el elemento separador de fecha
  const makeDateSeparator = (date) => {
    const sep = div({ className: 'date-separator' });
    const label = span({ className: 'date-separator-label' }, sep,
      formatDateSeparator(date)
    );
    return sep;
  };

  // ── Estado de multi-selección ─────────────────────────────────────────────
  let selectMode = false;
  const selectedIds = new Set();

  const enterSelectMode = (firstMsgId) => {
    selectMode = true;
    selectedIds.clear();
    if (firstMsgId) selectedIds.add(firstMsgId);
    renderMessages(getMessages(chatId));
    selectBar.classList.add('select-bar--visible');
    bar.style.display = 'none';
    updateSelectBar();
  };

  const exitSelectMode = () => {
    selectMode = false;
    selectedIds.clear();
    renderMessages(getMessages(chatId));
    selectBar.classList.remove('select-bar--visible');
    bar.style.display = '';
  };

  const toggleSelect = (msgId) => {
    if (selectedIds.has(msgId)) selectedIds.delete(msgId);
    else selectedIds.add(msgId);
    // Re-render para reflejar cambios de selección
    renderMessages(getMessages(chatId));
    updateSelectBar();
  };

  const updateSelectBar = () => {
    const n = selectedIds.size;
    selectBarCount.textContent = n === 1 ? '1 mensaje seleccionado' : `${n} mensajes seleccionados`;
    selectBarDelete.disabled = n === 0;
  };

  const renderMessages = (msgs) => {
    messagesArea.innerHTML = '';

    // Banner de cifrado E2E — siempre visible al inicio del historial
    const e2eBanner = div({ className: 'e2e-banner' }, messagesArea);
    span({ className: 'e2e-banner-icon' }, e2eBanner, '🔒');
    span({ className: 'e2e-banner-text' }, e2eBanner,
      'Los mensajes están cifrados de extremo a extremo.'
    );

    if (msgs.length === 0) {
      div({ className: 'conv-no-messages' }, messagesArea, 'No hay mensajes aún. ¡Di hola! 👋');
      return;
    }

    let lastDate = null;

    msgs.forEach(msg => {
      const msgDate = msg.time instanceof Date ? msg.time : new Date(msg.time);

      // Insertar separador si el día cambió
      if (!lastDate || !sameDay(lastDate, msgDate)) {
        messagesArea.appendChild(makeDateSeparator(msgDate));
        lastDate = msgDate;
      }

      const bubbleEl = MessageBubble({
        text:           msg.text,
        sent:           msg.sent,
        time:           msg.time,
        delivered:      msg.delivered ?? false,
        senderInitials: chat.initials,
        senderStatus:   chat.status,
        imageData:      msg.imageData ?? null,
        replyTo:        msg.replyTo ?? null,
        msgId:          msg.id,
        reactions:      msg.reactions ?? {},
        onReact:        selectMode ? null : (emoji) => toggleReaction(chatId, msg.id, emoji),
        onReply:        selectMode ? null : () => startReply(msg),
        deleted:        msg.deleted ?? false,
        onDelete:       selectMode ? null : () => deleteMessage(chatId, msg.id),
        pinned:         getPinnedMessageId(chatId) === msg.id,
        onPin:          selectMode ? null : () => {
          if (getPinnedMessageId(chatId) === msg.id) {
            unpinMessage(chatId);
          } else {
            pinMessage(chatId, msg.id);
          }
        },
        selectable:     selectMode,
        selected:       selectedIds.has(msg.id),
        onSelect:       (id) => selectMode ? toggleSelect(id) : enterSelectMode(id),
        onForward:      selectMode ? null : () => openForwardModal(msg),
        forwardedFrom:  msg.forwardedFrom ?? null,
      });
      bubbleEl.dataset.msgId = msg.id;
      messagesArea.appendChild(bubbleEl);
    });

    scrollToBottom(messagesArea);
    updatePinnedBanner();
  };

  renderMessages(getMessages(chatId));

  // ── Reply context bar ────────────────────────────────────────────────────
  let replyToMsg = null;
  const replyBar = div({ className: 'reply-bar' });

  const startReply = (msg) => {
    replyToMsg = {
      id:         msg.id,
      text:       msg.text,
      imageData:  msg.imageData ?? null,
      senderName: msg.sent ? getState().user.name : chat.name,
    };

    replyBar.innerHTML = '';
    const icon  = span({ className: 'reply-bar-icon' }, replyBar, '↩');
    const info  = div({ className: 'reply-bar-info' }, replyBar);
    span({ className: 'reply-bar-author' }, info, replyToMsg.senderName);
    span({ className: 'reply-bar-preview' }, info,
      replyToMsg.imageData && !replyToMsg.text ? '📷 Imagen' : (replyToMsg.text ?? '')
    );
    const cancel = button({
      className: 'reply-bar-cancel',
      'aria-label': 'Cancelar respuesta',
      onClick: cancelReply,
    }, replyBar, '✕');

    replyBar.classList.add('reply-bar--visible');

    // Insertar justo antes del footer
    if (!bar.previousSibling || bar.previousSibling !== replyBar) {
      view.insertBefore(replyBar, bar);
    }
  };

  const cancelReply = () => {
    replyToMsg = null;
    replyBar.classList.remove('reply-bar--visible');
    setTimeout(() => replyBar.remove(), 150);
  };

  // ── Typing indicator ──────────────────────────────────────────────────────
  const typingEl = div({ className: 'typing-row' });
  const typingBubble = div({ className: 'typing-bubble bubble-received' }, typingEl);
  typingBubble.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;

  let typingTimeout = null;

  const autoReplies = [
    '👍',
    'Claro, entendido.',
    'Sí, ahora te confirmo.',
    '¡Perfecto!',
    'Dame un momento.',
    'Ok, ya veo.',
    '¿Me puedes dar más detalles?',
  ];

  const showTyping = () => {
    if (!messagesArea.contains(typingEl)) {
      messagesArea.appendChild(typingEl);
      scrollToBottom(messagesArea);
    }
  };

  const hideTyping = () => {
    if (messagesArea.contains(typingEl)) {
      messagesArea.removeChild(typingEl);
    }
  };

  // ── Barra de multi-selección (reemplaza el input cuando está activa) ────────
  const selectBar = div({ className: 'select-bar glass' });
  const selectBarCount  = span({ className: 'select-bar-count' }, selectBar, '');
  const selectBarRight  = div({ className: 'select-bar-actions' }, selectBar);

  const selectBarDelete = button({
    className: 'select-bar-btn select-bar-btn--danger',
    'aria-label': 'Eliminar seleccionados',
    disabled: true,
  }, selectBarRight, '🗑 Eliminar');

  const selectBarClose = button({
    className: 'select-bar-btn',
    'aria-label': 'Cancelar selección',
  }, selectBarRight, '✕ Cancelar');

  selectBarDelete.addEventListener('click', () => {
    selectedIds.forEach(id => deleteMessage(chatId, id));
    exitSelectMode();
  });
  selectBarClose.addEventListener('click', exitSelectMode);
  // updateSelectBar y enterSelectMode ya referencian selectBar, selectBarCount, selectBarDelete

  // ── Barra de escritura ─────────────────────────────────────────────────────
  const bar = footer({ className: 'conv-footer glass' }, view);
  view.appendChild(selectBar);   // hidden by default, shown in select mode
  updateBlockedState();           // aplica estado de bloqueo inicial
  bar.appendChild(MessageInputBar({
    onSend: ({ text, imageData }) => {
      sendMessage(chatId, text, imageData, replyToMsg);
      cancelReply();

      // Limpia timeout anterior si el usuario envía rápido
      clearTimeout(typingTimeout);

      // En Ghost Mode el indicador de escritura se suprime,
      // la respuesta llega directamente sin revelar actividad
      if (!isGhostMode()) {
        showTyping();
      }

      // Tras 1.5–2.5s oculta el indicador y envía respuesta simulada
      const delay = 1500 + Math.random() * 1000;
      typingTimeout = setTimeout(() => {
        hideTyping();
        const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
        receiveMessage(chatId, reply);
      }, delay);
    },
  }));

  // ── Suscripción: re-renderiza mensajes cuando cambian ──────────────────────
  const unsubscribe = subscribe((state) => {
    const msgs = state.messages[chatId] ?? [];
    renderMessages(msgs);
    updatePinnedBanner();
    updateBlockedState();
  });

  const observer = new MutationObserver(() => {
    if (!document.body.contains(view)) {
      unsubscribe();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return view;
};

/* ── Estilos de la vista ──────────────────────────────────────────────────── */

const injectStyles = () => {
  if (document.getElementById('style-conversation')) return;

  const style = document.createElement('style');
  style.id = 'style-conversation';
  style.textContent = `

    /* ── Shell ──────────────────────────────────────────────────────────── */
    .conv-view {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 100dvh;
      overflow: hidden;
    }

    /* ── Header ─────────────────────────────────────────────────────────── */
    .conv-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--glass-border);
      flex-shrink: 0;
      z-index: var(--z-raised);
    }

    .conv-contact {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex: 1;
      min-width: 0;
    }

    .conv-contact-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .conv-contact-name {
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
      letter-spacing: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conv-contact-status {
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
    }

    /* ── Temporizador de autodestrucción ───────────────────────────────── */
    .conv-timer-btn {
      font-size: 18px;
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: var(--transition-fast);
      opacity: 0.45;
      flex-shrink: 0;
      line-height: 1;
      user-select: none;
    }
    .conv-timer-btn:hover          { opacity: 0.85; background: var(--glass-2); }
    .conv-timer-btn--active        { opacity: 1; }
    .conv-timer-btn:focus-visible  { outline: 2px solid var(--text-secondary); outline-offset: 2px; }

    .conv-timer-menu {
      min-width: 160px;
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      z-index: 300;
      border: 1px solid var(--glass-border-strong);
    }

    .conv-timer-item {
      padding: var(--space-3) var(--space-4);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .conv-timer-item:hover          { background: var(--glass-2); color: var(--text-primary); }
    .conv-timer-item--active        { color: var(--accent-primary); font-weight: var(--weight-semibold); }
    .conv-timer-item:focus-visible  { outline: 2px solid var(--text-secondary); }

    /* Ocultar botón "volver" en desktop */
    @media (min-width: 681px) {
      .conv-header .btn:first-child {
        display: none;
      }
    }

    /* ── Mensajes ───────────────────────────────────────────────────────── */
    .conv-messages {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-4) var(--space-5);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    /* ── Separadores de fecha ───────────────────────────────────────────── */
    .date-separator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-2) 0;
      pointer-events: none;
      user-select: none;
    }

    .date-separator-label {
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      color: var(--text-muted);
      background: var(--glass-2);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-full);
      padding: 3px 12px;
      backdrop-filter: var(--blur-sm);
      letter-spacing: 0.02em;
    }

    .conv-no-messages {
      text-align: center;
      color: var(--text-muted);
      font-size: var(--text-sm);
      margin: auto;
    }

    /* Burbujas (desde design system) */
    .msg-row {
      display: flex;
      align-items: flex-end;
      gap: var(--space-2);
      animation: bubbleIn var(--transition-fast) ease both;
    }
    /* justify-content es más confiable que row-reverse para alinear al lado derecho */
    .msg-row-sent { justify-content: flex-end; }

    /* El max-width vive en el wrapper — evita dependencia circular con el porcentaje */
    .bubble-wrapper { max-width: 72%; }

    .bubble {
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-xl);
      font-size: var(--text-sm);
      line-height: var(--leading-relaxed);
      box-shadow: var(--shadow-sm);
    }
    .bubble-received {
      background: var(--glass-3);
      border: 1px solid var(--glass-border-strong);
      color: var(--text-primary);
      border-bottom-left-radius: var(--radius-xs);
      backdrop-filter: var(--blur-md);
      -webkit-backdrop-filter: var(--blur-md);
    }
    .bubble-sent {
      background: var(--bubble-sent-bg);
      border: 1px solid var(--bubble-sent-border);
      color: var(--text-primary);
      border-bottom-right-radius: var(--radius-xs);
      backdrop-filter: var(--blur-md);
      -webkit-backdrop-filter: var(--blur-md);
    }

    .bubble-time {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: var(--space-1);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 3px;
    }
    .bubble-checkmark { color: var(--text-secondary); font-size: 11px; }

    /* ── Footer / Input bar ─────────────────────────────────────────────── */
    .conv-footer {
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--glass-border);
      flex-shrink: 0;
    }

    .msg-input-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: var(--glass-2);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-full);
      padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
      backdrop-filter: var(--blur-md);
      transition: var(--transition-base);
    }
    .msg-input-row:focus-within {
      border-color: var(--text-secondary);
      background: var(--glass-3);
    }

    .msg-input {
      flex: 1;
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      color: var(--text-primary);
      background: transparent;
      border: none;
      outline: none;
    }
    .msg-input::placeholder { color: var(--text-muted); }

    /* ── Buttons genéricos (reutilizados aquí) ──────────────────────────── */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      border-radius: var(--radius-full);
      border: 1px solid transparent;
      padding: 10px 20px;
      cursor: pointer;
      transition: var(--transition-base);
      line-height: 1;
      white-space: nowrap;
    }
    .btn:active { transform: scale(0.97); }
    .btn-primary {
      background: var(--accent-primary);
      color: var(--accent-on-primary);
      box-shadow: var(--shadow-sm);
    }
    .btn-primary:hover { background: var(--accent-primary-hover); transform: translateY(-1px); }
    .btn-ghost {
      background: transparent;
      border-color: var(--glass-border);
      color: var(--text-secondary);
    }
    .btn-ghost:hover { background: var(--glass-1); color: var(--text-primary); }
    .btn-sm  { font-size: 11px; padding: 6px 14px; }
    .btn-icon { padding: 10px; }

    /* ── Conv error ─────────────────────────────────────────────────────── */
    .conv-error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
    }

    /* ── Banner de mensaje fijado ───────────────────────────────────────── */
    .pinned-banner {
      display: none;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-5);
      background: var(--glass-2);
      border-bottom: 1px solid var(--glass-border);
      cursor: pointer;
      transition: var(--transition-fast);
      flex-shrink: 0;
      border-left: 3px solid var(--accent-primary);
    }
    .pinned-banner--visible { display: flex; }
    .pinned-banner:hover { background: var(--glass-3); }

    .pinned-banner-icon { font-size: var(--text-sm); flex-shrink: 0; }

    .pinned-banner-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .pinned-banner-title {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--accent-primary);
    }

    .pinned-banner-text {
      font-size: var(--text-xs);
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pinned-banner-close {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      font-size: var(--text-xs);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      transition: var(--transition-fast);
      font-family: var(--font-sans);
      flex-shrink: 0;
    }
    .pinned-banner-close:hover { color: var(--text-primary); background: var(--glass-3); }

    /* ── Badge E2E en el header ─────────────────────────────────────────── */
    .conv-e2e-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      font-size: 14px;
      cursor: pointer;
      transition: var(--transition-fast);
      flex-shrink: 0;
      opacity: 0.7;
    }
    .conv-e2e-badge:hover        { opacity: 1; background: var(--glass-2); }
    .conv-e2e-badge:focus-visible { outline: 2px solid var(--text-secondary); outline-offset: 2px; opacity: 1; }

    /* ── Tooltip E2E ────────────────────────────────────────────────────── */
    .e2e-tooltip {
      position: fixed;
      max-width: 240px;
      border-radius: var(--radius-xl);
      padding: var(--space-3) var(--space-4);
      z-index: calc(var(--z-modal) + 10);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      opacity: 0;
      transform: translateY(-4px) scale(0.97);
      transition: opacity 0.15s ease, transform 0.15s ease;
      pointer-events: none;
      box-shadow: var(--shadow-lg);
    }
    .e2e-tooltip--visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .e2e-tooltip-title {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
    }
    .e2e-tooltip-body {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      line-height: var(--leading-relaxed);
    }

    /* ── Banner E2E al inicio del historial ─────────────────────────────── */
    .e2e-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-5);
      margin: var(--space-3) auto;
      max-width: 320px;
      background: var(--glass-1);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-xl);
    }

    .e2e-banner-icon { font-size: var(--text-xs); opacity: 0.7; }
    .e2e-banner-text {
      font-size: 11px;
      color: var(--text-muted);
      text-align: center;
      line-height: var(--leading-relaxed);
    }

    /* ── Icono 🔒 en burbuja enviada ────────────────────────────────────── */
    .bubble-e2e-lock {
      font-size: 8px;
      opacity: 0.45;
      margin-right: 1px;
      line-height: 1;
    }

    /* ── Reply bar (encima del footer) ─────────────────────────────────── */
    .reply-bar {
      display: none;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-5);
      background: var(--glass-2);
      border-top: 1px solid var(--glass-border);
      border-left: 3px solid var(--text-secondary);
      animation: fadeIn 0.15s ease both;
      flex-shrink: 0;
    }
    .reply-bar--visible { display: flex; }

    .reply-bar-icon { font-size: var(--text-base); color: var(--text-secondary); }

    .reply-bar-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .reply-bar-author {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--text-secondary);
    }

    .reply-bar-preview {
      font-size: var(--text-xs);
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .reply-bar-cancel {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      font-size: var(--text-sm);
      padding: var(--space-1);
      border-radius: var(--radius-full);
      transition: var(--transition-fast);
      font-family: var(--font-sans);
      flex-shrink: 0;
    }
    .reply-bar-cancel:hover { color: var(--text-primary); background: var(--glass-3); }

    /* ── Cita dentro de la burbuja ───────────────────────────────────────── */
    .bubble-quote {
      border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3);
      margin-bottom: var(--space-2);
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-left: 3px solid;
    }
    .bubble-quote-sent     { background: rgba(0,0,0,0.08); border-color: rgba(255,255,255,0.4); }
    .bubble-quote-received { background: var(--glass-2);   border-color: var(--text-secondary); }

    .bubble-quote-author {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--text-secondary);
    }

    .bubble-quote-text {
      font-size: var(--text-xs);
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bubble-quote-img {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      object-fit: cover;
    }

    /* ── Reacciones ─────────────────────────────────────────────────────── */

    /* Picker: aparece al hacer hover sobre la fila del mensaje */
    .msg-row { position: relative; }

    .reaction-picker {
      position: absolute;
      top: -36px;
      display: flex;
      gap: 2px;
      background: var(--glass-3);
      border: 1px solid var(--glass-border-strong);
      border-radius: var(--radius-full);
      padding: 4px 8px;
      backdrop-filter: var(--blur-md);
      box-shadow: var(--shadow-md);
      opacity: 0;
      pointer-events: none;
      transform: translateY(4px) scale(0.9);
      transition: opacity 0.15s ease, transform 0.15s ease;
      z-index: 10;
    }
    .reaction-picker-sent     { right: 0; }
    .reaction-picker-received { left: 36px; } /* 36px = ancho del avatar */

    .msg-row:hover .reaction-picker {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    .reaction-picker-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 2px 3px;
      border-radius: var(--radius-md);
      transition: transform 0.1s ease;
      line-height: 1;
      font-family: var(--font-sans);
    }
    .reaction-picker-btn:hover { transform: scale(1.3); }

    .reaction-picker-divider {
      width: 1px;
      height: 20px;
      background: var(--glass-border-strong);
      margin: 0 2px;
      flex-shrink: 0;
    }

    .reaction-reply-btn {
      font-size: 15px;
      opacity: 0.7;
    }
    .reaction-reply-btn:hover { opacity: 1; transform: scale(1.2); }

    .reaction-delete-btn {
      font-size: 15px;
      opacity: 0.6;
    }
    .reaction-delete-btn:hover { opacity: 1; transform: scale(1.2); filter: sepia(1) saturate(4) hue-rotate(-20deg); }

    /* ── Mensaje eliminado ───────────────────────────────────────────────── */
    .bubble-deleted {
      font-style: italic;
      opacity: 0.55;
      font-size: var(--text-xs);
      padding: var(--space-2) var(--space-3);
    }

    /* Badges de reacciones debajo de la burbuja */
    .reaction-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      margin-top: 4px;
    }

    .reaction-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: var(--glass-2);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-full);
      padding: 2px 8px;
      font-size: 13px;
      cursor: pointer;
      transition: var(--transition-fast);
      font-family: var(--font-sans);
    }
    .reaction-badge:hover { background: var(--glass-3); }
    .reaction-badge-mine  {
      background: var(--glass-3);
      border-color: var(--text-secondary);
    }

    .reaction-count {
      font-size: 11px;
      font-weight: var(--weight-semibold);
      color: var(--text-secondary);
      font-family: var(--font-sans);
    }

    /* ── Typing indicator ───────────────────────────────────────────────── */
    /* ── Modal de reenvío ──────────────────────────────────────────────── */
    .fwd-anon-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) var(--space-5);
      border-bottom: 1px solid var(--glass-border);
      flex-shrink: 0;
    }
    .fwd-anon-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    /* ── Botón opciones ⋯ ──────────────────────────────────────────────── */
    .conv-opt-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      font-size: 18px;
      font-weight: var(--weight-bold);
      letter-spacing: 1px;
      cursor: pointer;
      transition: var(--transition-fast);
      flex-shrink: 0;
      color: var(--text-muted);
      line-height: 1;
    }
    .conv-opt-btn:hover        { background: var(--glass-2); color: var(--text-primary); }
    .conv-opt-btn:focus-visible { outline: 2px solid var(--text-secondary); outline-offset: 2px; }

    /* ── Banner de usuario bloqueado ────────────────────────────────────── */
    .blocked-banner {
      display: none;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-5);
      background: rgba(239, 68, 68, 0.08);
      border-top: 1px solid rgba(239, 68, 68, 0.2);
      flex-shrink: 0;
    }
    .blocked-banner--visible { display: flex; }

    .blocked-banner-icon { font-size: var(--text-sm); }

    .blocked-banner-text {
      flex: 1;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .blocked-banner-btn {
      font-family: var(--font-sans);
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      border: 1px solid rgba(239, 68, 68, 0.4);
      background: transparent;
      color: var(--status-danger);
      cursor: pointer;
      transition: var(--transition-fast);
      white-space: nowrap;
    }
    .blocked-banner-btn:hover { background: rgba(239, 68, 68, 0.12); }

    /* ── Barra de multi-selección ──────────────────────────────────────── */
    .select-bar {
      display: none;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--glass-border);
      gap: var(--space-3);
      flex-shrink: 0;
    }
    .select-bar--visible { display: flex; }

    .select-bar-count {
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
      flex: 1;
    }

    .select-bar-actions {
      display: flex;
      gap: var(--space-2);
    }

    .select-bar-btn {
      font-family: var(--font-sans);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-full);
      border: 1px solid var(--glass-border);
      background: var(--glass-1);
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .select-bar-btn:hover:not(:disabled) {
      background: var(--glass-2);
      color: var(--text-primary);
    }
    .select-bar-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .select-bar-btn--danger { color: var(--status-danger); border-color: var(--status-danger); }
    .select-bar-btn--danger:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.1);
      color: var(--status-danger);
    }

    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30%            { transform: translateY(-6px); opacity: 1; }
    }

    .typing-row {
      display: flex;
      align-items: flex-end;
      gap: var(--space-2);
      animation: bubbleIn var(--transition-fast) ease both;
    }

    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: var(--space-3) var(--space-4);
      min-width: 56px;
    }

    .typing-dot {
      width: 7px;
      height: 7px;
      border-radius: var(--radius-full);
      background: var(--text-muted);
      animation: typingBounce 1.2s infinite ease-in-out;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  `;
  document.head.appendChild(style);
};
