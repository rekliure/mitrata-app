export type Gender = 'Woman' | 'Man' | 'Non-binary';

export type User = {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: Gender;
  city: string;
  bio: string;
  interests: string[];
  avatar: string;
  isPremium?: boolean;
};

export type SearchFilters = {
  query: string;
  city: string;
  minAge: number;
  maxAge: number;
  gender: string;
  premiumOnly: boolean;
};

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  mood: string;
  createdAt: string;
  likes: number;
};

export type Thread = {
  id: string;
  withUserId: string;
  withUserName: string;
  withAvatar: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};
