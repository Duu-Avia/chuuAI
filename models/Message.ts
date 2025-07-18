import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  pageId: String,
  senderId: String,
  message: String,
  timestamp: Number,
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

export default Message;
