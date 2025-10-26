const DEFAULT_BASE_URL = 'http://localhost:5678';
const DEFAULT_CHAT_WEBHOOK_ID = '357893d0-7b87-47b9-bd94-3dee78a79659';

const sanitize = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const trimTrailingSlash = (value: string) => (value.endsWith('/') ? value.slice(0, -1) : value);

export const getAssistantEndpoint = () => {
  const directUrl = sanitize(import.meta.env.VITE_AI_ASSISTANT_URL as string | undefined);
  if (directUrl) {
    return directUrl;
  }

  const legacyBase = sanitize(import.meta.env.VITE_N8N_BASE_URL as string | undefined);
  const legacyWebhook = sanitize(import.meta.env.VITE_N8N_CHAT_WEBHOOK_ID as string | undefined);
  if (legacyBase && legacyWebhook) {
    return `${trimTrailingSlash(legacyBase)}/chat/${legacyWebhook}`;
  }

  return `${DEFAULT_BASE_URL}/chat/${DEFAULT_CHAT_WEBHOOK_ID}`;
};
