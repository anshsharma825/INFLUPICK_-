/*
  # Freelancer and Influencer Platform Schema

  1. New Tables
    - `profiles` (base user profile table)
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `user_type` (enum: freelancer, influencer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `freelancers` (freelancer-specific details)
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `name` (text)
      - `bio` (text)
      - `contact_email` (text)
      - `contact_phone` (text)
      - `hourly_rate` (numeric)
      - `availability_status` (enum)
      - `success_rate` (numeric)
      - `total_projects` (integer)

    - `freelancer_skills` (skills for freelancers)
      - `id` (uuid, primary key)
      - `freelancer_id` (uuid, references freelancers)
      - `skill_name` (text)
      - `proficiency_level` (enum)

    - `portfolio_items` (freelancer portfolio)
      - `id` (uuid, primary key)
      - `freelancer_id` (uuid, references freelancers)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `project_url` (text)
      - `completion_date` (date)

    - `reviews` (reviews for freelancers)
      - `id` (uuid, primary key)
      - `freelancer_id` (uuid, references freelancers)
      - `reviewer_id` (uuid, references profiles)
      - `rating` (integer)
      - `comment` (text)
      - `created_at` (timestamp)

    - `influencers` (influencer-specific details)
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `company_name` (text)
      - `industry` (text)
      - `requirements` (text)
      - `min_budget` (numeric)
      - `max_budget` (numeric)
      - `timeline_start` (date)
      - `timeline_end` (date)

    - `past_collaborations` (influencer's past projects)
      - `id` (uuid, primary key)
      - `influencer_id` (uuid, references influencers)
      - `project_name` (text)
      - `description` (text)
      - `completion_date` (date)
      - `success_metrics` (jsonb)

  2. Security
    - Enable RLS on all tables
    - Policies for:
      - Users can read their own profile
      - Users can update their own profile
      - Freelancer profiles are publicly readable
      - Reviews are publicly readable
      - Users can only create reviews for others
      - Portfolio items are publicly readable
      - Skills are publicly readable

  3. Enums and Extensions
    - Create user_type enum
    - Create availability_status enum
    - Create proficiency_level enum
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMs
CREATE TYPE user_type AS ENUM ('freelancer', 'influencer');
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'not_available');
CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Base profiles table
CREATE TABLE profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users NOT NULL,
    user_type user_type NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Freelancers table
CREATE TABLE freelancers (
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
CREATE TABLE freelancer_skills (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id uuid REFERENCES freelancers ON DELETE CASCADE,
    skill_name text NOT NULL,
    proficiency_level proficiency_level DEFAULT 'intermediate',
    created_at timestamptz DEFAULT now()
);

-- Portfolio items
CREATE TABLE portfolio_items (
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
CREATE TABLE reviews (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id uuid REFERENCES freelancers ON DELETE CASCADE,
    reviewer_id uuid REFERENCES profiles NOT NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now()
);

-- Influencers table
CREATE TABLE influencers (
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
CREATE TABLE past_collaborations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    influencer_id uuid REFERENCES influencers ON DELETE CASCADE,
    project_name text NOT NULL,
    description text,
    completion_date date,
    success_metrics jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_collaborations ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_freelancers_profile_id ON freelancers(profile_id);
CREATE INDEX idx_freelancer_skills_freelancer_id ON freelancer_skills(freelancer_id);
CREATE INDEX idx_portfolio_items_freelancer_id ON portfolio_items(freelancer_id);
CREATE INDEX idx_reviews_freelancer_id ON reviews(freelancer_id);
CREATE INDEX idx_influencers_profile_id ON influencers(profile_id);
CREATE INDEX idx_past_collaborations_influencer_id ON past_collaborations(influencer_id);