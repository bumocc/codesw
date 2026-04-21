import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as yaml from "js-yaml";
import { Profile } from "../profiles";
import { ProviderDef } from "../providers";

export function applyHermes(profile: Profile, provider: ProviderDef): string {
  const ep = provider.endpoints.openai ?? provider.endpoints.anthropic;
  if (!ep) throw new Error(`${provider.displayName} 没有可用端点`);

  const dir = path.join(os.homedir(), ".hermes");
  const cfgFile = path.join(dir, "config.yaml");
  const envFile = path.join(dir, ".env");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let cfg: any = {};
  if (fs.existsSync(cfgFile)) {
    try { cfg = yaml.load(fs.readFileSync(cfgFile, "utf8")) ?? {}; } catch { cfg = {}; }
  }

  const modelId = profile.model ?? ep.defaultModel ?? provider.defaultModel ?? "default";
  const allModels = Array.from(new Set([...(provider.models ?? []), modelId]));
  cfg.model = cfg.model ?? {};
  cfg.model.provider = "custom";
  cfg.model.base_url = ep.baseUrl;
  cfg.model.default = modelId;
  delete cfg.model.model;

  cfg.model_aliases = cfg.model_aliases ?? {};
  for (const k of Object.keys(cfg.model_aliases)) {
    if (k.startsWith("codesw-")) delete cfg.model_aliases[k];
  }
  for (const m of allModels) {
    cfg.model_aliases[`codesw-${profile.name}-${m}`] = {
      model: m,
      provider: "custom",
      base_url: ep.baseUrl,
    };
  }
  cfg.model_aliases[`codesw-${profile.name}`] = {
    model: modelId,
    provider: "custom",
    base_url: ep.baseUrl,
  };

  fs.writeFileSync(cfgFile, yaml.dump(cfg, { lineWidth: 120 }));
  writeEnvKey(envFile, "OPENAI_API_KEY", profile.apiKey);
  return cfgFile;
}

function writeEnvKey(file: string, key: string, value: string): void {
  let lines: string[] = [];
  if (fs.existsSync(file)) {
    lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  }
  const prefix = `${key}=`;
  const idx = lines.findIndex((l) => l.startsWith(prefix));
  const line = `${prefix}${value}`;
  if (idx >= 0) lines[idx] = line; else lines.push(line);
  fs.writeFileSync(file, lines.filter((l, i) => !(i === lines.length - 1 && l === "")).join("\n") + "\n", { mode: 0o600 });
}
