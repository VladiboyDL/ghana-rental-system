const { delay } = require('../utils/helpers');

// Mock Ghana Card data
const MOCK_GHANA_CARDS = {
  'GHA-000000001-1': {
    number: 'GHA-000000001-1',
    firstName: 'Kwame',
    lastName: 'Asante',
    otherNames: '',
    dateOfBirth: '1980-05-15',
    gender: 'M',
    photo: '/mock/photos/kwame.jpg',
    address: 'GA-123-4567',
    status: 'VALID'
  },
  'GHA-000000002-2': {
    number: 'GHA-000000002-2',
    firstName: 'Ama',
    lastName: 'Mensah',
    otherNames: 'Adjoa',
    dateOfBirth: '1992-08-22',
    gender: 'F',
    photo: '/mock/photos/ama.jpg',
    address: 'GA-456-7890',
    status: 'VALID'
  },
  'GHA-000000003-3': {
    number: 'GHA-000000003-3',
    firstName: 'Kofi',
    lastName: 'Mensah',
    otherNames: '',
    dateOfBirth: '1985-03-10',
    gender: 'M',
    photo: '/mock/photos/kofi.jpg',
    address: 'GA-789-1234',
    status: 'VALID'
  },
  'GHA-000000004-4': {
    number: 'GHA-000000004-4',
    firstName: 'Akua',
    lastName: 'Owusu',
    otherNames: '',
    dateOfBirth: '1990-12-05',
    gender: 'F',
    photo: '/mock/photos/akua.jpg',
    address: 'GA-321-6543',
    status: 'VALID'
  }
};

// Generate mock data for any valid Ghana Card format
const generateMockCard = (cardNumber) => {
  const names = [
    { first: 'Kweku', last: 'Agyemang' },
    { first: 'Efua', last: 'Boateng' },
    { first: 'Yaw', last: 'Osei' },
    { first: 'Abena', last: 'Darko' }
  ];
  const name = names[Math.floor(Math.random() * names.length)];
  const genders = ['M', 'F'];
  const gender = genders[Math.floor(Math.random() * 2)];

  return {
    number: cardNumber,
    firstName: name.first,
    lastName: name.last,
    otherNames: '',
    dateOfBirth: `19${70 + Math.floor(Math.random() * 30)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    gender,
    photo: '/mock/photos/default.jpg',
    address: `GA-${Math.floor(Math.random() * 999)}-${Math.floor(Math.random() * 9999)}`,
    status: 'VALID'
  };
};

// Verify Ghana Card
const verifyGhanaCard = async (cardNumber) => {
  // Simulate network delay
  await delay(1000);

  // Check mock data first
  const card = MOCK_GHANA_CARDS[cardNumber];

  if (card) {
    return {
      success: true,
      data: card
    };
  }

  // For demo: Accept any valid format
  if (cardNumber.match(/^GHA-\d{9}-\d$/)) {
    return {
      success: true,
      data: generateMockCard(cardNumber)
    };
  }

  return {
    success: false,
    error: 'Invalid Ghana Card number'
  };
};

module.exports = {
  verifyGhanaCard,
  MOCK_GHANA_CARDS
};
