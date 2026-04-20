import { ProviderDef } from "./types";

export const zhipu: ProviderDef = {
  id: "zhipu",
  displayName: "智谱 AI (GLM)",
  apiKeyUrl: "https://open.bigmodel.cn/",
  endpoints: {
    anthropic: { baseUrl: "https://open.bigmodel.cn/api/anthropic", defaultModel: "glm-4.6" },
    openai:    { baseUrl: "https://open.bigmodel.cn/api/paas/v4",   defaultModel: "glm-4.6" },
  },
};
