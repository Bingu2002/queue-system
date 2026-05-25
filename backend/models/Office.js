const mongoose = require('mongoose');

const officeSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  type:     { type: String, enum: ['Grama Niladhari', 'Divisional Secretariat', 'Hospital', 'Other'] },
  district: { type: String, required: true },
  address:  { type: String },
  workingHours: {
    open:  { type: String, default: '08:00' },
    close: { type: String, default: '16:00' }
  },
  maxDailyTokens: { type: Number, default: 100 }
}, { timestamps: true });

module.exports = mongoose.model('Office', officeSchema);