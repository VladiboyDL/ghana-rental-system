/**
 * Tax Service - Business logic for tax calculations and reporting
 * Ghana 8% Withholding Tax on Rental Income
 */

const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { TAX_RATES } = require('../config/constants');
const logger = require('../utils/logger');

class TaxService {
  /**
   * Calculate withholding tax for a payment
   * Standard rate: 8% for registered individuals and corporates
   * Higher rate: 15% for unregistered individuals
   */
  static calculateWithholdingTax(grossAmount, taxRate = TAX_RATES.INDIVIDUAL_REGISTERED) {
    if (grossAmount < 0) {
      throw new ValidationError('Gross amount cannot be negative');
    }

    const rate = parseFloat(taxRate);
    const taxAmount = Math.round(grossAmount * rate * 100) / 100;
    const netAmount = Math.round((grossAmount - taxAmount) * 100) / 100;

    return {
      grossAmount: parseFloat(grossAmount),
      taxRate: rate,
      taxAmount,
      netAmount,
      effectiveRate: grossAmount > 0 ? (taxAmount / grossAmount) : 0
    };
  }

  /**
   * Record tax withholding for a payment
   */
  static async recordWithholding(paymentId, landlordId, taxData) {
    const { grossAmount, taxAmount, taxRate } = taxData;

    const withholdingId = generateId();
    const taxYear = new Date().getFullYear();
    const taxMonth = new Date().getMonth() + 1;

    await db.query(`
      INSERT INTO tax_withholdings (
        id, payment_id, landlord_id, gross_amount, tax_amount,
        tax_rate, tax_year, tax_month, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
    `, [withholdingId, paymentId, landlordId, grossAmount, taxAmount, taxRate, taxYear, taxMonth]);

    logger.info('Tax withholding recorded', { withholdingId, paymentId, taxAmount });

    return {
      id: withholdingId,
      taxYear,
      taxMonth,
      status: 'PENDING'
    };
  }

  /**
   * Get tax summary for a landlord for a specific year
   */
  static async getLandlordTaxSummary(landlordId, year = new Date().getFullYear()) {
    const result = await db.query(`
      SELECT
        tax_year,
        tax_month,
        SUM(gross_amount) as total_gross,
        SUM(tax_amount) as total_tax,
        COUNT(*) as transaction_count,
        status
      FROM tax_withholdings
      WHERE landlord_id = $1 AND tax_year = $2
      GROUP BY tax_year, tax_month, status
      ORDER BY tax_month
    `, [landlordId, year]);

    const monthlyBreakdown = result.rows.map(row => ({
      month: row.tax_month,
      grossAmount: parseFloat(row.total_gross),
      taxAmount: parseFloat(row.total_tax),
      transactionCount: parseInt(row.transaction_count),
      status: row.status
    }));

    const totals = monthlyBreakdown.reduce((acc, month) => ({
      totalGross: acc.totalGross + month.grossAmount,
      totalTax: acc.totalTax + month.taxAmount,
      totalTransactions: acc.totalTransactions + month.transactionCount
    }), { totalGross: 0, totalTax: 0, totalTransactions: 0 });

    return {
      landlordId,
      year,
      ...totals,
      monthlyBreakdown
    };
  }

  /**
   * Get quarterly tax report for GRA submission
   */
  static async getQuarterlyReport(year, quarter) {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = quarter * 3;

    const result = await db.query(`
      SELECT
        tw.landlord_id,
        u.first_name, u.last_name, u.company_name, u.tin_number, u.is_corporate,
        SUM(tw.gross_amount) as total_gross,
        SUM(tw.tax_amount) as total_tax,
        COUNT(*) as transaction_count
      FROM tax_withholdings tw
      JOIN users u ON tw.landlord_id = u.id
      WHERE tw.tax_year = $1 AND tw.tax_month >= $2 AND tw.tax_month <= $3
      GROUP BY tw.landlord_id, u.first_name, u.last_name, u.company_name, u.tin_number, u.is_corporate
      ORDER BY total_tax DESC
    `, [year, startMonth, endMonth]);

    const landlords = result.rows.map(row => ({
      landlordId: row.landlord_id,
      name: row.is_corporate ? row.company_name : `${row.first_name} ${row.last_name}`,
      tinNumber: row.tin_number,
      isCorporate: row.is_corporate,
      grossIncome: parseFloat(row.total_gross),
      taxWithheld: parseFloat(row.total_tax),
      transactionCount: parseInt(row.transaction_count)
    }));

    const totals = landlords.reduce((acc, l) => ({
      totalGross: acc.totalGross + l.grossIncome,
      totalTax: acc.totalTax + l.taxWithheld,
      totalTransactions: acc.totalTransactions + l.transactionCount
    }), { totalGross: 0, totalTax: 0, totalTransactions: 0 });

    return {
      year,
      quarter,
      period: `Q${quarter} ${year}`,
      generatedAt: new Date().toISOString(),
      landlordCount: landlords.length,
      ...totals,
      landlords
    };
  }

