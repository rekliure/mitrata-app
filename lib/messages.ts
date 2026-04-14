import { supabase } from '@/lib/supabase';
import type { Match, Message } from '@/types';
import { getBlockedRelationships } from '@/lib/social';

export async function getMyMatches(userId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('created_at', { ascending: false });

  return {
    data: (data as Match[]) ?? [],
    error: error?.message ?? null,
  };
}

export async function getMessagesForMatch(matchId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  return {
    data: (data as Message[]) ?? [],
    error: error?.message ?? null,
  };
}

export async function sendMessage(
  matchId: string,
  senderUserId: string,
  body: string
) {
  const trimmed = body.trim();

  if (!trimmed) {
    return { data: null, error: 'Message cannot be empty.' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_user_id: senderUserId,
      body: trimmed,
    })
    .select()
    .single();

  return {
    data: (data as Message | null) ?? null,
    error: error?.message ?? null,
  };
}

export async function markMessagesAsRead(matchId: string, userId: string) {
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .neq('sender_user_id', userId)
    .is('read_at', null)
    .select();

  return {
    data: (data as Message[]) ?? [],
    error: error?.message ?? null,
  };
}

export function subscribeToMatchMessages(
  matchId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getUnreadMessageCount(userId: string) {
  const blockedResult = await getBlockedRelationships(userId);
  const blockedIds = new Set(blockedResult.data ?? []);

  const matchesResult = await getMyMatches(userId);

  if (matchesResult.error) {
    return {
      count: 0,
      error: matchesResult.error,
    };
  }

  const safeMatches = matchesResult.data.filter((match) => {
    const otherUserId = match.user_a === userId ? match.user_b : match.user_a;
    return !blockedIds.has(otherUserId);
  });

  const safeMatchIds = safeMatches.map((match) => match.id);

  if (safeMatchIds.length === 0) {
    return {
      count: 0,
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .in('match_id', safeMatchIds)
    .neq('sender_user_id', userId)
    .is('read_at', null);

  return {
    count: (data as Message[] | null)?.length ?? 0,
    error: error?.message ?? null,
  };
}