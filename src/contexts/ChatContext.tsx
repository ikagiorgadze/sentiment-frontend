import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getAssistantEndpoint } from '@/lib/assistantConfig';
import { useAuth } from '@/contexts/AuthContext';
import * as chatService from '@/services/chatService';

type MessageRole = chatService.MessageRole;
type MessageStatus = 'ready' | 'pending' | 'error';

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: number;
  sourceMessageId?: number;
}

interface PaginationState {
  nextOffset: number;
  total: number;
  hasMore: boolean;
}

interface ChatContextValue {
  workspace: chatService.WorkspaceOverview | null;
  workspaceError: string | null;
  isWorkspaceLoading: boolean;
  activeChatId: string | null;
  activeChat: chatService.ChatSummary | null;
  isActiveChatLoading: boolean;
  messages: ConversationMessage[];
  hasMore: boolean;
  isLoadingMore: boolean;
  isSending: boolean;
  error: string | null;
  refreshWorkspace: (preferredChatId?: string | null) => Promise<void>;
  startNewChat: (options?: { projectId?: string | null; title?: string | null }) => Promise<chatService.ChatSummary | null>;
  selectChat: (chatId: string) => Promise<void>;
  sendMessage: (prompt: string) => Promise<void>;
  loadMore: () => Promise<void>;
  clearChat: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, title: string) => Promise<void>;
  moveChatToProject: (chatId: string, projectId: string | null) => Promise<void>;
  createProject: (payload: { name: string; description?: string | null }) => Promise<chatService.ChatProject | null>;
  updateProject: (projectId: string, payload: { name?: string | null; description?: string | null }) => Promise<chatService.ChatProject | null>;
  deleteProject: (projectId: string) => Promise<void>;
  clearWorkspaceHistory: () => Promise<void>;
  clearError: () => void;
}

const PAGE_SIZE = 20;

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createWelcomeMessage = (): ConversationMessage => ({
  id: makeId(),
  role: 'assistant',
  content:
    "Hi! I'm your political intelligence co-pilot. Ask about elections, coalitions, democratization, or policy shifts and I'll summarize recent reporting, academic perspectives, and relevant history.",
  status: 'ready',
  createdAt: Date.now(),
});

const chatExists = (workspace: chatService.WorkspaceOverview | null, chatId: string | null): boolean => {
  if (!workspace || !chatId) {
    return false;
  }
  return (
    workspace.standalone.some((chat) => chat.id === chatId) ||
    workspace.projects.some((group) => group.chats.some((chat) => chat.id === chatId))
  );
};

const firstAvailableChatId = (workspace: chatService.WorkspaceOverview | null): string | null => {
  if (!workspace) {
    return null;
  }
  if (workspace.standalone.length > 0) {
    return workspace.standalone[0].id;
  }
  for (const project of workspace.projects) {
    if (project.chats.length > 0) {
      return project.chats[0].id;
    }
  }
  return null;
};

const normalizeMessages = (messages: chatService.ChatMessage[]): ConversationMessage[] =>
  messages
    .map<ConversationMessage>((message) => ({
      id: message.id.toString(),
      role: message.role,
      content: message.content,
      status: 'ready',
      createdAt: new Date(message.created_at).getTime(),
      sourceMessageId: message.id,
    }))
    .reverse();

const deriveTitleFromContent = (content: string): string => {
  const firstLine = content.split('\n').find((line) => line.trim().length > 0) ?? content;
  const trimmed = firstLine.trim();
  if (!trimmed) {
    return 'New chat';
  }
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
};