  /**
   * Generate tax certificate for landlord
   */
  static async generateTaxCertificate(landlordId, year) {
    const summary = await this.getLandlordTaxSummary(landlordId, year);

    // Get landlord details
    const landlordResult = await db.query('SELECT * FROM users WHERE id = $1', [landlordId]);
    if (landlordResult.rows.length === 0) {
      throw new NotFoundError('Landlord not found', 'User', landlordId);
    }

    const landlord = landlordResult.rows[0];
    const certificateNumber = `TWC-${year}-${landlordId.substring(0, 8).toUpperCase()}`;

    return {
      certificateNumber,
      year,
      issuedDate: new Date().toISOString(),
      landlord: {
        id: landlordId,
        name: landlord.is_corporate ? landlord.company_name : `${landlord.first_name} ${landlord.last_name}`,
        tinNumber: landlord.tin_number,
        ghanaCardNumber: landlord.ghana_card_number,
        address: `${landlord.street_address || ''}, ${landlord.city || ''}, ${landlord.region || ''}`.trim()
      },
      totalGrossIncome: summary.totalGross,
      totalTaxWithheld: summary.totalTax,
      transactionCount: summary.totalTransactions,
      monthlyBreakdown: summary.monthlyBreakdown,
      certification: `This certifies that the above-named landlord has had Withholding Tax deducted at source on rental income for the year ${year} in accordance with the Income Tax Act, 2015 (Act 896).`
    };
  }

  /**
   * Verify tax compliance for a landlord
   */
  static async verifyCompliance(landlordId) {
    const currentYear = new Date().getFullYear();

    // Get landlord info
    const landlordResult = await db.query('SELECT * FROM users WHERE id = $1', [landlordId]);
    if (landlordResult.rows.length === 0) {
      throw new NotFoundError('Landlord not found', 'User', landlordId);
    }

    const landlord = landlordResult.rows[0];

    // Check TIN registration
    const hasTIN = !!landlord.tin_number;

    // Get payment history
    const paymentResult = await db.query(`
      SELECT COUNT(*) as total_payments,
        SUM(CASE WHEN tw.status = 'REMITTED' THEN 1 ELSE 0 END) as remitted_count
      FROM payments p
      LEFT JOIN tax_withholdings tw ON p.id = tw.payment_id
      WHERE p.landlord_id = $1 AND EXTRACT(YEAR FROM p.created_at) = $2
    `, [landlordId, currentYear]);

    const payments = paymentResult.rows[0];

    const complianceScore = this.calculateComplianceScore({
      hasTIN,
      totalPayments: parseInt(payments.total_payments) || 0,
      remittedPayments: parseInt(payments.remitted_count) || 0
    });

    return {
      landlordId,
      hasTIN,
      tinNumber: landlord.tin_number,
      complianceScore,
      totalPayments: parseInt(payments.total_payments) || 0,
      remittedPayments: parseInt(payments.remitted_count) || 0,
      status: complianceScore >= 80 ? 'COMPLIANT' : complianceScore >= 50 ? 'PARTIAL' : 'NON_COMPLIANT'
    };
  }

  /**
   * Calculate compliance score
   */
  static calculateComplianceScore({ hasTIN, totalPayments, remittedPayments }) {
    let score = 0;

    // TIN registration: 40 points
    if (hasTIN) score += 40;

    // Payment remittance: 60 points
    if (totalPayments > 0) {
      score += Math.round((remittedPayments / totalPayments) * 60);
    } else {
      score += 60; // No payments = compliant
    }

    return Math.min(score, 100);
  }
}

module.exports = TaxService;
