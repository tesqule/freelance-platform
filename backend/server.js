const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ── Защитные пакеты ──────────────────────────────
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

const app = express();
const server = http.createServer(app);

// ── Socket.IO ────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.SITE_URL || 'https://freelance-platform-production-2360.up.railway.app',
    methods: ['GET', 'POST']
  }
});

// ── HELMET — защитные HTTP-заголовки ─────────────
app.use(helmet({
  contentSecurityPolicy: false, // отключаем чтобы не ломать фронт
  crossOriginEmbedderPolicy: false
}));

// ── CORS — только свой домен ──────────────────────
app.use(cors({
  origin: [
    process.env.SITE_URL || 'https://freelance-platform-production-2360.up.railway.app',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10kb' })); // защита от огромных payload

// ── NoSQL Injection защита ────────────────────────
app.use(mongoSanitize());

// ── XSS защита ────────────────────────────────────
app.use(xss());

// ── HPP — защита от дублирования параметров ───────
app.use(hpp());

// ── Rate Limiting ─────────────────────────────────

// Жёсткий лимит для авторизации (защита от брутфорса)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20,                   // 20 попыток
  message: { message: 'Слишком много запросов. Попробуйте через 15 минут.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Общий лимит для API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 300,                  // 300 запросов
  message: { message: 'Слишком много запросов.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);

// ── MongoDB ───────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── Роуты ─────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/tasks',         require('./routes/tasks'));
app.use('/api/chat',          require('./routes/chat'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/portfolio',     require('./routes/portfolio'));
app.use('/api/favorites',     require('./routes/favorites'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/services',      require('./routes/services'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Socket.IO — чат ───────────────────────────────
const Message = require('./models/Message');
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    // Базовая валидация roomId
    if (typeof roomId === 'string' && roomId.length < 200) {
      socket.join(roomId);
    }
  });

  socket.on('send_message', async (data) => {
    try {
      // Валидация данных перед сохранением
      if (!data.room || !data.senderId || !data.text) return;
      if (typeof data.text !== 'string' || data.text.length > 5000) return;

      const message = new Message({
        room: data.room,
        sender: data.senderId,
        text: data.text,
        createdAt: new Date()
      });
      await message.save();
      const populated = await Message.findById(message._id).populate('sender', 'name avatar role');
      io.to(data.room).emit('receive_message', populated);
    } catch(err) {
      console.error('Message error:', err);
    }
  });
});

// ── Telegram Bot ──────────────────────────────────
const { startTelegramBot } = require('./utils/telegramBot');
startTelegramBot();

// ── Глобальный обработчик ошибок ─────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Внутренняя ошибка сервера'
      : err.message
  });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));