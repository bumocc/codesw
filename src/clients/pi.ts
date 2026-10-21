import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProviderDef } from "../providers";
import { ApplyInput, CurrentConfig, openaiEndpoint, readJson } from "./shared";

const DIR = path.join(os.homedir(), ".pi", "agent");
const MODELS_FILE = path.join(DIR, "models.json");
const SETTINGS_FILE = path.join(DIR, "settings.json");

export function applyPi(input: ApplyInput, provider: ProviderDef, models: string[]): string {
  const ep = openaiEndpoint(provider);

  fs.mkdirSync(DIR, { recursive: true });
  const cfg: any = readJson(MODELS_FILE);
  if (!cfg.providers || typeof cfg.providers !== "object") cfg.providers = {};
  cfg.providers[provider.id] = {
    baseUrl: ep.baseUrl,
    api: "openai-completions",
    apiKey: input.apiKey,
    // pi 默认 UA 是 OpenAI SDK 的，带上应用名供应商才能在用量里认出 pi
    headers: { "X-Title": "pi coding agent" },
    models: Array.from(new Set([input.model, ...models])).map((id) => ({ id })),
  };
  fs.writeFileSync(MODELS_FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });

  const settings: any = readJson(SETTINGS_FILE);
  settings.defaultProvider = provider.id;
  settings.defaultModel = input.model;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  return MODELS_FILE;
}

export function currentPi(): CurrentConfig | undefined {
  if (!fs.existsSync(SETTINGS_FILE)) return undefined;
  const settings = readJson(SETTINGS_FILE);
  if (!settings.defaultProvider) return undefined;
  const p = readJson(MODELS_FILE).providers?.[settings.defaultProvider];
  return { baseUrl: p?.baseUrl, model: settings.defaultModel };
}
