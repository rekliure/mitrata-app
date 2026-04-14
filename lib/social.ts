import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export async function getProfilesByUserIds(userIds: string[]) {
  const uniqueIds = [...new Set(userIds)].filter(Boolean);

  if (uniqueIds.length === 0) {
    return { data: [] as Profile[], error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', uniqueIds);

  return {
    data: (data as Profile[]) ?? [],
    error: error?.message ?? null,
  };
}