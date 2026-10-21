import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProviderDef } from "../providers";
import { ApplyInput, CurrentConfig, openaiEndpoint, readJson } from "./shared";

// Cline CLI 的供应商配置，格式与 `cline auth -p openai-compatible` 写出的一致
const FILE = path.join(os.homedir(), ".cline", "data", "settings", "providers.json");
const ID = "openai-compatible";

export function applyCline(input: ApplyInput, provider: ProviderDef): string {
  const ep = openaiEndpoint(provider);

  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const cfg: any = readJson(FILE);
  cfg.version = cfg.version ?? 1;
  if (!cfg.providers || typeof cfg.providers !== "object") cfg.providers = {};
  cfg.providers[ID] = {
    settings: { provider: ID, apiKey: input.apiKey, model: input.model, baseUrl: ep.baseUrl },
    updatedAt: new Date().toISOString(),
    tokenSource: "manual",
  };
  cfg.lastUsedProvider = ID;

  fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  return FILE;
}

export function currentCline(): CurrentConfig | undefined {
  if (!fs.existsSync(FILE)) return undefined;
  const cfg = readJson(FILE);
  if (!cfg.lastUsedProvider) return undefined;
  const s = cfg.providers?.[cfg.lastUsedProvider]?.settings;
  // 用的是 Cline 自己的账号或其他内置供应商
  if (cfg.lastUsedProvider !== ID || !s?.baseUrl) return { official: true };
  return { baseUrl: s.baseUrl, model: s.model };
}
