-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMs if they don't exist
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('freelancer', 'influencer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_status AS ENUM ('available', 'busy', 'not_available');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Base profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users NOT NULL,
    user_type user_type NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Freelancers table
CREATE TABLE IF NOT EXISTS freelancers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid REFERENCES profiles NOT NULL,
    name text NOT NULL,
    bio text,
    contact_email text,
    contact_phone text,
    hourly_rate numeric,
    availability_status availability_status DEFAULT 'available',
    success_rate numeric DEFAULT 0,
    total_projects integer DEFAULT 0,
    UNIQUE(profile_id)
);

-- Freelancer skills
CREATE TABLE IF NOT EXISTS freelancer_skills (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id uuid REFERENCES freelancers ON DELETE CASCADE,
    skill_name text NOT NULL,
    proficiency_level proficiency_level DEFAULT 'intermediate',
    created_at timestamptz DEFAULT now()
);

-- Portfolio items
CREATE TABLE IF NOT EXISTS portfolio_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id uuid REFERENCES freelancers ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    image_url text,
    project_url text,
    completion_date date,
    created_at timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id uuid REFERENCES freelancers ON DELETE CASCADE,
    reviewer_id uuid REFERENCES profiles NOT NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now()
);

-- Influencers table
CREATE TABLE IF NOT EXISTS influencers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid REFERENCES profiles NOT NULL,
    company_name text NOT NULL,
    industry text NOT NULL,
    requirements text,
    min_budget numeric,
    max_budget numeric,
    timeline_start date,
    timeline_end date,
    created_at timestamptz DEFAULT now(),
    UNIQUE(profile_id)
);

-- Past collaborations
CREATE TABLE IF NOT EXISTS past_collaborations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    influencer_id uuid REFERENCES influencers ON DELETE CASCADE,
    project_name text NOT NULL,
    description text,
    completion_date date,
    success_metrics jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
DO $$ BEGIN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE freelancer_skills ENABLE ROW LEVEL SECURITY;
    ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
    ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE past_collaborations ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing policies if they exist
DO $$ 
DECLARE
    tables text[] := ARRAY['profiles', 'freelancers', 'freelancer_skills', 'portfolio_items', 'reviews', 'influencers', 'past_collaborations'];
    t text;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can view their own profile" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update their own profile" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can insert their own profile" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Freelancer profiles are publicly readable" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Freelancers can update their own profile" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Skills are publicly readable" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Freelancers can manage their skills" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Portfolio items are publicly readable" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Freelancers can manage their portfolio" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Reviews are publicly readable" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can create reviews" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Influencer profiles are readable by authenticated users" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Influencers can update their own profile" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Past collaborations are readable by authenticated users" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Influencers can manage their past collaborations" ON %I', t);
    END LOOP;
END $$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Freelancer policies
CREATE POLICY "Freelancer profiles are publicly readable"
    ON freelancers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Freelancers can update their own profile"
    ON freelancers FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = freelancers.profile_id
        AND profiles.user_id = auth.uid()
    ));

-- Skills policies
CREATE POLICY "Skills are publicly readable"
    ON freelancer_skills FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Freelancers can manage their skills"
    ON freelancer_skills FOR ALL
    USING (EXISTS (
        SELECT 1 FROM freelancers
        JOIN profiles ON freelancers.profile_id = profiles.id
        WHERE freelancer_skills.freelancer_id = freelancers.id
        AND profiles.user_id = auth.uid()
    ));

-- Portfolio policies
CREATE POLICY "Portfolio items are publicly readable"
    ON portfolio_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Freelancers can manage their portfolio"
    ON portfolio_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM freelancers
        JOIN profiles ON freelancers.profile_id = profiles.id
        WHERE portfolio_items.freelancer_id = freelancers.id
        AND profiles.user_id = auth.uid()
    ));

-- Review policies
CREATE POLICY "Reviews are publicly readable"
    ON reviews FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create reviews"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = reviewer_id
        )
    );

-- Influencer policies
CREATE POLICY "Influencer profiles are readable by authenticated users"
    ON influencers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Influencers can update their own profile"
    ON influencers FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = influencers.profile_id
        AND profiles.user_id = auth.uid()
    ));

-- Past collaborations policies
CREATE POLICY "Past collaborations are readable by authenticated users"
    ON past_collaborations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Influencers can manage their past collaborations"
    ON past_collaborations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM influencers
        JOIN profiles ON influencers.profile_id = profiles.id
        WHERE past_collaborations.influencer_id = influencers.id
        AND profiles.user_id = auth.uid()
    ));

-- Create indexes for better performance
DO $$ 
BEGIN
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_freelancers_profile_id ON freelancers(profile_id);
    CREATE INDEX IF NOT EXISTS idx_freelancer_skills_freelancer_id ON freelancer_skills(freelancer_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_items_freelancer_id ON portfolio_items(freelancer_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_freelancer_id ON reviews(freelancer_id);
    CREATE INDEX IF NOT EXISTS idx_influencers_profile_id ON influencers(profile_id);
    CREATE INDEX IF NOT EXISTS idx_past_collaborations_influencer_id ON past_collaborations(influencer_id);
END $$;