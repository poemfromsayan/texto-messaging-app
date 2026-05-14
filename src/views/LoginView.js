/**
 * LoginView.js — Texto. Login Screen
 */

import { main, div, h1, p } from '../../html.js';
import { Input }             from '../components/Input.js';
import { Button }            from '../components/Button.js';
import { navigate }          from '../navigation.js';
import { setAuthenticated, requestNotificationPermission } from '../utils.js';

/**
 * Pantalla de inicio de sesión.
 * Panel glass centrado sobre el fondo del gradiente.
 *
 * Flujo:
 *   1. El usuario ingresa su número de teléfono.
 *   2. Se valida que el campo no esté vacío.
 *   3. Se persiste la sesión con setAuthenticated(true).
 *   4. Se navega a /chats.
 *
 * @returns {HTMLElement}
 */
export const LoginView = () => {

  injectStyles();

  // ── Shell ──────────────────────────────────────────────────────────────────
  const view = main({ className: 'login-view' });

  // ── Panel glass ───────────────────────────────────────────────────────────
  const panel = div({ className: 'login-panel glass-strong anim-scale-in' }, view);

  // Logo / marca
  const logo = div({ className: 'login-logo' }, panel);
  h1({ className: 'login-brand' }, logo, 'Texto.');
  p({ className: 'login-tagline' }, logo, 'Mensajería privada y segura.');

  // Separador
  div({ className: 'login-divider' }, panel);

  // Formulario
  const form = div({ className: 'login-form' }, panel);

  // Campo de teléfono — se trackea el valor con onInput
  let phoneValue = '';
  form.appendChild(Input({
    id: 'phone',
    labelText: 'Número de teléfono',
    type: 'tel',
    placeholder: '+52 55 0000 0000',
    onInput: (e) => {
      phoneValue = e.target.value;
      // Oculta el error mientras el usuario escribe
      errorMsg.classList.remove('login-error--visible');
    },
  }));

  // Mensaje de error (oculto por defecto)
  const errorMsg = p({ className: 'login-error' }, form,
    'Ingresa tu número de teléfono para continuar.'
  );

  // Botón continuar
  form.appendChild(Button({
    text: 'Continuar',
    variant: 'primary',
    type: 'submit',
    onClick: () => {
      if (!phoneValue.trim()) {
        errorMsg.classList.add('login-error--visible');
        document.getElementById('phone')?.focus();
        return;
      }
      setAuthenticated(true);
      // Solicita permiso de notificaciones después del login (con contexto claro)
      requestNotificationPermission();
      navigate('/chats');
    },
  }));

  // Nota de privacidad
  p({ className: 'login-privacy' }, panel,
    'Al continuar aceptas los términos de servicio. Tu número nunca se comparte.'
  );

  return view;
};

/* ── Estilos de la vista ──────────────────────────────────────────────────── */

const injectStyles = () => {
  if (document.getElementById('style-login')) return;

  const style = document.createElement('style');
  style.id = 'style-login';
  style.textContent = `
    .login-view {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      padding: var(--space-6);
    }

    .login-panel {
      width: 100%;
      max-width: 380px;
      padding: var(--space-10) var(--space-8);
      border-radius: var(--radius-2xl);
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      box-shadow: var(--shadow-lg);
    }

    .login-logo { text-align: center; }

    .login-brand {
      font-size: var(--text-3xl);
      font-weight: var(--weight-bold);
      letter-spacing: -0.04em;
      color: var(--text-primary);
    }

    .login-tagline {
      font-size: var(--text-sm);
      color: var(--text-muted);
      margin-top: var(--space-2);
    }

    .login-divider {
      height: 1px;
      background: var(--glass-border);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .login-form .btn {
      width: 100%;
      justify-content: center;
      padding: var(--space-4);
      margin-top: var(--space-1);
    }

    /* ── Error inline ────────────────────────────────────────────────── */
    .login-error {
      font-size: var(--text-xs);
      color: var(--status-danger);
      display: none;
      text-align: center;
    }
    .login-error--visible { display: block; }

    /* ── Nota de privacidad ──────────────────────────────────────────── */
    .login-privacy {
      font-size: var(--text-xs);
      color: var(--text-muted);
      text-align: center;
      line-height: var(--leading-relaxed);
    }

    /* ── Input scoped a login ────────────────────────────────────────── */
    .login-view .input-wrap {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .login-view .input-label {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--text-secondary);
      letter-spacing: 0.04em;
    }
    .login-view .input {
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      color: var(--text-primary);
      background: var(--glass-2);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4);
      width: 100%;
      outline: none;
      transition: var(--transition-base);
      backdrop-filter: var(--blur-sm);
      -webkit-backdrop-filter: var(--blur-sm);
    }
    .login-view .input::placeholder { color: var(--text-muted); }
    .login-view .input:focus {
      border-color: var(--text-secondary);
      background: var(--glass-3);
      box-shadow: 0 0 0 3px rgba(128, 128, 128, 0.15);
    }
  `;
  document.head.appendChild(style);
};
