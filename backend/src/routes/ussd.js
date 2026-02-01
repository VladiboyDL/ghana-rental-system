const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { PROPERTY_TYPES, PAYMENT_METHODS } = require('../config/constants');
const { processPayment } = require('../simulators/mobileMoney');
const { generateId, generatePaymentReference, calculatePaymentBreakdown } = require('../utils/helpers');

// USSD session store (in-memory for demo)
const sessions = new Map();

// Get menu for USSD code
router.get('/menu/:code', (req, res) => {
  const { code } = req.params;

  const menus = {
    '*714#': {
      title: 'Ghana Rental System',
      options: [
        { key: '1', label: 'Make Payment' },
        { key: '2', label: 'Check Balance' },
        { key: '3', label: 'My Contracts' },
        { key: '4', label: 'Report Issue' },
        { key: '5', label: 'Market Rent' },
        { key: '0', label: 'Help' }
      ]
    }
  };

  res.json({
    success: true,
    data: menus[code] || menus['*714#']
  });
});

// Start USSD session
router.post('/session', (req, res) => {
  const { phoneNumber, serviceCode } = req.body;

  const sessionId = generateId();

  sessions.set(sessionId, {
    phoneNumber,
    serviceCode,
    step: 'main',
    data: {},
    createdAt: new Date()
  });

  res.json({
    success: true,
    data: {
      sessionId,
      message: 'Welcome to Ghana Rental System\n\n1. Make Payment\n2. Check Balance\n3. My Contracts\n4. Report Issue\n5. Market Rent\n0. Help',
      endSession: false
    }
  });
});

// Process USSD input
router.post('/input', async (req, res) => {
  const { sessionId, input } = req.body;

  const session = sessions.get(sessionId);
  if (!session) {
    return res.json({
      success: true,
      data: {
        message: 'Session expired. Please dial *714# again.',
        endSession: true
      }
    });
  }

  let response = { message: '', endSession: false };

  try {
    switch (session.step) {
      case 'main':
        response = await handleMainMenu(session, input);
        break;
      case 'payment_select_contract':
        response = await handlePaymentContractSelect(session, input);
        break;
      case 'payment_select_method':
        response = await handlePaymentMethodSelect(session, input);
        break;
      case 'payment_confirm':
        response = await handlePaymentConfirm(session, input);
        break;
      case 'balance':
        response = await handleBalance(session, input);
        break;
      case 'contracts':
        response = await handleContracts(session, input);
        break;
      case 'market_region':
        response = await handleMarketRegion(session, input);
        break;
      case 'market_type':
        response = await handleMarketType(session, input);
        break;
      default:
        response.message = 'Invalid option. Please try again.';
    }

    if (response.endSession) {
      sessions.delete(sessionId);
    } else {
      sessions.set(sessionId, session);
    }

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('USSD error:', error);
    res.json({
      success: true,
      data: {
        message: 'An error occurred. Please try again.',
        endSession: true
      }
    });
  }
});

// Handle main menu
async function handleMainMenu(session, input) {
  switch (input) {
    case '1': // Make Payment
      const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(session.phoneNumber);
      if (!user) {
        return { message: 'Phone number not registered. Please register at our website.', endSession: true };
      }

      const contracts = db.prepare(`
        SELECT c.*, p.neighborhood, p.district
        FROM contracts c
        JOIN properties p ON c.property_id = p.id
        WHERE c.tenant_id = ? AND c.status = 'ACTIVE'
      `).all(user.id);

      if (contracts.length === 0) {
        return { message: 'No active contracts found.', endSession: true };
      }

      session.step = 'payment_select_contract';
      session.data.userId = user.id;
      session.data.contracts = contracts;

      let msg = 'Select Contract:\n';
      contracts.forEach((c, i) => {
        msg += `${i + 1}. ${c.neighborhood}, ${c.district} (GHS ${c.monthly_rent}/mo)\n`;
      });
      msg += '0. Back';

      return { message: msg, endSession: false };

    case '2': // Check Balance
      session.step = 'balance';
      return { message: 'Enter your registered phone number:', endSession: false };

    case '3': // My Contracts
      session.step = 'contracts';
      return { message: 'Enter your registered phone number:', endSession: false };

    case '5': // Market Rent
      session.step = 'market_region';
      return {
        message: 'Select Region:\n1. Greater Accra\n2. Ashanti\n3. Western\n4. Central\n0. Back',
        endSession: false
      };

    case '0': // Help
      return {
        message: 'Ghana Rental System Help:\n- Dial *714# to access\n- Visit www.ghanarentals.gov.gh\n- Call 0800-RENT for support',
        endSession: true
      };

    default:
      return { message: 'Invalid option. Please select 1-5 or 0 for help.', endSession: false };
  }
}

