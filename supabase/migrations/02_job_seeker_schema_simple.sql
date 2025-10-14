-- Simple version: Add columns one by one without complex constraints
ALTER TABLE profiles ADD COLUMN current_role TEXT;
ALTER TABLE profiles ADD COLUMN professional_summary TEXT;
ALTER TABLE profiles ADD COLUMN skills TEXT[];
ALTER TABLE profiles ADD COLUMN soft_skills TEXT[];
ALTER TABLE profiles ADD COLUMN career_goals TEXT[];
ALTER TABLE profiles ADD COLUMN vo_style TEXT;
ALTER TABLE profiles ADD COLUMN linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN portfolio_url TEXT;
ALTER TABLE profiles ADD COLUMN years_of_experience INTEGER;
ALTER TABLE profiles ADD COLUMN education TEXT;
ALTER TABLE profiles ADD COLUMN certifications TEXT[];
ALTER TABLE profiles ADD COLUMN languages TEXT[];
ALTER TABLE profiles ADD COLUMN availability_status TEXT DEFAULT 'available';
ALTER TABLE profiles ADD COLUMN preferred_work_type TEXT DEFAULT 'flexible';
ALTER TABLE profiles ADD COLUMN salary_expectation TEXT;