import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import JSON5 from "json5";
import { ProviderDef } from "../providers";
import { ApplyInput, CurrentConfig, openaiEndpoint, readJson } from "./shared";

// Kilo CLI 的全局配置，格式沿用 OpenCode
const DIR = path.join(os.homedir(), ".config", "kilo");

function configFile(): string {
  for (const name of ["kilo.jsonc", "kilo.json"]) {
    const f = path.join(DIR, name);
    if (fs.existsSync(f)) return f;
  }
  return path.join(DIR, "kilo.jsonc");
}

export function applyKilo(input: ApplyInput, provider: ProviderDef, models: string[]): string {
  const ep = openaiEndpoint(provider);
  const file = configFile();

  fs.mkdirSync(DIR, { recursive: true });
  const cfg: any = readJson(file, JSON5.parse);
  if (!cfg.$schema) cfg.$schema = "https://app.kilo.ai/config.json";
  if (!cfg.provider || typeof cfg.provider !== "object") cfg.provider = {};

  const entries: Record<string, { name: string }> = {};
  for (const m of new Set([...models, input.model])) entries[m] = { name: m };
  cfg.provider[provider.id] = {
    npm: "@ai-sdk/openai-compatible",
    name: provider.displayName,
    options: { baseURL: ep.baseUrl, apiKey: input.apiKey },
    models: entries,
  };
  cfg.model = `${provider.id}/${input.model}`;

  fs.writeFileSync(file, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  return file;
}

export function currentKilo(): CurrentConfig | undefined {
  const file = configFile();
  if (!fs.existsSync(file)) return undefined;
  const cfg = readJson(file, JSON5.parse);
  if (typeof cfg.model !== "string") return undefined;
  const i = cfg.model.indexOf("/");
  const key = i > 0 ? cfg.model.slice(0, i) : "";
  return {
    baseUrl: cfg.provider?.[key]?.options?.baseURL,
    model: i > 0 ? cfg.model.slice(i + 1) : cfg.model,
  };
}
