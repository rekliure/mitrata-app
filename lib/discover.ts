import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export type DiscoverFilters = {
  gender?: string;
  city?: string;
  looking_for?: string;
  minAge?: number;
  maxAge?: number;
};

export async function getDiscoverProfiles(
  currentUserId: string,
  filters?: DiscoverFilters
) {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_profile_complete', true)
    .eq('is_visible', true)
    .neq('user_id', currentUserId)
    .order('created_at', { ascending: false });

  if (filters?.gender?.trim()) {
    query = query.ilike('gender', filters.gender.trim());
  }

  if (filters?.city?.trim()) {
    query = query.ilike('city', `%${filters.city.trim()}%`);
  }

  if (filters?.looking_for?.trim()) {
    query = query.ilike('looking_for', filters.looking_for.trim());
  }

  if (typeof filters?.minAge === 'number') {
    query = query.gte('age', filters.minAge);
  }

  if (typeof filters?.maxAge === 'number') {
    query = query.lte('age', filters.maxAge);
  }

  const { data, error } = await query;

  console.log('DISCOVER currentUserId:', currentUserId);
  console.log('DISCOVER filters:', filters);
  console.log('DISCOVER data:', data);
  console.log('DISCOVER error:', error);

  return {
    data: (data as Profile[]) ?? [],
    error: error?.message ?? null,
  };
}