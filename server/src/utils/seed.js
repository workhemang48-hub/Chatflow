import 'dotenv/config';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import mongoose from 'mongoose';

// Creates no accounts. Just reads whatever users already exist in the
// database (however they were created — signup form, Atlas, anything)
// and makes sure they're all members of the default "General" team room.
// Safe to run as many times as you want.
async function seed() {
  await connectDB();

  const users = await User.find({}).select('_id name email role');

  if (users.length === 0) {
    console.log('No users found in the database yet — nothing to do.');
    console.log('Sign up through the app first, then run this again if needed.');
    await mongoose.disconnect();
    return;
  }

  const general = await Room.findOneAndUpdate(
    { type: 'team', name: 'General' },
    {
      $setOnInsert: { type: 'team', name: 'General', colorTag: '#5DCAA5' },
      $set: { isDefault: true },
      $addToSet: { members: { $each: users.map((u) => u._id) } },
    },
    { upsert: true, new: true }
  );

  console.log(`General room now has ${general.members.length} member(s):`);
  users.forEach((u) => console.log(`  - ${u.name} (${u.email}, ${u.role})`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});