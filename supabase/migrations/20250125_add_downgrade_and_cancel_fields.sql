-- Migration: Add downgrade and cancel fields to user_subscriptions
-- Date: 2025-01-25

-- 1. Add pending_plan_group for scheduled downgrades
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS pending_plan_group TEXT DEFAULT NULL;

-- 2. Add pending_plan_id for scheduled downgrades
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS pending_plan_id TEXT DEFAULT NULL;

-- 3. Add cancel_at_period_end flag
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- 4. Add canceled_at timestamp
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ DEFAULT NULL;

-- 5. Add cancel_reason for feedback
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS cancel_reason TEXT DEFAULT NULL;

-- Comments
COMMENT ON COLUMN public.user_subscriptions.pending_plan_group IS 'Plan group scheduled for next billing cycle (downgrade)';
COMMENT ON COLUMN public.user_subscriptions.pending_plan_id IS 'Plan ID scheduled for next billing cycle (downgrade)';
COMMENT ON COLUMN public.user_subscriptions.cancel_at_period_end IS 'If true, subscription will be canceled at current_period_end';
COMMENT ON COLUMN public.user_subscriptions.canceled_at IS 'When the user requested cancellation';
COMMENT ON COLUMN public.user_subscriptions.cancel_reason IS 'User feedback on why they canceled';
