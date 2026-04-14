import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export async function getProfilesByUserIds(userIds: string[]) {
  const uniqueIds = [...new Set(userIds)].filter(Boolean);

  if (uniqueIds.length === 0) {
    return {
      data: [] as Profile[],
      error: null,
    };
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

export async function getBlockedRelationships(userId: string) {
  const [blockedByMe, blockedMe] = await Promise.all([
    supabase
      .from('blocks')
      .select('blocked_user_id')
      .eq('blocker_user_id', userId),
    supabase
      .from('blocks')
      .select('blocker_user_id')
      .eq('blocked_user_id', userId),
  ]);

  const relatedIds = new Set<string>();

  for (const row of blockedByMe.data ?? []) {
    if (row.blocked_user_id) relatedIds.add(row.blocked_user_id);
  }

  for (const row of blockedMe.data ?? []) {
    if (row.blocker_user_id) relatedIds.add(row.blocker_user_id);
  }

  return {
    data: [...relatedIds],
    error: blockedByMe.error?.message || blockedMe.error?.message || null,
  };
}