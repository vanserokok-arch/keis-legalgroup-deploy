const http = require('http');
const app = require('./app');
const { PORT } = require('./config');
const { initDb } = require('./db');
const { initSocket } = require('./socket');
const { info } = require('./utils/logger');

const start = async () => {
  await initDb();

  const server = http.createServer(app);
  const io = initSocket(server);

  server.listen(PORT, () => {
    info(`KXchat server running on http://localhost:${PORT}`);
    info(`Socket.IO ready`);
  });

  return { server, io };
};

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
