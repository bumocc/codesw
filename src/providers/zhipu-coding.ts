import { ProviderDef } from "./types";

const MODELS = ["glm-5.1", "glm-5", "glm-4.7", "glm-4.5-air", "glm-4.7-flashx", "glm-4.7-flash"];

export const zhipuCoding: ProviderDef = {
  id: "zhipu-coding",
  displayName: "智谱 AI Coding Plan",
  apiKeyUrl: "https://open.bigmodel.cn/",
  models: MODELS,
  defaultModel: "glm-5.1",
  endpoints: {
    anthropic: { baseUrl: "https://open.bigmodel.cn/api/anthropic" },
    openai:    { baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4" },
  },
};
