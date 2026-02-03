-- Migration: Add RPC functions for clients and suppliers with stats
-- These functions were missing in production, causing server errors

-- Function to get personal clients with aggregated sales stats
CREATE OR REPLACE FUNCTION get_personal_clients_with_stats(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  name TEXT,
  cpf TEXT,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_sales BIGINT,
  total_gross NUMERIC,
  total_commission NUMERIC,
  last_sale_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.user_id,
    pc.name,
    pc.cpf,
    pc.cnpj,
    pc.phone,
    pc.email,
    pc.notes,
    pc.is_active,
    pc.created_at,
    pc.updated_at,
    COUNT(ps.id)::BIGINT as total_sales,
    COALESCE(SUM(ps.gross_value), 0) as total_gross,
    COALESCE(SUM(ps.commission_value), 0) as total_commission,
    MAX(ps.sale_date) as last_sale_date
  FROM personal_clients pc
  LEFT JOIN personal_sales ps ON ps.client_id = pc.id
  WHERE pc.user_id = p_user_id AND pc.is_active = true
  GROUP BY pc.id, pc.user_id, pc.name, pc.cpf, pc.cnpj, pc.phone, pc.email, pc.notes, pc.is_active, pc.created_at, pc.updated_at
  ORDER BY pc.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get personal suppliers with aggregated sales stats
CREATE OR REPLACE FUNCTION get_personal_suppliers_with_stats(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  name TEXT,
  cnpj TEXT,
  organization_id UUID,
  match_status TEXT,
  matched_at TIMESTAMPTZ,
  matched_by TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  commission_rule_id UUID,
  default_commission_rate NUMERIC,
  default_tax_rate NUMERIC,
  total_sales BIGINT,
  total_gross NUMERIC,
  total_commission NUMERIC,
  last_sale_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.id,
    ps.user_id,
    ps.name,
    ps.cnpj,
    ps.organization_id,
    ps.match_status,
    ps.matched_at,
    ps.matched_by,
    ps.is_active,
    ps.created_at,
    ps.updated_at,
    ps.commission_rule_id,
    ps.default_commission_rate,
    ps.default_tax_rate,
    COUNT(psa.id)::BIGINT as total_sales,
    COALESCE(SUM(psa.gross_value), 0) as total_gross,
    COALESCE(SUM(psa.commission_value), 0) as total_commission,
    MAX(psa.sale_date) as last_sale_date
  FROM personal_suppliers ps
  LEFT JOIN personal_sales psa ON psa.supplier_id = ps.id
  WHERE ps.user_id = p_user_id AND ps.is_active = true
  GROUP BY ps.id, ps.user_id, ps.name, ps.cnpj, ps.organization_id, ps.match_status, ps.matched_at, ps.matched_by, ps.is_active, ps.created_at, ps.updated_at, ps.commission_rule_id, ps.default_commission_rate, ps.default_tax_rate
  ORDER BY ps.name;
END;
$$ LANGUAGE plpgsql STABLE;
