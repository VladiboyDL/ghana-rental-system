/**
 * TaxService Unit Tests
 */

// Mock the database before importing the service
jest.mock('../../config/database', () => ({
  db: {
    query: jest.fn()
  }
}));

const TaxService = require('../../services/TaxService');

describe('TaxService', () => {
  describe('calculateWithholdingTax', () => {
    it('should calculate 8% withholding tax correctly', () => {
      const result = TaxService.calculateWithholdingTax(1000, 0.08);

      expect(result.grossAmount).toBe(1000);
      expect(result.taxRate).toBe(0.08);
      expect(result.taxAmount).toBe(80);
      expect(result.netAmount).toBe(920);
    });

    it('should handle zero amount', () => {
      const result = TaxService.calculateWithholdingTax(0, 0.08);

      expect(result.grossAmount).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.netAmount).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });

    it('should calculate 15% tax for unregistered individuals', () => {
      const result = TaxService.calculateWithholdingTax(1000, 0.15);

      expect(result.taxAmount).toBe(150);
      expect(result.netAmount).toBe(850);
    });

    it('should handle large amounts correctly', () => {
      const result = TaxService.calculateWithholdingTax(100000, 0.08);

      expect(result.taxAmount).toBe(8000);
      expect(result.netAmount).toBe(92000);
    });

    it('should round to 2 decimal places', () => {
      const result = TaxService.calculateWithholdingTax(333.33, 0.08);

      expect(result.taxAmount).toBe(26.67);
      expect(result.netAmount).toBe(306.66);
    });

    it('should throw error for negative amounts', () => {
      expect(() => {
        TaxService.calculateWithholdingTax(-100, 0.08);
      }).toThrow('Gross amount cannot be negative');
    });

    it('should use default tax rate if not provided', () => {
      const result = TaxService.calculateWithholdingTax(1000);

      expect(result.taxRate).toBe(0.08);
      expect(result.taxAmount).toBe(80);
    });
  });

  describe('calculateComplianceScore', () => {
    it('should give full score for TIN registered with all payments remitted', () => {
      const score = TaxService.calculateComplianceScore({
        hasTIN: true,
        totalPayments: 10,
        remittedPayments: 10
      });

      expect(score).toBe(100);
    });

    it('should give 40 points for TIN only', () => {
      const score = TaxService.calculateComplianceScore({
        hasTIN: true,
        totalPayments: 10,
        remittedPayments: 0
      });

      expect(score).toBe(40);
    });

    it('should give 60 points for no TIN but all payments remitted', () => {
      const score = TaxService.calculateComplianceScore({
        hasTIN: false,
        totalPayments: 10,
        remittedPayments: 10
      });

      expect(score).toBe(60);
    });

    it('should give partial score for partial remittance', () => {
      const score = TaxService.calculateComplianceScore({
        hasTIN: true,
        totalPayments: 10,
        remittedPayments: 5
      });

      expect(score).toBe(70); // 40 (TIN) + 30 (50% remitted)
    });

    it('should handle no payments gracefully', () => {
      const score = TaxService.calculateComplianceScore({
        hasTIN: true,
        totalPayments: 0,
        remittedPayments: 0
      });

      expect(score).toBe(100); // 40 (TIN) + 60 (no payments = compliant)
    });

    it('should cap score at 100', () => {
      const score = TaxService.calculateComplianceScore({
        hasTIN: true,
        totalPayments: 5,
        remittedPayments: 10 // More than total (edge case)
      });

      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
