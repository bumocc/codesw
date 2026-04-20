import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Profile } from "../profiles";
import { ProviderDef } from "../providers";

export function applyClaudeCode(profile: Profile, provider: ProviderDef): string {
  const ep = provider.endpoints.anthropic;
  if (!ep) throw new Error(`${provider.displayName} 未提供 Anthropic 兼容端点，无法用于 Claude Code`);

  const dir = path.join(os.homedir(), ".claude");
  const file = path.join(dir, "settings.json");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let settings: any = {};
  if (fs.existsSync(file)) {
    try { settings = JSON.parse(fs.readFileSync(file, "utf8")); } catch { settings = {}; }
  }
  if (!settings.env || typeof settings.env !== "object") settings.env = {};

  const model = profile.model ?? ep.defaultModel ?? provider.defaultModel;
  const small = profile.smallModel ?? ep.smallModel;

  settings.env.ANTHROPIC_BASE_URL = ep.baseUrl;
  settings.env.ANTHROPIC_AUTH_TOKEN = profile.apiKey;
  if (model) {
    settings.env.ANTHROPIC_MODEL = model;
    settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL = model;
    settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL = model;
    settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = small ?? model;
  }
  if (small) settings.env.ANTHROPIC_SMALL_FAST_MODEL = small;

  fs.writeFileSync(file, JSON.stringify(settings, null, 2));
  return file;
}
