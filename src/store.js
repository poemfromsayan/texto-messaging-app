/**
 * store.js — Texto. Global State (Observable Store)
 * ─────────────────────────────────────────────────────────────────────────────
 * Estado central de la app. Patrón Observable:
 *   1. El estado vive en un objeto interno privado.
 *   2. Los componentes se suscriben con subscribe(fn).
 *   3. Los cambios se hacen con setState(partial).
 *   4. Cada cambio notifica a todos los suscriptores.
 *
 * No hay dependencias externas — funciona con JS puro.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getTheme, showNotification, playNotificationSound } from './utils.js';

/* ══════════════════════════════════════════════════════════════════════════════
   DATOS MOCK
   Simulan la información que vendría de un servidor real.
   Se reemplazarán por llamadas a API en futuras fases.
══════════════════════════════════════════════════════════════════════════════ */

const now = new Date();
const minsAgo  = (m) => new Date(now - m * 60 * 1000);
const hoursAgo = (h) => minsAgo(h * 60);
const daysAgo  = (d) => hoursAgo(d * 24);

const MOCK_CHATS = [
  {
    id: '1',
    name: 'Adrián R.',
    initials: 'AR',
    status: 'online',
    lastMessage: 'Perfecto, me alegra mucho 🙌',
    lastTime: minsAgo(3),
    unread: 3,
  },
  {
    id: '2',
    name: 'María G.',
    initials: 'MG',
    status: 'away',
    lastMessage: '¿Viste el commit de anoche?',
    lastTime: hoursAgo(14),
    unread: 0,
  },
  {
    id: '3',
    name: 'Carlos L.',
    initials: 'CL',
    status: 'busy',
    lastMessage: 'Ok, mañana revisamos el pull request',
    lastTime: daysAgo(2),
    unread: 12,
  },
  {
    id: '4',
    name: 'Sara J.',
    initials: 'SJ',
    status: 'offline',
    lastMessage: 'Perfecto, nos vemos mañana entonces',
    lastTime: daysAgo(5),
    unread: 0,
  },
];

const MOCK_MESSAGES = {
  '1': [
    { id: 'm1', text: 'Hola, ¿viste el nuevo diseño de Texto.?',       sent: false, time: minsAgo(12) },
    { id: 'm2', text: 'Sí, el monocromático se ve increíble 🖤',        sent: true,  time: minsAgo(10), delivered: true },
    { id: 'm3', text: '¿Cuándo empezamos a implementarlo?',             sent: false, time: minsAgo(8) },
    { id: 'm4', text: 'Ya mismo — html.js ya está listo 🚀',            sent: true,  time: minsAgo(5), delivered: true },
    { id: 'm5', text: 'Perfecto, me alegra mucho 🙌',                   sent: false, time: minsAgo(3) },
  ],
  '2': [
    { id: 'm1', text: '¿Viste el commit de anoche?',                    sent: false, time: hoursAgo(14) },
  ],
  '3': [
    { id: 'm1', text: 'Ok, mañana revisamos el pull request',           sent: false, time: daysAgo(2) },
  ],
  '4': [
    { id: 'm1', text: 'Perfecto, nos vemos mañana entonces',            sent: true,  time: daysAgo(5), delivered: true },
  ],
};

const MOCK_CONTACTS = [
  { id: 'c1', name: 'Luis M.',    initials: 'LM', status: 'online'  },
  { id: 'c2', name: 'Elena V.',   initials: 'EV', status: 'away'    },
  { id: 'c3', name: 'Pedro A.',   initials: 'PA', status: 'offline' },
  { id: 'c4', name: 'Natalia R.', initials: 'NR', status: 'online'  },
  { id: 'c5', name: 'Diego F.',   initials: 'DF', status: 'busy'    },
];

/* ══════════════════════════════════════════════════════════════════════════════
   ESTADO INICIAL
══════════════════════════════════════════════════════════════════════════════ */

