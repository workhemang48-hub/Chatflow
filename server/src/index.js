import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';


import { connectDB } from './config/db.js';
import { registerSocketHandlers } from './socket/index.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import roomRoutes from './routes/rooms.js';
import messageRoutes from './routes/messages.js';
import submissionRoutes from './routes/submissions.js';
import pushRoutes from './routes/push.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function main() {
  await connectDB();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: CLIENT_URL, credentials: true },
  });

  app.set('io', io);

  app.use(cors({ origin: CLIENT_URL, credentials: true }));
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.get('/api/health', (req, res) => res.json({ ok: true, service: 'chatflow-server' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/push', pushRoutes);

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
  });

  registerSocketHandlers(io);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`[server] chatflow api + sockets listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error('[server] fatal startup error:', err);
  process.exit(1);
});
