-- Test with just one column first to isolate the issue
ALTER TABLE profiles ADD COLUMN job_title TEXT;
ALTER TABLE profiles ADD COLUMN summary_text TEXT;
ALTER TABLE profiles ADD COLUMN skill_list TEXT[];
ALTER TABLE profiles ADD COLUMN soft_skill_list TEXT[];
ALTER TABLE profiles ADD COLUMN goal_list TEXT[];
ALTER TABLE profiles ADD COLUMN presentation_style TEXT;
ALTER TABLE profiles ADD COLUMN linkedin_profile TEXT;
ALTER TABLE profiles ADD COLUMN portfolio_website TEXT;
ALTER TABLE profiles ADD COLUMN experience_years INTEGER;
ALTER TABLE profiles ADD COLUMN education_info TEXT;
ALTER TABLE profiles ADD COLUMN certification_list TEXT[];
ALTER TABLE profiles ADD COLUMN language_list TEXT[];
ALTER TABLE profiles ADD COLUMN work_status TEXT DEFAULT 'available';
ALTER TABLE profiles ADD COLUMN work_preference TEXT DEFAULT 'flexible';
ALTER TABLE profiles ADD COLUMN expected_salary TEXT;