const state = {
  /** Tema activo de la UI */
  theme: getTheme(),

  /** Usuario autenticado (mock) */
  user: {
    id: 'me',
    name: 'Saúl',
    initials: 'SJ',
    status: 'online',
  },

  /** ID del chat actualmente abierto. null = ninguno */
  activeChatId: null,

  /** Lista de conversaciones */
  chats: MOCK_CHATS,

  /** Mensajes por chatId */
  messages: MOCK_MESSAGES,

  /** Contactos disponibles para iniciar un chat */
  contacts: MOCK_CONTACTS,

  /** Mensaje fijado por chatId: { [chatId]: msgId | null } */
  pinnedMessages: {},

  /** Temporizador de autodestrucción por chatId: { [chatId]: number | null }
   *  Valores posibles: null (off), 10, 60, 3600, 86400 (segundos)
   */
  disappearTimers: {},

  /** IDs de chats archivados (ocultos de la lista principal) */
  archivedChats: JSON.parse(localStorage.getItem('texto-archived') ?? '[]'),
};

/* ══════════════════════════════════════════════════════════════════════════════
   SUSCRIPTORES
══════════════════════════════════════════════════════════════════════════════ */

const listeners = new Set();

/* ══════════════════════════════════════════════════════════════════════════════
   API PÚBLICA
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Retorna una copia superficial del estado actual.
 * No expone la referencia interna para evitar mutaciones externas.
 * @returns {typeof state}
 */
export const getState = () => ({ ...state });

/**
 * Actualiza el estado con los campos provistos y notifica a suscriptores.
 * @param {Partial<typeof state>} partial
 */
export const setState = (partial) => {
  Object.assign(state, partial);
  const snapshot = { ...state };
  listeners.forEach(fn => fn(snapshot));
};

/**
 * Suscribe una función al estado. Se ejecuta cada vez que el estado cambia.
 * @param {(state: typeof state) => void} fn
 * @returns {() => void} Función para cancelar la suscripción
 */
export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/* ══════════════════════════════════════════════════════════════════════════════
   HELPERS — Acceso rápido a partes del estado
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Busca un chat por su id.
 * @param {string} id
 * @returns {object|null}
 */
export const getChat = (id) =>
  state.chats.find(c => c.id === id) ?? null;

/**
 * Retorna los mensajes de un chat.
 * @param {string} chatId
 * @returns {object[]}
 */
export const getMessages = (chatId) =>
  state.messages[chatId] ?? [];

/* ══════════════════════════════════════════════════════════════════════════════
   ACCIONES
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Abre un chat: lo marca como activo y limpia los no leídos.
 * @param {string} chatId
 */
export const openChat = (chatId) => {
  const chats = state.chats.map(c =>
    c.id === chatId ? { ...c, unread: 0 } : c
  );
  setState({ activeChatId: chatId, chats });
};

/**
 * Envía un mensaje en un chat.
 * Añade el mensaje al estado y simula la confirmación de entrega tras 1 segundo.
 *
 * @param {string} chatId
 * @param {string} text
 */
export const sendMessage = (chatId, text, imageData = null, replyTo = null) => {
  if (!text?.trim() && !imageData) return;

  const msg = {
    id: `msg-${Date.now()}`,
    text: text?.trim() ?? '',
    imageData: imageData ?? null,
    replyTo: replyTo ?? null,   // { id, text, imageData, senderName }
    sent: true,
    time: new Date(),
    delivered: false,
  };

  const messages = {
    ...state.messages,
    [chatId]: [...(state.messages[chatId] ?? []), msg],
  };

  const preview = imageData ? '📷 Imagen' : text.trim();
  const chats = state.chats.map(c =>
    c.id === chatId
      ? { ...c, lastMessage: preview, lastTime: new Date(), unread: 0 }
      : c
  );

  setState({ messages, chats });

  // Programa autodestrucción si el chat tiene timer activo
  const sendTimer = getDisappearTimer(chatId);
  if (sendTimer) scheduleMessageDeletion(chatId, msg.id, sendTimer);

  // Simula confirmación de entrega del servidor
  setTimeout(() => {
    const updated = {
      ...state.messages,
      [chatId]: state.messages[chatId].map(m =>
        m.id === msg.id ? { ...m, delivered: true } : m
      ),
    };
    setState({ messages: updated });
  }, 1000);
};

