const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/chat',      require('./routes/chat'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/reviews',   require('./routes/reviews'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/admin',     require('./routes/admin'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

const Message = require('./models/Message');
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => socket.join(roomId));
  socket.on('send_message', async (data) => {
    try {
      const message = new Message({ room: data.room, sender: data.senderId, text: data.text, createdAt: new Date() });
      await message.save();
      const populated = await Message.findById(message._id).populate('sender', 'name avatar role');
      io.to(data.room).emit('receive_message', populated);
    } catch(err) { console.error('Message error:', err); }
  });
});

const { startTelegramBot } = require('./utils/telegramBot');
startTelegramBot();

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));