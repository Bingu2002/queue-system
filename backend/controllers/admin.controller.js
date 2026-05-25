const Office  = require('../models/Office');
const Service = require('../models/Service');
const Token   = require('../models/Token');
const mongoose = require('mongoose');

// Create a new office
exports.createOffice = async (req, res) => {
  try {
    const office = await Office.create(req.body);
    res.status(201).json(office);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new service for an office
exports.createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get analytics for an office
exports.getAnalytics = async (req, res) => {
  try {
    const { officeId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const todayStats = await Token.aggregate([
      { $match: {
        officeId: new mongoose.Types.ObjectId(officeId),
        date: today
      }},
      { $group: { _id: '$status', count: { $sum: 1 } }}
    ]);

    const weeklyStats = await Token.aggregate([
      { $match: {
        officeId: new mongoose.Types.ObjectId(officeId),
        status: 'served',
        servedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }},
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$servedAt' } },
        count: { $sum: 1 },
        avgWait: { $avg: {
          $divide: [{ $subtract: ['$servedAt', '$issuedAt'] }, 60000]
        }}
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({ today: todayStats, weekly: weeklyStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};