/**
 * Actualiza parcialmente el perfil del usuario autenticado.
 * Notifica a todos los suscriptores para que re-rendericen.
 *
 * @param {{ name?: string, initials?: string, status?: string }} partial
 */
export const updateUser = (partial) => {
  setState({ user: { ...state.user, ...partial } });
};

/**
 * Agrega o quita una reacción de un mensaje.
 * - Si el emoji es mío → lo quita (toggle off)
 * - Si el emoji es de otros → suma mi voto (toggle on)
 * - Si el emoji no existe → lo crea con count:1, mine:true
 *
 * Estructura de reactions en cada mensaje:
 *   { '👍': { count: 2, mine: true }, '❤️': { count: 1, mine: false } }
 *
 * @param {string} chatId
 * @param {string} msgId
 * @param {string} emoji
 */
/** Opciones de temporizador de autodestrucción */
export const DISAPPEAR_OPTIONS = [
  { label: 'Desactivado', value: null  },
  { label: '10 segundos', value: 10   },
  { label: '1 minuto',    value: 60   },
  { label: '1 hora',      value: 3600 },
  { label: '1 día',       value: 86400 },
];

/**
 * Configura el temporizador de autodestrucción de un chat.
 * @param {string} chatId
 * @param {number|null} seconds - null = desactivado
 */
export const setDisappearTimer = (chatId, seconds) => {
  setState({ disappearTimers: { ...state.disappearTimers, [chatId]: seconds ?? null } });
};

/**
 * Retorna el temporizador activo de un chat en segundos, o null.
 * @param {string} chatId
 * @returns {number|null}
 */
export const getDisappearTimer = (chatId) =>
  state.disappearTimers[chatId] ?? null;

/**
 * Programa la autodestrucción de un mensaje tras `seconds` segundos.
 * Llama a deleteMessage al expirar el timer.
 * @param {string} chatId
 * @param {string} msgId
 * @param {number} seconds
 */
export const scheduleMessageDeletion = (chatId, msgId, seconds) => {
  setTimeout(() => {
    deleteMessage(chatId, msgId);
  }, seconds * 1000);
};

/**
 * Fija un mensaje en un chat (uno por chat)./**
 * Fija un mensaje en un chat (uno por chat).
 * @param {string} chatId
 * @param {string} msgId
 */
export const pinMessage = (chatId, msgId) => {
  setState({ pinnedMessages: { ...state.pinnedMessages, [chatId]: msgId } });
};

/**
 * Desfija el mensaje activo en un chat.
 * @param {string} chatId
 */
export const unpinMessage = (chatId) => {
  const updated = { ...state.pinnedMessages };
  delete updated[chatId];
  setState({ pinnedMessages: updated });
};

/**
 * Retorna el id del mensaje fijado en un chat, o null.
 * @param {string} chatId
 * @returns {string|null}
 */
export const getPinnedMessageId = (chatId) =>
  state.pinnedMessages[chatId] ?? null;

/**
 * Marca un mensaje como eliminado./**
 * Marca un mensaje como eliminado.
 * No lo borra del array — lo reemplaza por un objeto "tombstone"
 * para preservar la estructura del hilo (replies, etc.).
 *
 * @param {string} chatId
 * @param {string} msgId
 */
export const deleteMessage = (chatId, msgId) => {
  const msgs = state.messages[chatId] ?? [];

  const updated = msgs.map(m =>
    m.id === msgId
      ? { ...m, deleted: true, text: '', imageData: null, reactions: {}, replyTo: null }
      : m
  );

  setState({ messages: { ...state.messages, [chatId]: updated } });
};

