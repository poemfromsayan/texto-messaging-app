/**
 * LandingView.js — Texto. Landing Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Página de presentación del producto. Estructura:
 *   · Nav      — Logo + links de acción
 *   · Hero     — Tagline, CTAs primarios, mockup CSS del app
 *   · Features — Grid de 6 funcionalidades clave
 *   · CTA      — Llamado final a la acción
 *   · Footer   — Créditos mínimos
 *
 * Estilo: dark glassmorphism, mismo sistema de tokens que el resto del app.
 * No depende de ningún estado del store — es completamente estática.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { div, span, nav, header, main, section, h1, h2, h3, p, footer } from '../../html.js';
import { navigate }    from '../navigation.js';
import { isDemoMode, setDemoMode } from '../utils.js';
import { loadDemoData } from '../store.js';

/* ── Datos de features ──────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: '🔒',
    title: 'Cifrado extremo a extremo',
    desc:  'Cada mensaje va cifrado de punto a punto. Sin backdoors, sin excepciones.',
  },
  {
    icon: '👻',
    title: 'Modo Fantasma',
    desc:  'Conéctate sin que nadie lo sepa. Sin "visto", sin estado activo.',
  },
  {
    icon: '💣',
    title: 'Mensajes efímeros',
    desc:  'Configura el tiempo y se autodestruyen. Como si nunca hubieran existido.',
  },
  {
    icon: '📁',
    title: 'Chats archivados',
    desc:  'Organiza sin eliminar. Muéstrelos cuando quieras, ocúltalos cuando no.',
  },
  {
    icon: '🎨',
    title: '100% personalizable',
    desc:  'Tema claro u oscuro, color de acento y fondo propio. Tu estilo.',
  },
  {
    icon: '⚡',
    title: 'Tiempo real',
    desc:  'Indicador de escritura, reacciones, notificaciones y más — sin recargar.',
  },
];

/* ── Mini mockup CSS del app ────────────────────────────────────────────── */

const buildMockup = () => {
  const win = div({ className: 'lp-app-window', 'aria-hidden': 'true' });

  // Barra de título estilo macOS
  const titlebar = div({ className: 'lp-titlebar' }, win);
  div({ className: 'lp-dot lp-dot--red' }, titlebar);
  div({ className: 'lp-dot lp-dot--yellow' }, titlebar);
  div({ className: 'lp-dot lp-dot--green' }, titlebar);
  span({ className: 'lp-titlebar-label' }, titlebar, 'Texto.');

  const body = div({ className: 'lp-win-body' }, win);

  // Sidebar con chat items
  const sidebar = div({ className: 'lp-win-sidebar' }, body);
  const chatItems = [
    { initials: 'MG', name: 'María García',   preview: 'Me encanta! ❤️',        active: true,  unread: 2  },
    { initials: 'CD', name: 'Carlos Dev',      preview: 'Gracias 😊',            active: false, unread: 1  },
    { initials: 'AD', name: 'Ana Diseño',      preview: '👻 Puedo estar aquí…',  active: false, unread: 0  },
    { initials: 'ET', name: 'Equipo Texto.',   preview: '¡Nos vemos en el demo!', active: false, unread: 5 },
  ];
  chatItems.forEach(({ initials, name, preview, active, unread }) => {
    const item = div({ className: `lp-chat-item${active ? ' lp-chat-item--active' : ''}` }, sidebar);
    div({ className: 'lp-mini-avatar' }, item, initials);
    const info = div({ className: 'lp-chat-info' }, item);
    span({ className: 'lp-chat-name' }, info, name);
    span({ className: 'lp-chat-preview' }, info, preview);
    if (unread) span({ className: 'lp-unread-badge' }, item, String(unread));
  });

  // Panel de conversación
  const conv = div({ className: 'lp-win-conv' }, body);

  // Header de conversación
  const convHead = div({ className: 'lp-conv-head' }, conv);
  div({ className: 'lp-mini-avatar lp-mini-avatar--md' }, convHead, 'MG');
  const convInfo = div({ className: 'lp-chat-info' }, convHead);
  span({ className: 'lp-chat-name' }, convInfo, 'María García');
  span({ className: 'lp-chat-preview' }, convInfo, '● en línea');

  // Mensajes
  const msgs = div({ className: 'lp-messages' }, conv);

  const bubbles = [
    { text: '¡Hola! ¿Cómo va el proyecto? 😊',          sent: false },
    { text: 'Muy bien 🚀 ya tenemos E2E y ghost mode',   sent: true  },
    { text: '¿En serio? ¡Qué increíble!',               sent: false },
    { text: 'Sí — pásate a probarlo 🔒',                 sent: true, withBadge: true },
    { text: '¡Me encanta! ❤️',                           sent: false, withReaction: '❤️ 2' },
  ];
  bubbles.forEach(({ text, sent, withBadge, withReaction }) => {
    const row = div({ className: `lp-bubble-row${sent ? ' lp-bubble-row--sent' : ''}` }, msgs);
    const bubble = div({ className: `lp-bubble${sent ? ' lp-bubble--sent' : ''}` }, row, text);
    if (withBadge)    span({ className: 'lp-e2e-badge' }, bubble, '🔒');
    if (withReaction) span({ className: 'lp-reaction-chip' }, row, withReaction);
  });

  // Input simulado
  const inputBar = div({ className: 'lp-input-bar' }, conv);
  span({ className: 'lp-input-placeholder' }, inputBar, 'Escribe un mensaje…');
  span({ className: 'lp-send-btn' }, inputBar, '↑');

  return win;
};

