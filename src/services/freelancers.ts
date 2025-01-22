import { supabase } from '../lib/supabase';
import type { Freelancer, FreelancerSkill, PortfolioItem } from '../types/database.types';

export async function createFreelancer(profileId: string, freelancerData: Partial<Freelancer>) {
  const { data, error } = await supabase
    .from('freelancers')
    .insert([{ ...freelancerData, profile_id: profileId }])
    .select()
    .single();

  if (error) throw error;
  return data as Freelancer;
}

export async function getFreelancer(profileId: string) {
  const { data, error } = await supabase
    .from('freelancers')
    .select(`
      *,
      freelancer_skills (*),
      portfolio_items (*),
      reviews (*)
    `)
    .eq('profile_id', profileId)
    .single();

  if (error) throw error;
  return data as Freelancer & {
    freelancer_skills: FreelancerSkill[];
    portfolio_items: PortfolioItem[];
  };
}

export async function updateFreelancer(freelancerId: string, updates: Partial<Freelancer>) {
  const { data, error } = await supabase
    .from('freelancers')
    .update(updates)
    .eq('id', freelancerId)
    .select()
    .single();

  if (error) throw error;
  return data as Freelancer;
}