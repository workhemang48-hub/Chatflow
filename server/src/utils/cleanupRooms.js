import 'dotenv/config';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import mongoose from 'mongoose';

// Removes any room "member" ObjectId that no longer points to a real user
// document — leftover references from accounts that were deleted and
// recreated during testing. Safe to run any time; only removes ghosts,
// never touches real, current members.
async function cleanup() {
  await connectDB();

  const realUserIds = new Set((await User.find({}).select('_id')).map((u) => u._id.toString()));
  const rooms = await Room.find({});

  for (const room of rooms) {
    const before = room.members.length;
    room.members = room.members.filter((id) => realUserIds.has(id.toString()));
    const after = room.members.length;

    if (before !== after) {
      await room.save();
      console.log(`"${room.name}" (${room.type}): removed ${before - after} ghost member(s), ${after} remain`);
    } else {
      console.log(`"${room.name}" (${room.type}): clean, ${after} member(s)`);
    }
  }

  await mongoose.disconnect();
}

cleanup().catch((err) => {
  console.error(err);
  process.exit(1);
});