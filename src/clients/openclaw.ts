import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import JSON5 from "json5";
import { ProviderDef } from "../providers";
import { t } from "../i18n";
import { ApplyInput, CurrentConfig, readJson } from "./shared";

const FILE = path.join(os.homedir(), ".openclaw", "openclaw.json");

export function applyOpenClaw(input: ApplyInput, provider: ProviderDef, models: string[]): string {
  const ep = provider.endpoints.openai ?? provider.endpoints.anthropic;
  if (!ep) throw new Error(t.noEndpoint(provider.displayName));

  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const cfg: any = readJson(FILE, JSON5.parse);

  const providerKey = provider.id;
  const allModels = Array.from(new Set([...models, input.model]));

  cfg.models = cfg.models ?? {};
  cfg.models.providers = cfg.models.providers ?? {};
  cfg.models.providers[providerKey] = {
    baseUrl: ep.baseUrl,
    apiKey: input.apiKey,
    models: allModels.map((m) => ({ id: m, name: m })),
  };

  cfg.agents = cfg.agents ?? {};
  cfg.agents.defaults = cfg.agents.defaults ?? {};
  cfg.agents.defaults.model = cfg.agents.defaults.model ?? {};
  cfg.agents.defaults.model.primary = `${providerKey}/${input.model}`;

  // 先清掉本供应商的旧条目，避免已下架的模型残留在可选列表里
  const refs = (cfg.agents.defaults.models = cfg.agents.defaults.models ?? {});
  for (const ref of Object.keys(refs)) {
    if (ref.startsWith(`${providerKey}/`)) delete refs[ref];
  }
  for (const m of allModels) {
    refs[`${providerKey}/${m}`] = { alias: `${provider.displayName} · ${m}` };
  }

  fs.writeFileSync(FILE, JSON5.stringify(cfg, null, 2));
  return FILE;
}

export function currentOpenClaw(): CurrentConfig | undefined {
  if (!fs.existsSync(FILE)) return undefined;
  const cfg = readJson(FILE, JSON5.parse);
  const primary = cfg.agents?.defaults?.model?.primary;
  if (typeof primary !== "string") return undefined;
  const key = Object.keys(cfg.models?.providers ?? {}).find((k) => primary.startsWith(`${k}/`));
  if (!key) return { model: primary };
  return { baseUrl: cfg.models.providers[key].baseUrl, model: primary.slice(key.length + 1) };
}
