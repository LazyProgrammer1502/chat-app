const express      = require('express');
const { createServer } = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit    = require('express-rate-limit');
require('dotenv').config();

const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

connectDB();

const app        = express();
const httpServer = createServer(app);

const allowedOrigins = ['http://localhost:5173', process.env.CLIENT_URL].filter(Boolean);

// ── Security ─────────────────────────────
app.use(helmet());
app.use(mongoSanitize());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// ── Rate limiting — generous in dev ──────
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// ── Body parsing ─────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── REST routes ───────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/rooms',    require('./routes/roomRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

app.get('/api/health', (_, res) => res.json({ success: true, message: 'Chat API running 🚀' }));
app.use('*', (req, res) => res.status(404).json({ success: false, message: `${req.originalUrl} not found` }));
app.use(errorHandler);

// ── Socket.io ────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});
require('./socket/socketHandler')(io);

// ── Start ─────────────────────────────────
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