export const toggleReaction = (chatId, msgId, emoji) => {
  const msgs = state.messages[chatId] ?? [];

  const updated = msgs.map(m => {
    if (m.id !== msgId) return m;

    const reactions = { ...(m.reactions ?? {}) };
    const current   = reactions[emoji];

    if (current?.mine) {
      // Quito mi reacción
      if (current.count <= 1) {
        delete reactions[emoji];
      } else {
        reactions[emoji] = { count: current.count - 1, mine: false };
      }
    } else if (current) {
      // Sumo al emoji existente
      reactions[emoji] = { count: current.count + 1, mine: true };
    } else {
      // Reacción nueva
      reactions[emoji] = { count: 1, mine: true };
    }

    return { ...m, reactions };
  });

  setState({ messages: { ...state.messages, [chatId]: updated } });
};

/**
 * Retorna la lista de contactos disponibles.
 * @returns {object[]}
 */
export const getContacts = () => state.contacts;

/**
 * Crea un nuevo chat con un contacto.
 * Si ya existe un chat con ese contacto, retorna su id.
 *
 * @param {{ id: string, name: string, initials: string, status: string }} contact
 * @returns {string} chatId del chat creado o existente
 */
export const createChat = (contact) => {
  // Busca si ya hay un chat con este contacto
  const existing = state.chats.find(c => c.id === contact.id);
  if (existing) return existing.id;

  const newChat = {
    id: contact.id,
    name: contact.name,
    initials: contact.initials,
    status: contact.status,
    lastMessage: '',
    lastTime: new Date(),
    unread: 0,
  };

  setState({
    chats: [newChat, ...state.chats],
    messages: { ...state.messages, [contact.id]: [] },
  });

  return contact.id;
};

/**
 * Recibe un mensaje entrante (del "otro" usuario).
 * No marca como delivered — ya llegó.
 *
 * @param {string} chatId
 * @param {string} text
 */
export const receiveMessage = (chatId, text) => {
  if (!text.trim()) return;

  const msg = {
    id: `msg-${Date.now()}`,
    text: text.trim(),
    sent: false,
    time: new Date(),
    delivered: true,
  };

  const messages = {
    ...state.messages,
    [chatId]: [...(state.messages[chatId] ?? []), msg],
  };

  const chat = getChat(chatId);
  const chats = state.chats.map(c =>
    c.id === chatId
      ? { ...c, lastMessage: text.trim(), lastTime: new Date() }
      : c
  );

  setState({ messages, chats });

  // Programa autodestrucción si el chat tiene timer activo
  const recvTimer = getDisappearTimer(chatId);
  if (recvTimer) scheduleMessageDeletion(chatId, msg.id, recvTimer);

  // Sonido de notificación
  playNotificationSound();

  // Notificación nativa si la tab está en segundo plano
  if (chat) {
    showNotification(chat.name, text.trim(), { tag: chatId });
  }
};

/* ══════════════════════════════════════════════════════════════════════════════
   CHATS ARCHIVADOS
══════════════════════════════════════════════════════════════════════════════ */

/** Persiste el arreglo de archivados en localStorage */
const _saveArchived = (list) => {
  localStorage.setItem('texto-archived', JSON.stringify(list));
};

/**
 * Archiva un chat por ID (lo oculta de la lista principal).
 * @param {string} chatId
 */
export const archiveChat = (chatId) => {
  if (state.archivedChats.includes(chatId)) return;
  const updated = [...state.archivedChats, chatId];
  // Si el chat archivado era el activo, cerrarlo
  const extra = state.activeChatId === chatId ? { activeChatId: null } : {};
  setState({ archivedChats: updated, ...extra });
  _saveArchived(updated);
};

