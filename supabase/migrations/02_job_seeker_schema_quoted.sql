-- Add columns with quoted identifiers to avoid reserved word conflicts
DO $$
BEGIN
  -- Add current_role column (quoted to avoid conflicts)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'current_role') THEN
    ALTER TABLE profiles ADD COLUMN "current_role" TEXT;
  END IF;

  -- Add professional_summary column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'professional_summary') THEN
    ALTER TABLE profiles ADD COLUMN "professional_summary" TEXT;
  END IF;

  -- Add skills column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'skills') THEN
    ALTER TABLE profiles ADD COLUMN "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  -- Add soft_skills column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'soft_skills') THEN
    ALTER TABLE profiles ADD COLUMN "soft_skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  -- Add career_goals column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'career_goals') THEN
    ALTER TABLE profiles ADD COLUMN "career_goals" TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  -- Add vo_style column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'vo_style') THEN
    ALTER TABLE profiles ADD COLUMN "vo_style" TEXT;
  END IF;

  -- Add linkedin_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'linkedin_url') THEN
    ALTER TABLE profiles ADD COLUMN "linkedin_url" TEXT;
  END IF;

  -- Add portfolio_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'portfolio_url') THEN
    ALTER TABLE profiles ADD COLUMN "portfolio_url" TEXT;
  END IF;

  -- Add years_of_experience column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'years_of_experience') THEN
    ALTER TABLE profiles ADD COLUMN "years_of_experience" INTEGER;
  END IF;

  -- Add education column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'education') THEN
    ALTER TABLE profiles ADD COLUMN "education" TEXT;
  END IF;

  -- Add certifications column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'certifications') THEN
    ALTER TABLE profiles ADD COLUMN "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  -- Add languages column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'languages') THEN
    ALTER TABLE profiles ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  -- Add availability_status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'availability_status') THEN
    ALTER TABLE profiles ADD COLUMN "availability_status" TEXT DEFAULT 'available';
  END IF;

  -- Add preferred_work_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'preferred_work_type') THEN
    ALTER TABLE profiles ADD COLUMN "preferred_work_type" TEXT DEFAULT 'flexible';
  END IF;

  -- Add salary_expectation column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'salary_expectation') THEN
    ALTER TABLE profiles ADD COLUMN "salary_expectation" TEXT;
  END IF;

END $$;