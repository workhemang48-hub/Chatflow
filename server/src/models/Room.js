import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['team', 'dm'], required: true },
    colorTag: { type: String, default: '#5DCAA5' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    // Marks a shared, mandatory channel (currently just "General") that
    // every employee is auto-joined to on signup — nobody can leave it or
    // remove someone else from it, enforced both here and server-side.
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

roomSchema.index({ members: 1 });

export default mongoose.model('Room', roomSchema);
