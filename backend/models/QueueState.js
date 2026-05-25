const mongoose = require('mongoose');

const queueStateSchema = new mongoose.Schema({
  officeId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true },
  serviceId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  currentToken: { type: Number, default: 0 },
  lastToken:    { type: Number, default: 0 },
  isOpen:       { type: Boolean, default: false },
  date:         { type: String }
}, { timestamps: true });

queueStateSchema.index({ officeId: 1, serviceId: 1 }, { unique: true });

module.exports = mongoose.model('QueueState', queueStateSchema);