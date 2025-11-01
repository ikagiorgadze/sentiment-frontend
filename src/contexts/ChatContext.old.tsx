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

type MessageRole = 'assistant' | 'user';
type MessageStatus = 'ready' | 'pending' | 'error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: number;
}

interface ChatContextValue {
  messages: ChatMessage[];
  isSending: boolean;
  error: string | null;
  sendMessage: (prompt: string) => Promise<void>;
  clearError: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

interface MessageHistoryItem {
  role: MessageRole;
  content: string;
}

interface PendingRequestMeta {
  id: string;
  prompt: string;
  history: MessageHistoryItem[];
  createdAt: number;
  userMessageId?: string;
  reconstructed?: boolean;
}

const MAX_HISTORY = 40;
const PENDING_META_SUFFIX = '::pending-meta';

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createWelcomeMessage = (): ChatMessage => ({
  id: makeId(),
  role: 'assistant',
  content:
    "Hi! I'm your political intelligence co-pilot. Ask about elections, coalitions, democratization, or policy shifts and I'll summarize recent reporting, academic perspectives, and relevant history.",
  status: 'ready',
  createdAt: Date.now(),
});

const getFallbackMessages = () => [createWelcomeMessage()];

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as ChatMessage;
  return (
    typeof candidate.id === 'string' &&
    (candidate.role === 'assistant' || candidate.role === 'user') &&
    typeof candidate.content === 'string' &&
    (candidate.status === 'ready' || candidate.status === 'pending' || candidate.status === 'error') &&
    typeof candidate.createdAt === 'number'
  );
};

const isHistoryItem = (value: unknown): value is MessageHistoryItem => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as MessageHistoryItem;
  return (
    (candidate.role === 'assistant' || candidate.role === 'user') && typeof candidate.content === 'string'
  );
};

const sanitizePendingMeta = (value: unknown): PendingRequestMeta | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as PendingRequestMeta;
  if (typeof candidate.id !== 'string' || typeof candidate.prompt !== 'string' || typeof candidate.createdAt !== 'number') {
    return null;
  }
  if (!Array.isArray(candidate.history) || !candidate.history.every(isHistoryItem)) {
    return null;
  }
  const userMessageId =
    typeof (candidate as PendingRequestMeta).userMessageId === 'string' &&
    (candidate as PendingRequestMeta).userMessageId.trim().length > 0
      ? (candidate as PendingRequestMeta).userMessageId
      : undefined;

  return {
    id: candidate.id,
    prompt: candidate.prompt,
    history: candidate.history.map(({ role, content }) => ({ role, content })),
    createdAt: candidate.createdAt,
    ...(userMessageId ? { userMessageId } : {}),
  };
};

const loadMessages = (key: string): ChatMessage[] => {
  if (typeof window === 'undefined') {
    return getFallbackMessages();
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return getFallbackMessages();
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const sanitized = parsed.filter(isChatMessage);
      if (sanitized.length) {
        return sanitized;
      }
    }
  } catch (error) {
    console.warn('Unable to restore chat history', error);
  }
  return getFallbackMessages();
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const buildHistoryWindow = (messages: ChatMessage[], upcoming?: ChatMessage): MessageHistoryItem[] => {
  const pool = upcoming ? [...messages, upcoming] : [...messages];
  return pool
    .filter((msg) => msg.role !== 'assistant' || msg.status === 'ready')
    .slice(-6)
    .map(({ role, content }) => ({ role, content }));
};

const getPendingStorageKey = (key: string) => `${key}${PENDING_META_SUFFIX}`;

export function ChatProvider({ children }: { children: ReactNode}) {
  const assistantEndpoint = useMemo(() => getAssistantEndpoint(), []);
  const { user, isAuthenticated } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage()]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  
  const controllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);

  // Load initial messages from database
  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([createWelcomeMessage()]);
      setHasMore(false);
      return;
    }

    const loadInitialMessages = async () => {
      try {
        const dbMessages = await chatService.getRecentMessages(20);
        if (dbMessages.length > 0) {
          const convertedMessages = dbMessages.map(msg => ({
            id: String(msg.id),
            role: msg.role,
            content: msg.content,
            status: 'ready' as MessageStatus,
            createdAt: new Date(msg.created_at).getTime(),
          }));
          setMessages(convertedMessages);
          setOffset(dbMessages.length);
          
          // Check if there are more messages
          const count = await chatService.getChatMessageCount();
          setHasMore(count > dbMessages.length);
        } else {
          setMessages([createWelcomeMessage()]);
          setHasMore(false);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setMessages([createWelcomeMessage()]);
      }
    };

    void loadInitialMessages();
  }, [isAuthenticated]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const loadMore = useCallback(async () => {
    if (!isAuthenticated || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const result = await chatService.getChatHistory(6, offset);
      if (result.messages.length > 0) {
        const convertedMessages = result.messages.reverse().map(msg => ({
          id: String(msg.id),
          role: msg.role,
          content: msg.content,
          status: 'ready' as MessageStatus,
          createdAt: new Date(msg.created_at).getTime(),
        }));
        setMessages(prev => [...convertedMessages, ...prev]);
        setOffset(prev => prev + result.messages.length);
        setHasMore(result.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
      setError('Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isAuthenticated, isLoadingMore, hasMore, offset]);

  const clearHistory = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await chatService.clearChatHistory();
      setMessages([createWelcomeMessage()]);
      setOffset(0);
      setHasMore(false);
    } catch (err) {
      console.error('Failed to clear history:', err);
      setError('Failed to clear history');
    }
  }, [isAuthenticated]);

  const sendMessage = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || isSending) {
        return;
      }

      setError(null);

      const userMessage: ChatMessage = {
        id: makeId(),
        role: 'user',
        content: trimmed,
        status: 'ready',
        createdAt: Date.now(),
      };

      const assistantPlaceholder: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: 'Analyzing your question...',
        status: 'pending',
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setIsSending(true);

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        // Build history window (last 10 messages for better context)
        const historyWindow = messagesRef.current
          .filter((msg) => msg.status === 'ready')
          .slice(-10)
          .map(({ role, content }) => ({ role, content }));

        const response = await fetch(assistantEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatInput: trimmed,
            history: historyWindow,
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
        
        // Update assistant message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholder.id
              ? { ...msg, content: formatted, status: 'ready' as MessageStatus }
              : msg
          )
        );

        // Save both messages to database if authenticated
        if (isAuthenticated) {
          try {
            await chatService.saveChatMessages([
              { role: 'user', content: trimmed },
              { role: 'assistant', content: formatted },
            ]);
          } catch (dbError) {
            console.error('Failed to save messages to database:', dbError);
            // Don't show error to user, messages are still in memory
          }
        }
      } catch (err) {
        const fallback =
          err instanceof DOMException && err.name === 'AbortError'
            ? 'Assistant request was interrupted. Please try again.'
            : err instanceof Error
              ? err.message
              : 'Unable to fetch the analysis. Please try again later.';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholder.id
              ? { ...msg, content: fallback, status: 'error' as MessageStatus }
              : msg
          )
        );
        setError(fallback);
      } finally {
        setIsSending(false);
        controllerRef.current = null;
      }
    },
    [assistantEndpoint, isSending, isAuthenticated, user?.id],
  );

  const value = useMemo(
    () => ({
      messages,
      isSending,
      error,
      sendMessage,
      clearError,
      hasMore,
      isLoadingMore,
      loadMore,
      clearHistory,
    }),
    [messages, isSending, error, sendMessage, clearError, hasMore, isLoadingMore, loadMore, clearHistory],
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
