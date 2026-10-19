import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProviderDef } from "../providers";
import { t } from "../i18n";
import { ApplyInput, CurrentConfig, readJson } from "./shared";

const FILE = path.join(os.homedir(), ".claude", "settings.json");

export function applyClaudeCode(input: ApplyInput, provider: ProviderDef): string {
  const ep = provider.endpoints.anthropic;
  if (!ep) throw new Error(t.noAnthropic(provider.displayName));

  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const settings: any = readJson(FILE);
  if (!settings.env || typeof settings.env !== "object") settings.env = {};
  for (const k of CLAUDE_ENV_KEYS) delete settings.env[k];

  const small = provider.smallModel ?? ep.smallModel ?? input.model;
  settings.env.ANTHROPIC_BASE_URL = ep.baseUrl;
  settings.env.ANTHROPIC_AUTH_TOKEN = input.apiKey;
  settings.env.ANTHROPIC_MODEL = input.model;
  settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL = input.model;
  settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL = input.model;
  settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = small;
  settings.env.ANTHROPIC_SMALL_FAST_MODEL = small;

  fs.writeFileSync(FILE, JSON.stringify(settings, null, 2));
  return FILE;
}

const CLAUDE_ENV_KEYS = [
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "ANTHROPIC_SMALL_FAST_MODEL",
];

export function restoreClaudeCode(): string {
  if (!fs.existsSync(FILE)) return FILE;
  const settings: any = readJson(FILE);
  if (settings.env && typeof settings.env === "object") {
    for (const k of CLAUDE_ENV_KEYS) delete settings.env[k];
    if (Object.keys(settings.env).length === 0) delete settings.env;
  }
  fs.writeFileSync(FILE, JSON.stringify(settings, null, 2));
  return FILE;
}

export function currentClaudeCode(): CurrentConfig | undefined {
  if (!fs.existsSync(FILE)) return undefined;
  const env = readJson(FILE).env ?? {};
  // 没有自定义地址就是官方账号
  if (!env.ANTHROPIC_BASE_URL) return { official: true };
  return { baseUrl: env.ANTHROPIC_BASE_URL, model: env.ANTHROPIC_MODEL };
}
