const { db } = require('../config/database');
const { PROPERTY_TYPES } = require('../config/constants');

// Get market rent data
const getRentCheck = async (req, res) => {
  try {
    const { region, district, neighborhood, propertyType, bedrooms } = req.query;

    if (!region || !district || !propertyType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields: region, district, propertyType'
        }
      });
    }

    // Get latest market data
    let query = `
      SELECT * FROM market_rent_data
      WHERE region = $1 AND district = $2 AND property_type = $3
    `;
    const params = [region, district, propertyType];
    let paramIndex = 4;

    if (neighborhood) {
      query += ` AND neighborhood = $${paramIndex++}`;
      params.push(neighborhood);
    }

    if (bedrooms) {
      query += ` AND bedrooms = $${paramIndex++}`;
      params.push(parseInt(bedrooms));
    }

    query += ' ORDER BY period_year DESC, period_month DESC LIMIT 1';

    const result = await db.query(query, params);
    const marketData = result.rows[0];

    if (!marketData) {
      // If no pre-calculated data, generate from actual contracts
      let contractQuery = `
        SELECT
          AVG(c.monthly_rent) as average_rent,
          MIN(c.monthly_rent) as min_rent,
          MAX(c.monthly_rent) as max_rent,
          COUNT(*) as sample_size
        FROM contracts c
        JOIN properties p ON c.property_id = p.id
        WHERE p.region = $1 AND p.district = $2 AND p.property_type = $3
        AND c.status IN ('ACTIVE', 'EXPIRED')
      `;
      const contractParams = [region, district, propertyType];

      if (bedrooms) {
        contractQuery += ' AND p.bedrooms = $4';
        contractParams.push(parseInt(bedrooms));
      }

      const liveResult = await db.query(contractQuery, contractParams);
      const liveData = liveResult.rows[0];

      if (liveData && parseInt(liveData.sample_size) > 0) {
        return res.json({
          success: true,
          data: {
            region,
            district,
            neighborhood: neighborhood || 'All',
            propertyType,
            propertyTypeName: PROPERTY_TYPES[propertyType]?.name,
            bedrooms: bedrooms ? parseInt(bedrooms) : null,
            averageRent: Math.round(parseFloat(liveData.average_rent)),
            medianRent: Math.round(parseFloat(liveData.average_rent)), // Approximate
            minRent: parseFloat(liveData.min_rent),
            maxRent: parseFloat(liveData.max_rent),
            sampleSize: parseInt(liveData.sample_size),
            dataSource: 'live',
            lastUpdated: new Date().toISOString()
          }
        });
      }

      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No market data available for this location and property type'
        }
      });
    }

    res.json({
      success: true,
      data: {
        region: marketData.region,
        district: marketData.district,
        neighborhood: marketData.neighborhood || 'All',
        propertyType: marketData.property_type,
        propertyTypeName: PROPERTY_TYPES[marketData.property_type]?.name,
        bedrooms: marketData.bedrooms,
        averageRent: marketData.average_rent,
        medianRent: marketData.median_rent,
        minRent: marketData.min_rent,
        maxRent: marketData.max_rent,
        percentile10: marketData.percentile_10,
        percentile90: marketData.percentile_90,
        sampleSize: marketData.sample_size,
        periodYear: marketData.period_year,
        periodMonth: marketData.period_month,
        dataSource: 'aggregated',
        lastUpdated: marketData.calculated_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Get rent trends
const getRentTrends = async (req, res) => {
  try {
    const { region, district, propertyType, bedrooms, months = 12 } = req.query;

    if (!region || !district || !propertyType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields: region, district, propertyType'
        }
      });
    }

    let query = `
      SELECT * FROM market_rent_data
      WHERE region = $1 AND district = $2 AND property_type = $3
    `;
    const params = [region, district, propertyType];
    let paramIndex = 4;

    if (bedrooms) {
      query += ` AND bedrooms = $${paramIndex++}`;
      params.push(parseInt(bedrooms));
    }

    query += ` ORDER BY period_year DESC, period_month DESC LIMIT $${paramIndex}`;
    params.push(parseInt(months));

    const result = await db.query(query, params);
    const trendData = result.rows;

    if (trendData.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No trend data available'
        }
      });
    }

    // Calculate trend
    const oldestRent = trendData[trendData.length - 1]?.average_rent || 0;
    const newestRent = trendData[0]?.average_rent || 0;
    const percentChange = oldestRent > 0 ? ((newestRent - oldestRent) / oldestRent) * 100 : 0;

    res.json({
      success: true,
      data: {
        region,
        district,
        propertyType,
        propertyTypeName: PROPERTY_TYPES[propertyType]?.name,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        trend: {
          direction: percentChange > 0 ? 'UP' : percentChange < 0 ? 'DOWN' : 'STABLE',
          percentChange: Math.round(percentChange * 100) / 100,
          startValue: parseFloat(oldestRent),
          endValue: parseFloat(newestRent)
        },
        dataPoints: trendData.reverse().map(d => ({
          year: d.period_year,
          month: d.period_month,
          averageRent: d.average_rent,
          medianRent: d.median_rent,
          sampleSize: d.sample_size
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Compare rent to market
const compareToMarket = async (req, res) => {
  try {
    const { region, district, neighborhood, propertyType, bedrooms, rentAmount } = req.body;

    if (!region || !district || !propertyType || !rentAmount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields: region, district, propertyType, rentAmount'
        }
      });
    }

    // Get market data
    let query = `
      SELECT * FROM market_rent_data
      WHERE region = $1 AND district = $2 AND property_type = $3
    `;
    const params = [region, district, propertyType];
    let paramIndex = 4;

    if (bedrooms) {
      query += ` AND bedrooms = $${paramIndex++}`;
      params.push(parseInt(bedrooms));
    }

    query += ' ORDER BY period_year DESC, period_month DESC LIMIT 1';

    const result = await db.query(query, params);
    let marketData = result.rows[0];

    // If no aggregated data, calculate from contracts
    if (!marketData) {
      const contractQuery = `
        SELECT
          AVG(c.monthly_rent) as average_rent,
          MIN(c.monthly_rent) as min_rent,
          MAX(c.monthly_rent) as max_rent,
          COUNT(*) as sample_size
        FROM contracts c
        JOIN properties p ON c.property_id = p.id
        WHERE p.region = $1 AND p.district = $2 AND p.property_type = $3
        AND c.status IN ('ACTIVE', 'EXPIRED')
        ${bedrooms ? 'AND p.bedrooms = $4' : ''}
      `;

      const contractResult = await db.query(contractQuery, params);
      const contractStats = contractResult.rows[0];

      if (contractStats && parseInt(contractStats.sample_size) > 0) {
        marketData = {
          average_rent: parseFloat(contractStats.average_rent),
          median_rent: parseFloat(contractStats.average_rent),
          min_rent: parseFloat(contractStats.min_rent),
          max_rent: parseFloat(contractStats.max_rent),
          percentile_10: parseFloat(contractStats.min_rent),
          percentile_90: parseFloat(contractStats.max_rent),
          sample_size: parseInt(contractStats.sample_size)
        };
      }
    }

    if (!marketData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No market data available for comparison'
        }
      });
    }

    // Calculate comparison
    const percentOfAverage = (rentAmount / marketData.average_rent) * 100;
    const percentOfMedian = (rentAmount / marketData.median_rent) * 100;

    let priceRating;
    if (percentOfMedian < 80) {
      priceRating = 'BELOW_MARKET';
    } else if (percentOfMedian <= 120) {
      priceRating = 'FAIR';
    } else if (percentOfMedian <= 150) {
      priceRating = 'ABOVE_MARKET';
    } else {
      priceRating = 'SIGNIFICANTLY_ABOVE_MARKET';
    }

    res.json({
      success: true,
      data: {
        rentAmount,
        marketData: {
          averageRent: Math.round(marketData.average_rent),
          medianRent: Math.round(marketData.median_rent),
          minRent: marketData.min_rent,
          maxRent: marketData.max_rent,
          percentile10: marketData.percentile_10,
          percentile90: marketData.percentile_90,
          sampleSize: marketData.sample_size
        },
        comparison: {
          percentOfAverage: Math.round(percentOfAverage * 10) / 10,
          percentOfMedian: Math.round(percentOfMedian * 10) / 10,
          differenceFromAverage: Math.round(rentAmount - marketData.average_rent),
          differenceFromMedian: Math.round(rentAmount - marketData.median_rent),
          priceRating,
          priceRatingDescription: {
            'BELOW_MARKET': 'This rent is below typical market rates',
            'FAIR': 'This rent is within typical market range',
            'ABOVE_MARKET': 'This rent is above typical market rates',
            'SIGNIFICANTLY_ABOVE_MARKET': 'This rent is significantly above market rates'
          }[priceRating]
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Get available regions/districts (for dropdowns)
const getLocations = async (req, res) => {
  try {
    // Get unique regions
    const regionsResult = await db.query(`
      SELECT DISTINCT region FROM properties ORDER BY region
    `);

    // Get districts per region
    const districtsResult = await db.query(`
      SELECT DISTINCT region, district FROM properties ORDER BY region, district
    `);

    // Group districts by region
    const locationData = {};
    regionsResult.rows.forEach(r => {
      locationData[r.region] = districtsResult.rows
        .filter(d => d.region === r.region)
        .map(d => d.district);
    });

    res.json({
      success: true,
      data: {
        regions: regionsResult.rows.map(r => r.region),
        districtsByRegion: locationData,
        propertyTypes: Object.entries(PROPERTY_TYPES).map(([code, info]) => ({
          code,
          name: info.name,
          category: info.category
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Get all regions
const getRegions = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT region FROM properties ORDER BY region
    `);

    res.json({
      success: true,
      data: result.rows.map(r => r.region)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get districts by region
const getDistricts = async (req, res) => {
  try {
    const { region } = req.query;

    let query = 'SELECT DISTINCT district FROM properties';
    const params = [];

    if (region) {
      query += ' WHERE region = $1';
      params.push(region);
    }

    query += ' ORDER BY district';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(r => r.district)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get neighborhoods by district
const getNeighborhoods = async (req, res) => {
  try {
    const { region, district } = req.query;

    let query = 'SELECT DISTINCT neighborhood FROM properties WHERE neighborhood IS NOT NULL';
    const params = [];
    let paramIndex = 1;

    if (region) {
      query += ` AND region = $${paramIndex++}`;
      params.push(region);
    }

    if (district) {
      query += ` AND district = $${paramIndex++}`;
      params.push(district);
    }

    query += ' ORDER BY neighborhood';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(r => r.neighborhood).filter(Boolean)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get property types
const getPropertyTypes = async (req, res) => {
  try {
    res.json({
      success: true,
      data: Object.entries(PROPERTY_TYPES).map(([code, info]) => ({
        code,
        name: info.name,
        category: info.category
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get rent data (for GRA)
const getRentData = async (req, res) => {
  try {
    const { region, district, propertyType, page = 1, limit = 20 } = req.query;

    let query = 'SELECT * FROM market_rent_data WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (region) {
      query += ` AND region = $${paramIndex++}`;
      params.push(region);
    }

    if (district) {
      query += ` AND district = $${paramIndex++}`;
      params.push(district);
    }

    if (propertyType) {
      query += ` AND property_type = $${paramIndex++}`;
      params.push(propertyType);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY period_year DESC, period_month DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(r => ({
        id: r.id,
        region: r.region,
        district: r.district,
        neighborhood: r.neighborhood,
        propertyType: r.property_type,
        propertyTypeName: PROPERTY_TYPES[r.property_type]?.name,
        bedrooms: r.bedrooms,
        averageRent: r.average_rent,
        medianRent: r.median_rent,
        minRent: r.min_rent,
        maxRent: r.max_rent,
        sampleSize: r.sample_size,
        periodYear: r.period_year,
        periodMonth: r.period_month,
        calculatedAt: r.calculated_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

module.exports = {
  getRentCheck,
  getRentTrends,
  compareToMarket,
  getLocations,
  getRegions,
  getDistricts,
  getNeighborhoods,
  getPropertyTypes,
  getRentData
};
