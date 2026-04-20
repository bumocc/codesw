import { ProviderDef } from "./types";

export const volcengine: ProviderDef = {
  id: "volcengine",
  displayName: "火山方舟 API",
  apiKeyUrl: "https://console.volcengine.com/ark",
  models: [
    "doubao-seed-2.0-code",
    "doubao-seed-2.0-pro",
    "doubao-seed-2.0-lite",
    "doubao-seed-code",
    "minimax-m2.5",
    "glm-4.7",
    "deepseek-v3.2",
  ],
  defaultModel: "doubao-seed-2.0-code",
  endpoints: {
    anthropic: { baseUrl: "https://ark.cn-beijing.volces.com/api/compatible" },
    openai:    { baseUrl: "https://ark.cn-beijing.volces.com/api/v3" },
  },
};
