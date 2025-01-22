/*
  # Update Influencer terminology to include Companies

  1. Changes
    - Rename 'influencer' type in user_type enum to 'business'
    - Rename 'influencers' table to 'businesses'
    - Update all references and foreign keys
    - Update policy names and descriptions
    
  2. Security
    - Maintain existing RLS policies with updated names
    - Transfer all existing permissions
*/

-- Update the user_type enum
ALTER TYPE user_type RENAME VALUE 'influencer' TO 'business';

-- Rename the influencers table to businesses
ALTER TABLE influencers RENAME TO businesses;

-- Update the foreign key reference in past_collaborations
ALTER TABLE past_collaborations 
    RENAME COLUMN influencer_id TO business_id;
ALTER TABLE past_collaborations 
    RENAME CONSTRAINT past_collaborations_influencer_id_fkey 
    TO past_collaborations_business_id_fkey;

-- Update indexes
ALTER INDEX idx_influencers_profile_id RENAME TO idx_businesses_profile_id;
ALTER INDEX idx_past_collaborations_influencer_id RENAME TO idx_past_collaborations_business_id;

-- Drop and recreate policies with updated names
DROP POLICY IF EXISTS "Influencer profiles are readable by authenticated users" ON businesses;
DROP POLICY IF EXISTS "Influencers can update their own profile" ON businesses;
DROP POLICY IF EXISTS "Past collaborations are readable by authenticated users" ON past_collaborations;
DROP POLICY IF EXISTS "Influencers can manage their past collaborations" ON past_collaborations;

-- Recreate policies with new names
CREATE POLICY "Business profiles are readable by authenticated users"
    ON businesses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Businesses can update their own profile"
    ON businesses FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = businesses.profile_id
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Past collaborations are readable by authenticated users"
    ON past_collaborations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Businesses can manage their past collaborations"
    ON past_collaborations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM businesses
        JOIN profiles ON businesses.profile_id = profiles.id
        WHERE past_collaborations.business_id = businesses.id
        AND profiles.user_id = auth.uid()
    ));