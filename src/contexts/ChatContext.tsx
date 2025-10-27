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

interface MessageHistoryItem {
  role: MessageRole;
  content: string;
}

interface PendingRequestMeta {
  id: string;
  prompt: string;
  history: MessageHistoryItem[];
  createdAt: number;
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
  return {
    id: candidate.id,
    prompt: candidate.prompt,
    history: candidate.history.map(({ role, content }) => ({ role, content })),
    createdAt: candidate.createdAt,
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
  const pendingMetaRef = useRef<PendingRequestMeta | null>(null);
  const isSendingRef = useRef(false);

  const persistPendingMeta = useCallback(
    (meta: PendingRequestMeta | null) => {
      if (typeof window === 'undefined') return;
      const pendingKey = getPendingStorageKey(storageKey);
      if (meta) {
        window.localStorage.setItem(pendingKey, JSON.stringify(meta));
      } else {
        window.localStorage.removeItem(pendingKey);
      }
    },
    [storageKey],
  );

  useEffect(() => {
    const nextMessages = loadMessages(storageKey);
    setMessages(nextMessages);
    setError(null);

    if (typeof window === 'undefined') {
      pendingMetaRef.current = null;
      return;
    }

    const pendingKey = getPendingStorageKey(storageKey);
    const rawMeta = window.localStorage.getItem(pendingKey);
    if (!rawMeta) {
      pendingMetaRef.current = null;
      return;
    }
    try {
      const parsed = sanitizePendingMeta(JSON.parse(rawMeta));
      if (!parsed) {
        window.localStorage.removeItem(pendingKey);
        pendingMetaRef.current = null;
        return;
      }
      const hasPendingMessage = nextMessages.some(
        (msg) => msg.id === parsed.id && msg.role === 'assistant' && msg.status === 'pending',
      );
      if (!hasPendingMessage) {
        window.localStorage.removeItem(pendingKey);
        pendingMetaRef.current = null;
        return;
      }
      pendingMetaRef.current = parsed;
    } catch (metaError) {
      console.warn('Unable to restore pending assistant request', metaError);
      window.localStorage.removeItem(pendingKey);
      pendingMetaRef.current = null;
    }
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

  const updateAssistantMessage = useCallback((meta: PendingRequestMeta, updater: (prev: ChatMessage) => ChatMessage) => {
    setMessages((prev) => {
      const now = Date.now();
      let updated = false;
      const next = prev.map((msg) => {
        if (msg.id === meta.id) {
          updated = true;
          return updater({ ...msg, createdAt: now });
        }
        return msg;
      });

      if (updated) {
        return next;
      }

      // If the placeholder vanished (e.g., due to reload), append a new assistant message.
      const synthesized = updater({
        id: meta.id,
        role: 'assistant',
        content: '',
        status: 'pending',
        createdAt: now,
      });
      return [...prev, synthesized].slice(-MAX_HISTORY);
    });
  }, []);

  const triggerAssistantRequest = useCallback(
    async (meta: PendingRequestMeta) => {
      if (isSendingRef.current) {
        return;
      }

      pendingMetaRef.current = meta;
      persistPendingMeta(meta);
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
            chatInput: meta.prompt,
            history: meta.history,
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
        updateAssistantMessage(meta, (previous) => ({
          ...previous,
          content: formatted,
          status: 'ready',
        }));
      } catch (err) {
        const fallback =
          err instanceof DOMException && err.name === 'AbortError'
            ? 'Assistant request was interrupted. Please try again.'
            : err instanceof Error
              ? err.message
              : 'Unable to fetch the analysis. Please try again later.';

        updateAssistantMessage(meta, (previous) => ({
          ...previous,
          content: fallback,
          status: 'error',
        }));
        setError(fallback);
      } finally {
        setIsSending(false);
        isSendingRef.current = false;
        controllerRef.current = null;
        pendingMetaRef.current = null;
        persistPendingMeta(null);
      }
    },
    [assistantEndpoint, persistPendingMeta, updateAssistantMessage, user?.id],
  );

  useEffect(() => {
    if (isSendingRef.current) return;
    const pendingMeta = pendingMetaRef.current;
    if (!pendingMeta) return;

    const hasPendingMessage = messagesRef.current.some(
      (msg) => msg.id === pendingMeta.id && msg.role === 'assistant' && msg.status === 'pending',
    );

    if (!hasPendingMessage) {
      pendingMetaRef.current = null;
      persistPendingMeta(null);
      return;
    }

    // Avoid rapid replays; give the original request a moment before retrying.
    if (Date.now() - pendingMeta.createdAt < 500) {
      return;
    }

    const refreshedMeta: PendingRequestMeta = {
      ...pendingMeta,
      createdAt: Date.now(),
    };
    pendingMetaRef.current = refreshedMeta;
    persistPendingMeta(refreshedMeta);
    void triggerAssistantRequest(refreshedMeta);
  }, [messages, persistPendingMeta, triggerAssistantRequest]);

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

      setMessages((prev) => {
        const next = [...prev, userMessage, assistantPlaceholder];
        return next.slice(-MAX_HISTORY);
      });

      const historyWindow = buildHistoryWindow(messagesRef.current, userMessage);

      const pendingMeta: PendingRequestMeta = {
        id: assistantPlaceholder.id,
        prompt: trimmed,
        history: historyWindow,
        createdAt: Date.now(),
      };

      messagesRef.current = [...messagesRef.current, userMessage, assistantPlaceholder].slice(-MAX_HISTORY);
      await triggerAssistantRequest(pendingMeta);
    },
    [triggerAssistantRequest],
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
