-- 1. Tabela de Planos
CREATE TABLE public.plans
(
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plan_group TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),

    -- Limites
    max_suppliers INTEGER DEFAULT 1,
    max_sales_month INTEGER DEFAULT 30,
    max_users INTEGER DEFAULT 1,
    max_revenue_month DECIMAL(12,2),

    -- Flags/Features extras
    features JSONB DEFAULT '{}'
    ::jsonb,
    
    is_public BOOLEAN DEFAULT true,
    asaas_plan_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now
    ()
);

    -- 2. Tabela de Assinaturas
    CREATE TABLE public.subscriptions
    (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        plan_id TEXT NOT NULL REFERENCES public.plans(id),

        status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),

        -- Snapshot para Grandfathering
        plan_snapshot JSONB NOT NULL,

        trial_ends_at TIMESTAMPTZ,
        current_period_start TIMESTAMPTZ DEFAULT now(),
        current_period_end TIMESTAMPTZ,

        asaas_customer_id TEXT,
        asaas_subscription_id TEXT,
        cancel_at_period_end BOOLEAN DEFAULT false,

        updated_at TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- 3. Tabela de Uso (Cache de limites)
    CREATE TABLE public.usage_stats
    (
        user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        sales_count_current_month INTEGER DEFAULT 0,
        suppliers_count INTEGER DEFAULT 0,
        last_reset_date DATE DEFAULT CURRENT_DATE,
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Index para performance
    CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
    CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

    -- RLS
    ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

    -- Polices para plans (todos podem ler planos públicos)
    CREATE POLICY "Public plans are viewable by everyone" ON public.plans
    FOR
    SELECT USING (is_public = true);

    -- Policies para subscriptions (apenas o dono vê sua assinatura)
    CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR
    SELECT USING (auth.uid() = user_id);

    -- Policies para usage_stats (apenas o dono vê seu uso)
    CREATE POLICY "Users can view their own usage stats" ON public.usage_stats
    FOR
    SELECT USING (auth.uid() = user_id);

    -- 4. SEED DATA - Planos Iniciais
    INSERT INTO public.plans
        (id, name, plan_group, price, interval, max_suppliers, max_sales_month, max_users, max_revenue_month, features)
    VALUES
        ('free_monthly', 'FREE', 'free', 0.00, 'month', 1, 30, 1, 2000.00, '{"custom_reports": false}'),
        ('pro_monthly', 'PRO', 'pro', 49.90, 'month', 5, 300, 1, NULL, '{"custom_reports": true}'),
        ('pro_yearly', 'PRO Anual', 'pro', 499.00, 'year', 5, 300, 1, NULL, '{"custom_reports": true}'),
        ('pro_plus_monthly', 'PRO +', 'pro_plus', 149.90, 'month', 15, 500, 3, NULL, '{"custom_reports": true, "team_management": true}'),
        ('pro_plus_yearly', 'PRO + Anual', 'pro_plus', 1499.00, 'year', 15, 500, 3, NULL, '{"custom_reports": true, "team_management": true}'),
        ('ultra_monthly', 'ULTRA', 'ultra', 239.00, 'month', 9999, 999999, 10, NULL, '{"custom_reports": true, "team_management": true, "api_access": true}'),
        ('ultra_yearly', 'ULTRA Anual', 'ultra', 2390.00, 'year', 9999, 999999, 10, NULL, '{"custom_reports": true, "team_management": true, "api_access": true}');

