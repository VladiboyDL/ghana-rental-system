const db = require('../config/database');
const { generateId } = require('../utils/helpers');

// SMS message log (for demo display)
const smsLog = [];

// Send SMS (simulated)
const sendSMS = async (phoneNumber, message, userId = null) => {
  // Log to console
  console.log(`[SMS] To: ${phoneNumber}`);
  console.log(`[SMS] Message: ${message}`);
  console.log('---');

  // Store in log for demo display
  const smsEntry = {
    id: generateId(),
    phoneNumber,
    message,
    status: 'DELIVERED',
    timestamp: new Date().toISOString()
  };
  smsLog.push(smsEntry);

  // Keep only last 100 messages
  if (smsLog.length > 100) {
    smsLog.shift();
  }

  // If userId provided, create in-app notification
  if (userId) {
    try {
      const stmt = db.prepare(`
        INSERT INTO notifications (id, user_id, notification_type, title, message, channels, sms_sent)
        VALUES (?, ?, 'SMS', 'SMS Notification', ?, '["sms"]', 1)
      `);
      stmt.run(generateId(), userId, message);
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  return {
    success: true,
    messageId: `SMS-${Date.now()}`,
    status: 'DELIVERED'
  };
};

// Get SMS log (for demo)
const getSMSLog = () => {
  return smsLog.slice(-50);
};

// Clear SMS log
const clearSMSLog = () => {
  smsLog.length = 0;
  return { success: true };
};

// Send OTP via SMS
const sendOTP = async (phoneNumber, otp, purpose = 'verification') => {
  let message = '';

  switch (purpose) {
    case 'verification':
      message = `Your Ghana Rental System verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
      break;
    case 'login':
      message = `Your Ghana Rental System login code is: ${otp}. Valid for 5 minutes.`;
      break;
    case 'contract_confirmation':
      message = `Your contract confirmation code is: ${otp}. Enter this code to confirm your rental contract.`;
      break;
    case 'password_reset':
      message = `Your password reset code is: ${otp}. Valid for 15 minutes.`;
      break;
    default:
      message = `Your Ghana Rental System code is: ${otp}.`;
  }

  return sendSMS(phoneNumber, message);
};

// Send contract notification
const sendContractNotification = async (tenantPhone, landlordName, propertyAddress, monthlyRent, confirmationCode) => {
  const message = `NEW CONTRACT: ${landlordName} has registered a rental contract for ${propertyAddress} at GHS ${monthlyRent}/month. Confirmation code: ${confirmationCode}. Log in to confirm or object.`;
  return sendSMS(tenantPhone, message);
};

// Send payment receipt
const sendPaymentReceipt = async (phone, paymentRef, amount, landlordName, periodStart, periodEnd) => {
  const message = `PAYMENT CONFIRMED: GHS ${amount} paid to ${landlordName} for ${periodStart} - ${periodEnd}. Ref: ${paymentRef}. Tax withheld and remitted to GRA.`;
  return sendSMS(phone, message);
};

// Send payment notification to landlord
const sendLandlordPaymentNotification = async (phone, tenantName, amount, netAmount, propertyAddress) => {
  const message = `RENT RECEIVED: ${tenantName} paid GHS ${amount} for ${propertyAddress}. Net amount after tax: GHS ${netAmount}. Settlement processing.`;
  return sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  getSMSLog,
  clearSMSLog,
  sendOTP,
  sendContractNotification,
  sendPaymentReceipt,
  sendLandlordPaymentNotification
};
