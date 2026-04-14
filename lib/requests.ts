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

  const relationshipResult = await getRelationshipStatuses(senderUserId, [receiverUserId]);

  if (relationshipResult.error) {
    return { data: null, error: relationshipResult.error };
  }

  const relation = relationshipResult.data[receiverUserId];

  if (relation.state === 'friend') {
    return { data: null, error: 'This user is already your Mitra.' };
  }

  if (relation.state === 'incoming_request') {
    return { data: null, error: 'This user already sent you a request. Please respond from Requests.' };
  }

  if (relation.state === 'outgoing_request') {
    return { data: null, error: 'Request already sent.' };
  }

  if (relation.state === 'declined_limit_reached') {
    return { data: null, error: 'Request limit reached for this user.' };
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

export async function getPendingRequestCount(userId: string) {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('receiver_user_id', userId)
    .eq('status', 'pending');

  return {
    count: data?.length ?? 0,
    error: error?.message ?? null,
  };
}

import type { RelationshipStatus } from '@/types';

export async function getRelationshipStatuses(
  currentUserId: string,
  candidateUserIds: string[]
) {
  const uniqueIds = [...new Set(candidateUserIds)].filter(Boolean);

  const resultMap: Record<string, RelationshipStatus> = {};
  for (const id of uniqueIds) {
    resultMap[id] = {
      user_id: id,
      state: 'not_friend',
      declineCount: 0,
    };
  }

  if (uniqueIds.length === 0) {
    return { data: resultMap, error: null };
  }

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .or(
      uniqueIds
        .flatMap((id) => [`and(user_a.eq.${currentUserId},user_b.eq.${id})`, `and(user_a.eq.${id},user_b.eq.${currentUserId})`])
        .join(',')
    );

  if (matchError) {
    return { data: resultMap, error: matchError.message };
  }

  for (const match of matches ?? []) {
    const otherId =
      match.user_a === currentUserId ? match.user_b : match.user_a;
    if (resultMap[otherId]) {
      resultMap[otherId].state = 'friend';
    }
  }

  const { data: outgoingPending, error: outgoingError } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('sender_user_id', currentUserId)
    .eq('status', 'pending')
    .in('receiver_user_id', uniqueIds);

  if (outgoingError) {
    return { data: resultMap, error: outgoingError.message };
  }

  for (const row of outgoingPending ?? []) {
    if (resultMap[row.receiver_user_id] && resultMap[row.receiver_user_id].state !== 'friend') {
      resultMap[row.receiver_user_id].state = 'outgoing_request';
    }
  }

  const { data: incomingPending, error: incomingError } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('receiver_user_id', currentUserId)
    .eq('status', 'pending')
    .in('sender_user_id', uniqueIds);

  if (incomingError) {
    return { data: resultMap, error: incomingError.message };
  }

  for (const row of incomingPending ?? []) {
    if (resultMap[row.sender_user_id] && resultMap[row.sender_user_id].state !== 'friend') {
      resultMap[row.sender_user_id].state = 'incoming_request';
    }
  }

  const { data: declinedRows, error: declinedError } = await supabase
    .from('connection_requests')
    .select('receiver_user_id')
    .eq('sender_user_id', currentUserId)
    .eq('status', 'declined')
    .in('receiver_user_id', uniqueIds);

  if (declinedError) {
    return { data: resultMap, error: declinedError.message };
  }

  const counts: Record<string, number> = {};
  for (const row of declinedRows ?? []) {
    counts[row.receiver_user_id] = (counts[row.receiver_user_id] ?? 0) + 1;
  }

  for (const userId of uniqueIds) {
    if (resultMap[userId].state === 'friend') continue;
    if (resultMap[userId].state === 'incoming_request') continue;
    if (resultMap[userId].state === 'outgoing_request') continue;

    const count = counts[userId] ?? 0;
    resultMap[userId].declineCount = count;

    if (count >= 3) {
      resultMap[userId].state = 'declined_limit_reached';
    } else if (count === 2) {
      resultMap[userId].state = 'declined_twice';
    } else if (count === 1) {
      resultMap[userId].state = 'declined_once';
    }
  }

  return { data: resultMap, error: null };
}