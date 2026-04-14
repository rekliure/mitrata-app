import { supabase } from '@/lib/supabase';

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