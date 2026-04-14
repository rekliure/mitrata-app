import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

type DiscoverFilters = {
  city?: string;
  gender?: string;
  looking_for?: string;
  min_age?: number;
  max_age?: number;
};

export async function getDiscoverProfiles(
  currentUserId: string,
  filters: DiscoverFilters = {}
) {
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('user_id', currentUserId)
    .eq('is_visible', true)
    .eq('is_profile_complete', true)
    .order('is_verified', { ascending: false })
    .order('updated_at', { ascending: false });

  const city = filters.city?.trim();
  const gender = filters.gender?.trim();
  const lookingFor = filters.looking_for?.trim();
  const minAge = filters.min_age;
  const maxAge = filters.max_age;

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (gender) {
    query = query.eq('gender', gender);
  }

  if (lookingFor) {
    query = query.eq('looking_for', lookingFor);
  }

  if (typeof minAge === 'number') {
    query = query.gte('age', minAge);
  }

  if (typeof maxAge === 'number') {
    query = query.lte('age', maxAge);
  }

  const { data, error } = await query;

  return {
    data: (data as Profile[]) ?? [],
    error: error?.message ?? null,
  };
}