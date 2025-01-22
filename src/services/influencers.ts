import { supabase } from '../lib/supabase';
import type { Influencer, PastCollaboration } from '../types/database.types';

export async function createInfluencer(profileId: string, influencerData: Partial<Influencer>) {
  const { data, error } = await supabase
    .from('influencers')
    .insert([{ ...influencerData, profile_id: profileId }])
    .select()
    .single();

  if (error) throw error;
  return data as Influencer;
}

export async function getInfluencer(profileId: string) {
  const { data, error } = await supabase
    .from('influencers')
    .select(`
      *,
      past_collaborations (*)
    `)
    .eq('profile_id', profileId)
    .single();

  if (error) throw error;
  return data as Influencer & {
    past_collaborations: PastCollaboration[];
  };
}

export async function updateInfluencer(influencerId: string, updates: Partial<Influencer>) {
  const { data, error } = await supabase
    .from('influencers')
    .update(updates)
    .eq('id', influencerId)
    .select()
    .single();

  if (error) throw error;
  return data as Influencer;
}