/* ── Vista principal ────────────────────────────────────────────────────── */

export const LandingView = () => {
  injectStyles();

  const view = div({ className: 'lp-view anim-fade-in' });

  /* ── Nav ─────────────────────────────────────────────────────────────────── */
  const topNav = nav({ className: 'lp-nav glass' }, view);
  span({ className: 'lp-nav-logo' }, topNav, 'Texto.');

  const navLinks = div({ className: 'lp-nav-links' }, topNav);

  if (isDemoMode()) {
    // Si ya está en demo, mostrar botón para ir a los chats
    const goApp = span({ className: 'lp-btn lp-btn--ghost lp-btn--sm',
      role: 'button', tabIndex: 0, onClick: () => navigate('/chats') }, navLinks, 'Ir al app →');
    goApp.addEventListener('keydown', e => { if (e.key === 'Enter') goApp.click(); });
  } else {
    const loginLink = span({
      className: 'lp-btn lp-btn--ghost lp-btn--sm',
      role: 'button',
      tabIndex: 0,
      onClick: () => navigate('/login'),
    }, navLinks, 'Iniciar sesión');
    loginLink.addEventListener('keydown', e => { if (e.key === 'Enter') loginLink.click(); });
  }

  /* ── Main ────────────────────────────────────────────────────────────────── */
  const mainEl = main({ className: 'lp-main' }, view);

  /* ── Hero ────────────────────────────────────────────────────────────────── */
  const hero = section({ className: 'lp-hero', 'aria-labelledby': 'hero-title' }, mainEl);

  const heroContent = div({ className: 'lp-hero-content' }, hero);

  span({ className: 'lp-eyebrow' }, heroContent, '✦ Mensajería privada');

  h1({ className: 'lp-hero-title', id: 'hero-title' }, heroContent, 'Texto.');

  p({ className: 'lp-hero-sub' }, heroContent,
    'Cifrado extremo a extremo, modo fantasma y mensajes efímeros. La privacidad que mereces, con el diseño que esperas.'
  );

  const heroCtaRow = div({ className: 'lp-hero-cta' }, heroContent);

  const demoBtn = div({
    className: 'lp-btn lp-btn--primary',
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Ver demo del app',
    onClick: () => {
      setDemoMode(true);
      loadDemoData();
      navigate('/chats');
    },
  }, heroCtaRow, 'Ver demo →');
  demoBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); demoBtn.click(); }
  });

  const loginBtn = div({
    className: 'lp-btn lp-btn--outline',
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Crear una cuenta o iniciar sesión',
    onClick: () => navigate('/login'),
  }, heroCtaRow, 'Crear cuenta');
  loginBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loginBtn.click(); }
  });

  // Mockup del app
  const mockupWrap = div({ className: 'lp-mockup-wrap' }, hero);
  const glow       = div({ className: 'lp-mockup-glow' }, mockupWrap);
  mockupWrap.appendChild(buildMockup());

  /* ── Features ────────────────────────────────────────────────────────────── */
  const featSection = section({
    className: 'lp-features-section',
    'aria-labelledby': 'features-title',
  }, mainEl);

  h2({ className: 'lp-section-title', id: 'features-title' }, featSection,
    'Todo lo que necesitas, sin lo que no quieres'
  );
  p({ className: 'lp-section-sub' }, featSection,
    'Diseñado desde cero con privacidad como principio, no como afterthought.'
  );

  const grid = div({ className: 'lp-features-grid' }, featSection);

  FEATURES.forEach(({ icon, title, desc }) => {
    const card = div({ className: 'lp-feature-card glass' }, grid);
    span({ className: 'lp-feature-icon' }, card, icon);
    h3({ className: 'lp-feature-title' }, card, title);
    p({ className: 'lp-feature-desc' }, card, desc);
  });

  /* ── CTA final ───────────────────────────────────────────────────────────── */
  const ctaSection = section({ className: 'lp-cta-section', 'aria-labelledby': 'cta-title' }, mainEl);

  const ctaCard = div({ className: 'lp-cta-card glass' }, ctaSection);
  span({ className: 'lp-cta-eyebrow' }, ctaCard, '¿Listo para probarlo?');
  h2({ className: 'lp-cta-title', id: 'cta-title' }, ctaCard,
    'Empieza en segundos. Sin registro.'
  );
  p({ className: 'lp-cta-sub' }, ctaCard,
    'El modo demo carga conversaciones reales con todas las funcionalidades activas.'
  );

  const ctaActions = div({ className: 'lp-cta-actions' }, ctaCard);

  const demoBtn2 = div({
    className: 'lp-btn lp-btn--primary lp-btn--lg',
    role: 'button',
    tabIndex: 0,
    onClick: () => {
      setDemoMode(true);
      loadDemoData();
      navigate('/chats');
    },
  }, ctaActions, 'Iniciar demo →');
  demoBtn2.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); demoBtn2.click(); }
  });

  const loginBtn2 = div({
    className: 'lp-btn lp-btn--outline',
    role: 'button',
    tabIndex: 0,
    onClick: () => navigate('/login'),
  }, ctaActions, 'Crear cuenta');
  loginBtn2.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loginBtn2.click(); }
  });

  /* ── Footer ──────────────────────────────────────────────────────────────── */
  const foot = footer({ className: 'lp-footer' }, view);
  span({ className: 'lp-footer-logo' }, foot, 'Texto.');
  span({ className: 'lp-footer-copy' }, foot, '© 2025 · Proyecto de portafolio · Construido con amor y vainilla 🍦');

  return view;
};

