import { ProviderDef } from "./types";

export const kimiCoding: ProviderDef = {
  id: "kimi-coding",
  displayName: "Kimi Coding Plan",
  apiKeyUrl: "https://platform.moonshot.cn/",
  models: ["kimi-for-coding"],
  defaultModel: "kimi-for-coding",
  endpoints: {
    anthropic: { baseUrl: "https://api.kimi.com/coding/" },
    openai:    { baseUrl: "https://api.kimi.com/coding/v1" },
  },
};
