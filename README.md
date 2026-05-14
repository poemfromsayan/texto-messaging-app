# Texto. — Private Messaging App

A Telegram-inspired private messaging web application built entirely with **vanilla JavaScript** and no UI frameworks. Designed with a glassmorphism aesthetic, a custom component library, and a focus on privacy features.

**[Live Demo →](https://poemfromsayan.github.io/texto-messaging-app/)**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Vanilla JavaScript (ES Modules) |
| Bundler | Vite 5 |
| Styling | CSS Custom Properties (design tokens) |
| State | Observable Store pattern |
| Routing | Hash-based client-side router |
| Persistence | localStorage |
| Audio | Web Audio API |
| Notifications | Notifications API |
| Deploy | GitHub Pages via GitHub Actions |

No React. No Vue. No jQuery. No UI library. Every component is hand-built.

---

## Features

### Messaging
- **Real-time chat** with simulated responses and typing indicator
- **Image messages** — attach and preview photos inline
- **Reply to messages** — threaded quote blocks with sender context
- **Forward messages** — send to any chat, with optional anonymous forwarding
- **Delete messages** — tombstone system preserving reply chain integrity
- **Message reactions** — emoji picker with reaction badges and counts
- **Pinned messages** — sticky banner with scroll-to behavior
- **Self-destructing messages** — auto-delete after 10s / 1m / 1h / 24h
- **Date separators** — automatic day groupings in conversation history
- **Multi-select** — select multiple messages to delete in bulk

### Privacy & Security
- **End-to-end encryption** (simulated) — lock badge, info banner, and per-message icon
- **Ghost Mode** — hides typing indicator and online status from contacts
- **PIN session lock** — 4-digit keypad with 5-minute inactivity auto-lock
- **Block users** — block/unblock contacts with banner and input suppression
- **Archived chats** — hide conversations from the main list, expandable section in sidebar
- **Active sessions** — view and terminate remote sessions from profile
- **Forward anonymously** — remove sender attribution when forwarding

### Customization & UX
- **Dark / Light mode** — system-aware toggle
- **6 accent color themes** — persistent across sessions
- **Browser notifications** — with permission flow
- **Notification sound** — synthesized via Web Audio API, toggleable
- **Offline mode** — connectivity banner and graceful degradation
- **Real-time search** — filters chats and contacts instantly
- **New chat modal** — searchable contact list with animated UI
- **Responsive layout** — desktop sidebar + mobile full-screen

---

## Architecture

```
texto-messaging-app/
├── html.js                  # Custom DOM factory — the core of the component system
├── tokens.css               # Design system: all CSS custom properties
├── src/
│   ├── router.js            # Hash-based SPA router with auth guard
│   ├── store.js             # Observable store (setState / subscribe pattern)
│   ├── navigation.js        # Decoupled navigate() to avoid circular imports
│   ├── utils.js             # Theme, auth, sound, ghost mode, PIN lock, accent colors
│   ├── components/
│   │   ├── Avatar.js        # Presence ring + initials
│   │   ├── Badge.js         # Unread count badge
│   │   ├── Button.js        # Polymorphic button (primary / ghost / icon)
│   │   ├── ChatListItem.js  # Sidebar conversation row
│   │   ├── Input.js         # Text input + image message input bar
│   │   └── MessageBubble.js # Full message bubble with all interaction states
│   ├── views/
│   │   ├── LoginView.js
│   │   ├── ChatListView.js  # Sidebar + new chat modal + archived section
│   │   ├── ConversationView.js
│   │   └── ProfileView.js   # Settings, PIN, ghost mode, sessions, accent colors
│   └── styles/
│       ├── base.css
│       ├── utilities.css
│       └── animations.css
└── assets/                  # App icons (16, 32, 180, 192, 512px)
```

### Key Patterns

**`html.js` — DOM Factory**
A `tag()` function that creates and configures DOM elements declaratively, including event listeners, attributes, and child nesting. All components are plain functions returning `HTMLElement`.

**Observable Store**
A single source of truth with `getState()`, `setState(partial)`, and `subscribe(fn)`. Components clean up their subscriptions via `MutationObserver` when removed from the DOM.

**Auth Guard**
The router checks `localStorage` for a valid session before rendering any protected route, redirecting to `/login` otherwise.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/poemfromsayan/texto-messaging-app.git
cd texto-messaging-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app runs on `http://localhost:5173`. Use any name and password to log in (mock authentication).

---

## License

MIT
