// User Role Type
export type UserRole = 'LANDLORD' | 'TENANT';

// User Types
export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  otherNames?: string;
  dateOfBirth?: string;
  gender?: string;
  ghanaCardNumber?: string;
  tinNumber?: string;
  digitalAddress?: string;
  region?: string;
  district?: string;
  city?: string;
  streetAddress?: string;
  status: string;
  verificationStatus: string;
  pushToken?: string;
}

// Property Types
export interface Property {
  id: string;
  landlordId: string;
  propertyCode: string;
  digitalAddress: string;
  region: string;
  district: string;
  city?: string;
  neighborhood?: string;
  streetAddress?: string;
  propertyType: string;
  propertyTypeName?: string;
  propertyCategory: string;
  bedrooms?: number;
  bathrooms?: number;
  floorAreaSqm?: number;
  yearBuilt?: number;
  isFurnished: boolean;
  hasParking: boolean;
  hasSecurity: boolean;
  hasGenerator: boolean;
  amenities: string[];
  ownershipType: string;
  ownershipVerified: boolean;
  photos: string[];
  status: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Contract Types
export interface Contract {
  id: string;
  contractNumber: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  property?: Property;
  landlord?: { id: string; name: string; firstName?: string; lastName?: string; phone: string; email: string };
  tenant?: { id: string; name: string; firstName?: string; lastName?: string; phone: string; email: string };
  contractType: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  currency: string;
  securityDeposit: number;
  serviceCharge: number;
  advanceMonths: number;
  paymentFrequency: string;
  taxRate: number;
  totalTaxWithheld: number;
  status: string;
  landlordSigned: boolean;
  landlordSignedAt?: string;
  tenantConfirmed: boolean;
  tenantConfirmedAt?: string;
  landlordIdScanUrl?: string;
  tenantIdScanUrl?: string;
  landlordExtractedData?: ExtractedIdData;
  tenantExtractedData?: ExtractedIdData;
  landlordSignatureUrl?: string;
  tenantSignatureUrl?: string;
  confirmationCode?: string;
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export interface Payment {
  id: string;
  paymentReference: string;
  contractId: string;
  tenantId: string;
  landlordId: string;
  contract?: Contract;
  tenant?: { id: string; name: string; phone: string };
  landlord?: { id: string; name: string; phone: string };
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  platformFee: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string;
  paymentProvider?: string;
  providerReference?: string;
  status: string;
  initiatedAt: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt?: string;
}

// Extracted ID Data from OCR
export interface ExtractedIdData {
  ghanaCardNumber?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  otherNames?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  placeOfIssuance?: string;
  dateOfIssuance?: string;
  expiryDate?: string;
  confidence: number;
  rawText?: string;
}

// Scanned Document
export interface ScannedDocument {
  id: string;
  userId: string;
  documentType: 'GHANA_CARD' | 'PASSPORT' | 'DRIVERS_LICENSE';
  documentUrl: string;
  extractedData?: ExtractedIdData;
  extractionConfidence?: number;
  status: 'PENDING' | 'PROCESSED' | 'VERIFIED' | 'REJECTED';
  verified: boolean;
  createdAt: string;
}

// Navigation Types
export type RootStackParamList = {
  // Auth
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  VerifyOTP: { phone: string; purpose: 'REGISTRATION' | 'LOGIN' };

  // Main Tabs
  MainTabs: { screen?: string } | undefined;

  // Landlord Screens
  LandlordDashboard: undefined;
  Properties: undefined;
  PropertyDetails: { propertyId: string };
  AddProperty: undefined;
  EditProperty: { propertyId: string };

  // Contracts
  Contracts: undefined;
  ContractDetails: { contractId: string };
  CreateContract: { propertyId?: string; scannedData?: ExtractedIdData };
  ScanDocument: {
    documentType: 'GHANA_CARD' | 'PASSPORT' | 'DRIVERS_LICENSE';
    onScanComplete?: (data: ExtractedIdData) => void;
    returnScreen?: string;
  };
  SignContract: { contractId: string };

  // Tenant Screens
  TenantDashboard: undefined;
  ConfirmContract: { contractId: string; code?: string; scannedData?: ExtractedIdData };

  // Payments
  Payments: undefined;
  PaymentDetails: { paymentId: string };
  MakePayment: { contractId: string; paymentId?: string };

  // Common
  Notifications: undefined;
  Profile: undefined;
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  TaxCertificates: undefined;
  HelpSupport: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
