const { CORS_ORIGIN } = require('../config');
let io;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('joinRoom', ({ conversationId, sessionId }) => {
      if (conversationId) socket.join(`conversation:${conversationId}`);
      if (sessionId) socket.join(`session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      // noop
    });
  });

  return io;
};

const broadcastNewMessage = (conversationId, sessionId, payload) => {
  if (!io) return;
  const rooms = [];
  if (conversationId) rooms.push(`conversation:${conversationId}`);
  if (sessionId) rooms.push(`session:${sessionId}`);

  if (!rooms.length) {
    io.emit('conversation:newMessage', payload);
    return;
  }

  let target = io;
  rooms.forEach((room) => {
    target = target.to(room);
  });
  target.emit('conversation:newMessage', payload);
};

module.exports = {
  initSocket,
  broadcastNewMessage,
};
