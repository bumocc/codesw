import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import JSON5 from "json5";
import { Profile } from "../profiles";
import { ProviderDef } from "../providers";

export function applyOpenClaw(profile: Profile, provider: ProviderDef): string {
  const ep = provider.endpoints.openai ?? provider.endpoints.anthropic;
  if (!ep) throw new Error(`${provider.displayName} 没有可用端点`);

  const dir = path.join(os.homedir(), ".openclaw");
  const file = path.join(dir, "openclaw.json");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let cfg: any = {};
  if (fs.existsSync(file)) {
    try { cfg = JSON5.parse(fs.readFileSync(file, "utf8")); } catch { cfg = {}; }
  }

  const providerKey = provider.id;
  const modelId = profile.model ?? ep.defaultModel ?? provider.defaultModel ?? "default";
  const modelRef = `${providerKey}/${modelId}`;

  const allModels = Array.from(new Set([...(provider.models ?? []), modelId]));

  cfg.models = cfg.models ?? {};
  cfg.models.providers = cfg.models.providers ?? {};
  cfg.models.providers[providerKey] = {
    baseUrl: ep.baseUrl,
    apiKey: profile.apiKey,
    models: allModels.map((m) => ({ id: m, name: m })),
  };

  cfg.agents = cfg.agents ?? {};
  cfg.agents.defaults = cfg.agents.defaults ?? {};
  cfg.agents.defaults.model = cfg.agents.defaults.model ?? {};
  cfg.agents.defaults.model.primary = modelRef;

  cfg.agents.defaults.models = cfg.agents.defaults.models ?? {};
  for (const m of allModels) {
    const ref = `${providerKey}/${m}`;
    cfg.agents.defaults.models[ref] = { alias: `${provider.displayName} · ${m}` };
  }

  fs.writeFileSync(file, JSON5.stringify(cfg, null, 2));
  return file;
}
