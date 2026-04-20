import { ProviderDef } from "./types";

export const kimi: ProviderDef = {
  id: "kimi",
  displayName: "Kimi API",
  apiKeyUrl: "https://platform.moonshot.cn/",
  models: ["kimi-k2.5"],
  defaultModel: "kimi-k2.5",
  endpoints: {
    anthropic: { baseUrl: "https://api.moonshot.cn/anthropic" },
    openai:    { baseUrl: "https://api.moonshot.cn/v1" },
  },
};
