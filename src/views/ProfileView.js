/**
 * ProfileView.js — Texto. Profile & Settings
 *
 * Vista de perfil del usuario autenticado.
 *
 * Funcionalidades:
 *   · Edición de nombre con preview en tiempo real del avatar
 *   · Selector de estado de presencia (online/away/busy/offline)
 *   · Guardar actualiza el store global → el sidebar refleja el cambio
 */

import { div, header, section, h2, h3, span } from '../../html.js';
import { Avatar }    from '../components/Avatar.js';
import { Button }    from '../components/Button.js';
import { Input }     from '../components/Input.js';
import { getState, updateUser } from '../store.js';
import { navigate }  from '../navigation.js';
import { initials as makeInitials, ACCENT_PALETTES, getAccentColor, setAccentColor, isSoundMuted, setSoundMuted, getPin, setPin, lockSession, isGhostMode, setGhostMode, getBgImage, setBgImage } from '../utils.js';

/**
 * @returns {HTMLElement}
 */
export const ProfileView = () => {

  injectStyles();

  const { user } = getState();

  // Estado local — no modifica el store hasta que el usuario presione Guardar
  let nameValue   = user.name;
  let statusValue = user.status;

  // ── Shell ──────────────────────────────────────────────────────────────────
  const view = div({ className: 'profile-view anim-fade-in' });

  // ── Header ─────────────────────────────────────────────────────────────────
  const head = header({ className: 'profile-header glass' }, view);

  head.appendChild(Button({
    text: '←',
    variant: 'ghost',
    size: 'sm',
    iconOnly: true,
    ariaLabel: 'Volver a chats',
    onClick: () => navigate('/chats'),
  }));

  h2({ className: 'profile-title' }, head, 'Mi perfil');

  // ── Scroll container ───────────────────────────────────────────────────────
  const scroll = div({ className: 'profile-scroll' }, view);

  // ── Avatar section ─────────────────────────────────────────────────────────
  const avatarSection = section({
    className: 'profile-avatar-section',
    'aria-label': 'Foto de perfil',
  }, scroll);

  const avatarEl = Avatar({
    initials: user.initials || makeInitials(user.name),
    size: 'lg',
    status: user.status,
  });
  avatarEl.classList.add('profile-avatar');
  avatarSection.appendChild(avatarEl);

  span({ className: 'profile-avatar-hint' }, avatarSection, 'Vista previa');

  // ── Sección de datos (card glass) ─────────────────────────────────────────
  const formSection = section({
    className: 'profile-form-section glass',
    'aria-label': 'Información personal',
  }, scroll);

  // Nombre
  h3({ className: 'profile-section-label' }, formSection, 'INFORMACIÓN');

  const nameWrap = div({ className: 'profile-field' }, formSection);
  nameWrap.appendChild(Input({
    id: 'profile-name',
    labelText: 'Nombre',
    type: 'text',
    placeholder: 'Tu nombre completo',
    value: user.name,
    onInput: (e) => {
      nameValue = e.target.value;
      // Actualiza las iniciales del avatar en tiempo real
      avatarEl.textContent = makeInitials(nameValue) || '??';
    },
  }));

  div({ className: 'profile-divider' }, formSection);

  // Estado de presencia
  h3({ className: 'profile-section-label' }, formSection, 'ESTADO');

  const statusGrid = div({
    className: 'profile-status-grid',
    role: 'radiogroup',
    'aria-label': 'Estado de presencia',
  }, formSection);

  const STATUSES = [
    { value: 'online',  label: 'Disponible',  color: 'var(--status-online)'  },
    { value: 'away',    label: 'Ausente',      color: 'var(--status-warning)' },
    { value: 'busy',    label: 'No molestar',  color: 'var(--status-danger)'  },
    { value: 'offline', label: 'Desconectado', color: 'var(--text-muted)'     },
  ];

  const selectStatus = (value) => {
    statusValue = value;
    statusBtns.forEach(({ el, value: v }) => {
      el.classList.toggle('profile-status-option--active', v === value);
      el.setAttribute('aria-checked', String(v === value));
    });
    // Actualiza el status ring del avatar preview
    ['online', 'away', 'busy', 'offline'].forEach(s =>
      avatarEl.classList.remove(`avatar-${s}`)
    );
    avatarEl.classList.add(`avatar-${value}`);
  };

  const statusBtns = STATUSES.map(s => {
    const isActive = s.value === statusValue;

    const btn = div({
      className: isActive
        ? 'profile-status-option profile-status-option--active'
        : 'profile-status-option',
      role: 'radio',
      tabIndex: 0,
      'aria-checked': String(isActive),
      'aria-label': s.label,
      onClick:   () => selectStatus(s.value),
      onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') selectStatus(s.value); },
    }, statusGrid);

    span({ className: 'profile-status-dot', style: { background: s.color } }, btn);
    span({ className: 'profile-status-label' }, btn, s.label);

    return { el: btn, value: s.value };
  });

  // ── Sonido de notificaciones ───────────────────────────────────────────────
  const soundSection = section({ className: 'profile-form-section glass' }, scroll);
  h3({ className: 'profile-section-label' }, soundSection, 'PRIVACIDAD Y NOTIFICACIONES');

  const soundRow = div({ className: 'profile-sound-row' }, soundSection);
  span({ className: 'profile-sound-label' }, soundRow, 'Sonido de mensajes');

  let mutedValue = isSoundMuted();

  const toggle = div({
    className: ['profile-sound-toggle', mutedValue ? '' : 'profile-sound-toggle--on'].filter(Boolean).join(' '),
    role: 'switch',
    tabIndex: 0,
    'aria-checked': String(!mutedValue),
    'aria-label': 'Sonido de notificaciones',
    onClick: () => {
      mutedValue = !mutedValue;
      setSoundMuted(mutedValue);
      toggle.classList.toggle('profile-sound-toggle--on', !mutedValue);
      toggle.setAttribute('aria-checked', String(!mutedValue));
    },
  }, soundRow);
  div({ className: 'profile-sound-thumb' }, toggle);

  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click(); }
  });

  // Separador visual
  div({ className: 'profile-sound-divider' }, soundSection);

  // ── Toggle: Modo Fantasma ────────────────────────────────────────────────
  const ghostRow = div({ className: 'profile-sound-row' }, soundSection);

  const ghostInfo = div({ className: 'profile-ghost-info' }, ghostRow);
  span({ className: 'profile-sound-label' }, ghostInfo, '👻  Modo fantasma');
  span({ className: 'profile-ghost-sub' }, ghostInfo, 'Oculta tu estado y "escribiendo..."');

  let ghostValue = isGhostMode();

  const ghostToggle = div({
    className: ['profile-sound-toggle', ghostValue ? 'profile-sound-toggle--on' : ''].filter(Boolean).join(' '),
    role: 'switch',
    tabIndex: 0,
    'aria-checked': String(ghostValue),
    'aria-label': 'Modo fantasma',
    onClick: () => {
      ghostValue = !ghostValue;
      setGhostMode(ghostValue);
      ghostToggle.classList.toggle('profile-sound-toggle--on', ghostValue);
      ghostToggle.setAttribute('aria-checked', String(ghostValue));
    },
  }, ghostRow);
  div({ className: 'profile-sound-thumb' }, ghostToggle);

  ghostToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ghostToggle.click(); }
  });

  // ── Bloqueo con PIN ─────────────────────────────────────────────────────────
  const pinSection = section({ className: 'profile-form-section glass' }, scroll);
  h3({ className: 'profile-section-label' }, pinSection, 'BLOQUEO CON PIN');

  let pinValue = getPin() ?? '';

  const pinInputWrap = div({ className: 'profile-pin-wrap' }, pinSection);
  span({ className: 'profile-sound-label' }, pinInputWrap, 'PIN de 4 dígitos');

  const pinField = document.createElement('input');
  pinField.type = 'password';
  pinField.inputMode = 'numeric';
  pinField.maxLength = 4;
  pinField.pattern = '[0-9]{4}';
  pinField.placeholder = pinValue ? '••••' : 'Sin PIN';
  pinField.value = '';
  pinField.className = 'profile-pin-input';
  pinField.setAttribute('aria-label', 'PIN de bloqueo');
  pinField.addEventListener('input', (e) => {
    pinValue = e.target.value.replace(/\D/g, '').slice(0, 4);
    pinField.value = pinValue;
  });
  pinInputWrap.appendChild(pinField);

  const pinHint = div({ className: 'profile-pin-hint' }, pinSection,
    getPin() ? '✓ PIN configurado — la sesión se bloqueará tras 5 min de inactividad.' : 'Sin PIN configurado — el bloqueo automático está desactivado.'
  );

  // Botón bloquear ahora (solo si hay PIN)
  if (getPin()) {
    const lockNowBtn = div({ className: 'profile-lock-now-btn' }, pinSection);
    lockNowBtn.appendChild(Button({
      text: '🔒  Bloquear ahora',
      variant: 'ghost',
      size: 'sm',
      onClick: () => lockSession(),
    }));
  }

  // ── Selector de color de acento ────────────────────────────────────────────
  const colorSection = section({ className: 'profile-form-section glass' }, scroll);
  h3({ className: 'profile-section-label' }, colorSection, 'COLOR DE ACENTO');

  const colorGrid = div({ className: 'profile-color-grid' }, colorSection);
  let accentValue = getAccentColor();

  const colorBtns = Object.entries(ACCENT_PALETTES).map(([key, palette]) => {
    const isActive = key === accentValue;
    const btn = div({
      className: ['profile-color-btn', isActive ? 'profile-color-btn--active' : ''].filter(Boolean).join(' '),
      role: 'button',
      tabIndex: 0,
      'aria-label': palette.label,
      'aria-pressed': String(isActive),
    }, colorGrid);

    const swatch = div({ className: 'profile-color-swatch' }, btn);
    swatch.style.background = palette.swatch;

    span({ className: 'profile-color-label' }, btn, palette.label);
    return { el: btn, key };
  });

  const selectAccent = (key) => {
    accentValue = key;
    setAccentColor(key);
    colorBtns.forEach(({ el, key: k }) => {
      el.classList.toggle('profile-color-btn--active', k === key);
      el.setAttribute('aria-pressed', String(k === key));
    });
  };

  colorBtns.forEach(({ el, key }) => {
    el.addEventListener('click', () => selectAccent(key));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAccent(key); }
    });
  });

  // ── Botón guardar ──────────────────────────────────────────────────────────
  // ── Fondo personalizado ──────────────────────────────────────────────────
  const PRESETS = [
    {
      id: 'aurora',
      label: 'Aurora',
      url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=120&fit=crop&q=60',
    },
    {
      id: 'space',
      label: 'Espacio',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&fit=crop&q=60',
    },
    {
      id: 'mountains',
      label: 'Montañas',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&fit=crop&q=60',
    },
    {
      id: 'abstract',
      label: 'Abstracto',
      url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&fit=crop&q=80',
      thumb: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=120&fit=crop&q=60',
    },
  ];

  const bgSection = section({ className: 'profile-form-section glass' }, scroll);
  h3({ className: 'profile-section-label' }, bgSection, 'FONDO PERSONALIZADO');

  // Tip de recomendación
  const bgTip = div({ className: 'profile-bg-tip' }, bgSection,
    '💡 Usa imágenes con variedad de color y profundidad. Evita fondos uniformes — el efecto glassmorphism se pierde.'
  );

  // Grid de presets
  const bgGrid = div({ className: 'profile-bg-grid' }, bgSection);
  let activeBgId = getBgImage()
    ? (PRESETS.find(p => p.url === getBgImage())?.id ?? 'custom')
    : null;

  const updateBgBtns = () => {
    bgBtns.forEach(({ el, preset }) => {
      el.classList.toggle('profile-bg-thumb--active', preset.id === activeBgId);
    });
    noneBtn.classList.toggle('profile-bg-none--active', !activeBgId);
  };

  // Botón "Sin fondo"
  const noneBtn = div({
    className: ['profile-bg-none', !activeBgId ? 'profile-bg-none--active' : ''].filter(Boolean).join(' '),
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Sin fondo personalizado',
    onClick: () => { activeBgId = null; setBgImage(null); updateBgBtns(); },
  }, bgGrid, '✕');

  noneBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); noneBtn.click(); }
  });

  const bgBtns = PRESETS.map(preset => {
    const el = div({
      className: ['profile-bg-thumb', preset.id === activeBgId ? 'profile-bg-thumb--active' : ''].filter(Boolean).join(' '),
      role: 'button',
      tabIndex: 0,
      'aria-label': preset.label,
      title: preset.label,
    }, bgGrid);

    const img = document.createElement('img');
    img.src = preset.thumb;
    img.alt = preset.label;
    img.loading = 'lazy';
    el.appendChild(img);

    span({ className: 'profile-bg-label' }, el, preset.label);

    el.addEventListener('click', () => {
      activeBgId = preset.id;
      setBgImage(preset.url);
      updateBgBtns();
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });

    return { el, preset };
  });

  // Input para URL personalizada
  const bgUrlWrap = div({ className: 'profile-bg-url-wrap' }, bgSection);
  span({ className: 'profile-sound-label' }, bgUrlWrap, 'URL personalizada');

  const bgUrlInput = document.createElement('input');
  bgUrlInput.type = 'url';
  bgUrlInput.placeholder = 'https://ejemplo.com/imagen.jpg';
  bgUrlInput.className = 'profile-pin-input';
  bgUrlInput.style.width = '100%';
  bgUrlInput.style.letterSpacing = 'normal';
  bgUrlInput.style.textAlign = 'left';
  bgUrlInput.setAttribute('aria-label', 'URL de fondo personalizado');
  bgUrlWrap.appendChild(bgUrlInput);

  const bgUrlApply = document.createElement('button');
  bgUrlApply.textContent = 'Aplicar';
  bgUrlApply.className = 'profile-bg-apply-btn';
  bgUrlWrap.appendChild(bgUrlApply);

  bgUrlApply.addEventListener('click', () => {
    const url = bgUrlInput.value.trim();
    if (!url) return;
    activeBgId = 'custom';
    setBgImage(url);
    updateBgBtns();
    bgUrlInput.value = '';
  });

  // ── Sesiones activas ─────────────────────────────────────────────────────
  const SESSION_STORAGE_KEY = 'texto-sessions';

  const DEFAULT_SESSIONS = [
    {
      id: 'session-current',
      icon: '🖥️',
      device: 'Chrome en macOS',
      location: 'Ciudad de México, MX',
      lastActive: 'Ahora mismo',
      current: true,
    },
    {
      id: 'session-mobile',
      icon: '📱',
      device: 'Safari en iPhone 15',
      location: 'Guadalajara, MX',
      lastActive: 'hace 2 horas',
      current: false,
    },
    {
      id: 'session-desktop',
      icon: '💻',
      device: 'Firefox en Windows 11',
      location: 'Monterrey, MX',
      lastActive: 'hace 1 día',
      current: false,
    },
  ];

  const loadSessions = () => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SESSIONS;
    } catch { return DEFAULT_SESSIONS; }
  };

  const saveSessions = (sessions) =>
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));

  let sessions = loadSessions();

  const sessionsSection = section({ className: 'profile-form-section glass' }, scroll);
  h3({ className: 'profile-section-label' }, sessionsSection, 'SESIONES ACTIVAS');

  const sessionsListEl = div({ className: 'sessions-list' }, sessionsSection);

  const renderSessions = () => {
    sessionsListEl.innerHTML = '';
    sessions.forEach((s, idx) => {
      const row = div({ className: ['session-row', s.current ? 'session-row--current' : ''].filter(Boolean).join(' ') }, sessionsListEl);

      const iconEl = span({ className: 'session-icon' }, row, s.icon);

      const info = div({ className: 'session-info' }, row);
      const deviceLine = div({ className: 'session-device' }, info);
      span({ className: 'session-device-name' }, deviceLine, s.device);
      if (s.current) {
        span({ className: 'session-current-badge' }, deviceLine, 'Esta sesión');
      }
      span({ className: 'session-location' }, info, `${s.location} · ${s.lastActive}`);

      if (!s.current) {
        const closeBtn = div({ className: 'session-close-btn' }, row, 'Cerrar');
        closeBtn.addEventListener('click', () => {
          sessions = sessions.filter(sess => sess.id !== s.id);
          saveSessions(sessions);
          renderSessions();
          updateCloseAllBtn();
        });
      }

      // Separador (salvo en el último)
      if (idx < sessions.length - 1) {
        div({ className: 'session-divider' }, sessionsListEl);
      }
    });
  };

  renderSessions();

  const closeAllWrap = div({ className: 'session-close-all-wrap' }, sessionsSection);
  const closeAllBtn = div({ className: 'session-close-all-btn' }, closeAllWrap);

  const updateCloseAllBtn = () => {
    const others = sessions.filter(s => !s.current);
    closeAllBtn.style.display = others.length === 0 ? 'none' : '';
    closeAllBtn.textContent = `Cerrar todas las demás (${others.length})`;
  };

  closeAllBtn.addEventListener('click', () => {
    sessions = sessions.filter(s => s.current);
    saveSessions(sessions);
    renderSessions();
    updateCloseAllBtn();
  });

  updateCloseAllBtn();

  // ── Botón guardar ──────────────────────────────────────────────────────────
  const actions = div({ className: 'profile-actions' }, scroll);

  actions.appendChild(Button({
    text: 'Guardar cambios',
    variant: 'primary',
    onClick: () => {
      const name     = nameValue.trim() || user.name;
      const computed = makeInitials(name) || user.initials;
      updateUser({ name, initials: computed, status: statusValue });

      // Guardar PIN (vacío = eliminar)
      const trimmedPin = pinValue.trim();
      if (trimmedPin.length === 4) setPin(trimmedPin);
      else if (trimmedPin.length === 0 && !getPin()) setPin(null);
      else if (trimmedPin.length === 0) setPin(null);

      navigate('/chats');
    },
  }));

  return view;
};

