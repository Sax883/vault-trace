import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  sender: { type: String, required: true }, // 'client' or 'admin'
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

MessageSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

MessageSchema.set('toJSON', {
  virtuals: true,
});

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

export default Message;