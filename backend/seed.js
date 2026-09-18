require('dotenv').config();
const mongoose = require('mongoose');
const Office = require('./models/Office');
const Service = require('./models/Service');

const seedData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear old data
    await Office.deleteMany({});
    await Service.deleteMany({});
    console.log('Cleared existing offices and services.');

    // 1. Create Government Offices (using valid enum values: 'Divisional Secretariat', 'Grama Niladhari', 'Hospital', 'Other')
    const kandyDS = await Office.create({
      name: 'Divisional Secretariat - Kandy',
      district: 'Kandy',
      type: 'Divisional Secretariat',
      address: 'William Gopallawa Mawatha, Kandy',
    });

    const kandyGN = await Office.create({
      name: 'Grama Niladhari Division - Kandy City',
      district: 'Kandy',
      type: 'Grama Niladhari',
      address: 'Main Street, Kandy',
    });

    const colomboDS = await Office.create({
      name: 'Divisional Secretariat - Colombo',
      district: 'Colombo',
      type: 'Divisional Secretariat',
      address: 'Dam Street, Colombo 12',
    });

    const kandyGH = await Office.create({
      name: 'National Hospital - Kandy',
      district: 'Kandy',
      type: 'Hospital',
      address: 'Hospital Road, Kandy',
    });

    // 2. Create Services linked to their respective offices
    await Service.insertMany([
      {
        officeId: kandyDS._id,
        name: 'NIC Renewal & Certification',
        description: 'Identity card replacement and registration verification',
        avgDuration: 15,
      },
      {
        officeId: kandyDS._id,
        name: 'Birth & Marriage Certificates',
        description: 'Issuance and duplicate copies of certificates',
        avgDuration: 10,
      },
      {
        officeId: kandyGN._id,
        name: 'Residence & Character Certificates',
        description: 'Official proof of residence and character letters',
        avgDuration: 8,
      },
      {
        officeId: colomboDS._id,
        name: 'Business Registration & Permits',
        description: 'Small business licensing and local trade approvals',
        avgDuration: 20,
      },
      {
        officeId: kandyGH._id,
        name: 'OPD General Consultation',
        description: 'Outpatient queue token for medical consultation',
        avgDuration: 12,
      },
    ]);

    console.log('Offices and services seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seedData();