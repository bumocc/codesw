import { ProviderDef } from "./types";

export const bumoCc: ProviderDef = {
  id: "bumo.cc",
  displayName: "不墨 API",
  apiKeyUrl: "https://api.bumo.cc/user/api-keys",
  models: [
    "glm/glm-5.1",
    "glm/glm-5",
    "glm/glm-4.7",
    "glm/glm-4.5-air",
    "kimi/kimi-k2.6",
    "kimi/kimi-k2.5",
    "deepseek/deepseek-v3.2",
    "qwen/qwen3.6-plus",
    "minimax/MiniMax-M2.7",
    "minimax/MiniMax-M2.7-highspeed",
  ],
  defaultModel: "glm/glm-5.1",
  endpoints: {
    anthropic: { baseUrl: "https://api.bumo.cc" },
    openai: { baseUrl: "https://api.bumo.cc/v1" },
  },
};
