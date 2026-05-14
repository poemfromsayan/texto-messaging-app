/**
 * ChatListView.js — Texto. Chat List View
 *
 * Layout:
 *   Desktop: sidebar fijo (280px) + área de conversación (flex:1)
 *   Mobile:  sidebar ocupa el 100% — ConversationView reemplaza esta vista
 */

import { div, nav, header, main, h2, p, input, span, button } from '../../html.js';
import { ChatListItem }     from '../components/ChatListItem.js';
import { Avatar }           from '../components/Avatar.js';
import { Button }           from '../components/Button.js';
import { ConversationView } from './ConversationView.js';
import { getState, subscribe, getContacts, createChat, archiveChat, unarchiveChat } from '../store.js';
import { navigate }         from '../navigation.js';
import { toggleTheme, clearAuthentication, isGhostMode, isDemoMode } from '../utils.js';
import { DemoBanner } from '../components/DemoBanner.js';

/**
 * @param {Object} [props]
 * @param {string} [props.activeChatId] - ID del chat a mostrar abierto
 * @returns {HTMLElement}
 */
export const ChatListView = ({ activeChatId = null } = {}) => {

  injectStyles();

  const state = getState();
  const currentChatId = activeChatId ?? state.activeChatId;

  // ── Shell principal ────────────────────────────────────────────────────────
  // chat-open activa el layout mobile (oculta sidebar, muestra conversación)
  const view = div({ className: currentChatId ? 'app-shell chat-open' : 'app-shell' });

  // ── Banner de modo demo (visible solo si el usuario no está autenticado) ──
  if (isDemoMode()) view.prepend(DemoBanner());

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const sidebar = nav({
    className: 'sidebar glass',
    'aria-label': 'Lista de conversaciones',
  }, view);

  // Header del sidebar
  const sidebarHeader = header({ className: 'sidebar-header' }, sidebar);

  // Avatar del usuario + toggle de tema
  const userRow = div({ className: 'sidebar-user-row' }, sidebarHeader);

  const { user } = state;
  const userAvatarEl = Avatar({ initials: user.initials, size: 'sm', status: isGhostMode() ? 'offline' : user.status });
  userAvatarEl.style.cursor = 'pointer';
  userAvatarEl.setAttribute('role', 'button');
  userAvatarEl.setAttribute('tabindex', '0');
  userAvatarEl.setAttribute('aria-label', 'Ver mi perfil');
  userAvatarEl.addEventListener('click', () => navigate('/profile'));
  userAvatarEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/profile'); }
  });
  userRow.appendChild(userAvatarEl);
  span({ className: 'sidebar-username' }, userRow, user.name);

  userRow.appendChild(Button({
    text: '◑',
    variant: 'ghost',
    size: 'sm',
    iconOnly: true,
    ariaLabel: 'Cambiar tema',
    onClick: toggleTheme,
  }));

  userRow.appendChild(Button({
    text: '⏻',
    variant: 'ghost',
    size: 'sm',
    iconOnly: true,
    ariaLabel: 'Cerrar sesión',
    onClick: () => {
      clearAuthentication();
      navigate('/login');
    },
  }));

  userRow.appendChild(Button({
    text: '+',
    variant: 'ghost',
    size: 'sm',
    iconOnly: true,
    ariaLabel: 'Nuevo chat',
    onClick: () => openNewChatModal(),
  }));

  // Buscador
  const searchWrap = div({ className: 'sidebar-search-wrap' }, sidebarHeader);
  let searchQuery = '';
  const searchInput = input({
    type: 'search',
    placeholder: '🔍  Buscar…',
    className: 'sidebar-search',
    'aria-label': 'Buscar conversaciones',
    onInput: (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilter(getState().chats);
    },
  }, searchWrap);

  // Lista de chats
  const chatList = div({
    className: 'sidebar-chat-list',
    role: 'list',
    'aria-label': 'Conversaciones',
  }, sidebar);

  // ── Menú contextual: archivar / desarchivar ──────────────────────────────
  let activeCtxMenu = null;

  const closeCtxMenu = () => {
    activeCtxMenu?.remove();
    activeCtxMenu = null;
  };

  const openCtxMenu = (e, chatId, archived) => {
    e.preventDefault();
    closeCtxMenu();

    const menu = div({ className: 'ctx-menu glass-strong' });

    const actionLabel = archived ? '📤  Desarchivar' : '📁  Archivar';
    const action = div({ className: 'ctx-menu-item', role: 'menuitem', tabIndex: 0 }, menu, actionLabel);

    action.addEventListener('click', () => {
      archived ? unarchiveChat(chatId) : archiveChat(chatId);
      closeCtxMenu();
    });
    action.addEventListener('keydown', (ke) => {
      if (ke.key === 'Enter' || ke.key === ' ') { ke.preventDefault(); action.click(); }
    });

    // Posicionar junto al cursor
    menu.style.position = 'fixed';
    menu.style.left = `${Math.min(e.clientX, window.innerWidth - 160)}px`;
    menu.style.top  = `${Math.min(e.clientY, window.innerHeight - 80)}px`;

    document.body.appendChild(menu);
    activeCtxMenu = menu;
    action.focus();

    // Cerrar al hacer clic fuera
    const dismiss = (ev) => {
      if (!menu.contains(ev.target)) { closeCtxMenu(); document.removeEventListener('click', dismiss, true); }
    };
    setTimeout(() => document.addEventListener('click', dismiss, true), 0);
  };

  // ── Sección "Archivados" al fondo del sidebar ─────────────────────────────
  const archivedRow = div({ className: 'archived-row', role: 'button', tabIndex: 0, 'aria-label': 'Ver chats archivados' }, sidebar);
  let archivedExpanded = false;
  const archivedList = div({ className: 'archived-list' });

  const renderArchivedList = (chats, archivedIds) => {
    archivedList.innerHTML = '';
    const archived = chats.filter(c => archivedIds.includes(c.id));
    archived.forEach(chat => {
      const row = div({ className: 'archived-chat-row' }, archivedList);
      row.appendChild(ChatListItem({
        ...chat,
        active: false,
        onClick: () => navigate(`/chat/${chat.id}`),
      }));
      row.addEventListener('contextmenu', (e) => openCtxMenu(e, chat.id, true));

      const unarchBtn = div({ className: 'archived-unarchive-btn', title: 'Desarchivar', 'aria-label': 'Desarchivar chat' }, row, '📤');
      unarchBtn.addEventListener('click', (e) => { e.stopPropagation(); unarchiveChat(chat.id); });
    });
  };

  const updateArchivedRow = (chats, archivedIds) => {
    const count = archivedIds.length;
    archivedRow.innerHTML = '';

    if (count === 0) {
      archivedRow.style.display = 'none';
      archivedExpanded = false;
      archivedList.remove();
      return;
    }

    archivedRow.style.display = 'flex';
    span({ className: 'archived-row-icon' }, archivedRow, '📁');
    span({ className: 'archived-row-label' }, archivedRow, `Archivados`);
    span({ className: 'archived-row-badge' }, archivedRow, String(count));
    span({ className: 'archived-row-chevron' }, archivedRow, archivedExpanded ? '▾' : '▸');

    if (archivedExpanded) {
      renderArchivedList(chats, archivedIds);
      if (!sidebar.contains(archivedList)) sidebar.appendChild(archivedList);
    } else {
      archivedList.remove();
    }
  };

  archivedRow.addEventListener('click', () => {
    archivedExpanded = !archivedExpanded;
    const { chats, archivedChats } = getState();
    updateArchivedRow(chats, archivedChats);
  });
  archivedRow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); archivedRow.click(); }
  });

  // ── Renderiza los items (filtrados, excluyendo archivados) ────────────────
  const renderChatList = (chats, archivedIds = []) => {
    chatList.innerHTML = '';
    const visible = chats.filter(c => !archivedIds.includes(c.id));
    if (visible.length === 0) {
      const empty = div({ className: 'search-empty' }, chatList);
      div({ className: 'search-empty-icon' }, empty, '🔍');
      p({ className: 'search-empty-text' }, empty, searchQuery ? 'Sin resultados' : 'Todos los chats están archivados');
      return;
    }
    visible.forEach(chat => {
      const item = ChatListItem({
        ...chat,
        active: chat.id === currentChatId,
        onClick: () => navigate(`/chat/${chat.id}`),
      });
      item.addEventListener('contextmenu', (e) => openCtxMenu(e, chat.id, false));
      chatList.appendChild(item);
    });
  };

  // Filtra los chats por nombre o último mensaje y re-renderiza
  const applyFilter = (chats, archivedIds = getState().archivedChats) => {
    if (!searchQuery) {
      renderChatList(chats, archivedIds);
      updateArchivedRow(chats, archivedIds);
      return;
    }
    const filtered = chats.filter(chat =>
      !archivedIds.includes(chat.id) && (
        chat.name?.toLowerCase().includes(searchQuery) ||
        chat.lastMessage?.toLowerCase().includes(searchQuery)
      )
    );
    renderChatList(filtered, archivedIds);
    updateArchivedRow(chats, archivedIds);
  };

  applyFilter(state.chats, state.archivedChats);

  // ── Área de contenido (conversación o estado vacío) ────────────────────────
  const content = main({ className: 'content-area' }, view);

  if (currentChatId) {
    content.appendChild(ConversationView({ chatId: currentChatId }));
  } else {
    // Estado vacío en desktop
    const empty = div({ className: 'content-empty anim-fade-in' }, content);
    div({ className: 'content-empty-icon' }, empty, '💬');
    h2({ className: 'content-empty-title' }, empty, 'Texto.');
    p({ className: 'content-empty-desc' }, empty,
      'Selecciona una conversación para comenzar.'
    );
  }

  // ── Suscripción al store ───────────────────────────────────────────────────
  // Re-renderiza la lista respetando el filtro activo
  const unsubscribe = subscribe((newState) => {
    applyFilter(newState.chats, newState.archivedChats);
  });

  // Limpia la suscripción cuando la vista se desmonte del DOM
  const observer = new MutationObserver(() => {
    if (!document.body.contains(view)) {
      unsubscribe();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ── Modal: Nuevo Chat ─────────────────────────────────────────────────────
  const buildNewChatModal = () => {
    // Overlay
    const overlay = div({
      className: 'modal-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Nuevo chat',
    });

    // Panel
    const panel = div({ className: 'modal-panel glass-strong anim-scale-in' }, overlay);

    // Header del modal
    const modalHeader = div({ className: 'modal-header' }, panel);
    span({ className: 'modal-title' }, modalHeader, 'Nuevo chat');
    const closeBtn = button({
      className: 'modal-close',
      'aria-label': 'Cerrar',
      onClick: () => closeNewChatModal(),
    }, modalHeader, '✕');

    // Buscador del modal
    const modalSearch = input({
      type: 'search',
      placeholder: '🔍  Buscar contacto…',
      className: 'sidebar-search',
      'aria-label': 'Buscar contacto',
      style: { margin: '0 var(--space-4)' },
    }, panel);

    // Lista de contactos
    const contactList = div({ className: 'modal-contact-list' }, panel);

    const renderContacts = (query = '') => {
      contactList.innerHTML = '';
      const all = getContacts();
      const filtered = query
        ? all.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
        : all;

      if (filtered.length === 0) {
        const empty = div({ className: 'search-empty' }, contactList);
        div({ className: 'search-empty-icon' }, empty, '🔍');
        p({ className: 'search-empty-text' }, empty, 'Sin resultados');
        return;
      }

      filtered.forEach(contact => {
        const item = div({ className: 'modal-contact-item', role: 'button', tabIndex: 0 }, contactList);

        // Avatar del contacto (usa el import estático del módulo)
        item.prepend(Avatar({ initials: contact.initials, size: 'sm', status: contact.status }));

        div({ className: 'modal-contact-name' }, item, contact.name);

        const statusLabel = { online: 'En línea', away: 'Ausente', busy: 'No molestar', offline: 'Desconectado' };
        div({ className: 'modal-contact-status' }, item, statusLabel[contact.status] ?? '');

        const selectContact = () => {
          const chatId = createChat(contact);
          closeNewChatModal();
          navigate(`/chat/${chatId}`);
        };

        item.addEventListener('click', selectContact);
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectContact(); }
        });
      });
    };

    modalSearch.addEventListener('input', (e) => renderContacts(e.target.value));
    renderContacts();

    // Cerrar al hacer clic en el overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeNewChatModal();
    });

    // Cerrar con Escape
    const handleKey = (e) => {
      if (e.key === 'Escape') closeNewChatModal();
    };
    document.addEventListener('keydown', handleKey);
    overlay._cleanup = () => document.removeEventListener('keydown', handleKey);

    return overlay;
  };

  let modalEl = null;

  const openNewChatModal = () => {
    if (modalEl) return;
    modalEl = buildNewChatModal();
    document.body.appendChild(modalEl);
    // Foco al input de búsqueda
    setTimeout(() => modalEl?.querySelector('input')?.focus(), 50);
  };

  const closeNewChatModal = () => {
    if (!modalEl) return;
    modalEl._cleanup?.();
    modalEl.classList.add('modal-closing');
    modalEl.addEventListener('animationend', () => {
      modalEl?.remove();
      modalEl = null;
    }, { once: true });
  };

  return view;
};

