import { Router } from 'express';
import mongoose from 'mongoose';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// List rooms the current user belongs to.
router.get('/', requireAuth, async (req, res) => {
  const rooms = await Room.find({ members: req.user._id })
    .populate('members', 'name avatarUrl status role')
    .sort({ createdAt: 1 });
  res.json({ rooms });
});
// Create a team channel.
router.post('/', requireAuth, async (req, res) => {
  const { name, colorTag, memberIds = [] } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Channel name is required.' });
  }

  const creatorId = req.user._id.toString();
  const members = Array.from(new Set([creatorId, ...memberIds]));

  let room;
  try {
    room = await Room.create({ name: name.trim(), type: 'team', colorTag, members });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A channel with that name already exists.' });
    }
    throw err;
  }

  const populated = await room.populate('members', 'name avatarUrl status role');

  // Push the new channel to every OTHER member's personal socket channel so
  // their sidebar updates live. The creator doesn't need this — they get
  // the room directly from this response, and adding it here too would
  // double-insert it client-side (same bug we fixed on the DM path).
  const io = req.app.get('io');
  members
    .filter((id) => id !== creatorId)
    .forEach((id) => io.to(id).emit('room:new', populated));

  res.status(201).json({ room: populated });
});

// Get-or-create a DM room between the current user and another user.
router.post('/dm/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  const other = await User.findById(userId);
  if (!other) return res.status(404).json({ error: 'User not found.' });

  let room = await Room.findOne({
    type: 'dm',
    members: { $all: [req.user._id, userId], $size: 2 },
  }).populate('members', 'name avatarUrl status role');

if (!room) {
    room = await Room.create({
      name: other.name,
      type: 'dm',
      members: [req.user._id, userId],
    });
    room = await room.populate('members', 'name avatarUrl status role');

    req.app.get('io').to(userId).emit('room:new', room);
  }
  res.status(200).json({ room });
});

// Add people to an existing team channel. Only current members can invite
// others. Notifies newly-added members with 'room:new' (so it appears in
// their sidebar) and existing members with 'room:updated' (so their member
// list/avatar stack refreshes) — mirrors the same live-update pattern used
// for channel creation and DMs.
router.post('/:roomId/members', requireAuth, async (req, res) => {
  const { roomId } = req.params;
  const { memberIds = [] } = req.body;

  if (!mongoose.isValidObjectId(roomId)) {
    return res.status(400).json({ error: 'Invalid room id.' });
  }
  if (memberIds.length === 0) {
    return res.status(400).json({ error: 'Select at least one person to add.' });
  }

  const room = await Room.findOne({ _id: roomId, members: req.user._id, type: 'team' });
  if (!room) {
    return res.status(403).json({ error: 'You are not a member of this channel.' });
  }
  if (room.isDefault) {
    return res.status(400).json({ error: 'Everyone is already part of this channel automatically.' });
  }

  const before = room.members.map((id) => id.toString());
  const toAdd = memberIds.filter((id) => !before.includes(id));

  if (toAdd.length === 0) {
    return res.status(400).json({ error: 'Everyone selected is already in this channel.' });
  }

  room.members = [...before, ...toAdd];
  await room.save();
  const populated = await room.populate('members', 'name avatarUrl status role');

  const io = req.app.get('io');
  toAdd.forEach((id) => io.to(id).emit('room:new', populated));
  io.to(roomId).emit('room:updated', populated);

  res.json({ room: populated });
});

// Remove a member from a team channel. Anyone can remove themselves
// (leave). Removing someone ELSE requires the manager role — this app has
// no per-channel admin concept, so channel-membership moderation piggybacks
// on the same role used for approving submissions.
router.delete('/:roomId/members/:userId', requireAuth, async (req, res) => {
  const { roomId, userId } = req.params;

  if (!mongoose.isValidObjectId(roomId) || !mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }

  const room = await Room.findOne({ _id: roomId, members: req.user._id, type: 'team' });
  if (!room) {
    return res.status(403).json({ error: 'You are not a member of this channel.' });
  }
  if (room.isDefault) {
    return res.status(400).json({ error: 'This channel is shared by everyone and can\'t be left.' });
  }

  const isSelf = userId === req.user._id.toString();
  if (!isSelf && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Only a manager can remove other members.' });
  }

  const before = room.members.map((id) => id.toString());
  if (!before.includes(userId)) {
    return res.status(400).json({ error: 'That person is not in this channel.' });
  }

  room.members = before.filter((id) => id !== userId);
  await room.save();

  const io = req.app.get('io');

  if (room.members.length === 0) {
    await Room.deleteOne({ _id: room._id });
  } else {
    const populated = await room.populate('members', 'name avatarUrl status role');
    io.to(roomId).emit('room:updated', populated);
  }

  // Tell the removed person's own client their access is gone (so it drops
  // out of their sidebar even if they're mid-session), and force their
  // socket to actually leave the room so no further broadcast reaches them.
  io.to(userId).emit('room:removed', { roomId });
  io.in(userId).socketsLeave(roomId);

  res.json({ ok: true });
});

export default router;
