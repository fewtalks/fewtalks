

export interface Tweet {
  text: string;
  imageBase64?: string;
}

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  isPro?: boolean;
}

// History Types
export type HistoryItemType = 'tweet' | 'image' | 'video';

export interface BaseHistoryItem {
  id: string;
  type: HistoryItemType;
  createdAt: string;
}

export interface TweetHistoryItem extends BaseHistoryItem {
  type: 'tweet';
  text: string;
}

export interface ImageHistoryItem extends BaseHistoryItem {
  type: 'image';
  prompt: string;
  style: string;
  imageBase64: string;
}

export interface VideoHistoryItem extends BaseHistoryItem {
  type: 'video';
  prompt: string;
  videoUrl: string;
}

export type HistoryItem = TweetHistoryItem | ImageHistoryItem | VideoHistoryItem;