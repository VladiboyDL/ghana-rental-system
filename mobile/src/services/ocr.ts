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

// Words to skip when looking for names (headers, common ID card text)
const SKIP_WORDS = [
  'REPUBLIC', 'GHANA', 'NATIONAL', 'IDENTIFICATION', 'AUTHORITY', 'CARD',
  'SURNAME', 'FIRST', 'NAME', 'OTHER', 'NAMES', 'FULL', 'PERSONAL', 'ID',
  'NUMBER', 'DATE', 'BIRTH', 'SEX', 'NATIONALITY', 'PLACE', 'ISSUANCE',
  'EXPIRY', 'ISSUED', 'EXPIRES', 'OF', 'THE',
];

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
    result.confidence += 0.25;
  }

  // Extract dates
  const dates = ocrText.match(GHANA_CARD_PATTERNS.date) || [];
  if (dates.length >= 1 && dates[0]) {
    // First date is usually date of birth
    result.dateOfBirth = formatDate(dates[0]);
    result.confidence += 0.15;
  }
  if (dates.length >= 2 && dates[1]) {
    // Second date might be issue date
    result.dateOfIssuance = formatDate(dates[1]);
    result.confidence += 0.10;
  }
  if (dates.length >= 3 && dates[2]) {
    // Third date might be expiry
    result.expiryDate = formatDate(dates[2]);
    result.confidence += 0.10;
  }

  // Try to extract name from labeled lines first (e.g., "FULL NAME: KWAME ASANTE")
  const fullNameMatch = ocrText.match(/FULL\s*NAME[:\s]+([A-Z][A-Z\s'-]+)/i);
  if (fullNameMatch && fullNameMatch[1]) {
    const name = fullNameMatch[1].trim();
    result.fullName = name;
    const nameParts = name.split(/\s+/);
    result.firstName = nameParts[0];
    result.lastName = nameParts[nameParts.length - 1];
    if (nameParts.length > 2) {
      result.otherNames = nameParts.slice(1, -1).join(' ');
    }
    result.confidence += 0.20;
  } else {
    // Fallback: Extract name - look for lines with all caps that aren't header words
    for (const line of lines) {
      if (GHANA_CARD_PATTERNS.name.test(line) && line.length > 5) {
        // Check if this line contains mostly header/skip words
        const words = line.split(/\s+/);
        const isHeaderLine = words.every(word => SKIP_WORDS.includes(word.toUpperCase()));

        if (!isHeaderLine && words.length >= 2) {
          result.fullName = line;
          result.firstName = words[0];
          result.lastName = words[words.length - 1];
          if (words.length > 2) {
            result.otherNames = words.slice(1, -1).join(' ');
          }
          result.confidence += 0.20;
          break;
        }
      }
    }
  }

  // Look for gender
  const genderMatch = ocrText.match(/SEX[:\s]*(MALE|FEMALE|M|F)\b/i) || ocrText.match(/\b(MALE|FEMALE)\b/i);
  if (genderMatch) {
    const gender = (genderMatch[1] || genderMatch[0]).toUpperCase();
    result.gender = gender === 'M' ? 'MALE' : gender === 'F' ? 'FEMALE' : gender;
    result.confidence += 0.10;
  }

  // Look for nationality
  if (/NATIONALITY[:\s]*GHANAIAN/i.test(ocrText) || /GHANAIAN/i.test(ocrText)) {
    result.nationality = 'Ghanaian';
    result.confidence += 0.10;
  }

  // Look for place of issuance
  const placeMatch = ocrText.match(/PLACE[:\s]*(ACCRA|KUMASI|TAMALE|CAPE COAST|TAKORADI|TEMA)/i) ||
                     ocrText.match(/\b(ACCRA|KUMASI|TAMALE|CAPE COAST|TAKORADI|TEMA)\b/i);
  if (placeMatch) {
    const place = placeMatch[1] || placeMatch[0];
    result.placeOfIssuance = place.charAt(0).toUpperCase() + place.slice(1).toLowerCase();
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
  // For demo purposes, we'll use mock OCR data
  // In production, you would integrate with a real OCR service like:
  // - Google Cloud Vision API
  // - AWS Textract
  // - Azure Computer Vision
  // - On-device ML Kit (requires native module setup)

  console.log('Processing image for OCR:', imageUri);

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Return mock OCR text for demo
  return generateMockOCRText();
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
  const randomDay = Math.floor(1 + Math.random() * 28).toString().padStart(2, '0');
  const randomMonth = Math.floor(1 + Math.random() * 12).toString().padStart(2, '0');
  const randomYear = Math.floor(1970 + Math.random() * 35);
  const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';

  return `REPUBLIC OF GHANA
NATIONAL IDENTIFICATION AUTHORITY
GHANA CARD
SURNAME: ${randomName.split(' ').pop()}
FIRST NAME: ${randomName.split(' ')[0]}
OTHER NAMES: ${randomName.split(' ').slice(1, -1).join(' ') || ''}
FULL NAME: ${randomName}
PERSONAL ID NUMBER: ${randomCardNum}
DATE OF BIRTH: ${randomDay}/${randomMonth}/${randomYear}
SEX: ${gender}
NATIONALITY: GHANAIAN
PLACE OF ISSUANCE: ACCRA
DATE OF ISSUANCE: 01/01/2022
DATE OF EXPIRY: 31/12/2032`;
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
