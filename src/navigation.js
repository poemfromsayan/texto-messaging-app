/**
 * navigation.js — Texto. Navigate Helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Exporta la función navigate de forma independiente para evitar dependencias
 * circulares entre router.js (que importa las vistas) y las vistas
 * (que necesitan navegar).
 *
 * Tanto router.js como las vistas importan desde aquí.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Navega a una ruta cambiando el hash de la URL.
 * @param {string} path - Ej: '/chats', '/chat/123', '/login'
 */
export const navigate = (path) => {
  window.location.hash = path;
};
