import api from './api';

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: number;
  chat_id: string;
  user_id: string;
  role: MessageRole;
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

export interface ChatProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  active_chat_count: number;
  total_chat_count: number;
  last_activity: string | null;
}

export interface ChatSummary {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string | null;
  system_prompt: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  last_message_at: string | null;
  message_count?: number;
  last_message_preview?: string | null;
  last_message_role?: MessageRole | null;
}

export interface WorkspaceOverview {
  projects: Array<{
    project: ChatProject;
    chats: ChatSummary[];
  }>;
  standalone: ChatSummary[];
}

export const fetchWorkspaceOverview = async (): Promise<WorkspaceOverview> => {
  const response = await api.get<WorkspaceOverview>('/chat/workspace');
  return response.data;
};

export const listProjects = async (): Promise<ChatProject[]> => {
  const response = await api.get<ChatProject[]>('/chat/projects');
  return response.data;
};

export const createProject = async (payload: {
  name: string;
  description?: string | null;
  metadata?: any;
}): Promise<ChatProject> => {
  const response = await api.post<ChatProject>('/chat/projects', payload);
  return response.data;
};

export const updateProject = async (
  projectId: string,
  payload: { name?: string | null; description?: string | null; metadata?: any },
): Promise<ChatProject> => {
  const response = await api.patch<ChatProject>(`/chat/projects/${projectId}`, payload);
  return response.data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(`/chat/projects/${projectId}`);
};

export const listChatSummaries = async (includeArchived: boolean = false): Promise<ChatSummary[]> => {
  const response = await api.get<ChatSummary[]>('/chat/sessions', {
    params: { includeArchived },
  });
  return response.data;
};

export const createChatSession = async (payload: {
  projectId?: string | null;
  title?: string | null;
  systemPrompt?: string | null;
  metadata?: any;
}): Promise<ChatSummary> => {
  const response = await api.post<ChatSummary>('/chat/sessions', payload);
  return response.data;
};

export const getChatSession = async (chatId: string): Promise<ChatSummary> => {
  const response = await api.get<ChatSummary>(`/chat/sessions/${chatId}`);
  return response.data;
};

export const updateChatSession = async (
  chatId: string,
  payload: {
    projectId?: string | null;
    title?: string | null;
    systemPrompt?: string | null;
    metadata?: any;
    archived?: boolean;
  },
): Promise<ChatSummary> => {
  const response = await api.patch<ChatSummary>(`/chat/sessions/${chatId}`, payload);
  return response.data;
};

export const deleteChatSession = async (chatId: string): Promise<void> => {
  await api.delete(`/chat/sessions/${chatId}`);
};

export const saveChatMessage = async (
  chatId: string,
  payload: { role: MessageRole; content: string; metadata?: any },
): Promise<ChatMessage> => {
  const response = await api.post<ChatMessage>(`/chat/sessions/${chatId}/messages`, payload);
  return response.data;
};

export const saveChatMessages = async (
  chatId: string,
  messages: Array<{ role: MessageRole; content: string; metadata?: any }>,
): Promise<ChatMessage[]> => {
  const response = await api.post<ChatMessage[]>(`/chat/sessions/${chatId}/messages/batch`, {
    messages,
  });
  return response.data;
};

export const getChatHistory = async (
  chatId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<PaginatedChatMessages> => {
  const response = await api.get<PaginatedChatMessages>(`/chat/sessions/${chatId}/messages`, {
    params: { limit, offset },
  });
  return response.data;
};

export const clearChat = async (chatId: string): Promise<void> => {
  await api.delete(`/chat/sessions/${chatId}/messages`);
};

export const deleteChatMessage = async (chatId: string, messageId: number): Promise<void> => {
  await api.delete(`/chat/sessions/${chatId}/messages/${messageId}`);
};

export const getChatMessageCount = async (chatId: string): Promise<number> => {
  const response = await api.get<{ count: number }>(`/chat/sessions/${chatId}/count`);
  return response.data.count;
};

export const clearWorkspace = async (): Promise<void> => {
  await api.delete('/chat/workspace');
};
