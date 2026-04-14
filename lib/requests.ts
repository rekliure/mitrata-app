import { supabase } from '@/lib/supabase';
import type { ConnectionRequest, Match } from '@/types';

export async function sendConnectionRequest(
  senderUserId: string,
  receiverUserId: string,
  introMessage: string
) {
  if (senderUserId === receiverUserId) {
    return { data: null, error: 'You cannot connect with yourself.' };
  }

  const { data, error } = await supabase
    .from('connection_requests')
    .insert({
      sender_user_id: senderUserId,
      receiver_user_id: receiverUserId,
      intro_message: introMessage.trim() || null,
      status: 'pending',
    })
    .select()
    .single();

  return {
    data: (data as ConnectionRequest | null) ?? null,
    error: error?.message ?? null,
  };
}

export async function getIncomingRequests(userId: string) {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('receiver_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return {
    data: (data as ConnectionRequest[]) ?? [],
    error: error?.message ?? null,
  };
}

export async function getOutgoingRequests(userId: string) {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('sender_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return {
    data: (data as ConnectionRequest[]) ?? [],
    error: error?.message ?? null,
  };
}

export async function updateRequestStatus(
  requestId: string,
  status: 'accepted' | 'declined' | 'canceled'
) {
  const { data, error } = await supabase
    .from('connection_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();

  return {
    data: (data as ConnectionRequest | null) ?? null,
    error: error?.message ?? null,
  };
}

export async function createMatch(userA: string, userB: string) {
  const a = [userA, userB].sort()[0];
  const b = [userA, userB].sort()[1];

  const { data: existing, error: existingError } = await supabase
    .from('matches')
    .select('*')
    .eq('user_a', a)
    .eq('user_b', b)
    .maybeSingle();

  if (existingError) {
    return {
      data: null,
      error: existingError.message,
    };
  }

  if (existing) {
    return {
      data: existing as Match,
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('matches')
    .insert({
      user_a: a,
      user_b: b,
    })
    .select()
    .single();

  return {
    data: (data as Match | null) ?? null,
    error: error?.message ?? null,
  };
}