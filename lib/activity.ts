import { supabase } from '@/lib/supabase';
import { getBlockedRelationships, getProfilesByUserIds } from '@/lib/social';
import type { ActivityItem, Post, PostComment, Profile } from '@/types';

type PostLikeRow = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

type RequestRow = {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  created_at: string;
  status: string;
};

export async function getActivityItems(userId: string, limit = 30) {
  const blockedResult = await getBlockedRelationships(userId);
  const blockedIds = new Set(blockedResult.data ?? []);

  const { data: myPosts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId);

  if (postsError) {
    return {
      data: [] as ActivityItem[],
      error: postsError.message,
    };
  }

  const typedPosts = (myPosts as Post[]) ?? [];
  const myPostIds = typedPosts.map((post) => post.id);
  const postMap: Record<string, Post> = {};
  for (const post of typedPosts) {
    postMap[post.id] = post;
  }

  const [likesResult, commentsResult, requestsResult] = await Promise.all([
    myPostIds.length > 0
      ? supabase
          .from('post_likes')
          .select('*')
          .in('post_id', myPostIds)
          .neq('user_id', userId)
      : Promise.resolve({ data: [], error: null }),
    myPostIds.length > 0
      ? supabase
          .from('post_comments')
          .select('*')
          .in('post_id', myPostIds)
          .neq('user_id', userId)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('connection_requests')
      .select('*')
      .eq('receiver_user_id', userId)
      .eq('status', 'pending'),
  ]);

  if (likesResult.error) {
    return {
      data: [] as ActivityItem[],
      error: likesResult.error.message,
    };
  }

  if (commentsResult.error) {
    return {
      data: [] as ActivityItem[],
      error: commentsResult.error.message,
    };
  }

  if (requestsResult.error) {
    return {
      data: [] as ActivityItem[],
      error: requestsResult.error.message,
    };
  }

  const likes = ((likesResult.data as PostLikeRow[]) ?? []).filter(
    (row) => !blockedIds.has(row.user_id)
  );

  const comments = ((commentsResult.data as PostComment[]) ?? []).filter(
    (row) => !blockedIds.has(row.user_id)
  );

  const requests = ((requestsResult.data as RequestRow[]) ?? []).filter(
    (row) => !blockedIds.has(row.sender_user_id)
  );

  const actorIds = [
    ...new Set([
      ...likes.map((row) => row.user_id),
      ...comments.map((row) => row.user_id),
      ...requests.map((row) => row.sender_user_id),
    ]),
  ];

  let profileMap: Record<string, Profile> = {};
  if (actorIds.length > 0) {
    const profilesResult = await getProfilesByUserIds(actorIds);
    if (!profilesResult.error) {
      for (const profile of profilesResult.data) {
        profileMap[profile.user_id] = profile;
      }
    }
  }

  const items: ActivityItem[] = [
    ...requests.map((row) => ({
      id: `request-${row.id}`,
      kind: 'request' as const,
      created_at: row.created_at,
      actor_user_id: row.sender_user_id,
      actor_profile: profileMap[row.sender_user_id] ?? null,
      request_id: row.id,
    })),
    ...likes.map((row) => ({
      id: `like-${row.id}`,
      kind: 'like' as const,
      created_at: row.created_at,
      actor_user_id: row.user_id,
      actor_profile: profileMap[row.user_id] ?? null,
      post_id: row.post_id,
      post_preview: postMap[row.post_id]?.content ?? null,
    })),
    ...comments.map((row) => ({
      id: `comment-${row.id}`,
      kind: 'comment' as const,
      created_at: row.created_at,
      actor_user_id: row.user_id,
      actor_profile: profileMap[row.user_id] ?? null,
      post_id: row.post_id,
      post_preview: postMap[row.post_id]?.content ?? null,
      comment_preview: row.body,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);

  return {
    data: items,
    error: null,
  };
}