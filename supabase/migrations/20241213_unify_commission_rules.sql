-- Migration: Unificar motor de regras de comissão (empresa + vendedor)
-- Data: 2024-12-13
-- Descrição: 
--   1. Adiciona personal_supplier_id à commission_rules
--   2. Cria constraint XOR: organization_id OU personal_supplier_id (nunca ambos)
--   3. Remove coluna commission_rules (JSONB) de personal_suppliers
--   4. Adiciona commission_rule_id FK em personal_suppliers

-- =====================================================
-- PASSO 1: Alterar tabela commission_rules
-- =====================================================

-- Adicionar coluna para vincular a fornecedor pessoal
ALTER TABLE commission_rules 
ADD COLUMN personal_supplier_id UUID REFERENCES personal_suppliers(id) ON DELETE CASCADE;

-- Tornar organization_id nullable (antes era obrigatório)
ALTER TABLE commission_rules 
ALTER COLUMN organization_id DROP NOT NULL;

-- Criar constraint XOR: apenas um dos dois pode ser preenchido
ALTER TABLE commission_rules
ADD CONSTRAINT commission_rules_owner_xor 
CHECK (
  (organization_id IS NOT NULL AND personal_supplier_id IS NULL) OR
  (organization_id IS NULL AND personal_supplier_id IS NOT NULL)
);

-- Índice para busca por fornecedor pessoal
CREATE INDEX idx_commission_rules_personal_supplier 
ON commission_rules(personal_supplier_id) 
WHERE personal_supplier_id IS NOT NULL;

-- =====================================================
-- PASSO 2: Alterar tabela personal_suppliers
-- =====================================================

-- Adicionar FK para regra de comissão
ALTER TABLE personal_suppliers
ADD COLUMN commission_rule_id UUID REFERENCES commission_rules(id) ON DELETE SET NULL;

-- Migrar dados existentes: criar regras a partir do JSONB
-- (executar apenas se houver dados para migrar)
DO $$
DECLARE
  supplier RECORD;
  new_rule_id UUID;
  rules JSONB;
  rule_type TEXT;
  default_rate NUMERIC;
BEGIN
  FOR supplier IN 
    SELECT id, user_id, name, commission_rules 
    FROM personal_suppliers 
    WHERE commission_rules IS NOT NULL
  LOOP
    rules := supplier.commission_rules;
    rule_type := COALESCE(rules->>'type', 'fixed');
    default_rate := COALESCE((rules->>'default_rate')::NUMERIC, (rules->>'net_rate')::NUMERIC);
    
    -- Criar regra na tabela commission_rules
    INSERT INTO commission_rules (
      id,
      personal_supplier_id,
      name,
      type,
      percentage,
      tiers,
      is_default,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      supplier.id,
      supplier.name || ' - Regra',
      CASE WHEN rule_type = 'tiered' THEN 'tiered' ELSE 'fixed' END,
      default_rate,
      CASE WHEN rule_type = 'tiered' THEN rules->'tiers' ELSE NULL END,
      false,
      true,
      NOW(),
      NOW()
    )
    RETURNING id INTO new_rule_id;
    
    -- Vincular fornecedor à nova regra
    UPDATE personal_suppliers 
    SET commission_rule_id = new_rule_id 
    WHERE id = supplier.id;
  END LOOP;
END $$;

-- Remover coluna JSONB antiga (após migração de dados)
ALTER TABLE personal_suppliers
DROP COLUMN IF EXISTS commission_rules;

-- =====================================================
-- PASSO 3: Atualizar RLS policies
-- =====================================================

-- Policy para vendedor acessar apenas suas próprias regras
CREATE POLICY "Users can manage their personal supplier rules"
ON commission_rules
FOR ALL
USING (
  -- Regra pertence a organização do usuário
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
  OR
  -- Regra pertence a fornecedor pessoal do usuário
  personal_supplier_id IN (
    SELECT id FROM personal_suppliers WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- ROLLBACK (se necessário)
-- =====================================================
-- ALTER TABLE personal_suppliers ADD COLUMN commission_rules JSONB;
-- ALTER TABLE personal_suppliers DROP COLUMN commission_rule_id;
-- ALTER TABLE commission_rules DROP CONSTRAINT commission_rules_owner_xor;
-- ALTER TABLE commission_rules ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE commission_rules DROP COLUMN personal_supplier_id;
-- DROP POLICY "Users can manage their personal supplier rules" ON commission_rules;

