const { delay, generateCode } = require('../utils/helpers');

// Process payment (simulated)
const processPayment = async (paymentRequest) => {
  const { amount, provider, phoneNumber, reference } = paymentRequest;

  // Simulate processing time
  await delay(2000);

  // Demo failure: Amount > 10,000 (for testing failure scenario)
  if (amount > 10000) {
    return {
      success: false,
      error: 'INSUFFICIENT_FUNDS',
      message: 'Payment failed - insufficient funds'
    };
  }

  // Generate provider reference
  const providerRef = `${provider}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    success: true,
    data: {
      reference,
      providerReference: providerRef,
      amount,
      provider,
      phoneNumber: phoneNumber ? phoneNumber.substr(0, 6) + '****' : '******',
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    }
  };
};

// Check payment status (simulated)
const checkPaymentStatus = async (reference) => {
  await delay(500);

  return {
    success: true,
    data: {
      reference,
      status: 'COMPLETED',
      timestamp: new Date().toISOString()
    }
  };
};

// Refund payment (simulated)
const refundPayment = async (reference, amount) => {
  await delay(1500);

  return {
    success: true,
    data: {
      originalReference: reference,
      refundReference: `REF-${Date.now()}`,
      amount,
      status: 'REFUNDED',
      timestamp: new Date().toISOString()
    }
  };
};

// Get wallet balance (simulated)
const getWalletBalance = async (phoneNumber) => {
  await delay(500);

  // Return random balance for demo
  const balance = Math.floor(Math.random() * 5000) + 500;

  return {
    success: true,
    data: {
      phoneNumber: phoneNumber.substr(0, 6) + '****',
      balance,
      currency: 'GHS'
    }
  };
};

module.exports = {
  processPayment,
  checkPaymentStatus,
  refundPayment,
  getWalletBalance
};
