/**
 * utils.js — Texto. Utility Functions
 * ─────────────────────────────────────────────────────────────────────────────
 * Funciones puras de apoyo. Sin efectos secundarios ni dependencias internas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ══════════════════════════════════════════════════════════════════════════════
   TEMA
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Lee el tema guardado en localStorage, o detecta la preferencia del SO.
 * @returns {'dark'|'light'}
 */
export const getTheme = () => {
  const saved = localStorage.getItem('texto-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Aplica un tema al documento y lo persiste en localStorage.
 * @param {'dark'|'light'} theme
 */
export const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('texto-theme', theme);
};

/**
 * Alterna entre dark y light mode.
 */
export const toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme') || getTheme();
  setTheme(current === 'dark' ? 'light' : 'dark');
};


/* ══════════════════════════════════════════════════════════════════════════════
   FECHAS Y TIEMPO
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Formatea una fecha como hora en formato 24h (HH:MM).
 * @param {Date|string|number} date
 * @returns {string} Ej: "10:42"
 */
export const formatTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * Formatea una fecha para la lista de chats.
 * - Hoy: muestra la hora ("10:42")
 * - Ayer: "Ayer"
 * - Esta semana: día abreviado ("Lun", "Mar"…)
 * - Más antiguo: fecha corta ("15 abr")
 *
 * @param {Date|string|number} date
 * @returns {string}
 */
export const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return formatTime(d);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Ayer';

  const diffMs = now - d;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 7) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[d.getDay()];
  }

  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};


/* ══════════════════════════════════════════════════════════════════════════════
   TEXTO
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Genera iniciales a partir de un nombre completo.
 * Toma la primera letra de las primeras dos palabras.
 *
 * @param {string} name - Ej: "Adrián Rojas"
 * @returns {string} Ej: "AR"
 */
export const initials = (name = '') => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() ?? '')
    .join('');
};

/**
 * Formatea una fecha para los separadores entre grupos de mensajes.
 * - Hoy → "Hoy"
 * - Ayer → "Ayer"
 * - Esta semana → "Lunes 28 de abr"
 * - Más antiguo → "15 de abril de 2024"
 *
 * @param {Date|string|number} date
 * @returns {string}
 */
export const formatDateSeparator = (date) => {
  const d   = date instanceof Date ? date : new Date(date);
  const now = new Date();

  const sameDay = (a, b) =>
    a.getDate()     === b.getDate()  &&
    a.getMonth()    === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(d, now)) return 'Hoy';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Ayer';

  const diffMs   = now - d;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 7) {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * Trunca un texto si supera el límite, añadiendo "…".
 *
 * @param {string} text
 * @param {number} [maxLength=60]
 * @returns {string}
 */
export const truncate = (text = '', maxLength = 60) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
};


/* ══════════════════════════════════════════════════════════════════════════════
   DOM
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Limpia todos los hijos de un nodo DOM.
 * @param {HTMLElement} el
 */
export const clearElement = (el) => {
  while (el.firstChild) el.removeChild(el.firstChild);
};

/**
 * Hace scroll suave al final de un contenedor (útil para la vista de mensajes).
 * @param {HTMLElement} el
 */
export const scrollToBottom = (el) => {
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
};


/* ══════════════════════════════════════════════════════════════════════════════
   AUTENTICACIÓN
   Estado de sesión del usuario, persistido en localStorage.
   NOTA: esto es una simulación para el portafolio — no es auth real.
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Verifica si el usuario tiene una sesión activa.
 * @returns {boolean}
 */
export const isAuthenticated = () =>
  localStorage.getItem('texto-auth') === 'true';

/**
 * Establece el estado de autenticación.
 * @param {boolean} value
 */
export const setAuthenticated = (value) =>
  localStorage.setItem('texto-auth', String(value));

/**
 * Cierra la sesión eliminando el flag de autenticación.
 */
export const clearAuthentication = () =>
  localStorage.removeItem('texto-auth');


