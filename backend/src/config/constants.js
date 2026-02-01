// User Roles
const ROLES = {
  LANDLORD_INDIVIDUAL: 'LANDLORD_INDIVIDUAL',
  LANDLORD_CORPORATE: 'LANDLORD_CORPORATE',
  TENANT_INDIVIDUAL: 'TENANT_INDIVIDUAL',
  TENANT_CORPORATE: 'TENANT_CORPORATE',
  GRA_OFFICER: 'GRA_OFFICER',
  DISTRICT_OFFICER: 'DISTRICT_OFFICER',
  INSPECTOR: 'INSPECTOR',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN'
};

// User Status
const USER_STATUS = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BLACKLISTED: 'BLACKLISTED'
};

// Verification Status
const VERIFICATION_STATUS = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};

// Property Types
const PROPERTY_TYPES = {
  'R-SR': { name: 'Single Room', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-SC': { name: 'Self-Contained', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-1B': { name: '1-Bedroom', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-2B': { name: '2-Bedroom', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-3B': { name: '3-Bedroom', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-4B+': { name: '4+ Bedroom', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-HS': { name: 'House', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-VL': { name: 'Villa', category: 'RESIDENTIAL', maxAdvance: 6 },
  'R-CMP': { name: 'Compound Room', category: 'RESIDENTIAL', maxAdvance: 6 },
  'C-SHP': { name: 'Shop', category: 'COMMERCIAL', maxAdvance: 12 },
  'C-OFF': { name: 'Office', category: 'COMMERCIAL', maxAdvance: 12 },
  'C-WHS': { name: 'Warehouse', category: 'COMMERCIAL', maxAdvance: 24 },
  'C-IND': { name: 'Industrial', category: 'COMMERCIAL', maxAdvance: 24 },
  'C-MXD': { name: 'Mixed Use', category: 'COMMERCIAL', maxAdvance: 12 }
};

// Property Status
const PROPERTY_STATUS = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED'
};

// Contract Status
const CONTRACT_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_TENANT_CONFIRMATION: 'PENDING_TENANT_CONFIRMATION',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
  DISPUTED: 'DISPUTED'
};

// Contract Types
const CONTRACT_TYPES = {
  STANDARD: 'STANDARD',
  SHORT_TERM: 'SHORT_TERM',
  COMMERCIAL: 'COMMERCIAL',
  RENT_TO_OWN: 'RENT_TO_OWN'
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

// Payment Methods
const PAYMENT_METHODS = {
  MOBILE_MONEY_MTN: 'MOBILE_MONEY_MTN',
  MOBILE_MONEY_VODAFONE: 'MOBILE_MONEY_VODAFONE',
  MOBILE_MONEY_AIRTELTIGO: 'MOBILE_MONEY_AIRTELTIGO',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CARD: 'CARD'
};

// Tax Rates
const TAX_RATES = {
  INDIVIDUAL_REGISTERED: 0.08,
  INDIVIDUAL_UNREGISTERED: 0.15,
  CORPORATE: 0.08,
  RESIDENT_LANDLORD: 0.00,
  SOCIAL_HOUSING: 0.02
};

const TAX_EXEMPTION_THRESHOLD = 500;

// Platform Fees
const PLATFORM_FEE_RATE = 0.01;
const PLATFORM_FEE_CAP = 50;

// Case Types
const CASE_TYPES = {
  UNREGISTERED_RENTAL: 'UNREGISTERED_RENTAL',
  CASH_PAYMENT: 'CASH_PAYMENT',
  TAX_EVASION: 'TAX_EVASION',
  HABITABILITY: 'HABITABILITY',
  ILLEGAL_EVICTION: 'ILLEGAL_EVICTION',
  ANONYMOUS_TIP: 'ANONYMOUS_TIP'
};

// Case Priority
const CASE_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Case Status
const CASE_STATUS = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_REVIEW: 'PENDING_REVIEW',
  CLOSED: 'CLOSED'
};

// Dispute Types
const DISPUTE_TYPES = {
  CONTRACT_TERMS: 'CONTRACT_TERMS',
  PAYMENT: 'PAYMENT',
  HABITABILITY: 'HABITABILITY',
  EVICTION: 'EVICTION',
  DEPOSIT_RETURN: 'DEPOSIT_RETURN',
  RENT_INCREASE: 'RENT_INCREASE',
  OTHER: 'OTHER'
};

// Dispute Status
const DISPUTE_STATUS = {
  FILED: 'FILED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  MEDIATION: 'MEDIATION',
  RESOLVED: 'RESOLVED',
  APPEALED: 'APPEALED',
  CLOSED: 'CLOSED'
};

// Ghana Regions
const GHANA_REGIONS = [
  {
    name: 'Greater Accra',
    code: 'GAR',
    districts: [
      'Accra Metropolitan', 'Tema Metropolitan', 'Ga East', 'Ga West', 'Ga North',
      'Ga South', 'Ga Central', 'Ledzokuku', 'Krowor', 'La Dade Kotopon',
      'La Nkwantanang Madina', 'Adentan', 'Ayawaso East', 'Ayawaso North',
      'Ayawaso Central', 'Ayawaso West', 'Ablekuma Central', 'Ablekuma North',
      'Ablekuma West', 'Okaikwei North', 'Korle Klottey', 'Weija Gbawe'
    ]
  },
  {
    name: 'Ashanti',
    code: 'ASH',
    districts: [
      'Kumasi Metropolitan', 'Oforikrom', 'Asokwa', 'Suame', 'Old Tafo',
      'Manhyia North', 'Manhyia South', 'Kwadaso', 'Bantama', 'Nhyiaeso',
      'Obuasi Municipal', 'Ejisu', 'Juaben'
    ]
  },
  {
    name: 'Western',
    code: 'WES',
    districts: ['Sekondi-Takoradi Metropolitan', 'Effia-Kwesimintsim', 'Essikado-Ketan']
  },
  {
    name: 'Central',
    code: 'CEN',
    districts: ['Cape Coast Metropolitan', 'Komenda-Edina-Eguafo-Abirem']
  },
  {
    name: 'Eastern',
    code: 'EAS',
    districts: ['New Juaben Municipal', 'Koforidua']
  },
  {
    name: 'Volta',
    code: 'VOL',
    districts: ['Ho Municipal', 'Keta']
  },
  {
    name: 'Northern',
    code: 'NOR',
    districts: ['Tamale Metropolitan', 'Sagnarigu']
  }
];

// Security Deposit Limits
const MAX_SECURITY_DEPOSIT_MONTHS = 3;

// Contract Duration Limits
const MIN_DURATION_MONTHS = 1;
const MAX_DURATION_MONTHS = 60;

// Confirmation Expiry
const CONFIRMATION_EXPIRY_DAYS = 7;

module.exports = {
  ROLES,
  USER_STATUS,
  VERIFICATION_STATUS,
  PROPERTY_TYPES,
  PROPERTY_STATUS,
  CONTRACT_STATUS,
  CONTRACT_TYPES,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  TAX_RATES,
  TAX_EXEMPTION_THRESHOLD,
  PLATFORM_FEE_RATE,
  PLATFORM_FEE_CAP,
  CASE_TYPES,
  CASE_PRIORITY,
  CASE_STATUS,
  DISPUTE_TYPES,
  DISPUTE_STATUS,
  GHANA_REGIONS,
  MAX_SECURITY_DEPOSIT_MONTHS,
  MIN_DURATION_MONTHS,
  MAX_DURATION_MONTHS,
  CONFIRMATION_EXPIRY_DAYS
};