// Handle payment contract selection
async function handlePaymentContractSelect(session, input) {
  if (input === '0') {
    session.step = 'main';
    return { message: 'Welcome to Ghana Rental System\n\n1. Make Payment\n2. Check Balance\n3. My Contracts\n4. Report Issue\n5. Market Rent\n0. Help', endSession: false };
  }

  const index = parseInt(input) - 1;
  if (isNaN(index) || index < 0 || index >= session.data.contracts.length) {
    return { message: 'Invalid selection. Please try again.', endSession: false };
  }

  const contract = session.data.contracts[index];
  session.data.selectedContract = contract;
  session.step = 'payment_select_method';

  return {
    message: `Pay GHS ${contract.monthly_rent} for ${contract.neighborhood}\n\nSelect payment method:\n1. MTN MoMo\n2. Vodafone Cash\n3. AirtelTigo\n0. Back`,
    endSession: false
  };
}

// Handle payment method selection
async function handlePaymentMethodSelect(session, input) {
  if (input === '0') {
    session.step = 'payment_select_contract';
    let msg = 'Select Contract:\n';
    session.data.contracts.forEach((c, i) => {
      msg += `${i + 1}. ${c.neighborhood}, ${c.district} (GHS ${c.monthly_rent}/mo)\n`;
    });
    msg += '0. Back';
    return { message: msg, endSession: false };
  }

  const methods = { '1': 'MOBILE_MONEY_MTN', '2': 'MOBILE_MONEY_VODAFONE', '3': 'MOBILE_MONEY_AIRTELTIGO' };
  const methodNames = { '1': 'MTN MoMo', '2': 'Vodafone Cash', '3': 'AirtelTigo' };

  if (!methods[input]) {
    return { message: 'Invalid selection. Please enter 1, 2, or 3.', endSession: false };
  }

  const contract = session.data.selectedContract;
  const landlord = db.prepare('SELECT * FROM users WHERE id = ?').get(contract.landlord_id);

  // Calculate breakdown
  const breakdown = calculatePaymentBreakdown(contract.monthly_rent, landlord, contract);

  session.data.paymentMethod = methods[input];
  session.data.breakdown = breakdown;
  session.step = 'payment_confirm';

  const landlordName = landlord.is_corporate ? landlord.company_name : `${landlord.first_name} ${landlord.last_name}`;

  return {
    message: `Confirm Payment:\nTo: ${landlordName}\nRent: GHS ${contract.monthly_rent}\nTax: GHS ${breakdown.taxAmount.toFixed(2)}\nTotal: GHS ${breakdown.grossAmount.toFixed(2)}\nMethod: ${methodNames[input]}\n\n1. Confirm\n2. Cancel`,
    endSession: false
  };
}