/* ══════════════════════════════════════════════════════════════════════════════
   NOTIFICACIONES
   Wrapper sobre la Notifications API del browser.
   Solo muestra notificaciones cuando la tab NO está en primer plano.
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Solicita permiso para mostrar notificaciones del browser.
 * Solo pregunta si el estado es 'default' (nunca solicitado antes).
 * @returns {Promise<NotificationPermission>}
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return await Notification.requestPermission();
};

/**
 * Muestra una notificación nativa del sistema operativo.
 * Solo se muestra si:
 *   - El browser soporta la API
 *   - El permiso está concedido
 *   - La tab actual NO está en primer plano (document.hidden)
 *
 * @param {string} title   - Título de la notificación (ej: nombre del contacto)
 * @param {string} body    - Texto del mensaje
 * @param {Object} [opts]  - Opciones extra (icon, tag, etc.)
 */
export const showNotification = (title, body, opts = {}) => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (!document.hidden) return; // El usuario ya está viendo la app

  const n = new Notification(title, {
    body,
    icon: '/icon.png',   // fallback si no existe → el browser lo ignora
    badge: '/icon.png',
    tag: opts.tag ?? title, // agrupa notificaciones del mismo chat
    ...opts,
  });

  // Auto-cierra a los 5 segundos
  setTimeout(() => n.close(), 5000);
};


/* ══════════════════════════════════════════════════════════════════════════════
   TEMA DE COLOR (ACENTO)
   Cada paleta define variables para dark y light mode.
   Se aplican sobreescribiendo los tokens base vía un <style> dinámico.
══════════════════════════════════════════════════════════════════════════════ */

export const ACCENT_PALETTES = {
  mono: {
    label: 'Clásico',
    swatch: '#888888',
    dark: {
      primary:      '#EDEDED',
      hover:        '#FFFFFF',
      onPrimary:    '#0A0A0A',
      bubbleBg:     'rgba(255,255,255,0.18)',
      bubbleBorder: 'rgba(255,255,255,0.30)',
    },
    light: {
      primary:      '#1A1A1A',
      hover:        '#000000',
      onPrimary:    '#FFFFFF',
      bubbleBg:     'rgba(0,0,0,0.09)',
      bubbleBorder: 'rgba(0,0,0,0.18)',
    },
  },
  blue: {
    label: 'Azul',
    swatch: '#4A9EFF',
    dark: {
      primary:      '#4A9EFF',
      hover:        '#62AEFF',
      onPrimary:    '#FFFFFF',
      bubbleBg:     'rgba(74,158,255,0.22)',
      bubbleBorder: 'rgba(74,158,255,0.38)',
    },
    light: {
      primary:      '#1A6ED8',
      hover:        '#0D5EC7',
      onPrimary:    '#FFFFFF',
      bubbleBg:     'rgba(26,110,216,0.16)',
      bubbleBorder: 'rgba(26,110,216,0.30)',
    },
  },
  green: {
    label: 'Verde',
    swatch: '#4CAF50',
    dark: {
      primary:      '#4CAF50',
      hover:        '#5DC061',
      onPrimary:    '#FFFFFF',
      bubbleBg:     'rgba(76,175,80,0.20)',
      bubbleBorder: 'rgba(76,175,80,0.36)',
    },
    light: {
      primary:      '#2E7D32',
      hover:        '#1B5E20',
      onPrimary:    '#FFFFFF',
      bubbleBg:     'rgba(46,125,50,0.15)',
      bubbleBorder: 'rgba(46,125,50,0.28)',
    },
  },
  purple: {
    label: 'Morado',
    swatch: '#9C6FE4',
    dark: {
      primary:      '#9C6FE4',
      hover:        '#AA7EEC',
      onPrimary:    '#FFFFFF',
      bubbleBg:     'rgba(156,111,228,0.20)',
      bubbleBorder: 'rgba(156,111,228,0.36)',
    },
    light: {
      primary:      '#7B3FD8',
      hover:        '#6A2FC7',
      onPrimary:    '#FFFFFF',
      bubbleBg:     'rgba(123,63,216,0.14)',
      bubbleBorder: 'rgba(123,63,216,0.28)',
    },
  },
  orange: {
    label: 'Naranja',
    swatch: '#FF9240',
    dark: {
      primary:      '#FF9240',
      hover:        '#FFA050',
      onPrimary:    '#1A1A1A',
      bubbleBg:     'rgba(255,146,64,0.20)',
      bubbleBorder: 'rgba(255,146,64,0.36)',
    },
    light: {
      primary:      '#E06500',
      hover:        '#CC5500',
      onPrimary:    '#FFFFFF',
      bubbleBg:     'rgba(224,101,0,0.14)',
      bubbleBorder: 'rgba(224,101,0,0.28)',
    },
  },
  rose: {
    label: 'Rosa',
    swatch: '#F06292',
    dark: {
      primary:      '#F06292',
      hover:        '#F472A0',
      onPrimary:    '#FFFFFF',
      bubbleBg:     'rgba(240,98,146,0.20)',
      bubbleBorder: 'rgba(240,98,146,0.36)',
    },
    light: {
      primary:      '#C2185B',
      hover:        '#AD1457',
      onPrimary:    '#FFFFFF',
      bubbleBg:     'rgba(194,24,91,0.14)',
      bubbleBorder: 'rgba(194,24,91,0.28)',
    },
  },
};

