import { HistoryItem, TweetHistoryItem, ImageHistoryItem, VideoHistoryItem } from '../types';
import { v4 as uuidv4 } from 'uuid'; // Simple unique ID generation

const MAX_IMAGE_HISTORY_ITEMS = 3; // Limit the number of stored images to prevent quota issues.
export const FREE_GENERATION_LIMIT = 5;

// Helper to get a user-specific key
const getStorageKey = (userEmail: string): string => `fewtalks_history_${userEmail}`;
const getUsageKey = (userEmail: string): string => `fewtalks_usage_${userEmail}`;

// Get usage for a user
export const getUsage = (userEmail: string): { count: number; remaining: number } => {
  try {
    const usageCount = parseInt(localStorage.getItem(getUsageKey(userEmail)) || '0', 10);
    const remaining = Math.max(0, FREE_GENERATION_LIMIT - usageCount);
    return { count: usageCount, remaining };
  } catch (error) {
    console.error("Failed to parse usage from localStorage", error);
    return { count: 0, remaining: FREE_GENERATION_LIMIT };
  }
};

// Increment usage for a user
export const incrementUsage = (userEmail: string): void => {
  const { count } = getUsage(userEmail);
  localStorage.setItem(getUsageKey(userEmail), String(count + 1));
};


// Get all history for a user
export const getHistory = (userEmail: string): HistoryItem[] => {
  try {
    const historyJson = localStorage.getItem(getStorageKey(userEmail));
    if (!historyJson) return [];
    const history = JSON.parse(historyJson) as HistoryItem[];
    // Sort by most recent first
    return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error)
  {
    console.error("Failed to parse history from localStorage", error);
    return [];
  }
};

// Add a new item to a user's history
export const addHistoryItem = (userEmail: string, itemData: Omit<TweetHistoryItem, 'id' | 'createdAt'> | Omit<ImageHistoryItem, 'id' | 'createdAt'> | Omit<VideoHistoryItem, 'id' | 'createdAt'>): void => {
  let history = getHistory(userEmail);

  // If the new item is an image, prune the history if it exceeds the max limit.
  if (itemData.type === 'image') {
    const imageItems = history.filter(item => item.type === 'image');
    if (imageItems.length >= MAX_IMAGE_HISTORY_ITEMS) {
      // History is sorted newest to oldest, so the last image in the filtered list is the oldest.
      const oldestImageId = imageItems[imageItems.length - 1].id;
      history = history.filter(item => item.id !== oldestImageId);
    }
  }

  const newItem: HistoryItem = {
    ...itemData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  const updatedHistory = [newItem, ...history];
  
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Failed to save history to localStorage. The data might be too large.", error);
    // The pruning logic above should prevent this in most cases, but we log if it still fails.
  }
};

// Clear history for a user, optionally by type
export const clearHistory = (userEmail: string, type?: 'tweet' | 'image' | 'video'): void => {
  if (type) {
    let history = getHistory(userEmail);
    history = history.filter(item => item.type !== type);
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(history));
  } else {
    localStorage.removeItem(getStorageKey(userEmail));
  }
};

// Quick and dirty UUID implementation if a library isn't available
const v4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}