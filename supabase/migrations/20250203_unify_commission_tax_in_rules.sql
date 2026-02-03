-- Migration: Unificar comissão e taxa em uma única regra
-- Data: 2025-02-03
-- Descrição:
--   Uma regra define AMBOS os percentuais (comissão e taxa) simultaneamente.
--   Remove a coluna target e adiciona colunas separadas para cada tipo.

-- =====================================================
-- PASSO 1: Adicionar novas colunas
-- =====================================================

-- Renomear percentage para commission_percentage
ALTER TABLE commission_rules
RENAME COLUMN percentage TO commission_percentage;

-- Adicionar coluna para taxa
ALTER TABLE commission_rules
ADD COLUMN tax_percentage NUMERIC(5,2) DEFAULT 0;

-- Para regras tiered, renomear tiers para commission_tiers
ALTER TABLE commission_rules
RENAME COLUMN tiers TO commission_tiers;

-- Adicionar coluna para faixas de taxa (opcional, pode usar mesmo % de comissão)
ALTER TABLE commission_rules
ADD COLUMN tax_tiers JSONB DEFAULT NULL;

-- =====================================================
-- PASSO 2: Migrar dados existentes
-- =====================================================

-- Regras de taxa: mover percentage para tax_percentage
UPDATE commission_rules
SET
  tax_percentage = commission_percentage,
  tax_tiers = commission_tiers,
  commission_percentage = 0,
  commission_tiers = NULL
WHERE target = 'tax';

-- =====================================================
-- PASSO 3: Remover coluna target
-- =====================================================

ALTER TABLE commission_rules
DROP COLUMN IF EXISTS target;

-- =====================================================
-- ROLLBACK (se necessário)
-- =====================================================
-- ALTER TABLE commission_rules ADD COLUMN target TEXT DEFAULT 'commission';
-- UPDATE commission_rules SET target = 'tax' WHERE tax_percentage > 0 AND commission_percentage = 0;
-- ALTER TABLE commission_rules RENAME COLUMN commission_percentage TO percentage;
-- ALTER TABLE commission_rules RENAME COLUMN commission_tiers TO tiers;
-- ALTER TABLE commission_rules DROP COLUMN tax_percentage;
-- ALTER TABLE commission_rules DROP COLUMN tax_tiers;
