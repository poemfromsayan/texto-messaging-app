/**
 * router.js — Texto. Hash Router
 * ─────────────────────────────────────────────────────────────────────────────
 * Navegación del lado del cliente usando window.location.hash.
 *
 * ¿Por qué hash y no History API?
 *   El hash (#) funciona sin configuración de servidor — el archivo
 *   index.html se puede abrir directamente desde el explorador de archivos
 *   y la navegación funciona igual. La History API requeriría un servidor
 *   que redirija todas las rutas a index.html.
 *
 * Rutas disponibles:
 *   #/         → Lista de chats (sin chat activo)
 *   #/chats    → Lista de chats (sin chat activo)
 *   #/chat/:id → Lista de chats con conversación activa
 *   #/login    → Pantalla de inicio de sesión
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { setTheme, getTheme, isAuthenticated, setAccentColor, getAccentColor, initOfflineDetector, initSessionLock } from './utils.js';
import { openChat }      from './store.js';
import { navigate }      from './navigation.js';
import { LoginView }     from './views/LoginView.js';
import { ProfileView }   from './views/ProfileView.js';
import { ChatListView }  from './views/ChatListView.js';

/* ══════════════════════════════════════════════════════════════════════════════
   CONTENEDOR
══════════════════════════════════════════════════════════════════════════════ */

const app = document.getElementById('app');

/* ══════════════════════════════════════════════════════════════════════════════
   DEFINICIÓN DE RUTAS
   Cada ruta mapea un patrón de path a una función que retorna un HTMLElement.
══════════════════════════════════════════════════════════════════════════════ */

const routes = {
  '/':        () => ChatListView(),
  '/chats':   () => ChatListView(),
  '/login':   () => LoginView(),
  '/profile': () => ProfileView(),

  '/chat/:id': ({ id }) => {
    openChat(id);
    return ChatListView({ activeChatId: id });
  },
};

/* ══════════════════════════════════════════════════════════════════════════════
   MATCHING DE RUTAS
   Compara el path actual contra los patrones definidos.
   Soporta segmentos dinámicos con el prefijo ":" (ej: :id).
══════════════════════════════════════════════════════════════════════════════ */

/**
 * @param {string} path - Path actual (ej: "/chat/123")
 * @returns {{ handler: Function, params: Object } | null}
 */
const matchRoute = (path) => {
  for (const [pattern, handler] of Object.entries(routes)) {
    // Match exacto
    if (pattern === path) return { handler, params: {} };

    // Match con parámetros dinámicos
    const patternParts = pattern.split('/');
    const pathParts    = path.split('/');

    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    const matched = patternParts.every((segment, i) => {
      if (segment.startsWith(':')) {
        params[segment.slice(1)] = decodeURIComponent(pathParts[i]);
        return true;
      }
      return segment === pathParts[i];
    });

    if (matched) return { handler, params };
  }

  return null;
};

/* ══════════════════════════════════════════════════════════════════════════════
   RENDER
   Lee el hash, encuentra la ruta, y monta la vista en #app.
══════════════════════════════════════════════════════════════════════════════ */

const render = () => {
  const path = window.location.hash.slice(1) || '/';
  const auth = isAuthenticated();

  // ── Auth guard ────────────────────────────────────────────────────────────
  // Usuario no autenticado intentando acceder a una ruta protegida → login
  if (path !== '/login' && !auth) {
    navigate('/login');
    return;
  }
  // Usuario autenticado intentando ir a login → chats
  if (path === '/login' && auth) {
    navigate('/chats');
    return;
  }

  const match = matchRoute(path);

  // Ruta no encontrada → inicio apropiado según auth state
  if (!match) {
    navigate(auth ? '/' : '/login');
    return;
  }

  // Limpia la vista anterior y monta la nueva
  app.innerHTML = '';
  const view = match.handler(match.params);
  app.appendChild(view);
};

/* navigate se exporta desde navigation.js */
export { navigate } from './navigation.js';

/* ══════════════════════════════════════════════════════════════════════════════
   INICIALIZACIÓN
══════════════════════════════════════════════════════════════════════════════ */

const init = () => {
  // 1. Aplica el tema guardado (o detecta el del SO)
  setTheme(getTheme());

  // 2. Aplica el color de acento guardado
  setAccentColor(getAccentColor());

  // 3. Inicializa el detector de conexión
  initOfflineDetector();

  // 4. Inicializa el bloqueo de sesión con PIN
  initSessionLock();

  // 5. Escucha cambios de ruta
  window.addEventListener('hashchange', render);

  // 6. Render inicial
  render();
};

init();
