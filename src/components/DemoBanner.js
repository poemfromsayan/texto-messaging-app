/**
 * DemoBanner.js — Texto. Demo Mode Banner
 * ─────────────────────────────────────────────────────────────────────────────
 * Barra persistente que aparece en la parte superior del app cuando el usuario
 * está en modo demo. Indica el estado y ofrece un CTA para crear cuenta.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { div, span } from '../../html.js';
import { clearDemoMode } from '../utils.js';

let _stylesInjected = false;

const injectStyles = () => {
  if (_stylesInjected) return;
  _stylesInjected = true;

  const style = document.createElement('style');
  style.id = 'style-demo-banner';
  style.textContent = `
    .demo-banner {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 6px var(--space-4);
      background: linear-gradient(90deg,
        rgba(99, 102, 241, 0.18) 0%,
        rgba(139, 92, 246, 0.14) 50%,
        rgba(6, 182, 212, 0.12) 100%
      );
      border-bottom: 1px solid rgba(99, 102, 241, 0.2);
      flex-shrink: 0;
      z-index: var(--z-raised);
      backdrop-filter: blur(8px);
    }

    .demo-badge {
      font-size: 9px;
      font-weight: var(--weight-bold);
      letter-spacing: 0.12em;
      color: var(--accent-primary);
      background: rgba(99, 102, 241, 0.18);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: var(--radius-full);
      padding: 2px 8px;
      flex-shrink: 0;
    }

    .demo-text {
      flex: 1;
      font-size: var(--text-xs);
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .demo-cta {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--accent-primary);
      cursor: pointer;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(99, 102, 241, 0.3);
      transition: var(--transition-fast);
      flex-shrink: 0;
      white-space: nowrap;
    }
    .demo-cta:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--accent-primary);
    }
  `;
  document.head.appendChild(style);
};

/**
 * Crea el banner de modo demo.
 * @returns {HTMLElement}
 */
export const DemoBanner = () => {
  injectStyles();

  const banner = div({ className: 'demo-banner', role: 'status', 'aria-live': 'polite' });

  span({ className: 'demo-badge' }, banner, 'DEMO');
  span({ className: 'demo-text' }, banner, 'Estás explorando Texto. en modo demo — los datos no se guardan');

  const cta = span({
    className: 'demo-cta',
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Salir del modo demo y crear una cuenta',
    onClick: () => {
      clearDemoMode();
      window.location.href = window.location.pathname + '#/login';
      window.location.reload();
    },
  }, banner, 'Crear cuenta →');

  cta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cta.click(); }
  });

  return banner;
};
