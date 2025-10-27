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
}

const MAX_HISTORY = 40;

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

export function ChatProvider({ children }: { children: ReactNode }) {
  const assistantEndpoint = useMemo(() => getAssistantEndpoint(), []);
  const { user } = useAuth();
  const userIdentifier = user?.id || user?.email || 'guest';
  const storageKey = useMemo(() => `ai-assistant-history-${userIdentifier}`, [userIdentifier]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(storageKey));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const isSendingRef = useRef(false);

  useEffect(() => {
    const nextMessages = loadMessages(storageKey);
    setMessages(nextMessages);
    setError(null);
  }, [storageKey]);

  useEffect(() => {
    messagesRef.current = messages;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (storageError) {
      console.warn('Unable to persist chat history', storageError);
    }
  }, [messages, storageKey]);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const sendMessage = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || isSendingRef.current) {
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

      const placeholderId = assistantPlaceholder.id;

      const historyWindow = [...messagesRef.current, userMessage]
        .filter((msg) => msg.role !== 'assistant' || msg.status === 'ready')
        .slice(-6)
        .map(({ role, content }) => ({ role, content }));

      setMessages((prev) => {
        const next = [...prev, userMessage, assistantPlaceholder];
        return next.slice(-MAX_HISTORY);
      });

      setIsSending(true);
      isSendingRef.current = true;

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
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
        });

        const rawText = await response.text();
        if (!response.ok) {
          throw new Error(rawText || 'Assistant is unavailable right now. Please try again.');
        }

        const formatted = rawText.trim() || 'No analysis was returned for that prompt.';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === placeholderId
              ? { ...msg, content: formatted, status: 'ready', createdAt: Date.now() }
              : msg,
          ),
        );
      } catch (err) {
        const fallback =
          err instanceof Error
            ? err.message
            : 'Unable to fetch the analysis. Please try again later.';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === placeholderId
              ? {
                  ...msg,
                  content: fallback,
                  status: 'error',
                  createdAt: Date.now(),
                }
              : msg,
          ),
        );
        setError(fallback);
      } finally {
        setIsSending(false);
        isSendingRef.current = false;
        controllerRef.current = null;
      }
    },
    [assistantEndpoint, user?.id],
  );

  const value = useMemo(
    () => ({
      messages,
      isSending,
      error,
      sendMessage,
      clearError,
    }),
    [messages, isSending, error, sendMessage, clearError],
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