// Handle payment confirmation
async function handlePaymentConfirm(session, input) {
  if (input === '2') {
    session.step = 'main';
    return { message: 'Payment cancelled.\n\n1. Make Payment\n2. Check Balance\n3. My Contracts\n0. Help', endSession: false };
  }

  if (input !== '1') {
    return { message: 'Please enter 1 to confirm or 2 to cancel.', endSession: false };
  }

  const contract = session.data.selectedContract;
  const breakdown = session.data.breakdown;

  // Process payment
  const paymentResult = await processPayment({
    amount: breakdown.grossAmount,
    provider: session.data.paymentMethod,
    phoneNumber: session.phoneNumber,
    reference: generatePaymentReference()
  });

  if (paymentResult.success) {
    // Create payment record
    const paymentId = generateId();
    const paymentReference = paymentResult.data.reference;
    const today = new Date();
    const periodStart = today.toISOString().split('T')[0];
    const periodEnd = new Date(today.setMonth(today.getMonth() + 1)).toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO payments (
        id, payment_reference, contract_id, tenant_id, landlord_id,
        gross_amount, tax_amount, net_amount, platform_fee,
        period_start, period_end, payment_method, status, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', datetime('now'))
    `).run(
      paymentId, paymentReference, contract.id, session.data.userId, contract.landlord_id,
      breakdown.grossAmount, breakdown.taxAmount, breakdown.netAmount, breakdown.platformFee,
      periodStart, periodEnd, session.data.paymentMethod
    );

    return {
      message: `Payment Successful!\nRef: ${paymentReference}\nAmount: GHS ${breakdown.grossAmount.toFixed(2)}\nTax paid: GHS ${breakdown.taxAmount.toFixed(2)}\n\nReceipt sent via SMS.`,
      endSession: true
    };
  }

  return {
    message: `Payment Failed: ${paymentResult.message}\n\nPlease try again later.`,
    endSession: true
  };
}

// Handle balance check
async function handleBalance(session, input) {
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(input);
  if (!user) {
    return { message: 'Phone number not registered.', endSession: true };
  }

  // Get total paid and due
  const contracts = db.prepare(`
    SELECT c.*, p.neighborhood
    FROM contracts c
    JOIN properties p ON c.property_id = p.id
    WHERE c.tenant_id = ? AND c.status = 'ACTIVE'
  `).all(user.id);

  if (contracts.length === 0) {
    return { message: 'No active contracts.', endSession: true };
  }

  let msg = 'Your Balance:\n';
  contracts.forEach(c => {
    msg += `${c.neighborhood}: GHS ${c.monthly_rent}/mo\n`;
  });

  return { message: msg, endSession: true };
}

// Handle contracts view
async function handleContracts(session, input) {
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(input);
  if (!user) {
    return { message: 'Phone number not registered.', endSession: true };
  }

  const contracts = db.prepare(`
    SELECT c.*, p.neighborhood, p.district
    FROM contracts c
    JOIN properties p ON c.property_id = p.id
    WHERE c.tenant_id = ? OR c.landlord_id = ?
    ORDER BY c.created_at DESC LIMIT 5
  `).all(user.id, user.id);

  if (contracts.length === 0) {
    return { message: 'No contracts found.', endSession: true };
  }

  let msg = 'Your Contracts:\n';
  contracts.forEach(c => {
    msg += `${c.contract_number}\n${c.neighborhood}, ${c.district}\nGHS ${c.monthly_rent}/mo - ${c.status}\n\n`;
  });

  return { message: msg, endSession: true };
}

// Handle market region selection
async function handleMarketRegion(session, input) {
  const regions = { '1': 'Greater Accra', '2': 'Ashanti', '3': 'Western', '4': 'Central' };

  if (input === '0') {
    session.step = 'main';
    return { message: 'Welcome to Ghana Rental System\n\n1. Make Payment\n2. Check Balance\n3. My Contracts\n4. Report Issue\n5. Market Rent\n0. Help', endSession: false };
  }

  if (!regions[input]) {
    return { message: 'Invalid selection.', endSession: false };
  }

  session.data.region = regions[input];
  session.step = 'market_type';

  return {
    message: 'Select Property Type:\n1. Single Room\n2. 1-Bedroom\n3. 2-Bedroom\n4. 3-Bedroom\n0. Back',
    endSession: false
  };
}

// Handle market type selection
async function handleMarketType(session, input) {
  const types = { '1': 'R-SR', '2': 'R-1B', '3': 'R-2B', '4': 'R-3B' };
  const typeNames = { '1': 'Single Room', '2': '1-Bedroom', '3': '2-Bedroom', '4': '3-Bedroom' };

  if (input === '0') {
    session.step = 'market_region';
    return { message: 'Select Region:\n1. Greater Accra\n2. Ashanti\n3. Western\n4. Central\n0. Back', endSession: false };
  }

  if (!types[input]) {
    return { message: 'Invalid selection.', endSession: false };
  }

  // Get market data
  const marketData = db.prepare(`
    SELECT * FROM market_rent_data
    WHERE region = ? AND property_type = ?
    ORDER BY period_year DESC, period_month DESC LIMIT 1
  `).get(session.data.region, types[input]);

  if (marketData) {
    return {
      message: `Market Rent - ${session.data.region}\n${typeNames[input]}:\n\nAverage: GHS ${marketData.average_rent}\nRange: GHS ${marketData.min_rent} - ${marketData.max_rent}\nSample: ${marketData.sample_size} properties`,
      endSession: true
    };
  }

  // Fallback to contract data
  const contracts = db.prepare(`
    SELECT AVG(c.monthly_rent) as avg, MIN(c.monthly_rent) as min, MAX(c.monthly_rent) as max, COUNT(*) as cnt
    FROM contracts c
    JOIN properties p ON c.property_id = p.id
    WHERE p.region = ? AND p.property_type = ? AND c.status IN ('ACTIVE', 'EXPIRED')
  `).get(session.data.region, types[input]);

  if (contracts && contracts.cnt > 0) {
    return {
      message: `Market Rent - ${session.data.region}\n${typeNames[input]}:\n\nAverage: GHS ${Math.round(contracts.avg)}\nRange: GHS ${contracts.min} - ${contracts.max}\nSample: ${contracts.cnt} properties`,
      endSession: true
    };
  }

  return {
    message: `No data available for ${typeNames[input]} in ${session.data.region}.`,
    endSession: true
  };
}

module.exports = router;
