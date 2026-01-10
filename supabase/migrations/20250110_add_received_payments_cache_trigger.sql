-- Migration: Add cache invalidation trigger to received_payments table
-- Issue: Dashboard "Recebimentos" card not updating when payments are marked as received
-- Root cause: Cache invalidation trigger missing for received_payments table

-- Create trigger to invalidate dashboard cache when received_payments changes
CREATE TRIGGER trigger_invalidate_cache_payments
    AFTER INSERT OR UPDATE OR DELETE ON public.received_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.invalidate_dashboard_cache();

-- Comment explaining the trigger
COMMENT ON TRIGGER trigger_invalidate_cache_payments ON public.received_payments IS 
'Invalidates dashboard cache (home_analytics) when payment status changes, ensuring Recebimentos card updates in real-time';
