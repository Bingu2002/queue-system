const Token      = require('../models/Token');
const QueueState = require('../models/QueueState');
const { sendSMS } = require('../utils/sms');

// POST /api/queue/next
// Officer presses "Call Next" — advances the queue by 1
exports.callNext = async (req, res) => {
  try {
    const { officeId, serviceId } = req.body;

    const queueState = await QueueState.findOne({ officeId, serviceId });
    if (!queueState) return res.status(404).json({ message: 'Queue not found' });
    if (!queueState.isOpen) return res.status(400).json({ message: 'Queue is closed' });

    queueState.currentToken += 1;
    await queueState.save();

    // Mark the called token's status
    const calledToken = await Token.findOneAndUpdate(
      { officeId, serviceId, tokenNumber: queueState.currentToken, status: 'waiting' },
      { status: 'called', calledAt: new Date() },
      { new: true }
    ).populate('citizenId', 'phone name');

    const io = req.app.get('io');
    const waitCount = queueState.lastToken - queueState.currentToken;

    // Broadcast the new current token to all citizens watching this queue
    io.to(`queue:${officeId}:${serviceId}`).emit('queue-update', {
      currentToken: queueState.currentToken,
      lastToken:    queueState.lastToken,
      waitCount
    });

    // Find the citizen who is now 3 positions away and send them an alert
    const nearbyToken = await Token.findOne({
      officeId, serviceId,
      tokenNumber: queueState.currentToken + 3,
      status: 'waiting'
    }).populate('citizenId', 'phone');

    if (nearbyToken) {
      // Push a real-time alert to their browser
      io.to(`token:${nearbyToken._id}`).emit('nearly-your-turn', {
        message: 'Get ready — you are 3 tokens away!'
      });

      // Also send SMS if they have a phone number
      const phone = nearbyToken.citizenId?.phone || nearbyToken.guestPhone;
      if (phone) {
        const officeName = calledToken?.officeId || 'the office';
        sendSMS(phone, `GovQueue: You are 3 tokens away at ${officeName}. Token #${nearbyToken.tokenNumber}. Please be ready.`);
      }
    }

    res.json({
      currentToken: queueState.currentToken,
      calledToken,
      waitCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/queue/status/:id
// Officer updates a token: served ✓ | skipped ↷ | no-show ✗
exports.updateTokenStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'served' | 'skipped' | 'no-show'

    const update = { status };
    if (status === 'served') update.servedAt = new Date();

    const token = await Token.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!token) return res.status(404).json({ message: 'Token not found' });

    res.json(token);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/queue/current?officeId=...&serviceId=...
// Officer sees the live queue list for today, plus how many served
exports.getCurrentQueue = async (req, res) => {
  try {
    const { officeId, serviceId } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const tokens = await Token.find({
      officeId,
      serviceId,
      date:   today,
      status: { $in: ['waiting', 'called'] }
    })
      .sort('tokenNumber')
      .populate('citizenId', 'name phone');

    const queueState  = await QueueState.findOne({ officeId, serviceId });
    const servedToday = await Token.countDocuments({
      officeId, serviceId, date: today, status: 'served'
    });

    res.json({
      tokens,
      currentToken: queueState?.currentToken || 0,
      lastToken:    queueState?.lastToken || 0,
      servedToday
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/queue/toggle
// Admin opens or closes the queue for the day
exports.toggleQueue = async (req, res) => {
  try {
    const { officeId, serviceId, isOpen } = req.body;

    const queueState = await QueueState.findOneAndUpdate(
      { officeId, serviceId },
      { isOpen },
      { new: true, upsert: true }
    );

    const io = req.app.get('io');
    io.to(`queue:${officeId}:${serviceId}`).emit('queue-status-changed', { isOpen });

    res.json({ message: `Queue ${isOpen ? 'opened' : 'closed'}`, queueState });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};