const Office = require('../models/Office');
const Service = require('../models/Service');

// Get all offices with their services attached
exports.getOffices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.district) filter.district = req.query.district;
    if (req.query.type) filter.type = req.query.type;

    const offices = await Office.find(filter).lean();
    const officeIds = offices.map((office) => office._id);

    // Fetch all services belonging to these offices
    const services = await Service.find({ officeId: { $in: officeIds } }).lean();

    // Attach services to their respective office
    const officesWithServices = offices.map((office) => ({
      ...office,
      services: services.filter(
        (s) => s.officeId && s.officeId.toString() === office._id.toString()
      ),
    }));

    res.status(200).json(officesWithServices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single office + its services
exports.getOfficeById = async (req, res) => {
  try {
    const office = await Office.findById(req.params.id);
    if (!office) return res.status(404).json({ message: 'Office not found' });

    const services = await Service.find({ officeId: req.params.id });
    res.status(200).json({ office, services });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};