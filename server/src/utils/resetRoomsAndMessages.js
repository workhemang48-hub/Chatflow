import 'dotenv/config';
import { connectDB } from '../config/db.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Submission from '../models/Submission.js';
import mongoose from 'mongoose';

// Wipes rooms, messages, and submissions ONLY — user accounts are left
// completely untouched. Use this to clear out accumulated test-data mess
// (duplicate rooms, ghost DMs pointing at deleted accounts, etc.) and
// start the chat/rooms side fresh, without losing anyone's login.
async function reset() {
  await connectDB();

  const [rooms, messages, submissions] = await Promise.all([
    Room.deleteMany({}),
    Message.deleteMany({}),
    Submission.deleteMany({}),
  ]);

  console.log(`Deleted ${rooms.deletedCount} room(s)`);
  console.log(`Deleted ${messages.deletedCount} message(s)`);
  console.log(`Deleted ${submissions.deletedCount} submission(s)`);
  console.log('\nUser accounts were NOT touched — everyone can still sign in the same way.');
  console.log('Run `npm run seed` next to rebuild a fresh General room.');

  await mongoose.disconnect();
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});