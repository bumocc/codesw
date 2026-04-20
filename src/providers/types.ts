export type ProtocolKind = "anthropic" | "openai";

export interface ProviderEndpoint {
  baseUrl: string;
  /** default model id recommended for coding */
  defaultModel?: string;
  /** small/fast model id, for Claude Code ANTHROPIC_SMALL_FAST_MODEL */
  smallModel?: string;
}

export interface ProviderDef {
  id: string;
  displayName: string;
  /** endpoints keyed by protocol */
  endpoints: Partial<Record<ProtocolKind, ProviderEndpoint>>;
  /** URL to create / manage API keys */
  apiKeyUrl?: string;
  /** 可选模型列表（交互选择时展示） */
  models?: string[];
  /** 默认模型（未在 endpoints 中单独指定时使用） */
  defaultModel?: string;
}
