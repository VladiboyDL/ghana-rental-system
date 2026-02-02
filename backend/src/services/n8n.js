/**
 * n8n Webhook Service
 *
 * Sends notifications to n8n for processing via WhatsApp, SMS, Email, etc.
 *
 * Required ENV variables:
 * - N8N_WEBHOOK_URL: Your n8n webhook URL
 * - N8N_ENABLED: Set to 'true' to enable n8n webhooks
 * - N8N_API_KEY: Optional API key for webhook authentication
 */

const axios = require('axios');

// Check if n8n is enabled
const isN8nEnabled = () => {
  return process.env.N8N_ENABLED === 'true' && process.env.N8N_WEBHOOK_URL;
};

// Send webhook to n8n
const sendN8nWebhook = async (eventType, payload) => {
  if (!isN8nEnabled()) {
    console.log('[n8n] Disabled - webhook not sent');
    return { success: true, mock: true };
  }

  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add API key if configured
    if (process.env.N8N_API_KEY) {
      headers['X-API-Key'] = process.env.N8N_API_KEY;
    }

    const data = {
      event: eventType,
      timestamp: new Date().toISOString(),
      source: 'ghana-rental-api',
      payload
    };

    const response = await axios.post(webhookUrl, data, {
      headers,
      timeout: 10000
    });

    console.log(`[n8n] Webhook sent: ${eventType}`);

    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('[n8n] Webhook error:', error.message);

    return {
      success: false,
      error: error.message
    };
  }
};

// Event types for n8n workflows
const N8N_EVENTS = {
  // User events
  USER_REGISTERED: 'user.registered',
  USER_VERIFIED: 'user.verified',
  USER_LOGIN: 'user.login',
  PASSWORD_RESET_REQUESTED: 'user.password_reset_requested',

  // OTP events
  OTP_GENERATED: 'otp.generated',
  OTP_VERIFIED: 'otp.verified',

  // Property events
  PROPERTY_CREATED: 'property.created',
  PROPERTY_VERIFIED: 'property.verified',

  // Contract events
  CONTRACT_CREATED: 'contract.created',
  CONTRACT_PENDING_CONFIRMATION: 'contract.pending_confirmation',
  CONTRACT_CONFIRMED: 'contract.confirmed',
  CONTRACT_EXPIRED: 'contract.expired',

  // Payment events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',

  // Inspection events
  INSPECTION_SCHEDULED: 'inspection.scheduled',
  INSPECTION_COMPLETED: 'inspection.completed',

  // Tax events
  TAX_CERTIFICATE_GENERATED: 'tax.certificate_generated',
  TAX_REMINDER: 'tax.reminder'
};

// Send OTP notification to n8n
const sendOTPToN8n = async (phoneNumber, otp, purpose, userId = null) => {
  return sendN8nWebhook(N8N_EVENTS.OTP_GENERATED, {
    phoneNumber,
    otp,
    purpose,
    userId,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });
};

// Send contract notification to n8n
const sendContractToN8n = async (contract, tenant, landlord, property) => {
  return sendN8nWebhook(N8N_EVENTS.CONTRACT_PENDING_CONFIRMATION, {
    contractId: contract.id,
    contractNumber: contract.contractNumber,
    tenant: {
      id: tenant.id,
      phone: tenant.phone,
      email: tenant.email,
      name: `${tenant.firstName} ${tenant.lastName}`
    },
    landlord: {
      id: landlord.id,
      name: `${landlord.firstName} ${landlord.lastName}`
    },
    property: {
      address: property.streetAddress,
      neighborhood: property.neighborhood,
      region: property.region
    },
    monthlyRent: contract.monthlyRent,
    confirmationCode: contract.confirmationCode,
    expiresAt: contract.confirmationExpiresAt
  });
};

// Send payment notification to n8n
const sendPaymentToN8n = async (payment, contract, tenant, landlord) => {
  return sendN8nWebhook(N8N_EVENTS.PAYMENT_COMPLETED, {
    paymentId: payment.id,
    paymentRef: payment.paymentReference,
    tenant: {
      id: tenant.id,
      phone: tenant.phone,
      name: `${tenant.firstName} ${tenant.lastName}`
    },
    landlord: {
      id: landlord.id,
      phone: landlord.phone,
      name: `${landlord.firstName} ${landlord.lastName}`
    },
    amount: {
      gross: payment.grossAmount,
      tax: payment.taxAmount,
      net: payment.netAmount
    },
    period: {
      start: payment.periodStart,
      end: payment.periodEnd
    }
  });
};

// Send inspection notification to n8n
const sendInspectionToN8n = async (inspection, property, landlord, inspector) => {
  return sendN8nWebhook(N8N_EVENTS.INSPECTION_SCHEDULED, {
    inspectionId: inspection.id,
    caseNumber: inspection.caseNumber,
    property: {
      id: property.id,
      address: property.streetAddress,
      neighborhood: property.neighborhood
    },
    landlord: {
      id: landlord.id,
      phone: landlord.phone,
      name: `${landlord.firstName} ${landlord.lastName}`
    },
    inspector: {
      id: inspector.id,
      name: `${inspector.firstName} ${inspector.lastName}`
    },
    scheduledDate: inspection.scheduledDate
  });
};

// Send user registration to n8n
const sendUserRegistrationToN8n = async (user) => {
  return sendN8nWebhook(N8N_EVENTS.USER_REGISTERED, {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    name: `${user.firstName} ${user.lastName}`,
    region: user.region
  });
};

module.exports = {
  sendN8nWebhook,
  sendOTPToN8n,
  sendContractToN8n,
  sendPaymentToN8n,
  sendInspectionToN8n,
  sendUserRegistrationToN8n,
  isN8nEnabled,
  N8N_EVENTS
};
