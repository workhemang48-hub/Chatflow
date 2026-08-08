import { Router } from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Submission from '../models/Submission.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
  res.json({ users: users.map((u) => u.toSafeJSON()) });
});

router.patch('/:userId/reset-password', requireAuth, requireRole('manager'), async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const tempPassword = crypto.randomBytes(9).toString('base64').replace(/[/+=]/g, '').slice(0, 10);
  user.passwordHash = await User.hashPassword(tempPassword);
  user.mustChangePassword = true;
  await user.save();

  res.json({ tempPassword, user: user.toSafeJSON() });
});

// Deletes the signed-in user's own account, cascading cleanup so no other
// data is left pointing at a user that no longer exists:
//  - pulled out of every room's members array
//  - any DM rooms that become empty (no members left) are removed entirely
//  - their messages/submissions are left in place for room history, but
//    senderId will simply no longer resolve — the client renders that as
//    "Deleted user" rather than crashing (see MessageList/RoomView).
//
// This is the ONLY correct way to remove a user without leaving orphaned
// references. Deleting a user document directly in the database (e.g. via
// Atlas) skips all of this and WILL cause exactly the ghost-member/
// duplicate-room issues seen during testing — this endpoint exists so
// that never has to happen again.
router.delete('/me', requireAuth, async (req, res) => {
  const userId = req.user._id;

  await Room.updateMany({ members: userId }, { $pull: { members: userId } });
  await Room.deleteMany({ type: 'dm', members: { $size: 0 } });
  await User.findByIdAndDelete(userId);

  res.json({ ok: true });
});

export default router;