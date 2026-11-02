import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProviderDef } from "../providers";
import { ApplyInput, CurrentConfig, openaiEndpoint, readJson, sameUrl } from "./shared";

// Factory Droid 的 BYOK 配置；不登录 Factory 也能用 customModels 里的模型
const FILE = path.join(os.homedir(), ".factory", "settings.json");
// Droid 里自定义模型的 id 是 custom:<model>
const PREFIX = "custom:";

export function applyDroid(input: ApplyInput, provider: ProviderDef, models: string[]): string {
  const ep = openaiEndpoint(provider);

  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const cfg: any = readJson(FILE);
  // 先清掉本供应商的旧条目，避免已下架的模型残留在 /model 列表里
  const others = (Array.isArray(cfg.customModels) ? cfg.customModels : []).filter(
    (m: any) => !(m && typeof m.baseUrl === "string" && sameUrl(m.baseUrl, provider)),
  );
  cfg.customModels = [
    ...Array.from(new Set([input.model, ...models])).map((m) => ({
      model: m,
      displayName: `${m} (${provider.displayName})`,
      baseUrl: ep.baseUrl,
      apiKey: input.apiKey,
      provider: "generic-chat-completion-api",
      maxOutputTokens: 8192,
    })),
    ...others,
  ];
  // droid / droid exec 不带 -m 时用的默认模型
  cfg.sessionDefaultSettings = { ...cfg.sessionDefaultSettings, model: PREFIX + input.model };

  fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  return FILE;
}

export function currentDroid(): CurrentConfig | undefined {
  if (!fs.existsSync(FILE)) return undefined;
  const cfg = readJson(FILE);
  const id = cfg.sessionDefaultSettings?.model;
  if (typeof id !== "string") return undefined;
  if (!id.startsWith(PREFIX)) return { official: true };
  const model = id.slice(PREFIX.length);
  const m = (Array.isArray(cfg.customModels) ? cfg.customModels : []).find((x: any) => x?.model === model);
  return { baseUrl: m?.baseUrl, model };
}
