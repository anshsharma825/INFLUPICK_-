export type UserType = 'freelancer' | 'business';
export type AvailabilityStatus = 'available' | 'busy' | 'not_available';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Profile {
  id: string;
  user_id: string;
  user_type: UserType;
  created_at: string;
  updated_at: string;
}

export interface Freelancer {
  id: string;
  profile_id: string;
  name: string;
  bio?: string;
  contact_email?: string;
  contact_phone?: string;
  hourly_rate?: number;
  availability_status: AvailabilityStatus;
  success_rate: number;
  total_projects: number;
}

export interface FreelancerSkill {
  id: string;
  freelancer_id: string;
  skill_name: string;
  proficiency_level: ProficiencyLevel;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  freelancer_id: string;
  title: string;
  description?: string;
  image_url?: string;
  project_url?: string;
  completion_date?: string;
  created_at: string;
}

export interface Review {
  id: string;
  freelancer_id: string;
  reviewer_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Business {
  id: string;
  profile_id: string;
  company_name: string;
  industry: string;
  requirements?: string;
  min_budget?: number;
  max_budget?: number;
  timeline_start?: string;
  timeline_end?: string;
  created_at: string;
}

export interface PastCollaboration {
  id: string;
  business_id: string;
  project_name: string;
  description?: string;
  completion_date?: string;
  success_metrics?: Record<string, any>;
  created_at: string;
}