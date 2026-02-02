/**
 * Twilio WhatsApp Service
 *
 * Sends OTP and notifications via Twilio WhatsApp Sandbox
 *
 * Required ENV variables:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_WHATSAPP_FROM: WhatsApp sandbox number (e.g., whatsapp:+14155238886)
 * - WHATSAPP_ENABLED: Set to 'true' to enable WhatsApp messaging
 */

const twilio = require('twilio');

// Initialize Twilio client
let twilioClient = null;

const initTwilioClient = () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('[WhatsApp] Twilio client initialized');
  }
  return twilioClient;
};

// Check if WhatsApp is enabled
const isWhatsAppEnabled = () => {
  return process.env.WHATSAPP_ENABLED === 'true' &&
         process.env.TWILIO_ACCOUNT_SID &&
         process.env.TWILIO_AUTH_TOKEN &&
         process.env.TWILIO_WHATSAPP_FROM;
};

// Format phone number for WhatsApp
const formatWhatsAppNumber = (phoneNumber) => {
  // Remove any existing whatsapp: prefix
  let cleaned = phoneNumber.replace('whatsapp:', '');

  // Remove spaces, dashes, parentheses
  cleaned = cleaned.replace(/[\s\-\(\)]/g, '');

  // Handle Ghana numbers
  if (cleaned.startsWith('0')) {
    cleaned = '+233' + cleaned.slice(1);
  } else if (cleaned.startsWith('233')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return `whatsapp:${cleaned}`;
};

// Send WhatsApp message
const sendWhatsAppMessage = async (to, message) => {
  if (!isWhatsAppEnabled()) {
    console.log('[WhatsApp] Disabled - falling back to console log');
    console.log(`[WhatsApp Mock] To: ${to}`);
    console.log(`[WhatsApp Mock] Message: ${message}`);
    return { success: true, mock: true, messageId: `MOCK-${Date.now()}` };
  }

  try {
    const client = initTwilioClient();
    if (!client) {
      throw new Error('Twilio client not initialized');
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: formatWhatsAppNumber(to)
    });

    console.log(`[WhatsApp] Message sent to ${to}: ${result.sid}`);

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
      to: result.to
    };
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error.message);

    // Return failure but don't throw - allow fallback to SMS simulator
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// Send OTP via WhatsApp
const sendOTPWhatsApp = async (phoneNumber, otp, purpose = 'verification') => {
  let message = '';
  const emoji = {
    verification: '🔐',
    login: '🔑',
    contract_confirmation: '📝',
    password_reset: '🔄'
  };

  switch (purpose) {
    case 'verification':
      message = `${emoji.verification} *Ghana Rental System*\n\nYour verification code is: *${otp}*\n\nThis code expires in 10 minutes.\n\n⚠️ Do not share this code with anyone.`;
      break;
    case 'login':
      message = `${emoji.login} *Ghana Rental System*\n\nYour login code is: *${otp}*\n\nThis code expires in 5 minutes.`;
      break;
    case 'contract_confirmation':
      message = `${emoji.contract_confirmation} *Ghana Rental System*\n\nYour contract confirmation code is: *${otp}*\n\nEnter this code in the app to confirm your rental contract.`;
      break;
    case 'password_reset':
      message = `${emoji.password_reset} *Ghana Rental System*\n\nYour password reset code is: *${otp}*\n\nThis code expires in 15 minutes.\n\n⚠️ If you didn't request this, please ignore.`;
      break;
    default:
      message = `🏠 *Ghana Rental System*\n\nYour code is: *${otp}*`;
  }

  return sendWhatsAppMessage(phoneNumber, message);
};

// Send contract notification via WhatsApp
const sendContractNotificationWhatsApp = async (tenantPhone, landlordName, propertyAddress, monthlyRent, confirmationCode) => {
  const message = `📝 *NEW RENTAL CONTRACT*\n\n` +
    `Landlord: *${landlordName}*\n` +
    `Property: ${propertyAddress}\n` +
    `Monthly Rent: *GH₵ ${monthlyRent.toLocaleString()}*\n\n` +
    `Your confirmation code is: *${confirmationCode}*\n\n` +
    `Please log in to the Ghana Rental app to review and confirm this contract.\n\n` +
    `⚠️ If you did not initiate this rental, please contact us immediately.`;

  return sendWhatsAppMessage(tenantPhone, message);
};

// Send payment receipt via WhatsApp
const sendPaymentReceiptWhatsApp = async (phone, paymentRef, amount, landlordName, periodStart, periodEnd) => {
  const message = `✅ *PAYMENT CONFIRMED*\n\n` +
    `Amount: *GH₵ ${amount.toLocaleString()}*\n` +
    `Paid to: ${landlordName}\n` +
    `Period: ${periodStart} - ${periodEnd}\n` +
    `Reference: ${paymentRef}\n\n` +
    `Tax has been automatically withheld and remitted to GRA.\n\n` +
    `🧾 Your tax certificate will be available in the app.`;

  return sendWhatsAppMessage(phone, message);
};

// Send landlord payment notification via WhatsApp
const sendLandlordPaymentNotificationWhatsApp = async (phone, tenantName, amount, netAmount, propertyAddress) => {
  const message = `💰 *RENT PAYMENT RECEIVED*\n\n` +
    `From: ${tenantName}\n` +
    `Property: ${propertyAddress}\n` +
    `Gross Amount: GH₵ ${amount.toLocaleString()}\n` +
    `*Net Amount: GH₵ ${netAmount.toLocaleString()}*\n\n` +
    `(8% withholding tax deducted)\n\n` +
    `Settlement will be processed within 24 hours.`;

  return sendWhatsAppMessage(phone, message);
};

// Send inspection notice via WhatsApp
const sendInspectionNoticeWhatsApp = async (phone, propertyAddress, inspectorName, scheduledDate) => {
  const message = `🔍 *PROPERTY INSPECTION NOTICE*\n\n` +
    `Property: ${propertyAddress}\n` +
    `Inspector: ${inspectorName}\n` +
    `Scheduled: ${scheduledDate}\n\n` +
    `Please ensure the property is accessible at the scheduled time.\n\n` +
    `For questions, contact the Ghana Revenue Authority.`;

  return sendWhatsAppMessage(phone, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendOTPWhatsApp,
  sendContractNotificationWhatsApp,
  sendPaymentReceiptWhatsApp,
  sendLandlordPaymentNotificationWhatsApp,
  sendInspectionNoticeWhatsApp,
  isWhatsAppEnabled,
  formatWhatsAppNumber
};