/* ── Estilos ──────────────────────────────────────────────────────────────── */

const injectStyles = () => {
  if (document.getElementById('style-profile')) return;

  const style = document.createElement('style');
  style.id = 'style-profile';
  style.textContent = `

    .profile-view {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 100dvh;
      overflow: hidden;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--glass-border);
      flex-shrink: 0;
      z-index: var(--z-raised);
    }

    .profile-title {
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
      letter-spacing: 0;
    }

    .profile-scroll {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6) var(--space-5);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      max-width: 480px;
      margin: 0 auto;
      width: 100%;
    }

    /* ── Avatar ────────────────────────────────────────────────────────── */
    .profile-avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-4) 0;
    }

    .profile-avatar {
      cursor: default;
      transition: transform var(--transition-fast);
    }

    .profile-avatar-hint {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

    /* ── Form card ─────────────────────────────────────────────────────── */
    .profile-form-section {
      border-radius: var(--radius-xl);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .profile-section-label {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--text-muted);
      letter-spacing: 0.08em;
      padding: var(--space-4) var(--space-4) var(--space-2);
    }

    .profile-field { padding: 0 var(--space-4) var(--space-4); }

    .profile-form-section .input-wrap  { gap: var(--space-2); }
    .profile-form-section .input-label {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--text-secondary);
      letter-spacing: 0.04em;
    }
    .profile-form-section .input {
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      color: var(--text-primary);
      background: var(--glass-1);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4);
      width: 100%;
      outline: none;
      transition: var(--transition-base);
    }
    .profile-form-section .input::placeholder { color: var(--text-muted); }
    .profile-form-section .input:focus {
      border-color: var(--text-secondary);
      background: var(--glass-2);
      box-shadow: 0 0 0 3px rgba(128, 128, 128, 0.12);
    }

    .profile-divider {
      height: 1px;
      background: var(--glass-border);
      margin: 0 var(--space-4);
    }

    /* ── Status grid ───────────────────────────────────────────────────── */
    .profile-status-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4) var(--space-4);
    }

    .profile-status-option {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      border: 1px solid var(--glass-border);
      cursor: pointer;
      transition: var(--transition-fast);
      user-select: none;
    }
    .profile-status-option:hover         { background: var(--glass-1); }
    .profile-status-option--active       { background: var(--glass-2); border-color: var(--glass-border-strong); }
    .profile-status-option:focus-visible { outline: 2px solid var(--text-secondary); outline-offset: 2px; }

    .profile-status-dot {
      width: 10px; height: 10px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }

    .profile-status-label {
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      color: var(--text-secondary);
    }
    .profile-status-option--active .profile-status-label { color: var(--text-primary); }

    /* ── Botón guardar ─────────────────────────────────────────────────── */
    .profile-actions .btn {
      width: 100%;
      justify-content: center;
      padding: var(--space-4);
    }

    /* ── Botones reutilizados (mismos que ConversationView) ───────────── */
    .profile-view .btn {
      display: inline-flex; align-items: center; justify-content: center;
      font-family: var(--font-sans); font-size: var(--text-sm);
      font-weight: var(--weight-medium); border-radius: var(--radius-full);
      border: 1px solid transparent; padding: 10px 20px;
      cursor: pointer; transition: var(--transition-base); line-height: 1;
    }
    .profile-view .btn:active { transform: scale(0.97); }
    .profile-view .btn-primary {
      background: var(--accent-primary); color: var(--accent-on-primary);
      box-shadow: var(--shadow-sm);
    }
    .profile-view .btn-primary:hover { background: var(--accent-primary-hover); }
    .profile-view .btn-ghost {
      background: transparent; border-color: var(--glass-border); color: var(--text-secondary);
    }
    .profile-view .btn-ghost:hover { background: var(--glass-1); color: var(--text-primary); }
    .profile-view .btn-sm  { font-size: 11px; padding: 6px 14px; }
    .profile-view .btn-icon { padding: 10px; }

    /* ── Bloqueo con PIN ────────────────────────────────────────────────── */
    .profile-pin-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-2) var(--space-4);
      margin-top: var(--space-2);
    }

    .profile-pin-input {
      width: 80px;
      text-align: center;
      font-size: var(--text-base);
      font-family: var(--font-sans);
      letter-spacing: 0.2em;
      background: var(--glass-2);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3);
      color: var(--text-primary);
      outline: none;
      transition: var(--transition-base);
    }
    .profile-pin-input:focus {
      border-color: var(--text-secondary);
      background: var(--glass-3);
    }
    .profile-pin-input::placeholder { color: var(--text-muted); letter-spacing: normal; }

    .profile-pin-hint {
      font-size: var(--text-xs);
      color: var(--text-muted);
      margin-top: var(--space-1);
      padding: 0 var(--space-4) var(--space-4);
      line-height: var(--leading-relaxed);
    }

    .profile-lock-now-btn {
      padding: 0 var(--space-4) var(--space-4);
    }

    /* ── Separador entre toggles ────────────────────────────────────────── */
    .profile-sound-divider {
      height: 1px;
      background: var(--glass-border);
      margin: 0 var(--space-4);
    }

    /* ── Subtítulo del toggle fantasma ──────────────────────────────────── */
    .profile-ghost-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .profile-ghost-sub {
      font-size: var(--text-xs);
      color: var(--text-muted);
      line-height: var(--leading-relaxed);
    }

    /* ── Toggle de sonido ───────────────────────────────────────────────── */
    .profile-sound-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-2) var(--space-4) var(--space-4);
      margin-top: var(--space-2);
    }

    .profile-sound-label {
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    .profile-sound-toggle {
      width: 44px;
      height: 24px;
      border-radius: var(--radius-full);
      background: var(--glass-3);
      border: 1px solid var(--glass-border-strong);
      position: relative;
      cursor: pointer;
      transition: background 0.2s ease;
      flex-shrink: 0;
    }
    .profile-sound-toggle--on {
      background: var(--accent-primary);
      border-color: transparent;
    }
    .profile-sound-toggle:focus-visible {
      outline: 2px solid var(--text-secondary);
      outline-offset: 2px;
    }

    .profile-sound-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      border-radius: var(--radius-full);
      background: var(--text-muted);
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .profile-sound-toggle--on .profile-sound-thumb {
      transform: translateX(20px);
      background: var(--accent-on-primary);
    }

    /* ── Selector de color de acento ──────────────────────────────────── */
    .profile-color-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-2);
      margin-top: var(--space-3);
    }

    .profile-color-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: var(--transition-fast);
      border: 1px solid transparent;
    }
    .profile-color-btn:hover {
      background: var(--glass-2);
    }
    .profile-color-btn--active {
      background: var(--glass-2);
      border-color: var(--text-secondary);
    }
    .profile-color-btn:focus-visible {
      outline: 2px solid var(--text-secondary);
      outline-offset: 2px;
    }

    .profile-color-swatch {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      box-shadow: var(--shadow-sm);
      flex-shrink: 0;
    }

    .profile-color-label {
      font-size: var(--text-xs);
      color: var(--text-muted);
      text-align: center;
    }
    .profile-color-btn--active .profile-color-label {
      color: var(--text-primary);
      font-weight: var(--weight-semibold);
    }

    /* ── Sesiones activas ───────────────────────────────────────────────── */
    .sessions-list {
      display: flex;
      flex-direction: column;
      padding: var(--space-2) 0;
    }

    .session-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      transition: var(--transition-fast);
    }
    .session-row:hover { background: var(--glass-1); }
    .session-row--current { background: transparent; }

    .session-icon {
      font-size: 22px;
      flex-shrink: 0;
      width: 36px;
      text-align: center;
    }

    .session-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .session-device {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .session-device-name {
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
    }

    .session-current-badge {
      font-size: 10px;
      font-weight: var(--weight-semibold);
      color: var(--accent-primary);
      background: rgba(var(--accent-primary-rgb, 99, 102, 241), 0.12);
      padding: 1px 6px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(var(--accent-primary-rgb, 99, 102, 241), 0.25);
    }

    .session-location {
      font-size: var(--text-xs);
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .session-close-btn {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--status-danger);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      border: 1px solid rgba(239, 68, 68, 0.3);
      cursor: pointer;
      transition: var(--transition-fast);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .session-close-btn:hover { background: rgba(239, 68, 68, 0.1); }

    .session-divider {
      height: 1px;
      background: var(--glass-border);
      margin: 0 var(--space-4);
    }

    .session-close-all-wrap {
      padding: var(--space-3) var(--space-4) var(--space-4);
      border-top: 1px solid var(--glass-border);
    }

    .session-close-all-btn {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--status-danger);
      cursor: pointer;
      text-align: center;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: var(--transition-fast);
    }
    .session-close-all-btn:hover { background: rgba(239, 68, 68, 0.08); }

    /* ── Fondo personalizado ─────────────────────────────────────────────── */
    .profile-bg-tip {
      font-size: var(--text-xs);
      color: var(--text-muted);
      line-height: var(--leading-relaxed);
      padding: 0 var(--space-4) var(--space-3);
    }

    .profile-bg-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--space-2);
      padding: 0 var(--space-4) var(--space-4);
    }

    .profile-bg-none {
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1;
      border-radius: var(--radius-md);
      border: 1.5px dashed var(--glass-border-strong);
      font-size: var(--text-base);
      color: var(--text-muted);
      cursor: pointer;
      transition: var(--transition-fast);
      user-select: none;
    }
    .profile-bg-none:hover { background: var(--glass-1); border-color: var(--text-muted); }
    .profile-bg-none--active {
      background: var(--glass-2);
      border-color: var(--text-secondary);
      border-style: solid;
      color: var(--text-primary);
      box-shadow: 0 0 0 2px var(--text-secondary);
    }
    .profile-bg-none:focus-visible { outline: 2px solid var(--text-secondary); outline-offset: 2px; }

    .profile-bg-thumb {
      position: relative;
      aspect-ratio: 1;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1.5px solid transparent;
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .profile-bg-thumb img {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }
    .profile-bg-thumb:hover img   { transform: scale(1.08); }
    .profile-bg-thumb:hover       { border-color: var(--glass-border-strong); }
    .profile-bg-thumb--active {
      border-color: var(--text-secondary);
      box-shadow: 0 0 0 2px var(--text-secondary);
    }
    .profile-bg-thumb:focus-visible { outline: 2px solid var(--text-secondary); outline-offset: 2px; }

    .profile-bg-label {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      font-size: 9px;
      font-weight: var(--weight-semibold);
      color: #fff;
      text-align: center;
      background: linear-gradient(transparent, rgba(0,0,0,0.7));
      padding: 6px 2px 3px;
      pointer-events: none;
      letter-spacing: 0.03em;
    }

    .profile-bg-url-wrap {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: 0 var(--space-4) var(--space-4);
    }
    .profile-bg-url-wrap .profile-sound-label {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
    .profile-bg-url-wrap .profile-pin-input {
      width: 100%;
      letter-spacing: normal;
      text-align: left;
    }

    .profile-bg-apply-btn {
      align-self: flex-end;
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      color: var(--accent-on-primary);
      background: var(--accent-primary);
      border: none;
      border-radius: var(--radius-full);
      padding: var(--space-2) var(--space-5);
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .profile-bg-apply-btn:hover  { background: var(--accent-primary-hover); }
    .profile-bg-apply-btn:active { transform: scale(0.97); }

  `;
  document.head.appendChild(style);
};
