const { v4: uuidv4 } = require('uuid');
const {
  PROPERTY_TYPES,
  TAX_RATES,
  TAX_EXEMPTION_THRESHOLD,
  PLATFORM_FEE_RATE,
  PLATFORM_FEE_CAP,
  MAX_SECURITY_DEPOSIT_MONTHS
} = require('../config/constants');

// Generate UUID
const generateId = () => uuidv4();

// Generate unique codes
const generateCode = (prefix, length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
};

// Generate OTP code
const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

// Generate contract number
const generateContractNumber = () => {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `CTR-${year}-${sequence}`;
};

// Generate payment reference
const generatePaymentReference = () => {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `PAY-${year}-${sequence}`;
};

// Generate property code
const generatePropertyCode = (region, district, digitalAddress) => {
  const regionCode = region.substring(0, 3).toUpperCase();
  const districtCode = district.substring(0, 3).toUpperCase();
  const sequence = Math.floor(Math.random() * 99).toString().padStart(2, '0');
  return `${regionCode}-${districtCode}-${digitalAddress}-${sequence}`;
};

// Generate case number
const generateCaseNumber = () => {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `CASE-${year}-${sequence}`;
};

// Generate dispute number
const generateDisputeNumber = () => {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `DSP-${year}-${sequence}`;
};

// Generate certificate number
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `TAX-${year}-${sequence}`;
};

// Generate verification code
const generateVerificationCode = () => {
  return generateCode('VRF', 12);
};

// Validate Ghana phone number
const validateGhanaPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  const regex = /^0(2[0-9]|5[0-9])[0-9]{7}$/;
  return regex.test(cleaned);
};

// Format Ghana phone number
const formatGhanaPhone = (phone) => {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233')) {
    digits = '0' + digits.slice(3);
  }
  return digits;
};

// Validate Ghana Card number
const validateGhanaCard = (cardNumber) => {
  const regex = /^GHA-\d{9}-\d$/;
  return regex.test(cardNumber);
};

// Validate TIN number
const validateTIN = (tin) => {
  const regex = /^[CP]\d{8}$/;
  return regex.test(tin);
};

// Validate digital address
const validateDigitalAddress = (address) => {
  const regex = /^[A-Z]{2}-\d{3,4}-\d{4}$/;
  return regex.test(address);
};

// Calculate tax amount
const calculateTax = (grossAmount, landlord, contract) => {
  // Check exemption threshold
  if (contract.monthly_rent < TAX_EXEMPTION_THRESHOLD) {
    return 0;
  }

  // Determine rate based on landlord type
  let rate = TAX_RATES.INDIVIDUAL_REGISTERED;
  if (landlord.is_corporate) {
    rate = TAX_RATES.CORPORATE;
  } else if (!landlord.tin_number) {
    rate = TAX_RATES.INDIVIDUAL_UNREGISTERED;
  }

  return grossAmount * rate;
};

// Calculate platform fee
const calculatePlatformFee = (amount) => {
  const fee = amount * PLATFORM_FEE_RATE;
  return Math.min(fee, PLATFORM_FEE_CAP);
};

// Calculate payment breakdown
const calculatePaymentBreakdown = (grossAmount, landlord, contract) => {
  const taxAmount = calculateTax(grossAmount, landlord, contract);
  const platformFee = calculatePlatformFee(grossAmount);
  const netAmount = grossAmount - taxAmount - platformFee;

  return {
    grossAmount,
    taxAmount,
    platformFee,
    netAmount,
    taxRate: grossAmount > 0 ? taxAmount / grossAmount : 0
  };
};

// Validate contract terms
const validateContractTerms = (contract, property) => {
  const errors = [];

  const propertyType = PROPERTY_TYPES[property.property_type];
  if (!propertyType) {
    errors.push('Invalid property type');
    return { valid: false, errors };
  }

  // Check advance payment limit
  const maxAdvance = propertyType.maxAdvance;
  if (contract.advanceMonths > maxAdvance) {
    errors.push(`Advance payment exceeds limit of ${maxAdvance} months for this property type`);
  }

  // Check security deposit
  const maxDeposit = contract.monthlyRent * MAX_SECURITY_DEPOSIT_MONTHS;
  if (contract.securityDeposit > maxDeposit) {
    errors.push(`Security deposit exceeds ${MAX_SECURITY_DEPOSIT_MONTHS} months rent`);
  }

  // Check contract duration
  const startDate = new Date(contract.startDate);
  const endDate = new Date(contract.endDate);
  const durationMonths = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));

  if (durationMonths < 1) {
    errors.push('Contract duration must be at least 1 month');
  }
  if (durationMonths > 60) {
    errors.push('Contract duration cannot exceed 60 months');
  }

  return { valid: errors.length === 0, errors };
};

// Calculate compliance score
const calculateComplianceScore = (landlord, contracts, payments, disputes, violations) => {
  let score = 100;

  // Contract registration (30%)
  if (contracts.total > 0) {
    const registeredRatio = contracts.registered / contracts.total;
    score -= (1 - registeredRatio) * 30;
  }

  // Tax payment timeliness (25%)
  if (payments.total > 0) {
    const onTimeRatio = payments.onTime / payments.total;
    score -= (1 - onTimeRatio) * 25;
  }

  // Tenant confirmations (15%)
  if (contracts.total > 0) {
    const confirmedRatio = contracts.confirmed / contracts.total;
    score -= (1 - confirmedRatio) * 15;
  }

  // Document completeness (10%)
  if (!landlord.ownership_verified) {
    score -= 10;
  }

  // Dispute history (10%)
  score -= Math.min(disputes.lost * 5, 10);

  // Inspection results (10%)
  score -= Math.min(violations * 5, 10);

  return Math.max(0, Math.round(score));
};

// Calculate risk score for property
const calculateRiskScore = (property, hasContracts, hasGsmPresence, hasUtilityAnomaly, anonymousTips, landlordViolations) => {
  let score = 0;

  // Property registered but no contracts > 6 months
  const ageMonths = Math.floor((new Date() - new Date(property.created_at)) / (1000 * 60 * 60 * 24 * 30));
  if (!hasContracts && ageMonths > 6) {
    score += 25;
  }

  // GSM data shows residence, no contract
  if (hasGsmPresence && !hasContracts) {
    score += 20;
  }

  // Utility usage anomaly
  if (hasUtilityAnomaly) {
    score += 15;
  }

  // Anonymous tips
  score += anonymousTips * 15;

  // Landlord history
  score += Math.min(landlordViolations * 2, 10);

  return Math.min(score, 100);
};

// Format currency
const formatCurrency = (amount, currency = 'GHS') => {
  return `${currency} ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Simulate delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  generateId,
  generateCode,
  generateOTP,
  generateContractNumber,
  generatePaymentReference,
  generatePropertyCode,
  generateCaseNumber,
  generateDisputeNumber,
  generateCertificateNumber,
  generateVerificationCode,
  validateGhanaPhone,
  formatGhanaPhone,
  validateGhanaCard,
  validateTIN,
  validateDigitalAddress,
  calculateTax,
  calculatePlatformFee,
  calculatePaymentBreakdown,
  validateContractTerms,
  calculateComplianceScore,
  calculateRiskScore,
  formatCurrency,
  formatDate,
  delay
};
