-- Fix data consistency for Ghana Rental System
-- Run this SQL directly on your PostgreSQL database

-- Update contract dates to be current/realistic
-- Contract 1: Active, started 6 months ago
UPDATE contracts
SET start_date = CURRENT_DATE - INTERVAL '6 months',
    end_date = CURRENT_DATE + INTERVAL '18 months',
    landlord_signed_at = CURRENT_DATE - INTERVAL '6 months' - INTERVAL '10 days',
    tenant_confirmed_at = CURRENT_DATE - INTERVAL '6 months' - INTERVAL '9 days',
    updated_at = NOW()
WHERE contract_number = 'CTR-2024-0001';

-- Contract 2: Active, started 3 months ago
UPDATE contracts
SET start_date = CURRENT_DATE - INTERVAL '3 months',
    end_date = CURRENT_DATE + INTERVAL '9 months',
    landlord_signed_at = CURRENT_DATE - INTERVAL '3 months' - INTERVAL '10 days',
    tenant_confirmed_at = CURRENT_DATE - INTERVAL '3 months' - INTERVAL '9 days',
    updated_at = NOW()
WHERE contract_number = 'CTR-2024-0002';

-- Contract 3: Pending, starts next month
UPDATE contracts
SET start_date = CURRENT_DATE + INTERVAL '1 month',
    end_date = CURRENT_DATE + INTERVAL '13 months',
    landlord_signed_at = CURRENT_DATE - INTERVAL '5 days',
    updated_at = NOW()
WHERE contract_number = 'CTR-2024-0003';

-- Delete old payment data
DELETE FROM payments;

-- Insert new realistic payments for Contract 1 (6 months of payments)
INSERT INTO payments (payment_reference, contract_id, tenant_id, landlord_id, gross_amount, tax_amount, net_amount, platform_fee, period_start, period_end, payment_method, payment_provider, status, completed_at, settled_at, initiated_at)
SELECT
    'PAY-2026-' || LPAD(ROW_NUMBER() OVER (ORDER BY month_offset)::TEXT, 4, '0') || '-001',
    c.id,
    c.tenant_id,
    c.landlord_id,
    c.monthly_rent,
    c.monthly_rent * 0.08,
    c.monthly_rent - (c.monthly_rent * 0.08) - (c.monthly_rent * 0.01),
    c.monthly_rent * 0.01,
    c.start_date + (month_offset || ' months')::INTERVAL,
    c.start_date + ((month_offset + 1) || ' months')::INTERVAL - INTERVAL '1 day',
    'MOBILE_MONEY',
    CASE WHEN month_offset % 2 = 0 THEN 'MTN' ELSE 'VODAFONE' END,
    'COMPLETED',
    c.start_date + (month_offset || ' months')::INTERVAL + INTERVAL '3 days',
    c.start_date + (month_offset || ' months')::INTERVAL + INTERVAL '4 days',
    c.start_date + (month_offset || ' months')::INTERVAL + INTERVAL '3 days'
FROM contracts c
CROSS JOIN generate_series(0, 5) AS month_offset
WHERE c.contract_number = 'CTR-2024-0001'
  AND c.start_date + (month_offset || ' months')::INTERVAL < CURRENT_DATE;

-- Insert payments for Contract 2 (3 months of payments)
INSERT INTO payments (payment_reference, contract_id, tenant_id, landlord_id, gross_amount, tax_amount, net_amount, platform_fee, period_start, period_end, payment_method, payment_provider, status, completed_at, settled_at, initiated_at)
SELECT
    'PAY-2026-' || LPAD((ROW_NUMBER() OVER (ORDER BY month_offset) + 10)::TEXT, 4, '0') || '-002',
    c.id,
    c.tenant_id,
    c.landlord_id,
    c.monthly_rent,
    c.monthly_rent * 0.08,
    c.monthly_rent - (c.monthly_rent * 0.08) - (c.monthly_rent * 0.01),
    c.monthly_rent * 0.01,
    c.start_date + (month_offset || ' months')::INTERVAL,
    c.start_date + ((month_offset + 1) || ' months')::INTERVAL - INTERVAL '1 day',
    'MOBILE_MONEY',
    CASE WHEN month_offset % 2 = 0 THEN 'VODAFONE' ELSE 'MTN' END,
    'COMPLETED',
    c.start_date + (month_offset || ' months')::INTERVAL + INTERVAL '2 days',
    c.start_date + (month_offset || ' months')::INTERVAL + INTERVAL '3 days',
    c.start_date + (month_offset || ' months')::INTERVAL + INTERVAL '2 days'
FROM contracts c
CROSS JOIN generate_series(0, 2) AS month_offset
WHERE c.contract_number = 'CTR-2024-0002'
  AND c.start_date + (month_offset || ' months')::INTERVAL < CURRENT_DATE;

-- Update tax certificates to current year/month
UPDATE tax_certificates
SET period_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    period_month = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER - 1
WHERE period_year < EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

-- Update market rent data to current period
UPDATE market_rent_data
SET period_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    period_month = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    calculated_at = NOW();

-- Verify the changes
SELECT 'Contracts Updated' as status, contract_number, start_date, end_date, status FROM contracts;
SELECT 'Payments Count' as status, COUNT(*) as total FROM payments;
SELECT 'Payments' as status, payment_reference, period_start, period_end, status FROM payments ORDER BY period_start;
