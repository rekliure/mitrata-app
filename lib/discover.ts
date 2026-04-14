import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

type DiscoverFilters = {
  city?: string;
  gender?: string;
  looking_for?: string;
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
    .order('updated_at', { ascending: false });

  const city = filters.city?.trim();
  const gender = filters.gender?.trim();
  const lookingFor = filters.looking_for?.trim();

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (gender) {
    query = query.ilike('gender', gender);
  }

  if (lookingFor) {
    query = query.ilike('looking_for', lookingFor);
  }

  const { data, error } = await query;

  return {
    data: (data as Profile[]) ?? [],
    error: error?.message ?? null,
  };
}