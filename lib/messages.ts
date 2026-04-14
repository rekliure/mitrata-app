import { supabase } from '@/lib/supabase';
import type { Match, Message } from '@/types';

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
  const text = body.trim();

  if (!text) {
    return { data: null, error: 'Message cannot be empty.' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_user_id: senderUserId,
      body: text,
    })
    .select()
    .single();

  return {
    data: (data as Message | null) ?? null,
    error: error?.message ?? null,
  };
}

export async function markMessagesAsRead(matchId: string, currentUserId: string) {
  const { error } = await supabase.rpc('mark_match_messages_read', {
    p_match_id: matchId,
  });

  return {
    error: error?.message ?? null,
  };
}

export async function getUnreadMessageCount(userId: string) {
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);

  if (matchError) {
    return { count: 0, error: matchError.message };
  }

  const matchIds = ((matches as Match[]) ?? []).map((m) => m.id);

  if (matchIds.length === 0) {
    return { count: 0, error: null };
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .in('match_id', matchIds)
    .neq('sender_user_id', userId)
    .is('read_at', null);

  return {
    count: data?.length ?? 0,
    error: error?.message ?? null,
  };
}

export function subscribeToMatchMessages(
  matchId: string,
  onMessage: () => void
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
        onMessage();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}