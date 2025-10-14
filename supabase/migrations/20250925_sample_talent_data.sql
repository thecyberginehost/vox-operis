-- Add sample talent data for testing the talent directory

-- First, let's make sure your current profile is public and has some data
UPDATE profiles
SET
    is_profile_public = true,
    is_available = true,
    show_contact_info = true,
    show_rates = true,
    bio = COALESCE(bio, 'Experienced voice-over artist specializing in commercial and narrative work. Professional studio setup with fast turnaround times.'),
    location = COALESCE(location, 'Los Angeles, CA'),
    specialties = CASE
        WHEN array_length(specialties, 1) IS NULL OR array_length(specialties, 1) = 0
        THEN ARRAY['Commercial', 'Narration', 'E-Learning']
        ELSE specialties
    END,
    hourly_rate = COALESCE(hourly_rate, 150),
    experience_years = COALESCE(experience_years, 5),
    website = COALESCE(website, 'https://example.com'),
    phone = COALESCE(phone, '+1 (555) 123-4567')
WHERE is_active = true;

-- Create some sample profiles for testing (if they don't exist)
-- Note: These will only be created if profiles with these emails don't already exist

DO $$
BEGIN
    -- Sample Profile 1: Commercial Specialist
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'sarah.voice@demo.com') THEN
        INSERT INTO profiles (
            id,
            email,
            full_name,
            bio,
            location,
            specialties,
            hourly_rate,
            experience_years,
            is_profile_public,
            is_available,
            show_contact_info,
            show_rates,
            website,
            phone,
            is_active,
            role,
            subscription_status,
            billing_cycle,
            vo_count,
            storage_used_gb,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'sarah.voice@demo.com',
            'Sarah Williams',
            'Award-winning commercial voice talent with 10+ years experience. Specialized in automotive, healthcare, and technology campaigns. Professional home studio with Source-Connect capabilities.',
            'New York, NY',
            ARRAY['Commercial', 'Corporate', 'E-Learning', 'Explainer Video'],
            200,
            10,
            true,
            true,
            true,
            true,
            'https://sarahvoice.com',
            '+1 (212) 555-0123',
            true,
            'user',
            'active',
            'monthly',
            3,
            0.5,
            now() - interval '2 years',
            now()
        );
    END IF;

    -- Sample Profile 2: Audiobook Narrator
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'mike.narrator@demo.com') THEN
        INSERT INTO profiles (
            id,
            email,
            full_name,
            bio,
            location,
            specialties,
            hourly_rate,
            experience_years,
            is_profile_public,
            is_available,
            show_contact_info,
            show_rates,
            website,
            phone,
            is_active,
            role,
            subscription_status,
            billing_cycle,
            vo_count,
            storage_used_gb,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'mike.narrator@demo.com',
            'Michael Chen',
            'Professional audiobook narrator with over 150 completed titles. Specializing in fiction, business, and self-help genres. ACX approved with consistent 5-star ratings.',
            'Austin, TX',
            ARRAY['Audiobook', 'Narration', 'Documentary', 'Podcast'],
            175,
            8,
            true,
            false,
            false,
            true,
            null,
            null,
            true,
            'user',
            'active',
            'yearly',
            12,
            2.1,
            now() - interval '1 year',
            now()
        );
    END IF;

    -- Sample Profile 3: Character Voice Artist
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'alex.characters@demo.com') THEN
        INSERT INTO profiles (
            id,
            email,
            full_name,
            bio,
            location,
            specialties,
            hourly_rate,
            experience_years,
            is_profile_public,
            is_available,
            show_contact_info,
            show_rates,
            website,
            phone,
            is_active,
            role,
            subscription_status,
            billing_cycle,
            vo_count,
            storage_used_gb,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'alex.characters@demo.com',
            'Alex Rivera',
            'Versatile character voice artist bringing animated characters to life. Experienced in video games, animation, and interactive media. Range includes children, elderly, fantasy creatures, and robots.',
            'Vancouver, BC',
            ARRAY['Character Voice', 'Animation', 'Video Game', 'IVR/Phone System'],
            125,
            6,
            true,
            true,
            true,
            true,
            'https://alexvoices.ca',
            '+1 (604) 555-0187',
            true,
            'user',
            'trial',
            'free',
            8,
            1.3,
            now() - interval '8 months',
            now()
        );
    END IF;

    -- Sample Profile 4: Corporate Specialist
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'jennifer.corp@demo.com') THEN
        INSERT INTO profiles (
            id,
            email,
            full_name,
            bio,
            location,
            specialties,
            hourly_rate,
            experience_years,
            is_profile_public,
            is_available,
            show_contact_info,
            show_rates,
            website,
            phone,
            is_active,
            role,
            subscription_status,
            billing_cycle,
            vo_count,
            storage_used_gb,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'jennifer.corp@demo.com',
            'Jennifer Thompson',
            'Corporate communication specialist with Fortune 500 experience. Expert in training videos, internal communications, and executive presentations. Warm, authoritative delivery.',
            'Chicago, IL',
            ARRAY['Corporate', 'E-Learning', 'Training', 'Explainer Video'],
            180,
            12,
            true,
            true,
            false,
            false,
            null,
            null,
            true,
            'user',
            'active',
            'yearly',
            6,
            0.8,
            now() - interval '3 years',
            now()
        );
    END IF;

END $$;

-- Add some sample profile analytics for more realistic stats
INSERT INTO profile_analytics (user_id, event_type, visitor_ip, created_at)
SELECT
    p.id,
    (ARRAY['profile_view', 'profile_view', 'profile_view', 'like'])[floor(random() * 4 + 1)],
    '127.0.0.1',
    now() - (random() * interval '30 days')
FROM profiles p
WHERE p.is_profile_public = true
AND p.email IN ('sarah.voice@demo.com', 'mike.narrator@demo.com', 'alex.characters@demo.com', 'jennifer.corp@demo.com')
AND random() > 0.3; -- Only add analytics for some records randomly

-- This will run multiple times to create more realistic view/like counts
INSERT INTO profile_analytics (user_id, event_type, visitor_ip, created_at)
SELECT
    p.id,
    'profile_view',
    '192.168.1.' || floor(random() * 255 + 1),
    now() - (random() * interval '60 days')
FROM profiles p
WHERE p.is_profile_public = true
AND random() > 0.5
LIMIT 50;

-- Update profile view counters
UPDATE profiles
SET profile_views_count = (
    SELECT COUNT(*)
    FROM profile_analytics pa
    WHERE pa.user_id = profiles.id
    AND pa.event_type = 'profile_view'
)
WHERE is_profile_public = true;