import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import { sendPushToUsers } from '../utils/sendPush.js';
// Tracks how many active sockets each user currently has open, so presence
// only flips to "offline" once their LAST tab/connection disconnects.
const activeConnectionsByUser = new Map();

export function registerSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing auth token.'));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (!user) return next(new Error('User not found.'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token.'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();

    const count = (activeConnectionsByUser.get(userId) || 0) + 1;
    activeConnectionsByUser.set(userId, count);

    if (count === 1) {
      await User.findByIdAndUpdate(userId, { status: 'online' });
      io.emit('presence:update', { userId, status: 'online' });
    }
    // A personal channel, independent of any chat room — lets the server
    // push events straight to this user (e.g. "you were just added to a
    // new DM") even though their socket connected before that room existed.
    socket.join(userId);
    // Auto-join every room this user is a member of, so presence/typing/
    // messages broadcast correctly without an explicit join step per room.
    const rooms = await Room.find({ members: userId }).select('_id');
    rooms.forEach((room) => socket.join(room._id.toString()));

    socket.on('room:join', (roomId) => {
      socket.join(roomId);
    });

    socket.on('room:leave', (roomId) => {
      socket.leave(roomId);
    });

    // Primary path for plain text messages — sent and broadcast over the
    // live socket connection instead of a REST round trip.
    socket.on('message:send', async ({ roomId, content, replyTo }, ack) => {
      try {
        if (!content || !content.trim()) {
          return ack?.({ error: 'Message content cannot be empty.' });
        }

        const room = await Room.findById(roomId);
        if (!room || !room.members.some((m) => m.toString() === userId)) {
          return ack?.({ error: 'You are not a member of this room.' });
        }

        let replySnapshot = null;
        if (replyTo) {
          const original = await Message.findById(replyTo).populate('senderId', 'name').populate('submission');
          if (original) {
            replySnapshot = {
              messageId: original._id,
              senderName: original.senderId?.name || 'Unknown',
              preview: original.deleted
                ? 'This message was deleted'
                : original.type === 'submission'
                ? original.submission?.fileName || 'Attachment'
                : original.content,
            };
          }
        }

        const message = await Message.create({
          roomId,
          senderId: userId,
          type: 'text',
          content: content.trim(),
          replyTo: replySnapshot,
        });
        const populated = await message.populate('senderId', 'name avatarUrl role');

        io.to(roomId).emit('message:new', populated);
        ack?.({ ok: true, message: populated });

        const recipientIds = room.members
          .map((m) => m.toString())
          .filter((id) => id !== userId);
        sendPushToUsers(recipientIds, {
          title: socket.user.name,
          body: content.trim().slice(0, 120),
          url: `/app/rooms/${roomId}`,
        }).catch((err) => console.error('[push] message notify failed:', err.message));
      } catch (err) {
        ack?.({ error: 'Could not send message.' });
      }
    });

    socket.on('typing:start', ({ roomId }) => {
      socket.to(roomId).emit('typing:update', {
        roomId,
        userId,
        name: socket.user.name,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ roomId }) => {
      socket.to(roomId).emit('typing:update', {
        roomId,
        userId,
        name: socket.user.name,
        isTyping: false,
      });
    });

    socket.on('disconnect', async () => {
      const remaining = (activeConnectionsByUser.get(userId) || 1) - 1;

      if (remaining <= 0) {
        activeConnectionsByUser.delete(userId);
        await User.findByIdAndUpdate(userId, { status: 'offline' });
        io.emit('presence:update', { userId, status: 'offline' });
      } else {
        activeConnectionsByUser.set(userId, remaining);
      }
    });
  });
}