/**
 * Lee el color de acento guardado.
 * @returns {string} clave de ACCENT_PALETTES
 */
export const getAccentColor = () =>
  localStorage.getItem('texto-accent') ?? 'mono';

/**
 * Aplica una paleta de acento sobreescribiendo las variables CSS en :root.
 * Genera un <style id="texto-accent-override"> dinámico.
 * @param {string} key - clave de ACCENT_PALETTES
 */
export const setAccentColor = (key) => {
  const palette = ACCENT_PALETTES[key] ?? ACCENT_PALETTES.mono;
  localStorage.setItem('texto-accent', key);

  let styleEl = document.getElementById('texto-accent-override');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'texto-accent-override';
    document.head.appendChild(styleEl);
  }

  const vars = (mode) => {
    const p = palette[mode];
    return `
      --accent-primary:       ${p.primary};
      --accent-primary-hover: ${p.hover};
      --accent-on-primary:    ${p.onPrimary};
      --bubble-sent-bg:       ${p.bubbleBg};
      --bubble-sent-border:   ${p.bubbleBorder};
    `;
  };

  styleEl.textContent = `
    [data-theme="dark"]  { ${vars('dark')}  }
    [data-theme="light"] { ${vars('light')} }
  `;
};


/* ══════════════════════════════════════════════════════════════════════════════
   MODO SIN CONEXIÓN
   Detecta pérdida/recuperación de red con navigator.onLine y los eventos
   window online/offline. Muestra un banner global no intrusivo.
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Inicializa el detector de conexión.
 * Crea un banner en el DOM y lo muestra/oculta según el estado de la red.
 * Llamar una sola vez al arrancar la app.
 */
export const initOfflineDetector = () => {
  // Estilos del banner
  const style = document.createElement('style');
  style.textContent = `
    #offline-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      background: #1a1a1a;
      color: #f0f0f0;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
      transform: translateY(-100%);
      transition: transform 0.25s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    #offline-banner.offline-banner--visible {
      transform: translateY(0);
    }
    #offline-banner.offline-banner--back {
      background: #1a3a1a;
      color: #a0e0a0;
    }
  `;
  document.head.appendChild(style);

  // Elemento del banner
  const banner = document.createElement('div');
  banner.id = 'offline-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  document.body.prepend(banner);

  let backOnlineTimer = null;

  const showOffline = () => {
    clearTimeout(backOnlineTimer);
    banner.textContent = '⚠️  Sin conexión — los mensajes se enviarán cuando vuelva la red.';
    banner.classList.remove('offline-banner--back');
    banner.classList.add('offline-banner--visible');
  };

  const showBackOnline = () => {
    banner.textContent = '✓  Conexión restaurada';
    banner.classList.add('offline-banner--back');
    banner.classList.add('offline-banner--visible');

    // Ocultar tras 2.5s
    backOnlineTimer = setTimeout(() => {
      banner.classList.remove('offline-banner--visible');
    }, 2500);
  };

  window.addEventListener('offline', showOffline);
  window.addEventListener('online',  showBackOnline);

  // Mostrar inmediatamente si ya estamos sin conexión al cargar
  if (!navigator.onLine) showOffline();
};


