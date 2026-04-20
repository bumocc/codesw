import { ProviderDef } from "./types";

export const volcengineCoding: ProviderDef = {
  id: "volcengine-coding",
  displayName: "火山方舟 Coding Plan",
  apiKeyUrl: "https://console.volcengine.com/ark",
  models: [
    "doubao-seed-2.0-code",
    "doubao-seed-2.0-pro",
    "doubao-seed-2.0-lite",
    "doubao-seed-code",
    "minimax-m2.5",
    "glm-4.7",
    "deepseek-v3.2",
    "kimi-k2.5",
  ],
  defaultModel: "kimi-k2.5",
  endpoints: {
    anthropic: { baseUrl: "https://ark.cn-beijing.volces.com/api/coding" },
    openai:    { baseUrl: "https://ark.cn-beijing.volces.com/api/coding/v3" },
  },
};
