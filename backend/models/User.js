const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  phone:    { type: String, required: true, unique: true },
  email:    { type: String },
  password: { type: String, required: true },
  role:     { type: String, enum: ['citizen', 'officer', 'admin', 'superadmin'], default: 'citizen' },
  officeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' }
}, { timestamps: true });

// In Mongoose 8+, async hooks return a Promise and do not accept a next callback
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);