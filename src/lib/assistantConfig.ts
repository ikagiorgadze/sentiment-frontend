// Use relative path to leverage nginx proxy (avoids CORS issues)
// nginx proxies /webhook/* to localhost:5678/webhook/*
const DEFAULT_WEBHOOK_PATH = '/webhook/chat/ad221486-cf3d-43e0-98b2-390192147713';

const sanitize = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const getAssistantEndpoint = () => {
  // Priority 1: Direct URL override (for development or custom deployments)
  const directUrl = sanitize(import.meta.env.VITE_AI_ASSISTANT_URL as string | undefined);
  if (directUrl) {
    return directUrl;
  }

  // Priority 2: Use default relative path (production)
  // This goes through nginx proxy, avoiding CORS issues
  return DEFAULT_WEBHOOK_PATH;
};
