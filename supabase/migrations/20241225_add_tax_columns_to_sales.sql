-- Adicionar colunas de taxas/impostos na tabela de vendas
ALTER TABLE personal_sales
ADD COLUMN tax_rate numeric DEFAULT 0,
ADD COLUMN tax_amount numeric DEFAULT 0;

-- Adicionar colunas de taxas/impostos na tabela de itens
ALTER TABLE personal_sale_items
ADD COLUMN tax_rate numeric DEFAULT 0,
ADD COLUMN tax_amount numeric DEFAULT 0,
ADD COLUMN net_value numeric DEFAULT 0;

-- Atualizar net_value dos itens existentes (igual ao total_price pois não havia imposto anteriormente)
UPDATE personal_sale_items SET net_value = total_price WHERE net_value = 0;