/* ══════════════════════════════════════════════════════════════════════════════
   ESTILOS
══════════════════════════════════════════════════════════════════════════════ */

let _stylesInjected = false;

const injectStyles = () => {
  if (_stylesInjected) return;
  _stylesInjected = true;

  const style = document.createElement('style');
  style.id = 'style-landing';
  style.textContent = `

    /* ── Layout base ─────────────────────────────────────────────────────── */
    .lp-view {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
      overflow-x: hidden;
    }

    /* ── Nav ─────────────────────────────────────────────────────────────── */
    .lp-nav {
      position: sticky;
      top: 0;
      z-index: var(--z-modal);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) var(--space-6);
      border-bottom: 1px solid var(--glass-border);
      backdrop-filter: blur(var(--blur-lg));
    }

    .lp-nav-logo {
      font-size: var(--text-xl);
      font-weight: var(--weight-bold);
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .lp-nav-links {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    /* ── Botones ─────────────────────────────────────────────────────────── */
    .lp-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-sans);
      font-weight: var(--weight-semibold);
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: var(--transition-base);
      user-select: none;
      font-size: var(--text-sm);
      padding: var(--space-3) var(--space-5);
      border: 1.5px solid transparent;
    }
    .lp-btn:active { transform: scale(0.97); }

    .lp-btn--primary {
      background: var(--accent-primary);
      color: var(--accent-on-primary);
      border-color: var(--accent-primary);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
    }
    .lp-btn--primary:hover {
      background: var(--accent-primary-hover);
      box-shadow: 0 6px 28px rgba(99, 102, 241, 0.45);
    }

    .lp-btn--outline {
      background: transparent;
      border-color: var(--glass-border-strong);
      color: var(--text-secondary);
    }
    .lp-btn--outline:hover {
      background: var(--glass-1);
      border-color: var(--text-muted);
      color: var(--text-primary);
    }

    .lp-btn--ghost {
      background: transparent;
      border-color: transparent;
      color: var(--text-secondary);
    }
    .lp-btn--ghost:hover {
      background: var(--glass-1);
      color: var(--text-primary);
    }

    .lp-btn--sm  { font-size: var(--text-xs); padding: var(--space-2) var(--space-4); }
    .lp-btn--lg  { font-size: var(--text-base); padding: var(--space-4) var(--space-7); }

    /* ── Main ────────────────────────────────────────────────────────────── */
    .lp-main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* ── Hero ────────────────────────────────────────────────────────────── */
    .lp-hero {
      display: flex;
      align-items: center;
      gap: var(--space-10);
      padding: clamp(var(--space-10), 8vw, 100px) var(--space-6);
      max-width: 1100px;
      margin: 0 auto;
      width: 100%;
    }

    .lp-hero-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
      min-width: 0;
    }

    .lp-eyebrow {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      letter-spacing: 0.12em;
      color: var(--accent-primary);
      text-transform: uppercase;
    }

    .lp-hero-title {
      font-size: clamp(3rem, 8vw, 5.5rem);
      font-weight: var(--weight-bold);
      color: var(--text-primary);
      letter-spacing: -0.04em;
      line-height: 1;
    }

    .lp-hero-sub {
      font-size: var(--text-lg);
      color: var(--text-secondary);
      line-height: var(--leading-relaxed);
      max-width: 460px;
    }

    .lp-hero-cta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      padding-top: var(--space-2);
    }

    /* ── App mockup ──────────────────────────────────────────────────────── */
    .lp-mockup-wrap {
      flex-shrink: 0;
      position: relative;
      width: min(480px, 100%);
    }

    .lp-mockup-glow {
      position: absolute;
      inset: -40px;
      background: radial-gradient(ellipse at center,
        rgba(99, 102, 241, 0.2) 0%,
        rgba(139, 92, 246, 0.12) 40%,
        transparent 70%
      );
      pointer-events: none;
      border-radius: 50%;
      filter: blur(20px);
    }

    .lp-app-window {
      width: 100%;
      aspect-ratio: 16 / 10;
      background: rgba(9, 9, 15, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow:
        0 40px 80px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
    }

    /* Title bar */
    .lp-titlebar {
      height: 30px;
      background: rgba(9, 9, 15, 0.8);
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      flex-shrink: 0;
    }
    .lp-dot {
      width: 10px; height: 10px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }
    .lp-dot--red    { background: #ff5f57; }
    .lp-dot--yellow { background: #febc2e; }
    .lp-dot--green  { background: #28c840; }

    .lp-titlebar-label {
      flex: 1;
      text-align: center;
      font-size: 10px;
      color: rgba(255,255,255,0.3);
      font-weight: var(--weight-semibold);
      letter-spacing: -0.01em;
      margin-right: 36px; /* balance the dots */
    }

    /* Window body */
    .lp-win-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Mockup sidebar */
    .lp-win-sidebar {
      width: 36%;
      background: rgba(9, 9, 15, 0.5);
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .lp-chat-item {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 6px 10px;
      cursor: default;
      position: relative;
    }
    .lp-chat-item--active { background: rgba(255, 255, 255, 0.06); }

    .lp-mini-avatar {
      width: 26px; height: 26px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      font-size: 8px; font-weight: 700;
      color: white;
      flex-shrink: 0;
      letter-spacing: -0.02em;
    }
    .lp-mini-avatar--md { width: 30px; height: 30px; font-size: 9px; }

    .lp-chat-info { flex: 1; min-width: 0; }
    .lp-chat-name {
      display: block;
      font-size: 9px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lp-chat-preview {
      display: block;
      font-size: 8px;
      color: rgba(255, 255, 255, 0.35);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
    }

    .lp-unread-badge {
      font-size: 7px;
      font-weight: 700;
      color: white;
      background: var(--accent-primary);
      border-radius: var(--radius-full);
      padding: 1px 5px;
      min-width: 14px;
      text-align: center;
      flex-shrink: 0;
    }

    /* Mockup conversation panel */
    .lp-win-conv {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .lp-conv-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      flex-shrink: 0;
    }

    .lp-messages {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 10px;
      overflow: hidden;
    }

    .lp-bubble-row {
      display: flex;
      align-items: flex-end;
      gap: 4px;
    }
    .lp-bubble-row--sent { justify-content: flex-end; }

    .lp-bubble {
      max-width: 72%;
      padding: 4px 8px;
      border-radius: 10px;
      font-size: 8px;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.06);
      position: relative;
    }
    .lp-bubble--sent {
      background: rgba(99, 102, 241, 0.28);
      border-color: rgba(99, 102, 241, 0.2);
    }

    .lp-e2e-badge {
      font-size: 7px;
      margin-left: 4px;
      opacity: 0.7;
    }

    .lp-reaction-chip {
      font-size: 7px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-full);
      padding: 2px 5px;
      color: rgba(255, 255, 255, 0.6);
      align-self: flex-end;
    }

    .lp-input-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-top: 1px solid rgba(255,255,255,0.05);
      background: rgba(9,9,15,0.4);
    }
    .lp-input-placeholder {
      flex: 1;
      font-size: 8px;
      color: rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: var(--radius-full);
      padding: 3px 8px;
    }
    .lp-send-btn {
      width: 18px; height: 18px;
      border-radius: var(--radius-full);
      background: var(--accent-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 9px;
      color: white;
      flex-shrink: 0;
    }

    /* ── Features section ────────────────────────────────────────────────── */
    .lp-features-section {
      padding: clamp(var(--space-10), 6vw, 80px) var(--space-6);
      max-width: 1100px;
      margin: 0 auto;
      width: 100%;
    }

    .lp-section-title {
      font-size: clamp(1.5rem, 4vw, 2.25rem);
      font-weight: var(--weight-bold);
      color: var(--text-primary);
      letter-spacing: -0.03em;
      text-align: center;
      margin-bottom: var(--space-3);
    }

    .lp-section-sub {
      font-size: var(--text-base);
      color: var(--text-muted);
      text-align: center;
      margin-bottom: var(--space-10);
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .lp-features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-4);
    }

    .lp-feature-card {
      padding: var(--space-6);
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      transition: var(--transition-base);
    }
    .lp-feature-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.2);
    }

    .lp-feature-icon {
      font-size: 1.75rem;
      line-height: 1;
    }

    .lp-feature-title {
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
    }

    .lp-feature-desc {
      font-size: var(--text-xs);
      color: var(--text-muted);
      line-height: var(--leading-relaxed);
    }

    /* ── CTA section ─────────────────────────────────────────────────────── */
    .lp-cta-section {
      padding: clamp(var(--space-8), 6vw, 80px) var(--space-6);
      max-width: 1100px;
      margin: 0 auto;
      width: 100%;
    }

    .lp-cta-card {
      border-radius: calc(var(--radius-xl) + 4px);
      padding: clamp(var(--space-8), 5vw, 60px);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--space-4);
      background: linear-gradient(135deg,
        rgba(99,102,241,0.1) 0%,
        rgba(139,92,246,0.07) 50%,
        rgba(6,182,212,0.06) 100%
      );
    }

    .lp-cta-eyebrow {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      letter-spacing: 0.1em;
      color: var(--accent-primary);
      text-transform: uppercase;
    }

    .lp-cta-title {
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      font-weight: var(--weight-bold);
      color: var(--text-primary);
      letter-spacing: -0.03em;
    }

    .lp-cta-sub {
      font-size: var(--text-sm);
      color: var(--text-muted);
      max-width: 420px;
      line-height: var(--leading-relaxed);
    }

    .lp-cta-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      justify-content: center;
      padding-top: var(--space-2);
    }

    /* ── Footer ──────────────────────────────────────────────────────────── */
    .lp-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-5) var(--space-6);
      border-top: 1px solid var(--glass-border);
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .lp-footer-logo {
      font-size: var(--text-base);
      font-weight: var(--weight-bold);
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .lp-footer-copy {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 900px) {
      .lp-hero {
        flex-direction: column;
        gap: var(--space-8);
        text-align: center;
      }
      .lp-hero-sub   { max-width: 100%; margin: 0 auto; }
      .lp-hero-cta   { justify-content: center; }
      .lp-mockup-wrap { width: min(420px, 100%); margin: 0 auto; }
    }

    @media (max-width: 640px) {
      .lp-nav { padding: var(--space-3) var(--space-4); }
      .lp-features-grid { grid-template-columns: 1fr 1fr; }
      .lp-win-sidebar   { display: none; }
      .lp-footer        { justify-content: center; }
    }

    @media (max-width: 420px) {
      .lp-features-grid { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
};
