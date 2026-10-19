import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProviderDef } from "../providers";
import { t } from "../i18n";
import { ApplyInput, CurrentConfig, readJson } from "./shared";

const FILE = path.join(os.homedir(), ".config", "opencode", "opencode.json");

export function applyOpenCode(input: ApplyInput, provider: ProviderDef, models: string[]): string {
  const ep = provider.endpoints.openai ?? provider.endpoints.anthropic;
  if (!ep) throw new Error(t.noEndpoint(provider.displayName));

  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const cfg: any = readJson(FILE);
  if (!cfg.$schema) cfg.$schema = "https://opencode.ai/config.json";
  if (!cfg.provider || typeof cfg.provider !== "object") cfg.provider = {};

  const key = provider.id;
  const entries: Record<string, { name: string }> = {};
  for (const m of new Set([...models, input.model])) entries[m] = { name: m };

  cfg.provider[key] = {
    npm: "@ai-sdk/openai-compatible",
    name: provider.displayName,
    options: {
      baseURL: ep.baseUrl,
      apiKey: input.apiKey,
    },
    models: entries,
  };
  cfg.model = `${key}/${input.model}`;

  fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2));
  return FILE;
}

export function currentOpenCode(): CurrentConfig | undefined {
  if (!fs.existsSync(FILE)) return undefined;
  const cfg = readJson(FILE);
  if (typeof cfg.model !== "string") return undefined;
  const i = cfg.model.indexOf("/");
  const key = i > 0 ? cfg.model.slice(0, i) : "";
  return {
    baseUrl: cfg.provider?.[key]?.options?.baseURL,
    model: i > 0 ? cfg.model.slice(i + 1) : cfg.model,
  };
}