/* ══════════════════════════════════════════════════════════════════════════════
   SONIDO DE NOTIFICACIÓN
   Sintetizado con la Web Audio API — sin archivos de audio externos.
   Imita el tono doble y suave de Telegram.
══════════════════════════════════════════════════════════════════════════════ */

let _audioCtx = null;

const getAudioCtx = () => {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
};

/**
 * Lee si el sonido está silenciado.
 * @returns {boolean}
 */
export const isSoundMuted = () =>
  localStorage.getItem('texto-mute') === 'true';

/**
 * Activa o desactiva el sonido.
 * @param {boolean} muted
 */
export const setSoundMuted = (muted) =>
  localStorage.setItem('texto-mute', String(muted));

/**
 * Reproduce el sonido de notificación de mensaje recibido.
 * Dos tonos cortos ascendentes (estilo Telegram).
 * No hace nada si el sonido está silenciado o el browser no soporta Web Audio.
 */
export const playNotificationSound = () => {
  if (isSoundMuted()) return;
  if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;

  try {
    const ctx      = getAudioCtx();
    const now      = ctx.currentTime;
    const gain     = ctx.createGain();
    gain.connect(ctx.destination);

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Fade in / fade out suave
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.01);
      gain.gain.linearRampToValueAtTime(0,    startTime + duration);

      osc.connect(gain);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Dos tonos: el segundo ligeramente más alto
    playTone(880, now,        0.12);
    playTone(988, now + 0.14, 0.12);
  } catch (_) {
    // Silenciar cualquier error (política de autoplay, etc.)
  }
};


/* ══════════════════════════════════════════════════════════════════════════════
   BLOQUEO DE SESIÓN CON PIN
   - El PIN se guarda en localStorage (hash simple para el portafolio).
   - Tras LOCK_TIMEOUT ms de inactividad, se muestra la pantalla de bloqueo.
   - El usuario también puede bloquear manualmente.
   - Sin PIN configurado → el bloqueo no se activa.
══════════════════════════════════════════════════════════════════════════════ */

const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutos de inactividad

/**
 * Lee el PIN guardado (en claro — solo para demo de portafolio).
 * @returns {string|null}
 */
export const getPin = () => localStorage.getItem('texto-pin') || null;

/**
 * Guarda el PIN. Pasar null para eliminarlo.
 * @param {string|null} pin
 */
export const setPin = (pin) => {
  if (pin) localStorage.setItem('texto-pin', pin);
  else localStorage.removeItem('texto-pin');
};

/**
 * Inicializa el sistema de bloqueo de sesión.
 * Crea la pantalla de bloqueo en el DOM y configura los timers de inactividad.
 * Llamar una sola vez al arrancar la app.
 */
