import { ProviderDef } from "./types";

export const bumoAi: ProviderDef = {
  id: "bumo.ai",
  displayName: "BUMO API",
  apiKeyUrl: "https://api.bumo.ai/user/api-keys",
  models: [
    "claude-opus-4-7",
    "claude-opus-4-6",
    "claude-sonnet-4-6",
    "claude-opus-4-5",
    "claude-sonnet-4-5",
    "claude-haiku-4-5",
    "gpt-5.4",
    "gpt-5.4-mini",
    "gpt-5.3-codex",
    "gemini-3.1-pro-preview",
  ],
  defaultModel: "claude-sonnet-4-6",
  endpoints: {
    anthropic: { baseUrl: "https://api.bumo.ai" },
    openai: { baseUrl: "https://api.bumo.ai/v1" },
  },
};
