import { supabase } from '@/lib/supabase';
import type {
  FeedComment,
  FeedPost,
  Post,
  PostComment,
  PostVisibility,
  Profile,
} from '@/types';
import { getBlockedRelationships } from '@/lib/social';

export async function createPost(
  userId: string,
  content: string,
  mood: string | null,
  visibility: PostVisibility
) {
  const trimmed = content.trim();

  if (!trimmed) {
    return { data: null, error: 'Post content cannot be empty.' };
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content: trimmed,
      mood: mood?.trim() || null,
      visibility,
    })
    .select()
    .single();

  return {
    data: (data as Post | null) ?? null,
    error: error?.message ?? null,
  };
}

export async function getMyPosts(userId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return {
    data: (data as Post[]) ?? [],
    error: error?.message ?? null,
  };
}

export async function deletePost(postId: string, userId: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);

  return {
    error: error?.message ?? null,
  };
}

export async function likePost(postId: string, userId: string) {
  const { error } = await supabase.from('post_likes').insert({
    post_id: postId,
    user_id: userId,
  });

  return {
    error: error?.message ?? null,
  };
}

export async function unlikePost(postId: string, userId: string) {
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  return {
    error: error?.message ?? null,
  };
}

export async function createComment(
  postId: string,
  userId: string,
  body: string
) {
  const trimmed = body.trim();

  if (!trimmed) {
    return { data: null, error: 'Comment cannot be empty.' };
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: userId,
      body: trimmed,
    })
    .select()
    .single();

  return {
    data: (data as PostComment | null) ?? null,
    error: error?.message ?? null,
  };
}

export async function deleteComment(commentId: string, userId: string) {
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  return {
    error: error?.message ?? null,
  };
}

export async function getCommentsForPost(postId: string) {
  const { data: comments, error: commentsError } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (commentsError) {
    return {
      data: [] as FeedComment[],
      error: commentsError.message,
    };
  }

  const typedComments = (comments as PostComment[]) ?? [];
  const userIds = [...new Set(typedComments.map((comment) => comment.user_id))];

  if (userIds.length === 0) {
    return {
      data: [] as FeedComment[],
      error: null,
    };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', userIds);

  if (profilesError) {
    return {
      data: typedComments.map((comment) => ({ comment, profile: null })),
      error: profilesError.message,
    };
  }

  const profileMap: Record<string, Profile> = {};
  for (const profile of (profiles as Profile[]) ?? []) {
    profileMap[profile.user_id] = profile;
  }

  return {
    data: typedComments.map((comment) => ({
      comment,
      profile: profileMap[comment.user_id] ?? null,
    })),
    error: null,
  };
}

export async function getFeedPosts(currentUserId: string, limit = 20) {
  const blockedResult = await getBlockedRelationships(currentUserId);
  const blockedIds = new Set(blockedResult.data ?? []);

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (postsError) {
    return {
      data: [] as FeedPost[],
      error: postsError.message,
    };
  }

  const typedPosts = (posts as Post[]) ?? [];
  const visiblePosts = typedPosts.filter((post) => !blockedIds.has(post.user_id));

  const filteredPosts = visiblePosts.filter((post) => {
    if (post.visibility === 'public') return true;
    return post.user_id === currentUserId;
  });

  const profileIds = [...new Set(filteredPosts.map((post) => post.user_id))];
  const postIds = filteredPosts.map((post) => post.id);

  let profileMap: Record<string, Profile> = {};
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', profileIds);

    for (const profile of (profiles as Profile[]) ?? []) {
      profileMap[profile.user_id] = profile;
    }
  }

  let likesByPost: Record<string, number> = {};
  let likedByMeSet = new Set<string>();

  if (postIds.length > 0) {
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id,user_id')
      .in('post_id', postIds);

    for (const row of likes ?? []) {
      const postId = row.post_id as string;
      const likerId = row.user_id as string;

      likesByPost[postId] = (likesByPost[postId] ?? 0) + 1;
      if (likerId === currentUserId) {
        likedByMeSet.add(postId);
      }
    }
  }

  let commentsByPost: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: comments } = await supabase
      .from('post_comments')
      .select('post_id')
      .in('post_id', postIds);

    for (const row of comments ?? []) {
      const postId = row.post_id as string;
      commentsByPost[postId] = (commentsByPost[postId] ?? 0) + 1;
    }
  }

  return {
    data: filteredPosts.map((post) => ({
      post,
      profile: profileMap[post.user_id] ?? null,
      like_count: likesByPost[post.id] ?? 0,
      liked_by_me: likedByMeSet.has(post.id),
      comment_count: commentsByPost[post.id] ?? 0,
    })),
    error: null,
  };
}