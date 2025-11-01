import api from './api';

export interface ChatMessage {
  id: number;
  user_id: string; // UUID
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface PaginatedChatMessages {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}

/**
 * Save a chat message to the database
 */
export const saveChatMessage = async (role: 'user' | 'assistant', content: string, metadata?: any): Promise<ChatMessage> => {
  const response = await api.post<ChatMessage>('/chat/messages', {
    role,
    content,
    metadata,
  });
  return response.data;
};

/**
 * Save multiple messages at once
 */
export const saveChatMessages = async (messages: Array<{ role: 'user' | 'assistant'; content: string; metadata?: any }>): Promise<ChatMessage[]> => {
  const response = await api.post<ChatMessage[]>('/chat/messages/batch', {
    messages,
  });
  return response.data;
};

/**
 * Get paginated chat history
 */
export const getChatHistory = async (limit: number = 6, offset: number = 0): Promise<PaginatedChatMessages> => {
  const response = await api.get<PaginatedChatMessages>('/chat/messages', {
    params: { limit, offset },
  });
  return response.data;
};

/**
 * Get recent chat messages (for initial load)
 */
export const getRecentMessages = async (limit: number = 20): Promise<ChatMessage[]> => {
  const response = await api.get<ChatMessage[]>('/chat/messages/recent', {
    params: { limit },
  });
  return response.data;
};

/**
 * Clear all chat history
 */
export const clearChatHistory = async (): Promise<void> => {
  await api.delete('/chat/messages');
};

/**
 * Delete a specific message
 */
export const deleteChatMessage = async (messageId: number): Promise<void> => {
  await api.delete(`/chat/messages/${messageId}`);
};

/**
 * Get message count
 */
export const getChatMessageCount = async (): Promise<number> => {
  const response = await api.get<{ count: number }>('/chat/count');
  return response.data.count;
};
