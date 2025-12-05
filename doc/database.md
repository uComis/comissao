# Modelo de Dados (Fase 1)

## Diagrama

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE AUTH                                  │
│                              (já existe)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  auth.users                                                                 │
│  ├── id (uuid, PK)                                                          │
│  ├── email                                                                  │
│  └── ...metadata                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 1:1
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  organizations                                                              │
│  ├── id (uuid, PK)                                                          │
│  ├── owner_id (uuid, FK → auth.users)                                       │
│  ├── name (text)                                                            │
│  ├── tax_deduction_rate (decimal) ← "taxa mágica"                           │
│  ├── created_at (timestamp)                                                 │
│  └── updated_at (timestamp)                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
           │                                    │
           │ 1:N                                │ 1:N
           ▼                                    ▼
┌──────────────────────────────┐    ┌──────────────────────────────────────────┐
│  sellers                     │    │  commission_rules                        │
│  ├── id (uuid, PK)           │    │  ├── id (uuid, PK)                       │
│  ├── organization_id (FK)    │    │  ├── organization_id (FK)                │
│  ├── name (text)             │    │  ├── name (text)                         │
│  ├── email (text)            │    │  ├── type (enum: fixed, tiered)          │
│  ├── is_active (boolean)     │    │  ├── percentage (decimal) ← se fixed     │
│  ├── created_at              │    │  ├── tiers (jsonb) ← se tiered           │
│  └── updated_at              │    │  ├── created_at                          │
└──────────────────────────────┘    │  └── updated_at                          │
           │                        └──────────────────────────────────────────┘
           │ 1:N                                │
           ▼                                    │
┌──────────────────────────────────────────────────────────────────────────────┐
│  sales                                                                       │
│  ├── id (uuid, PK)                                                           │
│  ├── organization_id (FK)                                                    │
│  ├── seller_id (FK → sellers)                                                │
│  ├── external_id (text) ← ID do Pipedrive/CRM                                │
│  ├── client_name (text)                                                      │
│  ├── gross_value (decimal) ← valor bruto                                     │
│  ├── net_value (decimal) ← valor após taxa mágica                            │
│  ├── sale_date (date)                                                        │
│  ├── created_at                                                              │
│  └── updated_at                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
           │
           │ 1:1
           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  commissions                                                                 │
│  ├── id (uuid, PK)                                                           │
│  ├── organization_id (FK)                                                    │
│  ├── seller_id (FK → sellers)                                                │
│  ├── sale_id (FK → sales)                                                    │
│  ├── rule_id (FK → commission_rules)                                         │
│  ├── base_value (decimal) ← valor usado no cálculo                           │
│  ├── percentage_applied (decimal) ← % que foi aplicado                       │
│  ├── amount (decimal) ← valor final da comissão                              │
│  ├── period (text) ← "2025-01" (ano-mês)                                     │
│  ├── created_at                                                              │
│  └── updated_at                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Relacionamentos

```
auth.users 1 ──── 1 organizations
organizations 1 ──── N sellers
organizations 1 ──── N commission_rules
organizations 1 ──── N sales
sellers 1 ──── N sales
sales 1 ──── 1 commissions
commission_rules 1 ──── N commissions
```

## Observações

- **Multi-tenant:** Todas as tabelas filtradas por `organization_id`
- **sellers ≠ users (Fase 1):** Vendedores são apenas cadastro, sem login
- **Taxa mágica:** `organizations.tax_deduction_rate` deduz % estimado de impostos do valor bruto
- **Tiers (faixas):** Armazenado como JSONB, ex: `[{"min": 0, "max": 10000, "pct": 5}, {"min": 10001, "max": null, "pct": 7}]`
