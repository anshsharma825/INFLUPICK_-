import { supabase } from '../lib/supabase';
import type { PortfolioItem } from '../types/database.types';

export async function addPortfolioItem(freelancerId: string, itemData: Partial<PortfolioItem>) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert([{ ...itemData, freelancer_id: freelancerId }])
    .select()
    .single();

  if (error) throw error;
  return data as PortfolioItem;
}

export async function updatePortfolioItem(itemId: string, updates: Partial<PortfolioItem>) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as PortfolioItem;
}

export async function removePortfolioItem(itemId: string) {
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}