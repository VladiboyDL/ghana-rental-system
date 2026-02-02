/**
 * Ghana Rental Market - Real World Activity Simulator
 *
 * Simulates 5 hours of real-world activity including:
 * - Landlord registrations and property listings
 * - Tenant registrations
 * - Contract creation and confirmation (1 tenant = 1 lease max)
 * - Payment processing
 * - GRA/Authority activities (audits, inspections)
 *
 * Run with: node scripts/simulate-activity.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'https://ghana-rental-api.onrender.com/api';
const SIMULATION_DURATION_HOURS = 5;
const SIMULATION_KEY = 'ghana-rental-sim-2024'; // Key for bypassing OTP verification

// Demo accounts (already verified and active in the system)
const DEMO_ACCOUNTS = {
  landlords: [
    { email: 'landlord@demo.com', password: 'demo123' },
    { email: 'landlord2@demo.com', password: 'demo123' }
  ],
  tenants: [
    { email: 'tenant@demo.com', password: 'demo123' },
    { email: 'tenant2@demo.com', password: 'demo123' }
  ],
  gra: { email: 'gra@demo.com', password: 'demo123' },
  admin: { email: 'admin@demo.com', password: 'admin123' }
};

// Realistic volumes for 5 hours (based on moderate market activity)
const VOLUMES = {
  newLandlords: 12,          // 12 new landlord registrations over 5 hours
  newTenants: 25,            // 25 new tenant registrations (more tenants than landlords)
  propertiesPerLandlord: { min: 1, max: 4 }, // Each landlord lists 1-4 properties
  contractCreationRate: 0.6, // 60% of properties get contracts
  confirmationRate: 0.85,    // 85% of contracts get confirmed
  paymentRate: 0.9,          // 90% of confirmed contracts have payment
  multiplePaymentRate: 0.3   // 30% chance of multiple months payment
};

// Tracking
const stats = {
  landlords: { registered: 0, failed: 0 },
  tenants: { registered: 0, failed: 0 },
  properties: { created: 0, failed: 0 },
  contracts: { created: 0, confirmed: 0, failed: 0 },
  payments: { completed: 0, failed: 0, totalAmount: 0, totalTax: 0 },
  inspections: { created: 0, completed: 0 }
};

// Store created entities for relationships
const createdUsers = { landlords: [], tenants: [] };
const createdProperties = [];
const createdContracts = [];
const usedTenants = new Set(); // Track tenants who already have a lease

// Ghana-specific data generators
const ghanaNames = {
  firstNames: {
    male: ['Kwame', 'Kofi', 'Kweku', 'Yaw', 'Kwabena', 'Kojo', 'Nana', 'Mensah', 'Asante', 'Osei',
           'Appiah', 'Boateng', 'Owusu', 'Amoako', 'Emmanuel', 'Daniel', 'Samuel', 'Joseph', 'Michael', 'David'],
    female: ['Ama', 'Akua', 'Adwoa', 'Abena', 'Efua', 'Akosua', 'Adjoa', 'Afua', 'Ekua', 'Afia',
             'Grace', 'Mary', 'Elizabeth', 'Sarah', 'Ruth', 'Esther', 'Patience', 'Comfort', 'Gifty', 'Vida']
  },
  lastNames: ['Mensah', 'Asante', 'Osei', 'Appiah', 'Boateng', 'Owusu', 'Amoako', 'Agyeman', 'Darko',
              'Frimpong', 'Antwi', 'Gyamfi', 'Kwarteng', 'Asamoah', 'Addai', 'Baffour', 'Tetteh', 'Addo',
              'Acheampong', 'Ofori', 'Adjei', 'Yeboah', 'Amponsah', 'Sarpong', 'Bonsu', 'Adu', 'Danso']
};

const neighborhoods = {
  'Greater Accra': {
    districts: ['Accra Metropolitan', 'Tema Metropolitan', 'Ga East', 'Ga West', 'Adentan', 'Madina'],
    areas: ['East Legon', 'Airport Residential', 'Cantonments', 'Osu', 'Labone', 'Dzorwulu',
            'Achimota', 'Madina', 'Tema Community 1', 'Spintex', 'Dansoman', 'Lapaz', 'Kasoa', 'Nungua',
            'Adenta', 'Haatso', 'Dome', 'Legon', 'Teshie', 'Nima', 'Mamobi', 'Kokomlemle']
  },
  'Ashanti': {
    districts: ['Kumasi Metropolitan', 'Oforikrom', 'Asokwa', 'Suame', 'Manhyia North'],
    areas: ['Ahodwo', 'Nhyiaeso', 'Airport', 'Kumasi Central', 'Bantama', 'Suame', 'Oforikrom',
            'Adum', 'Asafo', 'Kejetia', 'Tafo', 'Santasi', 'Atonsu']
  },
  'Western': {
    districts: ['Sekondi-Takoradi Metropolitan', 'Effia-Kwesimintsim'],
    areas: ['Airport Ridge', 'Chapel Hill', 'Beach Road', 'Anaji', 'Fijai', 'Kojokrom', 'Essikado']
  },
  'Central': {
    districts: ['Cape Coast Metropolitan', 'KEEA'],
    areas: ['Pedu', 'Abura', 'Cape Coast Central', 'UCC Area', 'Ola', 'Kotokuraba']
  },
  'Eastern': {
    districts: ['New Juaben South', 'New Juaben North'],
    areas: ['Koforidua Central', 'Adweso', 'Effiduase', 'Nsukwao', 'Ada', 'Betom']
  }
};

const propertyTypes = [
  { code: 'R-SR', weight: 15 },  // Single Room - common
  { code: 'R-SC', weight: 20 },  // Self-Contained - very common
  { code: 'R-1B', weight: 20 },  // 1-Bedroom - very common
  { code: 'R-2B', weight: 18 },  // 2-Bedroom - common
  { code: 'R-3B', weight: 12 },  // 3-Bedroom - moderate
  { code: 'R-4B+', weight: 5 },  // 4+ Bedroom - rare
  { code: 'R-HS', weight: 3 },   // House - rare
  { code: 'C-SHP', weight: 5 },  // Shop - some
  { code: 'C-OFF', weight: 2 }   // Office - rare
];

const streetNames = [
  'Main Street', 'Church Road', 'Market Lane', 'School Avenue', 'Hospital Road',
  'Station Road', 'Factory Lane', 'Bank Street', 'Post Office Road', 'Community Center Road',
  'First Close', 'Second Avenue', 'Third Street', 'Liberation Road', 'Independence Avenue',
  'Ring Road', 'Circle Road', 'Boundary Road', 'Junction Street', 'Old Road'
];

// Utility functions
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item.code;
  }
  return items[0].code;
}

function generateGhanaCard() {
  const prefix = 'GHA-';
  const numbers = Array(9).fill(0).map(() => randomInt(0, 9)).join('');
  const suffix = `-${randomInt(0, 9)}`;
  return prefix + numbers + suffix;
}

function generateTIN(isIndividual = true) {
  const prefix = isIndividual ? 'P00' : 'C00';
  return prefix + randomInt(10000000, 99999999);
}

function generatePhone() {
  const prefixes = ['024', '054', '055', '027', '057', '026', '056', '020', '050'];
  return prefixes[randomInt(0, prefixes.length - 1)] + Array(7).fill(0).map(() => randomInt(0, 9)).join('');
}

function generateDigitalAddress(region) {
  const regionCodes = {
    'Greater Accra': ['GA', 'GE', 'GW', 'GT', 'GS'],
    'Ashanti': ['AK', 'AS', 'AT'],
    'Western': ['WS', 'WR'],
    'Central': ['CC', 'CR'],
    'Eastern': ['ER', 'EK']
  };
  const codes = regionCodes[region] || ['GA'];
  const prefix = randomElement(codes);
  const numbers = randomInt(100, 999) + '-' + randomInt(1000, 9999);
  return `${prefix}-${numbers}`;
}

function generateEmail(firstName, lastName, counter) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
  const separators = ['.', '_', ''];
  const sep = randomElement(separators);
  const num = counter || randomInt(1, 9999);
  return `${firstName.toLowerCase()}${sep}${lastName.toLowerCase()}${num}@${randomElement(domains)}`;
}

function generateRent(propertyType, region) {
  // Base rent ranges by property type (in GHS)
  const rentRanges = {
    'R-SR': { min: 150, max: 500 },
    'R-SC': { min: 400, max: 1000 },
    'R-1B': { min: 600, max: 1500 },
    'R-2B': { min: 1000, max: 3000 },
    'R-3B': { min: 1500, max: 5000 },
    'R-4B+': { min: 3000, max: 10000 },
    'R-HS': { min: 2500, max: 8000 },
    'C-SHP': { min: 500, max: 3500 },
    'C-OFF': { min: 1200, max: 6000 }
  };

  // Location multipliers
  const locationMultipliers = {
    'Greater Accra': 1.3,
    'Ashanti': 1.0,
    'Western': 0.95,
    'Central': 0.85,
    'Eastern': 0.8
  };

  const range = rentRanges[propertyType] || { min: 500, max: 2000 };
  const multiplier = locationMultipliers[region] || 1.0;

  const baseRent = randomInt(range.min, range.max);
  const adjustedRent = Math.round((baseRent * multiplier) / 50) * 50; // Round to nearest 50

  return adjustedRent;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    phase: '\x1b[35m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// API Helper with retry
async function apiCall(method, endpoint, data = null, token = null, retries = 3, extraHeaders = {}) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    timeout: 30000
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      await sleep(1000 * (i + 1));
    }
  }
}

// Activate user via simulation bypass (skips OTP)
async function simulationActivate(phoneOrEmail) {
  try {
    const data = phoneOrEmail.includes('@') ? { email: phoneOrEmail } : { phone: phoneOrEmail };
    const response = await apiCall('post', '/auth/simulation-activate', data, null, 1, {
      'X-Simulation-Key': SIMULATION_KEY
    });
    return response;
  } catch (error) {
    log(`Simulation activate failed: ${error.response?.data?.error?.message || error.message}`, 'warning');
    return null;
  }
}

// Login existing demo account
async function loginDemoAccount(credentials) {
  try {
    const response = await apiCall('post', '/auth/login', {
      email: credentials.email,
      password: credentials.password
    });

    if (response.success && response.data) {
      return {
        id: response.data.user?.id,
        email: credentials.email,
        firstName: response.data.user?.firstName,
        lastName: response.data.user?.lastName,
        token: response.data.token,
        role: response.data.user?.role,
        region: response.data.user?.region || 'Greater Accra',
        district: response.data.user?.district || 'Accra Metropolitan'
      };
    }
  } catch (error) {
    log(`Login failed for ${credentials.email}: ${error.response?.data?.error?.message || error.message}`, 'error');
  }
  return null;
}

// Initialize demo accounts
async function initializeDemoAccounts() {
  log('Initializing demo landlord accounts...', 'info');
  for (const landlordCreds of DEMO_ACCOUNTS.landlords) {
    const landlord = await loginDemoAccount(landlordCreds);
    if (landlord) {
      landlord.areas = neighborhoods['Greater Accra']?.areas || ['East Legon'];
      createdUsers.landlords.push(landlord);
      log(`Logged in landlord: ${landlord.email}`, 'success');
    }
    await sleep(300);
  }

  log('Initializing demo tenant accounts...', 'info');
  for (const tenantCreds of DEMO_ACCOUNTS.tenants) {
    const tenant = await loginDemoAccount(tenantCreds);
    if (tenant) {
      createdUsers.tenants.push(tenant);
      log(`Logged in tenant: ${tenant.email}`, 'success');
    }
    await sleep(300);
  }

  return {
    landlords: createdUsers.landlords.length,
    tenants: createdUsers.tenants.length
  };
}

// User Registration (creates pending accounts - shows registration volume)
async function registerLandlord(counter) {
  const isMale = Math.random() > 0.4; // 60% male landlords
  const firstName = randomElement(isMale ? ghanaNames.firstNames.male : ghanaNames.firstNames.female);
  const lastName = randomElement(ghanaNames.lastNames);
  const region = randomElement(Object.keys(neighborhoods));
  const regionData = neighborhoods[region];

  const userData = {
    email: generateEmail(firstName, lastName, counter),
    phone: generatePhone(),
    password: 'Demo@123',
    role: 'LANDLORD_INDIVIDUAL',
    firstName,
    lastName,
    ghanaCardNumber: generateGhanaCard(),
    tinNumber: generateTIN(true),
    digitalAddress: generateDigitalAddress(region),
    region,
    district: randomElement(regionData.districts)
  };

  try {
    await apiCall('post', '/auth/register', userData);
  } catch (error) {
    // Registration might "fail" with OTP message, but user is created
    const errorMsg = error.response?.data?.error?.message || error.message;
    if (!errorMsg.includes('OTP sent') && !errorMsg.includes('verify')) {
      stats.landlords.failed++;
      log(`Landlord registration failed: ${errorMsg}`, 'error');
      return null;
    }
  }

  // Activate via simulation bypass
  const activated = await simulationActivate(userData.email);
  if (activated?.success && activated?.data) {
    stats.landlords.registered++;
    const landlord = {
      ...userData,
      id: activated.data.user?.id,
      token: activated.data.token,
      areas: regionData.areas
    };
    createdUsers.landlords.push(landlord);
    log(`Landlord registered & activated: ${firstName} ${lastName} - ${region}`, 'success');
    return landlord;
  } else {
    stats.landlords.failed++;
    log(`Landlord activation failed: ${firstName} ${lastName}`, 'error');
  }
  return null;
}

async function registerTenant(counter) {
  const isMale = Math.random() > 0.45; // 55% male tenants
  const firstName = randomElement(isMale ? ghanaNames.firstNames.male : ghanaNames.firstNames.female);
  const lastName = randomElement(ghanaNames.lastNames);
  const region = randomElement(Object.keys(neighborhoods));
  const regionData = neighborhoods[region];

  const userData = {
    email: generateEmail(firstName, lastName, counter + 1000), // Offset to avoid email collision
    phone: generatePhone(),
    password: 'Demo@123',
    role: 'TENANT_INDIVIDUAL',
    firstName,
    lastName,
    ghanaCardNumber: generateGhanaCard(),
    digitalAddress: generateDigitalAddress(region),
    region,
    district: randomElement(regionData.districts)
  };

  try {
    await apiCall('post', '/auth/register', userData);
  } catch (error) {
    // Registration might "fail" with OTP message, but user is created
    const errorMsg = error.response?.data?.error?.message || error.message;
    if (!errorMsg.includes('OTP sent') && !errorMsg.includes('verify')) {
      stats.tenants.failed++;
      log(`Tenant registration failed: ${errorMsg}`, 'error');
      return null;
    }
  }

  // Activate via simulation bypass
  const activated = await simulationActivate(userData.email);
  if (activated?.success && activated?.data) {
    stats.tenants.registered++;
    const tenant = {
      ...userData,
      id: activated.data.user?.id,
      token: activated.data.token
    };
    createdUsers.tenants.push(tenant);
    log(`Tenant registered & activated: ${firstName} ${lastName} - ${region}`, 'success');
    return tenant;
  } else {
    stats.tenants.failed++;
    log(`Tenant activation failed: ${firstName} ${lastName}`, 'error');
  }
  return null;
}

// Property Management
async function createProperty(landlord) {
  const propertyType = weightedRandom(propertyTypes);
  const region = landlord.region || 'Greater Accra';
  const district = landlord.district || 'Accra Metropolitan';
  const areas = landlord.areas || neighborhoods[region]?.areas || ['East Legon'];
  const neighborhood = randomElement(areas);

  const propertyData = {
    digitalAddress: generateDigitalAddress(region),
    region: region,
    district: district,
    city: district.replace(' Metropolitan', '').replace(' Municipal', ''),
    neighborhood,
    streetAddress: `${randomInt(1, 200)} ${randomElement(streetNames)}`,
    propertyType,
    propertyCategory: propertyType.startsWith('C-') ? 'COMMERCIAL' : 'RESIDENTIAL',
    ownershipType: Math.random() > 0.3 ? 'FREEHOLD' : 'LEASEHOLD',
    bedrooms: propertyType.includes('B') ? parseInt(propertyType.match(/\d/)?.[0] || 1) : 0,
    bathrooms: randomInt(1, propertyType.includes('4') ? 4 : 2),
    floorAreaSqm: randomInt(25, propertyType.includes('HS') ? 300 : 150),
    yearBuilt: randomInt(1985, 2024),
    isFurnished: Math.random() > 0.75,
    hasParking: Math.random() > 0.5,
    hasSecurity: Math.random() > 0.6,
    hasGenerator: Math.random() > 0.8,
    amenities: []
  };

  const rent = generateRent(propertyType, landlord.region);

  try {
    const response = await apiCall('post', '/properties', propertyData, landlord.token);
    if (response.success && response.data) {
      const property = {
        ...response.data,
        landlord,
        rent,
        propertyType,
        neighborhood
      };
      createdProperties.push(property);
      stats.properties.created++;
      log(`Property listed: ${propertyType} in ${neighborhood} - GH₵${rent}/month`, 'success');
      return property;
    }
  } catch (error) {
    stats.properties.failed++;
    log(`Property creation failed: ${error.response?.data?.error?.message || error.message}`, 'error');
  }
  return null;
}

// Get available tenant (active account not already in a lease)
function getAvailableTenant() {
  for (const tenant of createdUsers.tenants) {
    // Only consider active tenants (with tokens) who haven't already been assigned
    if (tenant.token && !usedTenants.has(tenant.id)) {
      return tenant;
    }
  }
  return null;
}

// Contract Management
async function createContract(property) {
  const tenant = getAvailableTenant();

  if (!tenant) {
    log(`No available tenants for property in ${property.neighborhood}`, 'warning');
    return null;
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + randomInt(1, 14)); // Start in 1-14 days
  const durationMonths = randomInt(12, 24);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationMonths);

  const advanceMonths = Math.min(randomInt(1, 6), 6); // Max 6 months advance

  const contractData = {
    propertyId: property.id,
    tenantEmail: tenant.email,
    tenantPhone: tenant.phone,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    monthlyRent: property.rent,
    securityDeposit: property.rent * randomInt(1, 2),
    advanceMonths,
    paymentFrequency: 'MONTHLY',
    contractType: property.propertyType?.startsWith('C-') ? 'COMMERCIAL' : 'RESIDENTIAL'
  };

  try {
    const response = await apiCall('post', '/contracts', contractData, property.landlord.token);
    if (response.success && response.data) {
      usedTenants.add(tenant.id); // Mark tenant as having a lease
      const contract = {
        ...response.data,
        property,
        tenant,
        landlord: property.landlord
      };
      createdContracts.push(contract);
      stats.contracts.created++;
      log(`Contract created: ${tenant.firstName} ${tenant.lastName} -> ${property.neighborhood} (GH₵${property.rent}/mo, ${durationMonths}mo)`, 'success');
      return contract;
    }
  } catch (error) {
    stats.contracts.failed++;
    log(`Contract creation failed: ${error.response?.data?.error?.message || error.message}`, 'error');
  }
  return null;
}

async function confirmContract(contract) {
  try {
    const confirmData = {
      confirmationCode: contract.confirmationCode || '123456'
    };

    const response = await apiCall('post', `/contracts/${contract.id}/confirm`, confirmData, contract.tenant.token);
    if (response.success) {
      contract.confirmed = true;
      stats.contracts.confirmed++;
      log(`Contract confirmed: ${contract.tenant.firstName} ${contract.tenant.lastName} - ${contract.property.neighborhood}`, 'success');
      return true;
    }
  } catch (error) {
    log(`Contract confirmation failed: ${error.response?.data?.error?.message || error.message}`, 'warning');
  }
  return false;
}

// Payment Processing
async function makePayment(contract, months = 1) {
  const totalAmount = contract.property.rent * months;
  const paymentMethods = [
    { method: 'MOBILE_MONEY_MTN', weight: 50 },
    { method: 'MOBILE_MONEY_VODAFONE', weight: 25 },
    { method: 'MOBILE_MONEY_AIRTELTIGO', weight: 15 },
    { method: 'CARD', weight: 10 }
  ];

  const totalWeight = paymentMethods.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  let selectedMethod = paymentMethods[0].method;
  for (const pm of paymentMethods) {
    random -= pm.weight;
    if (random <= 0) {
      selectedMethod = pm.method;
      break;
    }
  }

  // Calculate payment period
  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + months);

  const paymentData = {
    contractId: contract.id,
    amount: totalAmount,
    paymentMethod: selectedMethod,
    periodStart: periodStart.toISOString().split('T')[0],
    periodEnd: periodEnd.toISOString().split('T')[0],
    phoneNumber: contract.tenant?.phone
  };

  try {
    const response = await apiCall('post', '/payments', paymentData, contract.tenant.token);
    if (response.success && response.data) {
      const taxAmount = totalAmount * 0.08;
      stats.payments.completed++;
      stats.payments.totalAmount += totalAmount;
      stats.payments.totalTax += taxAmount;
      log(`Payment: GH₵${totalAmount.toLocaleString()} (${months}mo) via ${selectedMethod} - Tax: GH₵${taxAmount.toFixed(2)}`, 'success');
      return true;
    }
  } catch (error) {
    stats.payments.failed++;
    log(`Payment failed: ${error.response?.data?.error?.message || error.message}`, 'warning');
  }
  return false;
}

// GRA/Authority Activities
async function runGRAActivities() {
  log('GRA Officer reviewing dashboard and compliance...', 'info');

  try {
    // Login as GRA officer (demo account)
    const graLogin = await apiCall('post', '/auth/login', {
      email: 'gra@demo.com',
      password: 'demo123'
    });

    if (graLogin.success && graLogin.data?.token) {
      const token = graLogin.data.token;

      // Fetch dashboard stats
      const dashboardResponse = await apiCall('get', '/admin/dashboard', null, token);
      if (dashboardResponse.success) {
        const data = dashboardResponse.data;
        log(`Dashboard: ${data.properties?.total || 0} properties, ${data.contracts?.active || 0} active contracts`, 'info');
        log(`Tax collected: GH₵${(data.payments?.totalTax || 0).toLocaleString()}`, 'info');
      }

      // Generate reports
      await apiCall('get', '/admin/reports?type=compliance', null, token);
      log(`Compliance report generated`, 'success');

      await apiCall('get', '/admin/reports?type=tax_collection', null, token);
      log(`Tax collection report generated`, 'success');

      await apiCall('get', '/admin/reports?type=registrations', null, token);
      log(`Registration report generated`, 'success');
    }
  } catch (error) {
    log(`GRA activities: ${error.response?.data?.error?.message || error.message}`, 'warning');
  }
}

// Main Simulation
async function runSimulation() {
  console.log('\n' + '='.repeat(70));
  console.log('  GHANA RENTAL MARKET - 5 HOUR ACTIVITY SIMULATOR');
  console.log('  Simulating realistic market activity');
  console.log('='.repeat(70) + '\n');

  log(`API: ${API_BASE_URL}`, 'info');

  // Check API health
  try {
    const health = await apiCall('get', '/health');
    log(`API Status: ${health.data?.status || 'unknown'}`, health.data?.status === 'healthy' ? 'success' : 'warning');
  } catch (error) {
    log(`API not reachable: ${error.message}`, 'error');
    log('Please ensure the backend is running', 'error');
    return;
  }

  // ==================== INITIALIZATION: Login Demo Accounts ====================
  log('\n========== INITIALIZATION: DEMO ACCOUNTS ==========', 'phase');
  const initialized = await initializeDemoAccounts();
  log(`Initialized ${initialized.landlords} landlords, ${initialized.tenants} tenants`, 'success');

  if (initialized.landlords === 0 || initialized.tenants === 0) {
    log('Could not initialize demo accounts. Ensure backend has been seeded.', 'error');
    return;
  }

  // ==================== PHASE 1: MORNING (Hour 1-2) ====================
  log('\n========== PHASE 1: MORNING RUSH (8AM - 10AM) ==========', 'phase');

  // Register new landlords (creates pending accounts - simulating new signups)
  log('New landlords registering...', 'info');
  for (let i = 0; i < Math.ceil(VOLUMES.newLandlords * 0.5); i++) {
    await registerLandlord(i);
    await sleep(randomInt(500, 1500));
  }

  // Register initial batch of tenants
  log('New tenants registering...', 'info');
  for (let i = 0; i < Math.ceil(VOLUMES.newTenants * 0.4); i++) {
    await registerTenant(i);
    await sleep(randomInt(300, 1000));
  }

  // Demo landlords list properties
  log('Existing landlords listing new properties...', 'info');
  for (const landlord of createdUsers.landlords) {
    if (landlord.token) { // Only active accounts can list properties
      const numProperties = randomInt(VOLUMES.propertiesPerLandlord.min, VOLUMES.propertiesPerLandlord.max);
      for (let i = 0; i < numProperties; i++) {
        await createProperty(landlord);
        await sleep(randomInt(800, 2000));
      }
    }
  }

  // ==================== PHASE 2: MID-MORNING (Hour 2-3) ====================
  log('\n========== PHASE 2: MID-MORNING (10AM - 11AM) ==========', 'phase');

  // More tenant registrations
  log('More tenants registering...', 'info');
  for (let i = 0; i < Math.ceil(VOLUMES.newTenants * 0.3); i++) {
    await registerTenant(100 + i);
    await sleep(randomInt(400, 1200));
  }

  // Create contracts (landlords finding tenants)
  log('Landlords creating contracts with tenants...', 'info');
  const propertiesForContracts = createdProperties.filter(() => Math.random() < VOLUMES.contractCreationRate);

  for (const property of propertiesForContracts) {
    // Get an available active tenant (with token)
    const availableTenant = getAvailableTenant();
    if (!availableTenant) {
      log('No more available active tenants for contracts', 'warning');
      break;
    }

    await createContract(property);
    await sleep(randomInt(1000, 3000));
  }

  // ==================== PHASE 3: LATE MORNING (Hour 3-4) ====================
  log('\n========== PHASE 3: LATE MORNING (11AM - 12PM) ==========', 'phase');

  // Tenant confirmations
  log('Tenants confirming their contracts...', 'info');
  for (const contract of createdContracts) {
    if (Math.random() < VOLUMES.confirmationRate) {
      await confirmContract(contract);
      await sleep(randomInt(500, 1500));
    }
  }

  // ==================== PHASE 4: AFTERNOON (Hour 4) ====================
  log('\n========== PHASE 4: AFTERNOON (12PM - 1PM) ==========', 'phase');

  // More registrations
  log('Afternoon registrations...', 'info');
  for (let i = 0; i < Math.ceil(VOLUMES.newLandlords * 0.3); i++) {
    await registerLandlord(50 + i);
    await sleep(randomInt(600, 1500));
  }

  for (let i = 0; i < Math.ceil(VOLUMES.newTenants * 0.2); i++) {
    await registerTenant(300 + i);
    await sleep(randomInt(400, 1000));
  }

  // New landlords list properties
  const newLandlords = createdUsers.landlords.slice(-Math.ceil(VOLUMES.newLandlords * 0.3));
  for (const landlord of newLandlords) {
    const numProperties = randomInt(1, 2);
    for (let i = 0; i < numProperties; i++) {
      await createProperty(landlord);
      await sleep(randomInt(800, 1500));
    }
  }

  // ==================== PHASE 5: PAYMENTS (Hour 4-5) ====================
  log('\n========== PHASE 5: PAYMENT PROCESSING (1PM - 2PM) ==========', 'phase');

  // Process payments for confirmed contracts
  log('Tenants making rent payments...', 'info');
  const confirmedContracts = createdContracts.filter(c => c.confirmed);

  for (const contract of confirmedContracts) {
    if (Math.random() < VOLUMES.paymentRate) {
      const months = Math.random() < VOLUMES.multiplePaymentRate ? randomInt(2, 6) : 1;
      await makePayment(contract, months);
      await sleep(randomInt(600, 2000));
    }
  }

  // ==================== PHASE 6: GRA ACTIVITIES ====================
  log('\n========== PHASE 6: GRA REVIEW & REPORTING ==========', 'phase');
  await runGRAActivities();

  // ==================== PHASE 7: FINAL ACTIVITY ====================
  log('\n========== PHASE 7: END OF DAY ACTIVITY ==========', 'phase');

  // Last minute registrations
  for (let i = 0; i < Math.ceil(VOLUMES.newLandlords * 0.2); i++) {
    await registerLandlord(80 + i);
    await sleep(500);
  }

  // Final Summary
  const activeAccounts = createdUsers.landlords.filter(l => l.token).length + createdUsers.tenants.filter(t => t.token).length;
  console.log('\n' + '='.repeat(70));
  console.log('  SIMULATION COMPLETE - SUMMARY');
  console.log('='.repeat(70));
  console.log(`
  ACCOUNTS:
    Active Landlords:     ${createdUsers.landlords.filter(l => l.token).length}
    Active Tenants:       ${createdUsers.tenants.filter(t => t.token).length}

  NEW REGISTRATIONS (Pending OTP verification):
    Landlords:    ${stats.landlords.registered} registered (${stats.landlords.failed} failed)
    Tenants:      ${stats.tenants.registered} registered (${stats.tenants.failed} failed)

  PROPERTIES:
    Listed:       ${stats.properties.created} properties (${stats.properties.failed} failed)

  CONTRACTS:
    Created:      ${stats.contracts.created}
    Confirmed:    ${stats.contracts.confirmed} (${((stats.contracts.confirmed / (stats.contracts.created || 1)) * 100).toFixed(1)}% rate)
    Failed:       ${stats.contracts.failed}

  PAYMENTS:
    Completed:    ${stats.payments.completed}
    Failed:       ${stats.payments.failed}
    Total Rent:   GH₵ ${stats.payments.totalAmount.toLocaleString()}
    Total Tax:    GH₵ ${stats.payments.totalTax.toFixed(2)}

  CONSTRAINTS VERIFIED:
    Active tenants with lease: ${usedTenants.size} of ${createdUsers.tenants.filter(t => t.token).length}
  `);
  console.log('='.repeat(70) + '\n');
}

// Run the simulation
runSimulation().catch(error => {
  console.error('Simulation failed:', error);
  process.exit(1);
});
