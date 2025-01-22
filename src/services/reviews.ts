import { supabase } from '../lib/supabase';
import type { Review } from '../types/database.types';

export async function addReview(freelancerId: string, reviewerId: string, reviewData: Partial<Review>) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([{
      ...reviewData,
      freelancer_id: freelancerId,
      reviewer_id: reviewerId
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

export async function getReviews(freelancerId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('freelancer_id', freelancerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Review[];
}