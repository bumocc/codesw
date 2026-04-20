import { ProviderDef } from "./types";

export const minimax: ProviderDef = {
  id: "minimax",
  displayName: "MiniMax",
  apiKeyUrl: "https://platform.minimaxi.com/",
  endpoints: {
    anthropic: { baseUrl: "https://api.minimaxi.com/anthropic", defaultModel: "MiniMax-M2" },
    openai:    { baseUrl: "https://api.minimaxi.com/v1",         defaultModel: "MiniMax-M2" },
  },
};
