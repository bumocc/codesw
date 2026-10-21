import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProviderDef } from "../providers";
import { ApplyInput, CurrentConfig, openaiEndpoint, readJson } from "./shared";

const FILE = path.join(os.homedir(), ".qwen", "settings.json");

export function applyQwenCode(input: ApplyInput, provider: ProviderDef): string {
  const ep = openaiEndpoint(provider);

  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const cfg: any = readJson(FILE);
  if (!cfg.security || typeof cfg.security !== "object") cfg.security = {};
  // 选 openai 认证后启动时不再弹登录方式选择
  cfg.security.auth = { ...cfg.security.auth, selectedType: "openai", apiKey: input.apiKey, baseUrl: ep.baseUrl };
  if (!cfg.model || typeof cfg.model !== "object") cfg.model = {};
  cfg.model.name = input.model;

  fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  return FILE;
}

export function currentQwenCode(): CurrentConfig | undefined {
  if (!fs.existsSync(FILE)) return undefined;
  const cfg = readJson(FILE);
  const auth = cfg.security?.auth;
  if (!auth?.selectedType) return undefined;
  if (auth.selectedType !== "openai") return { official: true };
  return { baseUrl: auth.baseUrl, model: cfg.model?.name };
}
