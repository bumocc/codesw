import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as yaml from "js-yaml";
import { ProviderDef } from "../providers";
import { t } from "../i18n";
import { ApplyInput, CurrentConfig, readJson } from "./shared";

const DIR = path.join(os.homedir(), ".hermes");
const CFG_FILE = path.join(DIR, "config.yaml");
const ENV_FILE = path.join(DIR, ".env");

export function applyHermes(input: ApplyInput, provider: ProviderDef, models: string[]): string {
  const ep = provider.endpoints.openai ?? provider.endpoints.anthropic;
  if (!ep) throw new Error(t.noEndpoint(provider.displayName));

  fs.mkdirSync(DIR, { recursive: true });
  const cfg: any = readJson(CFG_FILE, (s) => yaml.load(s));

  cfg.model = cfg.model ?? {};
  cfg.model.provider = "custom";
  cfg.model.base_url = ep.baseUrl;
  cfg.model.default = input.model;
  delete cfg.model.model;

  // 别名统一以 codesw- 开头，每次应用前整体替换
  cfg.model_aliases = cfg.model_aliases ?? {};
  for (const k of Object.keys(cfg.model_aliases)) {
    if (k.startsWith("codesw-")) delete cfg.model_aliases[k];
  }
  for (const m of new Set([...models, input.model])) {
    cfg.model_aliases[`codesw-${m.replace(/\//g, "-")}`] = { model: m, provider: "custom", base_url: ep.baseUrl };
  }

  fs.writeFileSync(CFG_FILE, yaml.dump(cfg, { lineWidth: 120 }));
  writeEnvKey(ENV_FILE, "OPENAI_API_KEY", input.apiKey);
  return CFG_FILE;
}

export function currentHermes(): CurrentConfig | undefined {
  if (!fs.existsSync(CFG_FILE)) return undefined;
  const cfg = readJson(CFG_FILE, (s) => yaml.load(s));
  if (!cfg.model?.default && !cfg.model?.base_url) return undefined;
  return { baseUrl: cfg.model?.base_url, model: cfg.model?.default };
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
