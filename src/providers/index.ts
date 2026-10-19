import { ProviderDef } from "./types";
import { zhipu } from "./zhipu";
import { zhipuCoding } from "./zhipu-coding";
import { bailian } from "./bailian";
import { bailianCoding } from "./bailian-coding";
import { volcengine } from "./volcengine";
import { volcengineCoding } from "./volcengine-coding";
import { minimax } from "./minimax";
import { kimi } from "./kimi";
import { kimiCoding } from "./kimi-coding";
import { bumoCc } from "./bumo-cc";
import { bumoAi } from "./bumo-ai";
import { isZh } from "../i18n";

export { ProviderDef, ProviderEndpoint, ProtocolKind } from "./types";

const localize = (p: ProviderDef): ProviderDef =>
  isZh ? p : { ...p, displayName: p.displayNameEn ?? p.displayName, desc: p.descEn ?? p.desc };

export const PROVIDERS: ProviderDef[] = [
  bumoCc,
  bumoAi,
  zhipu,
  zhipuCoding,
  bailian,
  bailianCoding,
  volcengine,
  volcengineCoding,
  minimax,
  kimi,
  kimiCoding,
].map(localize);

export function getProvider(id: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.id === id || p.legacyIds?.includes(id));
}

const norm = (u: string) => u.trim().replace(/\/+$/, "").toLowerCase();

/** 根据客户端配置里的 baseUrl 反查供应商；legacy=true 表示用的是旧地址 */
export function matchBaseUrl(url?: string): { provider: ProviderDef; legacy: boolean } | undefined {
  if (!url) return undefined;
  const u = norm(url);
  for (const p of PROVIDERS) {
    const eps = Object.values(p.endpoints).map((e) => norm(e!.baseUrl));
    if (eps.includes(u)) return { provider: p, legacy: false };
    if (p.legacyBaseUrls?.some((l) => norm(l) === u)) return { provider: p, legacy: true };
  }
  return undefined;
}

export function defaultModelOf(p: ProviderDef): string {
  return p.defaultModel ?? p.endpoints.anthropic?.defaultModel ?? p.endpoints.openai?.defaultModel ?? p.models?.[0] ?? "";
}

export interface ModelList {
  models: string[];
  featured: string[];
  /** true 表示来自线上实时列表 */
  live: boolean;
}

/** 有 modelsUrl 的供应商实时拉取模型列表，失败时回退到内置列表 */
export async function loadModels(p: ProviderDef, timeoutMs = 5000): Promise<ModelList> {
  const fallback: ModelList = { models: p.models ?? [], featured: p.featured ?? [], live: false };
  if (!p.modelsUrl || typeof fetch !== "function") return fallback;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(p.modelsUrl, { signal: ctrl.signal, headers: { "User-Agent": "codesw" } });
    if (!res.ok) return fallback;
    const body: any = await res.json();
    const data: any[] = Array.isArray(body?.data) ? body.data : [];
    // 只要对话模型，图片等其他类型的模型在 Code 客户端里用不了
    const chat = data.filter((m) => typeof m?.id === "string" && m.category === "chat");
    if (!chat.length) return fallback;
    const models: string[] = chat.map((m) => m.id);
    // 推荐优先用内置的精选（线上 featured 标得较多），已下架的自动去掉
    const curated = (p.featured ?? []).filter((m) => models.includes(m));
    return {
      models,
      featured: curated.length ? curated : chat.filter((m) => m.featured).map((m) => m.id),
      live: true,
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
