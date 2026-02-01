const db = require('../config/database');
const { PROPERTY_TYPES } = require('../config/constants');

// Get market rent data
const getRentCheck = (req, res) => {
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
      WHERE region = ? AND district = ? AND property_type = ?
    `;
    const params = [region, district, propertyType];

    if (neighborhood) {
      query += ' AND neighborhood = ?';
      params.push(neighborhood);
    }

    if (bedrooms) {
      query += ' AND bedrooms = ?';
      params.push(parseInt(bedrooms));
    }

    query += ' ORDER BY period_year DESC, period_month DESC LIMIT 1';

    const marketData = db.prepare(query).get(...params);

    if (!marketData) {
      // If no pre-calculated data, generate from actual contracts
      const contractQuery = `
        SELECT
          AVG(c.monthly_rent) as average_rent,
          MIN(c.monthly_rent) as min_rent,
          MAX(c.monthly_rent) as max_rent,
          COUNT(*) as sample_size
        FROM contracts c
        JOIN properties p ON c.property_id = p.id
        WHERE p.region = ? AND p.district = ? AND p.property_type = ?
        AND c.status IN ('ACTIVE', 'EXPIRED')
      `;
      const contractParams = [region, district, propertyType];

      if (bedrooms) {
        contractQuery += ' AND p.bedrooms = ?';
        contractParams.push(parseInt(bedrooms));
      }

      const liveData = db.prepare(contractQuery).get(...contractParams);

      if (liveData && liveData.sample_size > 0) {
        return res.json({
          success: true,
          data: {
            region,
            district,
            neighborhood: neighborhood || 'All',
            propertyType,
            propertyTypeName: PROPERTY_TYPES[propertyType]?.name,
            bedrooms: bedrooms ? parseInt(bedrooms) : null,
            averageRent: Math.round(liveData.average_rent),
            medianRent: Math.round(liveData.average_rent), // Approximate
            minRent: liveData.min_rent,
            maxRent: liveData.max_rent,
            sampleSize: liveData.sample_size,
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
const getRentTrends = (req, res) => {
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
      WHERE region = ? AND district = ? AND property_type = ?
    `;
    const params = [region, district, propertyType];

    if (bedrooms) {
      query += ' AND bedrooms = ?';
      params.push(parseInt(bedrooms));
    }

    query += ' ORDER BY period_year DESC, period_month DESC LIMIT ?';
    params.push(parseInt(months));

    const trendData = db.prepare(query).all(...params);

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
          startValue: oldestRent,
          endValue: newestRent
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
const compareToMarket = (req, res) => {
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
      WHERE region = ? AND district = ? AND property_type = ?
    `;
    const params = [region, district, propertyType];

    if (bedrooms) {
      query += ' AND bedrooms = ?';
      params.push(parseInt(bedrooms));
    }

    query += ' ORDER BY period_year DESC, period_month DESC LIMIT 1';

    let marketData = db.prepare(query).get(...params);

    // If no aggregated data, calculate from contracts
    if (!marketData) {
      const contractStats = db.prepare(`
        SELECT
          AVG(c.monthly_rent) as average_rent,
          MIN(c.monthly_rent) as min_rent,
          MAX(c.monthly_rent) as max_rent,
          COUNT(*) as sample_size
        FROM contracts c
        JOIN properties p ON c.property_id = p.id
        WHERE p.region = ? AND p.district = ? AND p.property_type = ?
        AND c.status IN ('ACTIVE', 'EXPIRED')
        ${bedrooms ? 'AND p.bedrooms = ?' : ''}
      `).get(...params);

      if (contractStats && contractStats.sample_size > 0) {
        marketData = {
          average_rent: contractStats.average_rent,
          median_rent: contractStats.average_rent,
          min_rent: contractStats.min_rent,
          max_rent: contractStats.max_rent,
          percentile_10: contractStats.min_rent,
          percentile_90: contractStats.max_rent,
          sample_size: contractStats.sample_size
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
const getLocations = (req, res) => {
  try {
    // Get unique regions
    const regions = db.prepare(`
      SELECT DISTINCT region FROM properties ORDER BY region
    `).all();

    // Get districts per region
    const districts = db.prepare(`
      SELECT DISTINCT region, district FROM properties ORDER BY region, district
    `).all();

    // Group districts by region
    const locationData = {};
    regions.forEach(r => {
      locationData[r.region] = districts
        .filter(d => d.region === r.region)
        .map(d => d.district);
    });

    res.json({
      success: true,
      data: {
        regions: regions.map(r => r.region),
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

module.exports = {
  getRentCheck,
  getRentTrends,
  compareToMarket,
  getLocations
};
