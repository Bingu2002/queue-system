require('dotenv').config();
const mongoose = require('mongoose');
const Office = require('./models/Office');
const Service = require('./models/Service');
const User = require('./models/User');

const seedData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // 1. Clear old data
    await Office.deleteMany({});
    await Service.deleteMany({});
    await User.deleteMany({ phone: { $in: ['0711111111', '0722222222'] } });
    console.log('Cleared existing offices, services, and test staff accounts.');

    // 2. Create Government Offices
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

    // 3. Create Services linked to their respective offices
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

    // 4. Create Test Officer and Admin Accounts (password hashing runs automatically via User model hook)
    await User.create([
      {
        name: 'Counter Officer Kandy',
        phone: '0711111111',
        email: 'officer.kandy@govqueue.lk',
        password: 'password123',
        role: 'officer',
        officeId: kandyDS._id,
      },
      {
        name: 'System Admin Kandy',
        phone: '0722222222',
        email: 'admin.kandy@govqueue.lk',
        password: 'password123',
        role: 'admin',
        officeId: kandyDS._id,
      },
    ]);

    console.log('Offices, services, and staff accounts seeded successfully!');
    console.log('-----------------------------------------');
    console.log('Officer Login -> Phone: 0711111111 | Password: password123');
    console.log('Admin Login   -> Phone: 0722222222 | Password: password123');
    console.log('-----------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seedData();