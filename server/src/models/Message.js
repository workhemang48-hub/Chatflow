import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'submission'], required: true },
    content: { type: String, default: '' }, // used for type: 'text'
    submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }, // used for type: 'submission'
    // Soft delete only — content/submission above is intentionally left
    // intact in the database. Clients render deleted messages as
    // "deleted by {name}" instead of their real content, but nothing is
    // actually erased server-side.
    deleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null },

    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },

    replyTo: {
      type: new mongoose.Schema(
        {
          messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
          senderName: String,
          preview: String,
        },
        { _id: false }
      ),
      default: null,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export default mongoose.model('Message', messageSchema);
