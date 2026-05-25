const Office  = require('../models/Office');
const Service = require('../models/Service');

// Get all offices (with optional district/type filter)
exports.getOffices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.district) filter.district = req.query.district;
    if (req.query.type)     filter.type     = req.query.type;

    const offices = await Office.find(filter);
    res.json(offices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single office + its services
exports.getOfficeById = async (req, res) => {
  try {
    const office   = await Office.findById(req.params.id);
    if (!office) return res.status(404).json({ message: 'Office not found' });

    const services = await Service.find({ officeId: req.params.id });
    res.json({ office, services });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};