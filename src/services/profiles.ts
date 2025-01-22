import { supabase } from '../lib/supabase';
import type { Profile, UserType } from '../types/database.types';

export async function createProfile(userId: string, userType: UserType) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ user_id: userId, user_type: userType }])
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(profileId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}