export const initSessionLock = () => {
  // ── Estilos ───────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #lock-screen {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      background: rgba(10,10,10,0.72);
      animation: lockIn 0.2s ease both;
    }
    #lock-screen.lock-visible { display: flex; }
    @keyframes lockIn {
      from { opacity: 0; transform: scale(1.03); }
      to   { opacity: 1; transform: scale(1); }
    }

    .lock-brand {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.04em;
      color: #fff;
    }
    .lock-label {
      font-size: 13px;
      color: rgba(255,255,255,0.55);
      text-align: center;
    }
    .lock-dots {
      display: flex;
      gap: 14px;
    }
    .lock-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.45);
      background: transparent;
      transition: background 0.15s ease;
    }
    .lock-dot.filled { background: #fff; border-color: #fff; }

    .lock-keypad {
      display: grid;
      grid-template-columns: repeat(3, 64px);
      gap: 10px;
    }
    .lock-key {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff;
      font-size: 20px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.1s ease;
      font-family: system-ui, sans-serif;
      user-select: none;
    }
    .lock-key:hover   { background: rgba(255,255,255,0.18); }
    .lock-key:active  { background: rgba(255,255,255,0.28); transform: scale(0.95); }
    .lock-key.lock-key-del { font-size: 16px; }

    .lock-error {
      font-size: 12px;
      color: #ff6b6b;
      height: 16px;
      text-align: center;
    }
  `;
  document.head.appendChild(style);

  // ── DOM ───────────────────────────────────────────────────────────────────
  const screen = document.createElement('div');
  screen.id = 'lock-screen';
  screen.setAttribute('role', 'dialog');
  screen.setAttribute('aria-modal', 'true');
  screen.setAttribute('aria-label', 'Pantalla de bloqueo');

  screen.innerHTML = `
    <div class="lock-brand">Texto.</div>
    <div class="lock-label">Ingresa tu PIN para continuar</div>
    <div class="lock-dots">
      <div class="lock-dot" id="ld0"></div>
      <div class="lock-dot" id="ld1"></div>
      <div class="lock-dot" id="ld2"></div>
      <div class="lock-dot" id="ld3"></div>
    </div>
    <div class="lock-keypad" id="lock-keypad"></div>
    <div class="lock-error" id="lock-error"></div>
  `;
  document.body.appendChild(screen);

  // Teclado numérico
  const keypad = screen.querySelector('#lock-keypad');
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  keys.forEach(k => {
    const btn = document.createElement('div');
    btn.className = 'lock-key' + (k === '⌫' ? ' lock-key-del' : '') + (k === '' ? ' lock-key-empty' : '');
    btn.textContent = k;
    if (k === '') { btn.style.visibility = 'hidden'; }
    btn.addEventListener('click', () => handleKey(k));
    keypad.appendChild(btn);
  });

  // ── Lógica del PIN ────────────────────────────────────────────────────────
  let input = '';

  const dots = [0,1,2,3].map(i => screen.querySelector(`#ld${i}`));
  const errorEl = screen.querySelector('#lock-error');

  const updateDots = () => {
    dots.forEach((d, i) => d.classList.toggle('filled', i < input.length));
  };

  const showError = (msg) => {
    errorEl.textContent = msg;
    input = '';
    updateDots();
    setTimeout(() => { errorEl.textContent = ''; }, 1800);
  };

  const handleKey = (k) => {
    if (k === '' ) return;
    if (k === '⌫') { input = input.slice(0, -1); updateDots(); return; }
    if (input.length >= 4) return;

    input += k;
    updateDots();

    if (input.length === 4) {
      const pin = getPin();
      if (input === pin) {
        unlock();
      } else {
        showError('PIN incorrecto');
      }
    }
  };

  // Soporte de teclado físico
  const handlePhysicalKey = (e) => {
    if (!screen.classList.contains('lock-visible')) return;
    if (e.key >= '0' && e.key <= '9') handleKey(e.key);
    if (e.key === 'Backspace') handleKey('⌫');
  };
  document.addEventListener('keydown', handlePhysicalKey);

  // ── Bloqueo / desbloqueo ──────────────────────────────────────────────────
  const lock = () => {
    if (!getPin()) return; // Sin PIN → no bloquear
    input = '';
    updateDots();
    errorEl.textContent = '';
    screen.classList.add('lock-visible');
  };

  const unlock = () => {
    screen.classList.remove('lock-visible');
    input = '';
    resetTimer();
  };

  // ── Timer de inactividad ──────────────────────────────────────────────────
  let lockTimer = null;

  const resetTimer = () => {
    clearTimeout(lockTimer);
    if (getPin()) {
      lockTimer = setTimeout(lock, LOCK_TIMEOUT);
    }
  };

  ['mousemove','keydown','click','touchstart','scroll'].forEach(evt => {
    document.addEventListener(evt, resetTimer, { passive: true });
  });

  resetTimer();

  // ── API pública: bloqueo manual ───────────────────────────────────────────
  window.__textoLock__ = lock;
};

/**
 * Bloquea la sesión manualmente (si hay PIN configurado).
 */
export const lockSession = () => window.__textoLock__?.();


/* ══════════════════════════════════════════════════════════════════════════════
   MODO FANTASMA (GHOST MODE)
   Cuando está activo, el estado del usuario se reporta como 'offline'
   y el indicador de escritura no se dispara hacia otros contactos.
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Lee si el modo fantasma está activo.
 * @returns {boolean}
 */
export const isGhostMode = () =>
  localStorage.getItem('texto-ghost') === 'true';

/**
 * Activa o desactiva el modo fantasma.
 * @param {boolean} active
 */
export const setGhostMode = (active) =>
  localStorage.setItem('texto-ghost', String(active));
