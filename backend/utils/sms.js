// backend/utils/sms.js
// Dialog Axiata SMS API integration for Sri Lanka
// Docs: https://www.dialog.lk/enterprise/sms-api

const axios = require('axios');

/**
 * Send an SMS via Dialog Axiata API
 * @param {string} phone  - local format: 0771234567 or international: +94771234567
 * @param {string} message
 */
exports.sendSMS = async (phone, message) => {
  // Normalize to international format without +
  const normalized = phone.replace(/^0/, '94').replace(/^\+/, '');

  try {
    const response = await axios.post(
      'https://e-sms.dialog.lk/v2/sms',
      {
        recipient: normalized,
        mask: 'GovQueue',          // sender name (register with Dialog)
        message,
        transaction_id: `gq_${Date.now()}`,
      },
      {
        auth: {
          username: process.env.DIALOG_SMS_USER,
          password: process.env.DIALOG_SMS_PASS,
        },
        timeout: 8000,
      }
    );
    console.log(`SMS sent to ${normalized}:`, response.data);
    return true;
  } catch (err) {
    // Log but never crash the queue flow because SMS failed
    console.error('SMS failed:', err.response?.data || err.message);
    return false;
  }
};