const dedupeMessages = (messages: ConversationMessage[]): ConversationMessage[] => {
  const seen = new Set<string>();
  const result: ConversationMessage[] = [];
  for (const message of messages) {
    const key = message.sourceMessageId ? `${message.sourceMessageId}` : message.id;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(message);
    }
  }
  return result;
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const assistantEndpoint = useMemo(() => getAssistantEndpoint(), []);
  const { user, isAuthenticated } = useAuth();
  const [workspace, setWorkspace] = useState<chatService.WorkspaceOverview | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  const [messageStore, setMessageStore] = useState<Record<string, ConversationMessage[]>>({});
  const [paginationStore, setPaginationStore] = useState<Record<string, PaginationState>>({});
  const [isActiveChatLoading, setIsActiveChatLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const refreshWorkspace = useCallback(
    async (preferredChatId?: string | null) => {
      if (!isAuthenticated) {
        setWorkspace(null);
        setActiveChatId(null);
        setMessageStore({});
        setPaginationStore({});
        return;
      }

      setIsWorkspaceLoading(true);
      try {
        const data = await chatService.fetchWorkspaceOverview();
        setWorkspace(data);
        setWorkspaceError(null);

        const fallback = firstAvailableChatId(data);

        const desiredChat =
          (preferredChatId && chatExists(data, preferredChatId) && preferredChatId) ||
          (activeChatId && chatExists(data, activeChatId) && activeChatId) ||
          fallback;

        setActiveChatId(desiredChat ?? null);
      } catch (err) {
        console.error('Failed to load chat workspace:', err);
        setWorkspaceError('Failed to load workspace');
      } finally {
        setIsWorkspaceLoading(false);
      }
    },
    [activeChatId, isAuthenticated],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setWorkspace(null);
      setWorkspaceError(null);
      setActiveChatId(null);
      setMessageStore({});
      setPaginationStore({});
      return;
    }

    void refreshWorkspace();
  }, [isAuthenticated, refreshWorkspace]);

  useEffect(() => {
    const chatId = activeChatId;
    if (!chatId || !isAuthenticated) {
      setIsActiveChatLoading(false);
      return;
    }

    if (messageStore[chatId]) {
      setIsActiveChatLoading(false);
      return;
    }

    const loadMessages = async () => {
      setIsActiveChatLoading(true);
      try {
        const history = await chatService.getChatHistory(chatId, PAGE_SIZE, 0);
        const normalized = normalizeMessages(history.messages);

        setMessageStore((prev) => ({
          ...prev,
          [chatId]: normalized,
        }));

        setPaginationStore((prev) => ({
          ...prev,
          [chatId]: {
            nextOffset: history.messages.length,
            total: history.total,
            hasMore: history.hasMore,
          },
        }));
      } catch (err) {
        console.error('Failed to load chat messages:', err);
        setError('Failed to load chat messages');
      } finally {
        setIsActiveChatLoading(false);
      }
    };

    if (!messageStore[chatId]) {
      void loadMessages();
    }
  }, [activeChatId, isAuthenticated, messageStore]);

  const activeChat = useMemo(() => {
    if (!workspace || !activeChatId) {
      return null;
    }

    const standalone = workspace.standalone.find((chat) => chat.id === activeChatId);
    if (standalone) {
      return standalone;
    }

    for (const group of workspace.projects) {
      const match = group.chats.find((chat) => chat.id === activeChatId);
      if (match) {
        return match;
      }
    }

    return null;
  }, [workspace, activeChatId]);

  const messages = useMemo(() => {
    if (!activeChatId) {
      return [createWelcomeMessage()];
    }

    const chatMessages = messageStore[activeChatId];
    if (!chatMessages || chatMessages.length === 0) {
      return [createWelcomeMessage()];
    }

    return chatMessages;
  }, [activeChatId, messageStore]);

  const activePagination = activeChatId ? paginationStore[activeChatId] : undefined;
  const hasMore = activePagination?.hasMore ?? false;

  const clearError = useCallback(() => setError(null), []);

  const startNewChat = useCallback(
    async (options?: { projectId?: string | null; title?: string | null }) => {
      if (!isAuthenticated) {
        return null;
      }

      try {
        const chat = await chatService.createChatSession({
          projectId: options?.projectId ?? null,
          title: options?.title ?? null,
        });

        setMessageStore((prev) => ({
          ...prev,
          [chat.id]: [],
        }));
        setPaginationStore((prev) => ({
          ...prev,
          [chat.id]: {
            nextOffset: 0,
            total: 0,
            hasMore: false,
          },
        }));

        setActiveChatId(chat.id);
        activeChatIdRef.current = chat.id;

        await refreshWorkspace(chat.id);
        return chat;
      } catch (err) {
        console.error('Failed to start new chat:', err);
        setError('Failed to start a new chat');
        return null;
      }
    },
    [isAuthenticated, refreshWorkspace],
  );

  const selectChat = useCallback(async (chatId: string) => {
    if (activeChatIdRef.current === chatId) {
      return;
    }
    setActiveChatId(chatId);
    activeChatIdRef.current = chatId;
    if (!messageStore[chatId]) {
      setIsActiveChatLoading(true);
      try {
        const history = await chatService.getChatHistory(chatId, PAGE_SIZE, 0);
        const normalized = normalizeMessages(history.messages);
        setMessageStore((prev) => ({
          ...prev,
          [chatId]: normalized,
        }));
        setPaginationStore((prev) => ({
          ...prev,
          [chatId]: {
            nextOffset: history.messages.length,
            total: history.total,
            hasMore: history.hasMore,
          },
        }));
      } catch (err) {
        console.error('Failed to load chat messages:', err);
        setError('Failed to load chat messages');
      } finally {
        setIsActiveChatLoading(false);
      }
    }
  }, [messageStore]);

  const loadMore = useCallback(async () => {
    const chatId = activeChatIdRef.current;
    if (!chatId || isLoadingMore) {
      return;
    }

    const pagination = paginationStore[chatId];
    if (!pagination?.hasMore) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const offset = pagination.nextOffset ?? (messageStore[chatId]?.length ?? 0);
      const history = await chatService.getChatHistory(chatId, PAGE_SIZE, offset);
      const normalized = normalizeMessages(history.messages);

      setMessageStore((prev) => {
        const existing = prev[chatId] ?? [];
        return {
          ...prev,
          [chatId]: dedupeMessages([...normalized, ...existing]),
        };
      });

      setPaginationStore((prev) => ({
        ...prev,
        [chatId]: {
          nextOffset: offset + history.messages.length,
          total: history.total,
          hasMore: history.hasMore,
        },
      }));
    } catch (err) {
      console.error('Failed to load older messages:', err);
      setError('Failed to load older messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, messageStore, paginationStore]);

  const clearChat = useCallback(async () => {
    const chatId = activeChatIdRef.current;
    if (!chatId) {
      return;
    }

    try {
      await chatService.clearChat(chatId);
      setMessageStore((prev) => ({
        ...prev,
        [chatId]: [],
      }));
      setPaginationStore((prev) => ({
        ...prev,
        [chatId]: {
          nextOffset: 0,
          total: 0,
          hasMore: false,
        },
      }));
      await refreshWorkspace(chatId);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
      setError('Failed to clear chat history');
    }
  }, [refreshWorkspace]);

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        await chatService.deleteChatSession(chatId);
        setMessageStore((prev) => {
          const { [chatId]: _, ...rest } = prev;
          return rest;
        });
        setPaginationStore((prev) => {
          const { [chatId]: _, ...rest } = prev;
          return rest;
        });

        if (activeChatIdRef.current === chatId) {
          activeChatIdRef.current = null;
          setActiveChatId(null);
        }

        await refreshWorkspace();
      } catch (err) {
        console.error('Failed to delete chat session:', err);
        setError('Failed to delete chat');
      }
    },
    [refreshWorkspace],
  );

  const renameChat = useCallback(
    async (chatId: string, title: string) => {
      try {
        await chatService.updateChatSession(chatId, { title: title.trim() });
        await refreshWorkspace(chatId);
      } catch (err) {
        console.error('Failed to rename chat:', err);
        setError('Failed to rename chat');
      }
    },
    [refreshWorkspace],
  );

  const moveChatToProject = useCallback(
    async (chatId: string, projectId: string | null) => {
      try {
        await chatService.updateChatSession(chatId, { projectId });
        await refreshWorkspace(chatId);
      } catch (err) {
        console.error('Failed to move chat:', err);
        setError('Failed to move chat');
      }
    },
    [refreshWorkspace],
  );

  const createProject = useCallback(
    async (payload: { name: string; description?: string | null }) => {
      try {
        const project = await chatService.createProject(payload);
        await refreshWorkspace(activeChatIdRef.current);
        return project;
      } catch (err) {
        console.error('Failed to create project:', err);
        setError('Failed to create project');
        return null;
      }
    },
    [refreshWorkspace],
  );

  const updateProject = useCallback(
    async (projectId: string, payload: { name?: string | null; description?: string | null }) => {
      try {
        const project = await chatService.updateProject(projectId, payload);
        await refreshWorkspace(activeChatIdRef.current);
        return project;
      } catch (err) {
        console.error('Failed to update project:', err);
        setError('Failed to update project');
        return null;
      }
    },
    [refreshWorkspace],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        await chatService.deleteProject(projectId);
        await refreshWorkspace(activeChatIdRef.current);
      } catch (err) {
        console.error('Failed to delete project:', err);
        setError('Failed to delete project');
      }
    },
    [refreshWorkspace],
  );

  const clearWorkspaceHistory = useCallback(async () => {
    try {
      await chatService.clearWorkspace();
      setMessageStore({});
      setPaginationStore({});
      setActiveChatId(null);
      activeChatIdRef.current = null;
      await refreshWorkspace();
    } catch (err) {
      console.error('Failed to clear workspace history:', err);
      setError('Failed to clear workspace');
    }
  }, [refreshWorkspace]);

  const sendMessage = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || isSending) {
        return;
      }

      if (!isAuthenticated) {
        setError('You must be signed in to chat.');
        return;
      }

      setError(null);

      let chatId = activeChatIdRef.current;
      if (!chatId) {
        const chat = await startNewChat();
        chatId = chat?.id ?? null;
      }

      if (!chatId) {
        setError('Unable to start a new chat session.');
        return;
      }

      const userMessage: ConversationMessage = {
        id: makeId(),
        role: 'user',
        content: trimmed,
        status: 'ready',
        createdAt: Date.now(),
      };

      const assistantPlaceholder: ConversationMessage = {
        id: makeId(),
        role: 'assistant',
        content: 'Analyzing your question...',
        status: 'pending',
        createdAt: Date.now(),
      };

      setMessageStore((prev) => {
        const existing = prev[chatId!] ?? [];
        return {
          ...prev,
          [chatId!]: [...existing, userMessage, assistantPlaceholder],
        };
      });

      setIsSending(true);

      const historyForN8N = (messageStore[chatId] ?? [])
        .filter((message) => message.status === 'ready')
        .slice(-6)
        .map(({ role, content }) => ({ role, content }));

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const response = await fetch(assistantEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatInput: trimmed,
            history: historyForN8N,
            auth_user_id: user?.id,
          }),
          signal: controller.signal,
          keepalive: true,
        });

        const rawText = await response.text();
        if (!response.ok) {
          throw new Error(rawText || 'Assistant is unavailable right now. Please try again.');
        }

        const formatted = rawText.trim() || 'No analysis was returned for that prompt.';

        setMessageStore((prev) => {
          const existing = prev[chatId!] ?? [];
          return {
            ...prev,
            [chatId!]: existing.map((message) =>
              message.id === assistantPlaceholder.id
                ? { ...message, content: formatted, status: 'ready' as MessageStatus, createdAt: Date.now() }
                : message,
            ),
          };
        });

        try {
          const savedMessages = await chatService.saveChatMessages(chatId, [
            { role: 'user', content: trimmed },
            { role: 'assistant', content: formatted },
          ]);

          const userSaved = savedMessages.find((message) => message.role === 'user');
          const assistantSaved = savedMessages.find((message) => message.role === 'assistant');

          setMessageStore((prev) => {
            const existing = prev[chatId!] ?? [];
            return {
              ...prev,
              [chatId!]: dedupeMessages(
                existing.map((message) => {
                  if (userSaved && message.id === userMessage.id) {
                    return {
                      ...message,
                      id: userSaved.id.toString(),
                      sourceMessageId: userSaved.id,
                      createdAt: new Date(userSaved.created_at).getTime(),
                    };
                  }
                  if (assistantSaved && message.id === assistantPlaceholder.id) {
                    return {
                      ...message,
                      id: assistantSaved.id.toString(),
                      sourceMessageId: assistantSaved.id,
                      createdAt: new Date(assistantSaved.created_at).getTime(),
                    };
                  }
                  return message;
                }),
              ),
            };
          });

          setPaginationStore((prev) => {
            const existing = prev[chatId!] ?? { nextOffset: 0, total: 0, hasMore: false };
            return {
              ...prev,
              [chatId!]: {
                nextOffset: existing.nextOffset,
                total: existing.total + savedMessages.length,
                hasMore: existing.hasMore,
              },
            };
          });

          const shouldRename =
            !activeChat?.title ||
            activeChat.title.trim().length === 0 ||
            activeChat.title.toLowerCase() === 'new chat';

          if (shouldRename) {
            await chatService.updateChatSession(chatId, { title: deriveTitleFromContent(trimmed) });
            await refreshWorkspace(chatId);
          } else {
            await refreshWorkspace(chatId);
          }
        } catch (dbErr) {
          console.error('Failed to save chat messages:', dbErr);
        }
      } catch (err) {
        const fallback =
          err instanceof DOMException && err.name === 'AbortError'
            ? 'Assistant request was interrupted. Please try again.'
            : err instanceof Error
              ? err.message
              : 'Unable to fetch the analysis. Please try again later.';

        setMessageStore((prev) => {
          const existing = prev[chatId!] ?? [];
          return {
            ...prev,
            [chatId!]: existing.map((message) =>
              message.id === assistantPlaceholder.id
                ? { ...message, content: fallback, status: 'error' as MessageStatus }
                : message,
            ),
          };
        });
        setError(fallback);
      } finally {
        setIsSending(false);
        controllerRef.current = null;
      }
    },
    [
      activeChat?.title,
      assistantEndpoint,
      isAuthenticated,
      isSending,
      messageStore,
      refreshWorkspace,
      startNewChat,
      user?.id,
    ],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      workspace,
      workspaceError,
      isWorkspaceLoading,
      activeChatId,
      activeChat,
      isActiveChatLoading,
      messages,
      hasMore,
      isLoadingMore,
      isSending,
      error,
      refreshWorkspace,
      startNewChat,
      selectChat,
      sendMessage,
      loadMore,
      clearChat,
      deleteChat,
      renameChat,
      moveChatToProject,
      createProject,
      updateProject,
      deleteProject,
      clearWorkspaceHistory,
      clearError,
    }),
    [
      workspace,
      workspaceError,
      isWorkspaceLoading,
      activeChatId,
      activeChat,
      isActiveChatLoading,
      messages,
      hasMore,
      isLoadingMore,
      isSending,
      error,
      refreshWorkspace,
      startNewChat,
      selectChat,
      sendMessage,
      loadMore,
      clearChat,
      deleteChat,
      renameChat,
      moveChatToProject,
      createProject,
      updateProject,
      deleteProject,
      clearWorkspaceHistory,
      clearError,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
