import { ProviderDef } from "./types";

export const bailian: ProviderDef = {
  id: "bailian",
  displayName: "百炼 API",
  apiKeyUrl: "https://bailian.console.aliyun.com/",
  models: ["qwen3.6-plus", "kimi-k2.5", "glm-5.1", "MiniMax-M2.5"],
  defaultModel: "glm-5.1",
  endpoints: {
    anthropic: { baseUrl: "https://dashscope.aliyuncs.com/apps/anthropic" },
    openai:    { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  },
};