/* ── Estilos de la vista ──────────────────────────────────────────────────── */

const injectStyles = () => {
  if (document.getElementById('style-chat-list')) return;

  const style = document.createElement('style');
  style.id = 'style-chat-list';
  style.textContent = `

    /* ── App shell ──────────────────────────────────────────────────────── */
    .app-shell {
      display: flex;
      width: 100%;
      min-height: 100dvh;
    }

    /* ── Sidebar ────────────────────────────────────────────────────────── */
    .sidebar {
      width: 300px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--glass-border);
      overflow: hidden;
    }

    .sidebar-header {
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      border-bottom: 1px solid var(--glass-border);
      flex-shrink: 0;
    }

    .sidebar-user-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .sidebar-username {
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
      flex: 1;
    }

    .sidebar-search-wrap {
      position: relative;
    }

    .sidebar-search {
      width: 100%;
      background: var(--glass-2);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-full);
      padding: var(--space-2) var(--space-4);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      color: var(--text-primary);
      outline: none;
      transition: var(--transition-base);
      backdrop-filter: var(--blur-sm);
    }

    .sidebar-search::placeholder { color: var(--text-muted); }
    .sidebar-search:focus {
      border-color: var(--text-secondary);
      background: var(--glass-3);
    }

    .sidebar-chat-list {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-2);
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    /* ── Chat item (desde design system) ────────────────────────────────── */
    .chat-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .chat-item:hover  { background: var(--glass-2); backdrop-filter: var(--blur-sm); }
    .chat-item.active { background: var(--glass-3); box-shadow: var(--shadow-sm); }
    .chat-item:focus-visible { outline: 2px solid var(--text-secondary); outline-offset: 2px; }

    .chat-item-info  { flex: 1; min-width: 0; }
    .chat-item-top   { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
    .chat-item-name  { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .chat-item-time  { font-size: 10px; color: var(--text-muted); flex-shrink: 0; margin-left: var(--space-2); }
    .chat-item-preview { font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .badge-count {
      background: var(--accent-primary);
      color: var(--accent-on-primary);
      font-size: 10px;
      font-weight: var(--weight-bold);
      border-radius: var(--radius-full);
      padding: 2px 6px;
      min-width: 18px;
      text-align: center;
      flex-shrink: 0;
    }

    /* ── Área de contenido ──────────────────────────────────────────────── */
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Estado vacío */
    .content-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-8);
      text-align: center;
    }
    .content-empty-icon  { font-size: 48px; opacity: 0.3; }
    .content-empty-title { font-size: var(--text-xl); color: var(--text-muted); font-weight: var(--weight-semibold); }
    .content-empty-desc  { font-size: var(--text-sm); color: var(--text-muted); }

    /* ── Estado vacío de búsqueda ──────────────────────────────────────── */
    .chat-item-blocked {
      font-size: 12px;
      flex-shrink: 0;
      opacity: 0.7;
      margin-left: var(--space-1);
    }

    .search-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-8) var(--space-4);
      text-align: center;
    }
    .search-empty-icon { font-size: 28px; opacity: 0.3; }
    .search-empty-text {
      font-size: var(--text-sm);
      color: var(--text-muted);
    }

    /* ── Modal: Nuevo Chat ──────────────────────────────────────────────── */
    @keyframes overlayIn  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes overlayOut { from { opacity: 1; } to { opacity: 0; } }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: var(--blur-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal, 200);
      padding: var(--space-4);
      animation: overlayIn 0.15s ease both;
    }
    .modal-overlay.modal-closing {
      animation: overlayOut 0.15s ease both;
    }
    .modal-overlay.modal-closing .modal-panel {
      animation: scaleOut 0.15s ease both;
    }

    @keyframes scaleOut {
      from { opacity: 1; transform: scale(1); }
      to   { opacity: 0; transform: scale(0.95); }
    }

    .modal-panel {
      width: 100%;
      max-width: 400px;
      border-radius: var(--radius-2xl);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 80dvh;
      box-shadow: var(--shadow-lg);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-5) var(--space-5) var(--space-4);
      border-bottom: 1px solid var(--glass-border);
      flex-shrink: 0;
    }

    .modal-title {
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
    }

    .modal-close {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: var(--text-sm);
      color: var(--text-muted);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
      transition: var(--transition-fast);
      line-height: 1;
      font-family: var(--font-sans);
    }
    .modal-close:hover { background: var(--glass-2); color: var(--text-primary); }

    .modal-contact-list {
      overflow-y: auto;
      flex: 1;
      padding: var(--space-2);
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin-top: var(--space-2);
    }

    .modal-contact-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .modal-contact-item:hover     { background: var(--glass-2); }
    .modal-contact-item:focus-visible { outline: 2px solid var(--text-secondary); outline-offset: 2px; }

    .modal-contact-name {
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
      flex: 1;
    }

    .modal-contact-status {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

    /* ── Menú contextual ───────────────────────────────────────────────── */
    .ctx-menu {
      position: fixed;
      min-width: 150px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      z-index: calc(var(--z-modal) + 10);
      padding: var(--space-1);
      box-shadow: var(--shadow-lg);
      animation: ctxIn 0.1s ease;
    }
    @keyframes ctxIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }

    .ctx-menu-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
      color: var(--text-primary);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition-fast);
      user-select: none;
    }
    .ctx-menu-item:hover,
    .ctx-menu-item:focus-visible { background: var(--glass-2); outline: none; }

    /* ── Fila de Archivados al fondo del sidebar ────────────────────────── */
    .archived-row {
      display: none; /* shown via JS when count > 0 */
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      margin: var(--space-1) var(--space-2);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: var(--transition-fast);
      user-select: none;
      border: 1px solid var(--glass-border);
    }
    .archived-row:hover         { background: var(--glass-1); }
    .archived-row:focus-visible { outline: 2px solid var(--text-secondary); outline-offset: 2px; }

    .archived-row-icon  { font-size: var(--text-base); }
    .archived-row-label {
      flex: 1;
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--text-secondary);
    }
    .archived-row-badge {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--text-muted);
      background: var(--glass-2);
      border-radius: var(--radius-full);
      padding: 1px 7px;
      min-width: 20px;
      text-align: center;
    }
    .archived-row-chevron {
      font-size: 10px;
      color: var(--text-muted);
    }

    /* ── Lista expandida de chats archivados ────────────────────────────── */
    .archived-list {
      display: flex;
      flex-direction: column;
      padding: 0 var(--space-2) var(--space-2);
      gap: var(--space-1);
      animation: slideDown 0.2s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .archived-chat-row {
      position: relative;
      display: flex;
      align-items: center;
    }
    .archived-chat-row .chat-item {
      flex: 1;
      opacity: 0.75;
    }
    .archived-chat-row:hover .chat-item { opacity: 1; }

    .archived-unarchive-btn {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      cursor: pointer;
      font-size: var(--text-sm);
      opacity: 0;
      transition: var(--transition-fast);
    }
    .archived-chat-row:hover .archived-unarchive-btn {
      opacity: 1;
      background: var(--glass-2);
    }
    .archived-unarchive-btn:hover { background: var(--glass-3) !important; }

    /* ── Mobile: oculta el área de contenido, sidebar a pantalla completa ─ */
    @media (max-width: 680px) {
      .sidebar {
        width: 100%;
        border-right: none;
      }
      .content-area {
        display: none;
      }
      /* Cuando hay chat activo, oculta sidebar y muestra contenido */
      .app-shell.chat-open .sidebar {
        display: none;
      }
      .app-shell.chat-open .content-area {
        display: flex;
      }
    }
  `;
  document.head.appendChild(style);
};
