const { delay } = require('../utils/helpers');

// Mock TIN data
const MOCK_TINS = {
  'C12345678': {
    tin: 'C12345678',
    name: 'Kwame Asante',
    type: 'INDIVIDUAL',
    status: 'ACTIVE',
    taxCompliant: true,
    registrationDate: '2020-01-15'
  },
  'C87654321': {
    tin: 'C87654321',
    name: 'GoldKey Properties Ltd',
    type: 'CORPORATE',
    status: 'ACTIVE',
    taxCompliant: true,
    registrationDate: '2018-06-20'
  },
  'P11111111': {
    tin: 'P11111111',
    name: 'Test Person',
    type: 'INDIVIDUAL',
    status: 'ACTIVE',
    taxCompliant: false,
    registrationDate: '2021-03-10'
  }
};

// Verify TIN
const verifyTIN = async (tinNumber) => {
  await delay(500);

  // Check mock data
  const tin = MOCK_TINS[tinNumber];

  if (tin) {
    return {
      success: true,
      data: tin
    };
  }

  // Accept format: Cxxxxxxxx or Pxxxxxxxx
  if (tinNumber.match(/^[CP]\d{8}$/)) {
    return {
      success: true,
      data: {
        tin: tinNumber,
        name: 'Registered Taxpayer',
        type: tinNumber.startsWith('C') ? 'CORPORATE' : 'INDIVIDUAL',
        status: 'ACTIVE',
        taxCompliant: true,
        registrationDate: '2022-01-01'
      }
    };
  }

  return {
    success: false,
    error: 'Invalid TIN'
  };
};

// Get tax filing history (simulated)
const getTaxFilingHistory = async (tinNumber) => {
  await delay(500);

  // Generate mock history
  const filings = [];
  const currentYear = new Date().getFullYear();

  for (let year = currentYear - 3; year <= currentYear; year++) {
    filings.push({
      year,
      filingDate: `${year}-04-15`,
      status: 'FILED',
      amountDue: Math.floor(Math.random() * 50000) + 10000,
      amountPaid: Math.floor(Math.random() * 50000) + 10000,
      balance: 0
    });
  }

  return {
    success: true,
    data: {
      tin: tinNumber,
      filings
    }
  };
};

module.exports = {
  verifyTIN,
  getTaxFilingHistory,
  MOCK_TINS
};
