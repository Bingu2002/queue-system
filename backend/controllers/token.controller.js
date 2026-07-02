const Token      = require('../models/Token');
const QueueState = require('../models/QueueState');

// POST /api/tokens
// Citizen (or guest) takes a virtual queue token for a service
exports.issueToken = async (req, res) => {
  try {
    const { officeId, serviceId, guestPhone } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Atomically claim the next token number — no read-then-write race
    const queueState = await QueueState.findOneAndUpdate(
      { officeId, serviceId },
      {
        $inc: { lastToken: 1 },
        $setOnInsert: { currentToken: 0, isOpen: true, date: today }
      },
      { new: true, upsert: true }
    );

    if (!queueState.isOpen) {
      // roll back the increment since we're rejecting this token
      await QueueState.updateOne({ _id: queueState._id }, { $inc: { lastToken: -1 } });
      return res.status(400).json({ message: 'Queue is closed for today' });
    }

    const token = await Token.create({
      citizenId:   req.user?._id || null,   // null if guest
      guestPhone:  guestPhone || null,
      officeId,
      serviceId,
      tokenNumber: queueState.lastToken,
      status:      'waiting',
      date:        today
    });

    // Tell all citizens watching this queue that a new person joined
    const io = req.app.get('io');
    io.to(`queue:${officeId}:${serviceId}`).emit('queue-update', {
      currentToken: queueState.currentToken,
      lastToken:    queueState.lastToken,
      waitCount:    queueState.lastToken - queueState.currentToken
    });

    res.status(201).json(token);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tokens/mine
// Logged-in citizen checks their active token and position in queue
exports.getMyToken = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const token = await Token.findOne({
      citizenId: req.user._id,
      date:      today,
      status:    { $in: ['waiting', 'called'] }
    })
      .populate('officeId',  'name address district')
      .populate('serviceId', 'name avgDuration');

    if (!token) return res.status(404).json({ message: 'No active token today' });

    // Calculate how many people are ahead of them
    const queueState = await QueueState.findOne({
      officeId:  token.officeId._id,
      serviceId: token.serviceId._id
    });

    const position = Math.max(token.tokenNumber - (queueState?.currentToken || 0), 0);

    res.json({ token, position });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/tokens/:id
// Citizen cancels their token (e.g. they decided to leave)
exports.cancelToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) return res.status(404).json({ message: 'Token not found' });

    // Only the owner can cancel their own token
    if (token.citizenId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your token' });
    }

    token.status = 'cancelled';
    await token.save();

    res.json({ message: 'Token cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};