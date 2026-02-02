/**
 * SMS/Notification Service
 *
 * Unified notification service that supports:
 * 1. Twilio WhatsApp (primary for demo)
 * 2. n8n Webhook (for complex workflows)
 * 3. Console logging (fallback/development)
 *
 * Priority: WhatsApp > n8n > Console
 */

const { generateId } = require('../utils/helpers');
const {
  sendOTPWhatsApp,
  sendContractNotificationWhatsApp,
  sendPaymentReceiptWhatsApp,
  sendLandlordPaymentNotificationWhatsApp,
  isWhatsAppEnabled
} = require('../services/whatsapp');
const {
  sendOTPToN8n,
  sendContractToN8n,
  sendPaymentToN8n,
  isN8nEnabled
} = require('../services/n8n');

// SMS message log (for demo display and fallback)
const smsLog = [];

// Log message (always happens)
const logMessage = (phoneNumber, message, channel = 'SMS') => {
  const smsEntry = {
    id: generateId(),
    phoneNumber,
    message,
    channel,
    status: 'DELIVERED',
    timestamp: new Date().toISOString()
  };
  smsLog.push(smsEntry);

  // Keep only last 100 messages
  if (smsLog.length > 100) {
    smsLog.shift();
  }

  // Console log for development
  console.log(`[${channel}] To: ${phoneNumber}`);
  console.log(`[${channel}] Message: ${message.substring(0, 100)}...`);
  console.log('---');

  return smsEntry;
};

// Send SMS (with WhatsApp/n8n fallback)
const sendSMS = async (phoneNumber, message, userId = null) => {
  // Log the message
  const logEntry = logMessage(phoneNumber, message, isWhatsAppEnabled() ? 'WhatsApp' : 'SMS');

  // Try WhatsApp first
  if (isWhatsAppEnabled()) {
    const { sendWhatsAppMessage } = require('../services/whatsapp');
    const result = await sendWhatsAppMessage(phoneNumber, message);
    if (result.success && !result.mock) {
      return {
        success: true,
        messageId: result.messageId,
        channel: 'whatsapp',
        status: 'DELIVERED'
      };
    }
  }

  // Try n8n webhook
  if (isN8nEnabled()) {
    const { sendN8nWebhook } = require('../services/n8n');
    const result = await sendN8nWebhook('notification.sms', {
      phoneNumber,
      message,
      userId
    });
    if (result.success && !result.mock) {
      return {
        success: true,
        messageId: `N8N-${Date.now()}`,
        channel: 'n8n',
        status: 'QUEUED'
      };
    }
  }

  // Fallback to console log (already done above)
  return {
    success: true,
    messageId: logEntry.id,
    channel: 'console',
    status: 'LOGGED'
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

// Send OTP via best available channel
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

  // Log the OTP
  logMessage(phoneNumber, message, 'OTP');

  // Try WhatsApp first
  if (isWhatsAppEnabled()) {
    const result = await sendOTPWhatsApp(phoneNumber, otp, purpose);
    if (result.success && !result.mock) {
      // Also send to n8n for logging/analytics
      if (isN8nEnabled()) {
        sendOTPToN8n(phoneNumber, otp, purpose).catch(() => {});
      }
      return {
        success: true,
        messageId: result.messageId,
        channel: 'whatsapp'
      };
    }
  }

  // Try n8n
  if (isN8nEnabled()) {
    const result = await sendOTPToN8n(phoneNumber, otp, purpose);
    if (result.success && !result.mock) {
      return {
        success: true,
        messageId: `N8N-${Date.now()}`,
        channel: 'n8n'
      };
    }
  }

  // Fallback to console
  return {
    success: true,
    messageId: `SMS-${Date.now()}`,
    channel: 'console'
  };
};

// Send contract notification
const sendContractNotification = async (tenantPhone, landlordName, propertyAddress, monthlyRent, confirmationCode) => {
  const message = `NEW CONTRACT: ${landlordName} has registered a rental contract for ${propertyAddress} at GHS ${monthlyRent}/month. Confirmation code: ${confirmationCode}. Log in to confirm or object.`;

  // Log the notification
  logMessage(tenantPhone, message, 'CONTRACT');

  // Try WhatsApp
  if (isWhatsAppEnabled()) {
    const result = await sendContractNotificationWhatsApp(tenantPhone, landlordName, propertyAddress, monthlyRent, confirmationCode);
    if (result.success && !result.mock) {
      return { success: true, messageId: result.messageId, channel: 'whatsapp' };
    }
  }

  // Fallback to console
  return { success: true, messageId: `SMS-${Date.now()}`, channel: 'console' };
};

// Send payment receipt
const sendPaymentReceipt = async (phone, paymentRef, amount, landlordName, periodStart, periodEnd) => {
  const message = `PAYMENT CONFIRMED: GHS ${amount} paid to ${landlordName} for ${periodStart} - ${periodEnd}. Ref: ${paymentRef}. Tax withheld and remitted to GRA.`;

  // Log the receipt
  logMessage(phone, message, 'PAYMENT');

  // Try WhatsApp
  if (isWhatsAppEnabled()) {
    const result = await sendPaymentReceiptWhatsApp(phone, paymentRef, amount, landlordName, periodStart, periodEnd);
    if (result.success && !result.mock) {
      return { success: true, messageId: result.messageId, channel: 'whatsapp' };
    }
  }

  // Fallback to console
  return { success: true, messageId: `SMS-${Date.now()}`, channel: 'console' };
};

// Send payment notification to landlord
const sendLandlordPaymentNotification = async (phone, tenantName, amount, netAmount, propertyAddress) => {
  const message = `RENT RECEIVED: ${tenantName} paid GHS ${amount} for ${propertyAddress}. Net amount after tax: GHS ${netAmount}. Settlement processing.`;

  // Log the notification
  logMessage(phone, message, 'LANDLORD_PAYMENT');

  // Try WhatsApp
  if (isWhatsAppEnabled()) {
    const result = await sendLandlordPaymentNotificationWhatsApp(phone, tenantName, amount, netAmount, propertyAddress);
    if (result.success && !result.mock) {
      return { success: true, messageId: result.messageId, channel: 'whatsapp' };
    }
  }

  // Fallback to console
  return { success: true, messageId: `SMS-${Date.now()}`, channel: 'console' };
};

// Get notification channel status
const getNotificationStatus = () => {
  return {
    whatsapp: {
      enabled: isWhatsAppEnabled(),
      configured: !!process.env.TWILIO_ACCOUNT_SID
    },
    n8n: {
      enabled: isN8nEnabled(),
      configured: !!process.env.N8N_WEBHOOK_URL
    },
    fallback: 'console'
  };
};

module.exports = {
  sendSMS,
  getSMSLog,
  clearSMSLog,
  sendOTP,
  sendContractNotification,
  sendPaymentReceipt,
  sendLandlordPaymentNotification,
  getNotificationStatus
};