/**
 * Desarchiva un chat, devolviéndolo a la lista principal.
 * @param {string} chatId
 */
export const unarchiveChat = (chatId) => {
  const updated = state.archivedChats.filter(id => id !== chatId);
  setState({ archivedChats: updated });
  _saveArchived(updated);
};

/**
 * Comprueba si un chat está archivado.
 * @param {string} chatId
 * @returns {boolean}
 */
export const isArchived = (chatId) =>
  state.archivedChats.includes(chatId);

/* ══════════════════════════════════════════════════════════════════════════════
   BLOQUEO DE USUARIOS
══════════════════════════════════════════════════════════════════════════════ */

// Inicializar blockedUsers en el estado
state.blockedUsers = JSON.parse(localStorage.getItem('texto-blocked') ?? '[]');

const _saveBlocked = (list) =>
  localStorage.setItem('texto-blocked', JSON.stringify(list));

/**
 * Bloquea al contacto asociado con este chatId.
 * @param {string} chatId
 */
export const blockUser = (chatId) => {
  if (state.blockedUsers.includes(chatId)) return;
  const updated = [...state.blockedUsers, chatId];
  setState({ blockedUsers: updated });
  _saveBlocked(updated);
};

/**
 * Desbloquea al contacto asociado con este chatId.
 * @param {string} chatId
 */
export const unblockUser = (chatId) => {
  const updated = state.blockedUsers.filter(id => id !== chatId);
  setState({ blockedUsers: updated });
  _saveBlocked(updated);
};

/**
 * Comprueba si el contacto de este chat está bloqueado.
 * @param {string} chatId
 * @returns {boolean}
 */
export const isBlocked = (chatId) =>
  state.blockedUsers.includes(chatId);

/* ══════════════════════════════════════════════════════════════════════════════
   REENVÍO DE MENSAJES
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Reenvía un mensaje a otro chat.
 * @param {string}  targetChatId  - Chat de destino
 * @param {Object}  message       - Mensaje original (del store)
 * @param {boolean} anonymous     - true = no incluir nombre del remitente
 */
export const forwardMessage = (targetChatId, message, anonymous = false) => {
  const targetMessages = state.messages[targetChatId] ?? [];
  const { user, chats } = state;

  const newMsg = {
    id:            `msg-${Date.now()}-fwd`,
    text:          message.text ?? '',
    imageData:     message.imageData ?? null,
    sent:          true,
    time:          new Date(),
    delivered:     true,
    reactions:     {},
    replyTo:       null,
    deleted:       false,
    forwardedFrom: anonymous ? null : { name: message.sent ? user.name : (chats.find(c => c.id === targetChatId)?.name ?? 'Desconocido') },
  };

  const updated = {
    ...state.messages,
    [targetChatId]: [...targetMessages, newMsg],
  };

  // Actualizar el preview del chat destino
  const updatedChats = state.chats.map(c =>
    c.id === targetChatId
      ? { ...c, lastMessage: message.text || '📷 Imagen', lastTime: newMsg.time }
      : c
  );

  setState({ messages: updated, chats: updatedChats });
};

/* ══════════════════════════════════════════════════════════════════════════════
   DEMO DATA
   Datos ricos precargados para el modo de demostración.
   Muestran las principales funcionalidades sin necesidad de cuenta.
══════════════════════════════════════════════════════════════════════════════ */

const _demoNow   = () => new Date();
const _demoMin   = (m) => new Date(Date.now() - m * 60000);
const _demoHour  = (h) => _demoMin(h * 60);
const _demoDay   = (d) => _demoHour(d * 24);

