import { ExtractedIdData } from '../types';

// Ghana Card patterns
const GHANA_CARD_PATTERNS = {
  // Ghana Card number format: GHA-XXXXXXXXX-X
  cardNumber: /GHA-\d{9}-\d/i,
  // Date formats
  date: /\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/g,
  // Name patterns (typically in uppercase on ID)
  name: /^[A-Z][A-Z\s'-]+$/,
};

/**
 * Extract data from Ghana Card using OCR text
 * This function processes the raw text from OCR and extracts relevant fields
 */
export function extractGhanaCardData(ocrText: string): ExtractedIdData {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const result: ExtractedIdData = {
    confidence: 0,
    rawText: ocrText,
  };

  // Extract Ghana Card Number
  const cardNumberMatch = ocrText.match(GHANA_CARD_PATTERNS.cardNumber);
  if (cardNumberMatch) {
    result.ghanaCardNumber = cardNumberMatch[0].toUpperCase();
    result.confidence += 25;
  }

  // Extract dates
  const dates = ocrText.match(GHANA_CARD_PATTERNS.date) || [];
  if (dates.length >= 1 && dates[0]) {
    // First date is usually date of birth
    result.dateOfBirth = formatDate(dates[0]);
    result.confidence += 15;
  }
  if (dates.length >= 2 && dates[1]) {
    // Second date might be issue date
    result.dateOfIssuance = formatDate(dates[1]);
    result.confidence += 10;
  }
  if (dates.length >= 3 && dates[2]) {
    // Third date might be expiry
    result.expiryDate = formatDate(dates[2]);
    result.confidence += 10;
  }

  // Extract name - usually the first or second line with all caps
  for (const line of lines.slice(0, 5)) {
    if (GHANA_CARD_PATTERNS.name.test(line) && line.length > 5) {
      const nameParts = line.split(/\s+/);
      if (nameParts.length >= 2) {
        result.fullName = line;
        result.firstName = nameParts[0];
        result.lastName = nameParts[nameParts.length - 1];
        if (nameParts.length > 2) {
          result.otherNames = nameParts.slice(1, -1).join(' ');
        }
        result.confidence += 20;
        break;
      }
    }
  }

  // Look for gender
  const genderMatch = ocrText.match(/\b(MALE|FEMALE|M|F)\b/i);
  if (genderMatch) {
    const gender = genderMatch[0].toUpperCase();
    result.gender = gender === 'M' ? 'MALE' : gender === 'F' ? 'FEMALE' : gender;
    result.confidence += 10;
  }

  // Look for nationality
  if (/GHANAIAN|GHANA/i.test(ocrText)) {
    result.nationality = 'Ghanaian';
    result.confidence += 10;
  }

  // Look for place of issuance
  const placeMatch = ocrText.match(/ACCRA|KUMASI|TAMALE|CAPE COAST|TAKORADI|TEMA/i);
  if (placeMatch) {
    result.placeOfIssuance = placeMatch[0].charAt(0) + placeMatch[0].slice(1).toLowerCase();
  }

  return result;
}

/**
 * Format date string to ISO format
 */
function formatDate(dateStr: string): string {
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

/**
 * Validate extracted Ghana Card data
 */
export function validateGhanaCardData(data: ExtractedIdData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.ghanaCardNumber) {
    errors.push('Ghana Card number not detected');
  } else if (!/^GHA-\d{9}-\d$/.test(data.ghanaCardNumber)) {
    errors.push('Invalid Ghana Card number format');
  }

  if (!data.fullName && !data.firstName) {
    errors.push('Name not detected');
  }

  if (!data.dateOfBirth) {
    errors.push('Date of birth not detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Perform OCR on an image using ML Kit
 * Falls back to mock data for demo purposes
 */
export async function performOCR(imageUri: string): Promise<string> {
  try {
    // Try to use ML Kit OCR if available
    const MlkitOcr = require('react-native-mlkit-ocr').default;
    const result = await MlkitOcr.detectFromUri(imageUri);
    return result.map((block: any) => block.text).join('\n');
  } catch (error) {
    console.log('ML Kit not available, using mock data for demo');
    // Return mock OCR text for demo purposes
    return generateMockOCRText();
  }
}

/**
 * Generate mock OCR text for demo purposes
 */
function generateMockOCRText(): string {
  const mockNames = [
    'KWAME ASANTE BOATENG',
    'AMA MENSAH OWUSU',
    'KOFI ADJEI MENSAH',
    'ABENA SERWAA DARKO',
  ];
  const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
  const randomCardNum = `GHA-${Math.floor(100000000 + Math.random() * 900000000)}-${Math.floor(Math.random() * 10)}`;

  return `REPUBLIC OF GHANA
NATIONAL IDENTIFICATION AUTHORITY
GHANA CARD
${randomName}
${randomCardNum}
DATE OF BIRTH: 15/03/1985
SEX: ${Math.random() > 0.5 ? 'M' : 'F'}
NATIONALITY: GHANAIAN
ACCRA
ISSUED: 01/01/2022
EXPIRES: 31/12/2032`;
}

/**
 * Process image and extract text using ML Kit or similar
 * This is a placeholder - actual implementation depends on the OCR library used
 */
export async function processIdImage(imageUri: string): Promise<string> {
  return performOCR(imageUri);
}

/**
 * Calculate confidence score for extracted data
 */
export function calculateConfidence(data: ExtractedIdData): number {
  let score = 0;
  const maxScore = 100;

  // Ghana Card Number: 30 points
  if (data.ghanaCardNumber && /^GHA-\d{9}-\d$/.test(data.ghanaCardNumber)) {
    score += 30;
  }

  // Name: 25 points
  if (data.fullName || (data.firstName && data.lastName)) {
    score += 25;
  }

  // Date of Birth: 15 points
  if (data.dateOfBirth) {
    score += 15;
  }

  // Gender: 10 points
  if (data.gender) {
    score += 10;
  }

  // Nationality: 5 points
  if (data.nationality) {
    score += 5;
  }

  // Dates: 15 points total
  if (data.dateOfIssuance) score += 7.5;
  if (data.expiryDate) score += 7.5;

  return Math.min(score, maxScore);
}

export default {
  extractGhanaCardData,
  validateGhanaCardData,
  processIdImage,
  calculateConfidence,
};
