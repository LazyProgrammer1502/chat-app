<div align="center">

# 💬 ChatApp — Real-time MERN Chat

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[**Live Demo →**](https://your-chat-app.vercel.app) &nbsp;|&nbsp; [**API →**](https://your-chat-api.onrender.com/api/health)

A full-stack real-time chat application with direct messages, group rooms, typing indicators, read receipts, and file sharing — built with the MERN stack and Socket.io.

</div>

---

## 📸 Screenshots

> *(Add screenshots after deploying)*

---

## ✨ Features

### Messaging
- **Direct Messages** — 1-on-1 chat between any two users
- **Group Rooms** — create rooms, name them, add multiple members
- **Real-time delivery** — messages appear instantly via Socket.io WebSockets
- **Image sharing** — upload and render images inline in chat
- **File sharing** — attach PDFs and documents with download card
- **Delete messages** — soft delete with "Message deleted" placeholder

### Presence & Feedback
- **Online/offline status** — live green dot on avatars, updates instantly
- **Last seen** — shows when a user was last active
- **Typing indicators** — animated dots with "X is typing…" appear in real time
- **Read receipts** — single tick (delivered) → double blue tick (seen)
- **Unread badges** — per-room unread count in the sidebar

### Auth & Security
- **JWT authentication** — register, login, protected routes
- **Passwords hashed** with bcrypt (never stored in plain text)
- **Socket auth** — every WebSocket connection verified with JWT
- **NoSQL injection prevention** via express-mongo-sanitize
- **Rate limiting** on all API routes

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Tailwind CSS, Axios |
| **Real-time** | Socket.io client + server |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose |
| **Auth** | JSON Web Tokens (JWT), bcryptjs |
| **File Storage** | Cloudinary |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## 🗂 Project Structure

```
chat-app/
├── client/                          # React + Vite frontend
│   └── src/
│       ├── api/
│       │   ├── axios.js             # Axios instance + JWT interceptor
│       │   └── services.js          # All API call functions
│       ├── context/
│       │   ├── AuthContext.jsx      # Global auth state
│       │   ├── SocketContext.jsx    # Socket.io connection + all events
│       │   └── ChatContext.jsx      # Rooms list + active room state
│       ├── components/
│       │   ├── chat/                # ChatWindow, ChatHeader, MessageBubble,
│       │   │                        # MessageInput, TypingIndicator
│       │   ├── sidebar/             # Sidebar, NewGroupModal
│       │   └── ui/                  # Avatar, Spinner, ProtectedRoute
│       ├── pages/
│       │   ├── auth/                # Login, Register
│       │   └── ChatLayout.jsx       # Main layout — sidebar + chat window
│       └── utils/time.js            # Time formatting helpers
│
└── server/                          # Node.js + Express backend
    ├── config/
    │   ├── db.js                    # MongoDB connection
    │   └── cloudinary.js            # Multer + Cloudinary storage
    ├── controllers/
    │   ├── authController.js        # Register, login, search users
    │   ├── roomController.js        # DM + group room CRUD
    │   └── messageController.js     # Paginated messages, file upload
    ├── middleware/
    │   ├── auth.js                  # JWT protect (HTTP + Socket)
    │   └── errorHandler.js          # Global error handler
    ├── models/
    │   ├── User.js                  # isOnline, lastSeen, socketId
    │   ├── Room.js                  # type: dm | group, members, lastMessage
    │   └── Message.js               # type: text | image | file, readBy[]
    ├── routes/                      # Express routers
    └── socket/
        └── socketHandler.js         # All Socket.io events
```

---

## ⚡ How Socket.io Works Here

This app uses **persistent bidirectional connections** — unlike REST where you request and wait, the server pushes data to every client instantly.

```
Client A sends message
    → server receives 'send_message' event
    → saves to MongoDB
    → emits 'new_message' to every socket in the room
    → Client B receives it instantly without polling
```

**Events the client emits:**

| Event | Payload | What it does |
|---|---|---|
| `send_message` | `{ roomId, text, type }` | Send a message |
| `typing_start` | `{ roomId }` | Tell others you're typing |
| `typing_stop` | `{ roomId }` | Stop the typing indicator |
| `mark_read` | `{ roomId }` | Mark all messages as read |
| `join_room` | `{ roomId }` | Join a newly created room |
| `delete_message` | `{ messageId, roomId }` | Delete a message |

**Events the client listens to:**

| Event | What it means |
|---|---|
| `new_message` | A message arrived in a room |
| `typing` | Someone started/stopped typing |
| `messages_read` | Someone read the messages |
| `message_deleted` | A message was deleted |
| `presence` | A user came online or went offline |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- [MongoDB Atlas](https://mongodb.com/atlas) account (free)
- [Cloudinary](https://cloudinary.com) account (free)

### 1. Clone the repo
```bash
git clone https://github.com/LazyProgrammer1502/chat-app.git
cd chat-app
```

### 2. Setup the server
```bash
cd server
npm install
cp .env.example .env
```

Fill in `server/.env`:
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=any_long_random_string
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev    # starts on :5001
```

### 3. Setup the client
```bash
cd ../client
npm install
npm run dev    # starts on :5173
```

The frontend proxies `/api` and Socket.io to `:5001` via Vite config — no extra configuration needed in development.

---

## 🌐 Deployment

### Backend → Render
1. New Web Service → connect repo → **Root Directory:** `server`
2. Build: `npm install` | Start: `npm start`
3. Add all env variables from `.env.example`

### Frontend → Vercel
1. New Project → connect repo → **Root Directory:** `client`
2. Add environment variable: `VITE_API_URL = https://your-api.onrender.com`

### Important
- In MongoDB Atlas → **Network Access** → allow `0.0.0.0/0` (Render uses dynamic IPs)
- After Vercel deploys, go back to Render and set `CLIENT_URL = https://your-app.vercel.app`

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/me` | ✅ | Update name/bio |
| GET | `/api/auth/search?q=` | ✅ | Search users by name/email |
| GET | `/api/rooms` | ✅ | Get all user's rooms |
| POST | `/api/rooms/dm` | ✅ | Get or create DM with user |
| POST | `/api/rooms/group` | ✅ | Create group room |
| DELETE | `/api/rooms/:id/leave` | ✅ | Leave a room |
| GET | `/api/messages/:roomId` | ✅ | Get paginated messages |
| POST | `/api/messages/upload/image` | ✅ | Upload image (multipart) |
| POST | `/api/messages/upload/file` | ✅ | Upload file (multipart) |
| DELETE | `/api/messages/:id` | ✅ | Delete own message |

---

## 👨‍💻 Author

**Muhammad Faizan**

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-blue?style=flat-square)](https://muhammad-faizan-portfolio.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-LazyProgrammer1502-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/LazyProgrammer1502)

---

<div align="center">
  <sub>Built as a portfolio project to demonstrate real-time full-stack development with Socket.io</sub>
</div>
