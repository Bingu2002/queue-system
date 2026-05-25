const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  officeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true },
  name:        { type: String, required: true },
  description: { type: String },
  avgDuration: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);