const DEMO_CHATS = [
  {
    id: 'demo-1',
    name: 'María García',
    initials: 'MG',
    status: 'online',
    lastMessage: '¿Lo vemos hoy? 👀',
    lastTime: _demoMin(4),
    unread: 2,
  },
  {
    id: 'demo-2',
    name: 'Carlos Dev',
    initials: 'CD',
    status: 'away',
    lastMessage: 'Gracias 😊 fue difícil refactorizar ese módulo',
    lastTime: _demoMin(22),
    unread: 1,
  },
  {
    id: 'demo-3',
    name: 'Ana Diseño',
    initials: 'AD',
    status: 'busy',
    lastMessage: '👻 Exacto — puedo estar aquí sin que nadie lo sepa',
    lastTime: _demoHour(2),
    unread: 0,
  },
  {
    id: 'demo-4',
    name: 'Equipo Texto.',
    initials: 'ET',
    status: 'online',
    lastMessage: '¡Nos vemos en el demo! 🎊',
    lastTime: _demoMin(7),
    unread: 5,
  },
  {
    id: 'demo-arch',
    name: 'Soporte',
    initials: 'SO',
    status: 'offline',
    lastMessage: 'Tu solicitud fue procesada correctamente.',
    lastTime: _demoDay(7),
    unread: 0,
  },
];

