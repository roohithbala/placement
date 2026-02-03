import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index - automatically deletes expired documents
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster lookups (token index already created by unique: true)
passwordResetSchema.index({ email: 1 });

export default mongoose.model('PasswordReset', passwordResetSchema);