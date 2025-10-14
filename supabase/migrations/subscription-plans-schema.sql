-- ================================================================
-- Subscription Plans Schema
-- Adds comprehensive subscription plan management to Vox-Operis
-- ================================================================

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_name TEXT NOT NULL UNIQUE,
    plan_display_name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_vos INTEGER NOT NULL DEFAULT 1,
    max_storage_gb INTEGER NOT NULL DEFAULT 1,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_free BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add subscription plan reference to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial', 'suspended')),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time', 'free')),
ADD COLUMN IF NOT EXISTS vo_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_used_gb DECIMAL(10,3) DEFAULT 0.000;

-- Insert default subscription plans
INSERT INTO public.subscription_plans (plan_name, plan_display_name, description, price_monthly, price_yearly, max_vos, max_storage_gb, features, is_free, sort_order) VALUES
('free', 'Free Plan', 'Perfect for getting started with voice-over work', 0.00, 0.00, 1, 1, '["1 Voice-Over Profile", "Basic Templates", "Community Support", "1GB Storage"]'::jsonb, true, 1),
('starter', 'Starter Plan', 'Great for growing voice artists', 19.99, 199.99, 3, 5, '["3 Voice-Over Profiles", "Premium Templates", "Priority Support", "5GB Storage", "Advanced Analytics", "Custom Branding"]'::jsonb, false, 2),
('professional', 'Professional Plan', 'For established voice professionals', 49.99, 499.99, 10, 25, '["10 Voice-Over Profiles", "All Premium Templates", "24/7 Priority Support", "25GB Storage", "Advanced Analytics", "Custom Branding", "API Access", "White-label Options"]'::jsonb, false, 3),
('enterprise', 'Enterprise Plan', 'For agencies and large teams', 199.99, 1999.99, 999, 500, '["Unlimited Voice-Over Profiles", "Custom Templates", "Dedicated Account Manager", "500GB Storage", "Enterprise Analytics", "Full White-label", "API Access", "Custom Integrations", "SLA Guarantee"]'::jsonb, false, 4)
ON CONFLICT (plan_name) DO UPDATE SET
    plan_display_name = EXCLUDED.plan_display_name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    max_vos = EXCLUDED.max_vos,
    max_storage_gb = EXCLUDED.max_storage_gb,
    features = EXCLUDED.features,
    is_free = EXCLUDED.is_free,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- Create subscription_plan_changes table for audit trail
CREATE TABLE IF NOT EXISTS public.subscription_plan_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    old_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    new_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    change_reason TEXT,
    is_admin_override BOOLEAN DEFAULT false,
    change_type TEXT CHECK (change_type IN ('upgrade', 'downgrade', 'trial', 'cancellation', 'admin_override', 'system_change')),
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing profiles to have free plan by default
UPDATE public.profiles
SET subscription_plan_id = (SELECT id FROM public.subscription_plans WHERE plan_name = 'free' LIMIT 1),
    subscription_status = 'active',
    subscription_started_at = created_at,
    billing_cycle = 'free'
WHERE subscription_plan_id IS NULL;

-- Function to get user subscription details
CREATE OR REPLACE FUNCTION public.get_user_subscription_details(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user_id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'subscription_status', p.subscription_status,
        'subscription_started_at', p.subscription_started_at,
        'subscription_expires_at', p.subscription_expires_at,
        'billing_cycle', p.billing_cycle,
        'vo_count', p.vo_count,
        'storage_used_gb', p.storage_used_gb,
        'plan', jsonb_build_object(
            'id', sp.id,
            'name', sp.plan_name,
            'display_name', sp.plan_display_name,
            'description', sp.description,
            'price_monthly', sp.price_monthly,
            'price_yearly', sp.price_yearly,
            'max_vos', sp.max_vos,
            'max_storage_gb', sp.max_storage_gb,
            'features', sp.features,
            'is_free', sp.is_free
        )
    ) INTO result
    FROM public.profiles p
    LEFT JOIN public.subscription_plans sp ON p.subscription_plan_id = sp.id
    WHERE p.id = p_user_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admin to change user subscription plan
