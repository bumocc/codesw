import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Profile } from "../profiles";
import { ProviderDef } from "../providers";

export function applyOpenCode(profile: Profile, provider: ProviderDef): string {
  const ep = provider.endpoints.openai ?? provider.endpoints.anthropic;
  if (!ep) throw new Error(`${provider.displayName} 没有可用端点`);

  const dir = path.join(os.homedir(), ".config", "opencode");
  const file = path.join(dir, "opencode.json");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let cfg: any = {};
  if (fs.existsSync(file)) {
    try { cfg = JSON.parse(fs.readFileSync(file, "utf8")); } catch { cfg = {}; }
  }
  if (!cfg.$schema) cfg.$schema = "https://opencode.ai/config.json";
  if (!cfg.provider || typeof cfg.provider !== "object") cfg.provider = {};

  const model = profile.model ?? ep.defaultModel ?? provider.defaultModel ?? "default";
  const key = provider.id;

  cfg.provider[key] = {
    npm: "@ai-sdk/openai-compatible",
    name: provider.displayName,
    options: {
      baseURL: ep.baseUrl,
      apiKey: profile.apiKey,
    },
    models: {
      [model]: { name: model },
    },
  };
  cfg.model = `${key}/${model}`;

  fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
  return file;
}
