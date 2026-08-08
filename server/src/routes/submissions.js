import { Router } from 'express';
import mongoose from 'mongoose';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Submission from '../models/Submission.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload, persistUploadedFile } from '../middleware/upload.js';
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

async function populateForBroadcast(messageId) {
  return Message.findById(messageId)
    .populate('senderId', 'name avatarUrl role')
    .populate('submission');
}

// Submit work: uploads a file, creates a Submission + a 'submission' Message,
// broadcasts to the room so the manager sees the approval card live.
router.post('/room/:roomId', requireAuth, upload.single('file'), async (req, res) => {
  const { roomId } = req.params;
  const room = await assertMember(req, res, roomId);
  if (!room) return;

  if (!req.file) {
    return res.status(400).json({ error: 'A file is required to submit work.' });
  }

  const message = await Message.create({
    roomId,
    senderId: req.user._id,
    type: 'submission',
  });

  const { url, storageKey } = await persistUploadedFile(req, req.file);

  const submission = await Submission.create({
    messageId: message._id,
    roomId,
    submittedBy: req.user._id,
    fileUrl: url,
    fileStorageKey: storageKey,
    fileName: req.file.originalname,
    note: req.body.note || '',
    status: 'pending',
  });

  message.submission = submission._id;
  await message.save();

  const populated = await populateForBroadcast(message._id);
  req.app.get('io').to(roomId).emit('message:new', populated);

  res.status(201).json({ message: populated });

  const recipientIds = room.members
    .map((m) => m.toString())
    .filter((id) => id !== req.user._id.toString());
  sendPushToUsers(recipientIds, {
    title: req.user.name,
    body: `Submitted a file: ${req.file.originalname}`,
    url: `/app/rooms/${roomId}`,
  }).catch((err) => console.error('[push] submission notify failed:', err.message));
});

// Manager re-review after "changes requested": employee re-uploads a file
// against the SAME submission, status returns to 'pending'.
router.post('/:submissionId/resubmit', requireAuth, upload.single('file'), async (req, res) => {
  const { submissionId } = req.params;
  const submission = await Submission.findById(submissionId);

  if (!submission) return res.status(404).json({ error: 'Submission not found.' });
  if (submission.submittedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Only the original submitter can resubmit.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'A file is required to resubmit.' });
  }

  const { url, storageKey } = await persistUploadedFile(req, req.file);
  submission.fileUrl = url;
  submission.fileStorageKey = storageKey;
  submission.fileName = req.file.originalname;
  if (req.body.note !== undefined) submission.note = req.body.note;
  submission.status = 'pending';
  submission.reviewedBy = null;
  submission.reviewNote = '';
  submission.reviewedAt = null;
  await submission.save();

  const populated = await populateForBroadcast(submission.messageId);
  req.app.get('io').to(submission.roomId.toString()).emit('message:updated', populated);

  res.json({ message: populated });
});

// Manager decision: approve or request changes.
router.patch('/:submissionId/review', requireAuth, requireRole('manager'), async (req, res) => {
  const { submissionId } = req.params;
  const { decision, reviewNote } = req.body; // decision: 'approved' | 'changes_requested'

  if (!['approved', 'changes_requested'].includes(decision)) {
    return res.status(400).json({ error: "Decision must be 'approved' or 'changes_requested'." });
  }

  const submission = await Submission.findById(submissionId);
  if (!submission) return res.status(404).json({ error: 'Submission not found.' });

  const room = await Room.findOne({ _id: submission.roomId, members: req.user._id });
  if (!room) return res.status(403).json({ error: 'You are not a member of this room.' });

  submission.status = decision;
  submission.reviewedBy = req.user._id;
  submission.reviewNote = reviewNote || '';
  submission.reviewedAt = new Date();
  await submission.save();

  const populated = await populateForBroadcast(submission.messageId);
  req.app.get('io').to(submission.roomId.toString()).emit('message:updated', populated);

  res.json({ message: populated });
});

// "My submissions" — the current user's own history across all rooms.
router.get('/mine', requireAuth, async (req, res) => {
  const submissions = await Submission.find({ submittedBy: req.user._id })
    .sort({ createdAt: -1 })
    .populate('roomId', 'name type')
    .populate('reviewedBy', 'name');

  res.json({ submissions });
});

export default router;
