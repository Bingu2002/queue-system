const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  citizenId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestPhone:  { type: String },
  officeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true },
  serviceId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  tokenNumber: { type: Number, required: true },
  status:      { type: String, enum: ['waiting', 'called', 'served', 'skipped', 'cancelled'], default: 'waiting' },
  issuedAt:    { type: Date, default: Date.now },
  calledAt:    { type: Date },
  servedAt:    { type: Date },
  date:        { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Token', tokenSchema);