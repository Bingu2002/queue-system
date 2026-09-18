const Token = require('../models/Token');
const QueueState = require('../models/QueueState');

// POST /api/tokens
exports.issueToken = async (req, res) => {
  try {
    const { officeId, serviceId, guestPhone } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const queueState = await QueueState.findOneAndUpdate(
      { officeId, serviceId },
      {
        $inc: { lastToken: 1 },$setOnInsert: { currentToken: 0, isOpen: true, date: today },
      },
      { new: true, upsert: true }
    );

    if (!queueState.isOpen) {
      await QueueState.updateOne({ _id: queueState._id }, { $inc: { lastToken: -1 } });
      return res.status(400).json({ message: 'Queue is closed for today' });
    }

    const token = await Token.create({
      citizenId: req.user?._id || null,
      guestPhone: guestPhone || null,
      officeId,
      serviceId,
      tokenNumber: queueState.lastToken,
      status: 'waiting',
      date: today,
    });

    // Populate references so the frontend can display names
    await token.populate('officeId', 'name address district');
    await token.populate('serviceId', 'name avgDuration');

    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${officeId}:${serviceId}`).emit('queue-update', {
        currentToken: queueState.currentToken,
        lastToken: queueState.lastToken,
        waitCount: queueState.lastToken - queueState.currentToken,
      });
    }

    res.status(201).json(token);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tokens/mine
exports.getMyToken = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const token = await Token.findOne({
      citizenId: req.user._id,
      date: today,
      status: { $in: ['waiting', 'called'] },
    })
      .populate('officeId', 'name address district')
      .populate('serviceId', 'name avgDuration');

    if (!token) return res.status(404).json({ message: 'No active token today' });

    const queueState = await QueueState.findOne({
      officeId: token.officeId._id,
      serviceId: token.serviceId._id,
    });

    const position = Math.max(token.tokenNumber - (queueState?.currentToken || 0), 0);

    res.json({ token, position });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/tokens/:id
exports.cancelToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) return res.status(404).json({ message: 'Token not found' });

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