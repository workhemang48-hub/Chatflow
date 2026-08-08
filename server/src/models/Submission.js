import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    // Cloudinary public_id (if STORAGE_DRIVER=cloudinary) or local filename
    // (if not) — not used for anything yet, kept so a future "delete the
    // file when its submission is deleted" feature doesn't need another
    // storage-layer migration.
    fileStorageKey: { type: String, default: '' },
    fileName: { type: String, required: true },
    note: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'changes_requested'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export default mongoose.model('Submission', submissionSchema);
