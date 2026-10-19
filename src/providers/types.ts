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
  /** 英文界面使用的名称，不填则与 displayName 相同 */
  displayNameEn?: string;
  /** 选择供应商时显示在名称后的一句话说明 */
  desc?: string;
  descEn?: string;
  /** endpoints keyed by protocol */
  endpoints: Partial<Record<ProtocolKind, ProviderEndpoint>>;
  /** URL to create / manage API keys */
  apiKeyUrl?: string;
  /** 可选模型列表（交互选择时展示；配置了 modelsUrl 时作为拉取失败的兜底） */
  models?: string[];
  /** 推荐模型，列表中排在前面并标注「推荐」 */
  featured?: string[];
  /** 默认模型（未在 endpoints 中单独指定时使用） */
  defaultModel?: string;
  /** 小模型（Claude Code 的 Haiku / 后台任务），不填则与主模型相同 */
  smallModel?: string;
  /** OpenAI 兼容的 /v1/models 地址，交互时实时拉取最新模型列表 */
  modelsUrl?: string;
  /** 历史地址，用于识别客户端里仍在使用旧地址的配置 */
  legacyBaseUrls?: string[];
  /** 历史 id，兼容旧版本保存的数据 */
  legacyIds?: string[];
}
