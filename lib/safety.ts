import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export async function blockUser(
  blockerUserId: string,
  blockedUserId: string,
  reason?: string
) {
  if (blockerUserId === blockedUserId) {
    return { error: 'You cannot block yourself.' };
  }

  const { error } = await supabase.from('blocks').upsert(
    {
      blocker_user_id: blockerUserId,
      blocked_user_id: blockedUserId,
      reason: reason?.trim() || null,
    },
    { onConflict: 'blocker_user_id,blocked_user_id' }
  );

  return { error: error?.message ?? null };
}

export async function unblockUser(
  blockerUserId: string,
  blockedUserId: string
) {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_user_id', blockerUserId)
    .eq('blocked_user_id', blockedUserId);

  return { error: error?.message ?? null };
}

export async function getBlockedUserIds(blockerUserId: string) {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_user_id')
    .eq('blocker_user_id', blockerUserId);

  return {
    data: (data ?? []).map((row) => row.blocked_user_id as string),
    error: error?.message ?? null,
  };
}

export async function getMyBlockedProfiles(blockerUserId: string) {
  const blockedIdsResult = await getBlockedUserIds(blockerUserId);

  if (blockedIdsResult.error) {
    return {
      data: [] as Profile[],
      error: blockedIdsResult.error,
    };
  }

  const blockedIds = blockedIdsResult.data ?? [];

  if (blockedIds.length === 0) {
    return {
      data: [] as Profile[],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', blockedIds);

  return {
    data: (data as Profile[]) ?? [],
    error: error?.message ?? null,
  };
}

export async function reportUser(
  reporterUserId: string,
  reportedUserId: string,
  reason: string,
  details?: string
) {
  if (reporterUserId === reportedUserId) {
    return { error: 'You cannot report yourself.' };
  }

  const { error } = await supabase.from('reports').insert({
    reporter_user_id: reporterUserId,
    reported_user_id: reportedUserId,
    reason: reason.trim(),
    details: details?.trim() || null,
  });

  return { error: error?.message ?? null };
}