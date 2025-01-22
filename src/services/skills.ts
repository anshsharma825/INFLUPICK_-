import { supabase } from '../lib/supabase';
import type { FreelancerSkill } from '../types/database.types';

export async function addSkill(freelancerId: string, skillData: Partial<FreelancerSkill>) {
  const { data, error } = await supabase
    .from('freelancer_skills')
    .insert([{ ...skillData, freelancer_id: freelancerId }])
    .select()
    .single();

  if (error) throw error;
  return data as FreelancerSkill;
}

export async function removeSkill(skillId: string) {
  const { error } = await supabase
    .from('freelancer_skills')
    .delete()
    .eq('id', skillId);

  if (error) throw error;
}