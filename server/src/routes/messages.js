import { Router } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import Submission from '../models/Submission.js';
import { requireAuth } from '../middleware/auth.js';
import { sendPushToUsers } from '../utils/sendPush.js';

const router = Router();

async function assertMember(req, res, roomId) {
  if (!mongoose.isValidObjectId(roomId)) {
    res.status(400).json({ error: 'Invalid room id.' });
    return null;
  }
  const room = await Room.findOne({ _id: roomId, members: req.user._id });
  if (!room) {
    res.status(403).json({ error: 'You are not a member of this room.' });
    return null;
  }
  return room;
}

// Message history for a room, newest 'limit' loaded first (paginated
// backwards from there). Pass ?before=<ISO timestamp> to load older
// messages than that point — used for the "Load earlier messages" button.
router.get('/:roomId', requireAuth, async (req, res) => {
  const { roomId } = req.params;
  const room = await assertMember(req, res, roomId);
  if (!room) return;

  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const query = { roomId };

  if (req.query.before) {
    const before = new Date(req.query.before);
    if (!isNaN(before.getTime())) {
      query.createdAt = { $lt: before };
    }
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('senderId', 'name avatarUrl role')
    .populate('submission')
    .populate('deletedBy', 'name')
    .lean();

  res.json({ messages: messages.reverse(), hasMore: messages.length === limit });
});

// Send a plain text message. Real apps send this over the socket directly;
// this REST fallback exists for clients/environments without a live socket.
router.post('/:roomId', requireAuth, async (req, res) => {
  const { roomId } = req.params;
  const room = await assertMember(req, res, roomId);
  if (!room) return;

  const { content, replyTo } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  let replySnapshot = null;
  if (replyTo && mongoose.isValidObjectId(replyTo)) {
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
    senderId: req.user._id,
    type: 'text',
    content: content.trim(),
    replyTo: replySnapshot,
  });
  const populated = await message.populate('senderId', 'name avatarUrl role');

  req.app.get('io').to(roomId).emit('message:new', populated);
  res.status(201).json({ message: populated });

  const recipientIds = room.members
    .map((m) => m.toString())
    .filter((id) => id !== req.user._id.toString());
  sendPushToUsers(recipientIds, {
    title: req.user.name,
    body: content.trim().slice(0, 120),
    url: `/app/rooms/${roomId}`,
  }).catch((err) => console.error('[push] message notify failed:', err.message));
});

// Edits the content of a text message the requester sent.

router.patch('/:messageId', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(messageId)) {
    return res.status(400).json({ error: 'Invalid message id.' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ error: 'Message not found.' });
  }
  if (message.type !== 'text') {
    return res.status(400).json({ error: 'Only text messages can be edited.' });
  }
  if (message.deleted) {
    return res.status(400).json({ error: 'Cannot edit a deleted message.' });
  }

  const isSender = message.senderId.toString() === req.user._id.toString();
  if (!isSender) {
    return res.status(403).json({ error: 'Only the sender can edit this message.' });
  }

  message.content = content.trim();
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  await message.populate('senderId', 'name avatarUrl role');

  req.app.get('io').to(message.roomId.toString()).emit('message:updated', message);
  res.json({ message });
});

// Soft-deletes a message (plain text or a submission card). Nothing is
// actually erased — content/submission fields stay exactly as they were —
// this only flags it so clients render "deleted by {name}" in its place.
// The original sender can delete their own message; a manager can delete
// anyone's, but only within a room they're actually a member of.
router.delete('/:messageId', requireAuth, async (req, res) => {
  const { messageId } = req.params;

  if (!mongoose.isValidObjectId(messageId)) {
    return res.status(400).json({ error: 'Invalid message id.' });
  }

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ error: 'Message not found.' });
  }

  const room = await Room.findOne({ _id: message.roomId, members: req.user._id });
  if (!room) {
    return res.status(403).json({ error: 'You are not a member of this room.' });
  }

  const isSender = message.senderId.toString() === req.user._id.toString();
  if (!isSender && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Only the sender or a manager can delete this message.' });
  }

  message.deleted = true;
  message.deletedBy = req.user._id;
  message.deletedAt = new Date();
  await message.save();

  await message.populate('senderId', 'name avatarUrl role');
  await message.populate('submission');
  await message.populate('deletedBy', 'name');

  req.app.get('io').to(message.roomId.toString()).emit('message:updated', message);
  res.json({ message });
});

export default router;
