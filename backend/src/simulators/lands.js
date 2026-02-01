const { delay } = require('../utils/helpers');

// Verify property ownership
const verifyOwnership = async (propertyAddress, ownerGhanaCard) => {
  await delay(1500);

  // For demo: 80% success rate
  if (Math.random() > 0.2) {
    return {
      success: true,
      data: {
        propertyAddress,
        ownerName: 'Verified Owner',
        ownerGhanaCard,
        titleType: 'FREEHOLD',
        registrationDate: '2020-01-15',
        verified: true,
        plotNumber: `PLT-${Math.floor(Math.random() * 999999)}`,
        registryNumber: `LR-${Math.floor(Math.random() * 9999)}-${new Date().getFullYear()}`
      }
    };
  }

  return {
    success: true,
    data: {
      propertyAddress,
      verified: false,
      message: 'Property not found in registry - manual verification required'
    }
  };
};

// Get property history
const getPropertyHistory = async (digitalAddress) => {
  await delay(1000);

  return {
    success: true,
    data: {
      digitalAddress,
      transactions: [
        {
          date: '2020-01-15',
          type: 'REGISTRATION',
          description: 'Initial property registration'
        },
        {
          date: '2018-06-10',
          type: 'TRANSFER',
          description: 'Ownership transfer completed'
        }
      ]
    }
  };
};

// Validate digital address
const validateDigitalAddress = async (digitalAddress) => {
  await delay(500);

  // Accept valid format
  if (digitalAddress.match(/^[A-Z]{2}-\d{3,4}-\d{4}$/)) {
    // Generate mock location data
    const regions = ['Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern'];
    const region = regions[Math.floor(Math.random() * regions.length)];

    return {
      success: true,
      data: {
        digitalAddress,
        valid: true,
        region,
        district: 'Metropolitan',
        postCode: digitalAddress.split('-')[0],
        streetAddress: 'Sample Street, Area Name',
        latitude: 5.55 + (Math.random() - 0.5) * 0.1,
        longitude: -0.20 + (Math.random() - 0.5) * 0.1
      }
    };
  }

  return {
    success: false,
    error: 'Invalid digital address format'
  };
};

module.exports = {
  verifyOwnership,
  getPropertyHistory,
  validateDigitalAddress
};
