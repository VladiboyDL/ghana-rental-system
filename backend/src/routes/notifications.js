const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { sendOTP, sendSMS, getSMSLog, getNotificationStatus } = require('../simulators/sms');
const { isWhatsAppEnabled, sendWhatsAppMessage } = require('../services/whatsapp');
const { isN8nEnabled, sendN8nWebhook, N8N_EVENTS } = require('../services/n8n');

// Get notification channel status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: getNotificationStatus()
  });
});

// Get recent SMS/notification log (for demo dashboard)
router.get('/log', (req, res) => {
  res.json({
    success: true,
    data: getSMSLog()
  });
});

// Test WhatsApp integration (requires auth)
router.post('/test/whatsapp', authenticate, async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_PHONE', message: 'Phone number is required' }
    });
  }

  if (!isWhatsAppEnabled()) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'WHATSAPP_DISABLED',
        message: 'WhatsApp is not enabled. Set WHATSAPP_ENABLED=true in environment.'
      }
    });
  }

  const testMessage = message || `🧪 *Test Message*\n\nThis is a test from Ghana Rental System.\n\nTimestamp: ${new Date().toISOString()}`;

  const result = await sendWhatsAppMessage(phoneNumber, testMessage);

  res.json({
    success: result.success,
    data: result
  });
});

// Test n8n webhook integration (requires auth)
router.post('/test/n8n', authenticate, async (req, res) => {
  const { eventType, payload } = req.body;

  if (!isN8nEnabled()) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'N8N_DISABLED',
        message: 'n8n webhooks are not enabled. Set N8N_ENABLED=true in environment.'
      }
    });
  }

  const testPayload = payload || {
    test: true,
    message: 'Test webhook from Ghana Rental System',
    timestamp: new Date().toISOString(),
    userId: req.user?.id
  };

  const result = await sendN8nWebhook(eventType || 'test.ping', testPayload);

  res.json({
    success: result.success,
    data: result
  });
});

// Test OTP sending (requires auth)
router.post('/test/otp', authenticate, async (req, res) => {
  const { phoneNumber, purpose } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_PHONE', message: 'Phone number is required' }
    });
  }

  // Generate a test OTP
  const testOTP = Math.floor(100000 + Math.random() * 900000).toString();

  const result = await sendOTP(phoneNumber, testOTP, purpose || 'verification');

  res.json({
    success: true,
    data: {
      ...result,
      testOTP, // Include OTP in response for testing purposes
      note: 'This is a test endpoint. OTP is returned for verification.'
    }
  });
});

// List available n8n event types
router.get('/n8n/events', (req, res) => {
  res.json({
    success: true,
    data: N8N_EVENTS
  });
});

module.exports = router;