CREATE OR REPLACE FUNCTION public.admin_change_user_plan(
    p_user_id UUID,
    p_new_plan_id UUID,
    p_admin_id UUID,
    p_change_reason TEXT DEFAULT 'Admin override',
    p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS JSONB AS $$
DECLARE
    old_plan_id UUID;
    user_exists BOOLEAN;
    plan_exists BOOLEAN;
    is_admin BOOLEAN;
    plan_info RECORD;
    result JSONB;
BEGIN
    -- Check if admin has permission
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') INTO is_admin;
    IF NOT is_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'permission_denied',
            'message', 'Only administrators can change user subscription plans'
        );
    END IF;

    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id), subscription_plan_id
    INTO user_exists, old_plan_id
    FROM public.profiles WHERE id = p_user_id;

    IF NOT user_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'user_not_found',
            'message', 'User not found'
        );
    END IF;

    -- Check if new plan exists
    SELECT EXISTS(SELECT 1 FROM public.subscription_plans WHERE id = p_new_plan_id AND is_active = true) INTO plan_exists;
    IF NOT plan_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'plan_not_found',
            'message', 'Subscription plan not found or inactive'
        );
    END IF;

    -- Get plan info for response
    SELECT * INTO plan_info FROM public.subscription_plans WHERE id = p_new_plan_id;

    -- Update user subscription
    UPDATE public.profiles
    SET
        subscription_plan_id = p_new_plan_id,
        subscription_status = 'active',
        subscription_started_at = NOW(),
        subscription_expires_at = CASE
            WHEN plan_info.is_free THEN NULL
            WHEN p_billing_cycle = 'yearly' THEN NOW() + INTERVAL '1 year'
            WHEN p_billing_cycle = 'monthly' THEN NOW() + INTERVAL '1 month'
            ELSE NULL
        END,
        billing_cycle = CASE
            WHEN plan_info.is_free THEN 'free'
            ELSE p_billing_cycle
        END,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Log the change
    INSERT INTO public.subscription_plan_changes (
        user_id, old_plan_id, new_plan_id, changed_by, change_reason, is_admin_override, change_type
    ) VALUES (
        p_user_id, old_plan_id, p_new_plan_id, p_admin_id, p_change_reason, true,
        CASE
            WHEN old_plan_id IS NULL THEN 'admin_override'
            WHEN plan_info.sort_order > (SELECT sort_order FROM public.subscription_plans WHERE id = old_plan_id) THEN 'upgrade'
            ELSE 'downgrade'
        END
    );

    -- Log admin action
    INSERT INTO public.admin_logs (
        admin_id, admin_email, admin_name, action_type, action_description,
        target_resource_type, target_resource_id, success
    ) SELECT
        p_admin_id,
        admin.email,
        admin.full_name,
        'subscription_plan_changed',
        format('Changed user %s subscription to %s plan',
            (SELECT email FROM public.profiles WHERE id = p_user_id),
            plan_info.plan_display_name
        ),
        'user_subscription',
        p_user_id::text,
        true
    FROM public.profiles admin WHERE admin.id = p_admin_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Successfully changed subscription to %s plan', plan_info.plan_display_name),
        'data', jsonb_build_object(
            'user_id', p_user_id,
            'old_plan_id', old_plan_id,
            'new_plan_id', p_new_plan_id,
            'plan_name', plan_info.plan_display_name,
            'billing_cycle', p_billing_cycle
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all available subscription plans
CREATE OR REPLACE FUNCTION public.get_subscription_plans()
RETURNS SETOF public.subscription_plans AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.subscription_plans
    WHERE is_active = true
    ORDER BY sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON public.profiles(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_changes_user_id ON public.subscription_plan_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_changes_created_at ON public.subscription_plan_changes(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plan_changes ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans (readable by all authenticated users)
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

-- RLS policies for subscription_plan_changes (admin only)
CREATE POLICY "Admins can view all subscription changes" ON public.subscription_plan_changes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert subscription changes" ON public.subscription_plan_changes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Grant permissions
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_user_plan TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_plans TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans for the platform';
COMMENT ON TABLE public.subscription_plan_changes IS 'Audit trail for subscription plan changes';
COMMENT ON FUNCTION public.get_user_subscription_details IS 'Returns comprehensive subscription details for a user';
COMMENT ON FUNCTION public.admin_change_user_plan IS 'Allows admins to change user subscription plans with audit logging';
COMMENT ON FUNCTION public.get_subscription_plans IS 'Returns all active subscription plans';