const DEMO_MESSAGES = {
  'demo-1': [
    {
      id: 'dm1-1',
      text: '¡Hola! ¿Cómo va el proyecto?',
      sent: false,
      time: _demoHour(2),
      delivered: false,
      reactions: {},
      replyTo: null,
      deleted: false,
    },
    {
      id: 'dm1-2',
      text: 'Muy bien 🚀 ya tenemos el cifrado E2E listo, ghost mode, mensajes efímeros…',
      sent: true,
      time: _demoHour(2),
      delivered: true,
      reactions: { '🔒': ['MG'] },
      replyTo: null,
      deleted: false,
    },
    {
      id: 'dm1-3',
      text: '¿En serio? ¿Cómo lo implementaste?',
      sent: false,
      time: _demoHour(1),
      delivered: false,
      reactions: {},
      replyTo: null,
      deleted: false,
    },
    {
      id: 'dm1-4',
      text: 'Es una simulación con la misma UX que Telegram — mismo flujo, mismo badge de candado 🔐',
      sent: true,
      time: _demoHour(1),
      delivered: true,
      reactions: {},
      replyTo: null,
      deleted: false,
    },
    {
      id: 'dm1-5',
      text: '¡Me encanta! El detalle del badge está increíble',
      sent: false,
      time: _demoMin(30),
      delivered: false,
      reactions: { '❤️': ['me'], '👍': ['me'] },
      replyTo: null,
      deleted: false,
    },
    {
      id: 'dm1-6',
      text: '¿Lo vemos hoy? 👀',
      sent: false,
      time: _demoMin(4),
      delivered: false,
      reactions: {},
      replyTo: null,
      deleted: false,
    },
  ],
  'demo-2': [
    {
      id: 'dm2-1',
      text: 'Oye, ¿puedes revisar el PR de esta tarde?',
      sent: false,
      time: _demoDay(1),
      delivered: false,
      reactions: {},
      replyTo: null,
      deleted: false,
    },
    {
      id: 'dm2-2',
      text: 'Claro, lo veo en cuanto salga de la reunión',
      sent: true,
      time: _demoDay(1),
      delivered: true,
      reactions: {},
      replyTo: null,
      deleted: false,
    },
    {
      id: 'dm2-3',
      text: '¡El código quedó muy limpio! Refactorizar ese módulo valió la pena',
      sent: false,
      time: _demoMin(45),
      delivered: false,
      reactions: {},
      replyTo: { msgId: 'dm2-2', text: 'Claro, lo veo en cuanto salga de la reunión', sent: true },
      deleted: false,
    },
    {
      id: 'dm2-4',
      text: 'Gracias 😊 fue difícil refactorizar ese módulo',
      sent: true,
      time: _demoMin(22),
      delivered: true,
      reactions: {},
      replyTo: null,
      deleted: false,
    },
  ],
  'demo-3': [
    {
      id: 'dm3-1',
      text: 'Vi tu diseño en Figma — ¡el sistema de tokens está muy bien pensado!',
      sent: false,
      time: _demoDay(2),
      delivered: false,
      reactions: {},
      replyTo: null,
      deleted: false,
    },
    {
      id: 'dm3-2',
      text: 'Gracias, fue bastante trabajo alinear todo con CSS custom properties',
      sent: true,
      time: _demoDay(2),
      delivered: true,
      reactions: {},
      replyTo: null,
      deleted: false,
    },
    {
      id: 'dm3-3',
      text: '',
      sent: false,
      time: _demoDay(1),
      delivered: false,
      reactions: {},
      replyTo: null,
      deleted: true,
    },
    {
      id: 'dm3-4',
      text: 'Por cierto, ¿activaste el modo fantasma? No te vi conectado en todo el día',
      sent: false,
      time: _demoHour(3),
      delivered: false,
      reactions: {},
      replyTo: null,
      deleted: false,
    },
    {
      id: 'dm3-5',
      text: '👻 Exacto — puedo estar aquí sin que nadie lo sepa',
      sent: true,
      time: _demoHour(2),
      delivered: true,
      reactions: { '👻': ['AD'] },
      replyTo: null,
      deleted: false,
    },
  ],
  'demo-4': [
    {
      id: 'dm4-1',
      text: 'Deploy listo en GitHub Pages 🚀',
      sent: true,
      time: _demoHour(1),
      delivered: true,
      reactions: {},
      replyTo: null,
      deleted: false,
      senderInitials: 'TU',
    },
    {
      id: 'dm4-2',
      text: '¡Excelente! Ya lo probé y todo funciona perfecto',
      sent: false,
      time: _demoMin(50),
      delivered: false,
      reactions: {},
      replyTo: null,
      deleted: false,
      senderInitials: 'MG',
    },
    {
      id: 'dm4-3',
      text: '¿Cuándo agregamos los grupos reales? 🤔',
      sent: false,
      time: _demoMin(40),
      delivered: false,
      reactions: {},
      replyTo: null,
      deleted: false,
      senderInitials: 'CD',
    },
    {
      id: 'dm4-4',
      text: 'Pronto 😄 primero el landing page — queda increíble',
      sent: true,
      time: _demoMin(15),
      delivered: true,
      reactions: { '🎉': ['MG', 'CD'], '🔥': ['AD'] },
      replyTo: null,
      deleted: false,
    },
    {
      id: 'dm4-5',
      text: '¡Nos vemos en el demo! 🎊',
      sent: false,
      time: _demoMin(7),
      delivered: false,
      reactions: {},
      replyTo: null,
      deleted: false,
      senderInitials: 'AD',
    },
  ],
  'demo-arch': [
    {
      id: 'dma-1',
      text: 'Tu solicitud fue procesada correctamente.',
      sent: false,
      time: _demoDay(7),
      delivered: false,
      reactions: {},
      replyTo: null,
      deleted: false,
    },
  ],
};

const DEMO_CONTACTS = [
  { id: 'dc1', name: 'María García', initials: 'MG', status: 'online'  },
  { id: 'dc2', name: 'Carlos Dev',   initials: 'CD', status: 'away'    },
  { id: 'dc3', name: 'Ana Diseño',   initials: 'AD', status: 'busy'    },
];

/**
 * Carga datos de demostración en el store global.
 * Llamar antes de navegar a '/chats' en modo demo.
 */
export const loadDemoData = () => {
  setState({
    user: {
      id: 'me',
      name: 'Visitante',
      initials: 'VI',
      status: 'online',
    },
    chats:          DEMO_CHATS,
    messages:       DEMO_MESSAGES,
    contacts:       DEMO_CONTACTS,
    activeChatId:   'demo-1',
    pinnedMessages: { 'demo-1': 'dm1-4' },
    disappearTimers: {},
    archivedChats:  ['demo-arch'],
    blockedUsers:   [],
  });
};
