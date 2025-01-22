import { supabase } from '../lib/supabase';
import type { Business, PastCollaboration } from '../types/database.types';

export async function createBusiness(profileId: string, businessData: Partial<Business>) {
  const { data, error } = await supabase
    .from('businesses')
    .insert([{ ...businessData, profile_id: profileId }])
    .select()
    .single();

  if (error) throw error;
  return data as Business;
}

export async function getBusiness(profileId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      past_collaborations (*)
    `)
    .eq('profile_id', profileId)
    .single();

  if (error) throw error;
  return data as Business & {
    past_collaborations: PastCollaboration[];
  };
}

export async function updateBusiness(businessId: string, updates: Partial<Business>) {
  const { data, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', businessId)
    .select()
    .single();

  if (error) throw error;
  return data as Business;
}