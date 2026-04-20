import { ProviderDef } from "./types";

export const bailianCoding: ProviderDef = {
  id: "bailian-coding",
  displayName: "百炼 Coding Plan",
  apiKeyUrl: "https://bailian.console.aliyun.com/",
  models: ["qwen3.6-plus", "kimi-k2.5", "glm-5", "MiniMax-M2.5"],
  defaultModel: "glm-5",
  endpoints: {
    anthropic: { baseUrl: "https://coding.dashscope.aliyuncs.com/apps/anthropic" },
    openai:    { baseUrl: "https://coding.dashscope.aliyuncs.com/v1" },
  },
};
