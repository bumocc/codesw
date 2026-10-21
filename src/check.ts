import { ProtocolKind, ProviderDef } from "./providers";

/** 连通自检的结论：通了 / Key 无效 / 模型不存在 / 余额或额度不足 / 连不上 / 其他错误 */
export type CheckOutcome = "ok" | "auth" | "model" | "balance" | "network" | "error";

export interface CheckResult {
  outcome: CheckOutcome;
  ms: number;
  /** 供应商返回的原始错误信息，帮助用户自己判断 */
  detail?: string;
}

/** 按 HTTP 状态码 + 错误文案归类；各家供应商措辞不一，状态码优先，文案兜底 */
export function classify(status: number, message = ""): CheckOutcome {
  const msg = message.toLowerCase();
  if (status >= 200 && status < 300) return "ok";
  if (status === 401 || status === 403 || /invalid.*(api[_ ]?key|token)|unauthori[sz]ed|authentication/.test(msg)) return "auth";
  if (status === 402 || /balance|insufficient|quota|credit|余额|欠费|额度/.test(msg)) return "balance";
  if (status === 404 || /model.*(not (found|exist)|does not exist|unsupported|invalid)|no such model|模型不存在|不支持.*模型/.test(msg)) return "model";
  return "error";
}

function errorMessage(body: any): string {
  if (!body || typeof body !== "object") return "";
  const e = body.error ?? body;
  return String(e?.message ?? e?.msg ?? body.message ?? "");
}

/** 用该客户端实际走的协议发一次最小请求（max_tokens=1），费用可以忽略 */
export async function check(
  provider: ProviderDef,
  protocol: ProtocolKind,
  apiKey: string,
  model: string,
  timeoutMs = 20000,
): Promise<CheckResult> {
  const ep = provider.endpoints[protocol];
  const start = Date.now();
  if (!ep) return { outcome: "error", ms: 0 };
  const base = ep.baseUrl.replace(/\/+$/, "");
  const [url, headers, body] =
    protocol === "anthropic"
      ? [
          `${base}/v1/messages`,
          { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}`, "anthropic-version": "2023-06-01" },
          { model, max_tokens: 1, messages: [{ role: "user", content: "ping" }] },
        ]
      : [
          `${base}/chat/completions`,
          { Authorization: `Bearer ${apiKey}` },
          { model, max_tokens: 1, messages: [{ role: "user", content: "ping" }] },
        ];

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "User-Agent": "codesw", ...headers },
      body: JSON.stringify(body),
    });
    let json: any = null;
    try {
      json = await res.json();
    } catch {}
    const detail = errorMessage(json);
    return { outcome: classify(res.status, detail), ms: Date.now() - start, detail: res.ok ? undefined : detail || `HTTP ${res.status}` };
  } catch (e: any) {
    return { outcome: "network", ms: Date.now() - start, detail: e?.name === "AbortError" ? "timeout" : e?.message };
  } finally {
    clearTimeout(timer);
  }
}
