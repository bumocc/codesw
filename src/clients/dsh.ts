import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as yaml from "js-yaml";
import { ProviderDef } from "../providers";
import { t } from "../i18n";
import { ApplyInput, CurrentConfig, readJson, writeEnvKey } from "./shared";

// DeepSeek Harness（dsh）CLI 默认用 ~/.dsh；$DSH_HOME/cordis.patch.yml 是 home 级用户层，对 tui / web / headless 所有 profile 生效
export const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
const FILE = path.join(DSH_HOME, "cordis.patch.yml");
// dsh 的 credentials-local 插件从 $DSH_HOME/.env 读 apiKeyEnv 指向的变量，Key 不进 yml
const ENV_FILE = path.join(DSH_HOME, ".env");
const LLM = "llm-pi-ai";
const DEFAULT = "agent-default-model";

const load = (): any[] => {
  const v = readJson(FILE, (s) => yaml.load(s) ?? []);
  return Array.isArray(v) ? v : [];
};
const keyEnv = (id: string) => `CODESW_${id.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_API_KEY`;

export function applyDsh(input: ApplyInput, provider: ProviderDef, models: string[]): string {
  // 优先 OpenAI 协议（地址带 /v1）；只有 Anthropic 协议时填根地址，dsh 自己拼 /v1/messages
  const [api, ep] = provider.endpoints.openai
    ? ["openai-completions", provider.endpoints.openai]
    : ["anthropic-messages", provider.endpoints.anthropic];
  if (!ep) throw new Error(t.noEndpoint(provider.displayName));

  const name = `codesw-${provider.id}`;
  const list = load().filter((e: any) => e?.id !== DEFAULT);
  let llm = list.find((e: any) => e?.id === LLM);
  if (!llm) list.push((llm = { id: LLM }));
  llm.config = llm.config ?? {};
  llm.config.providers = llm.config.providers ?? {};
  llm.config.providers[name] = {
    apiKeyEnv: keyEnv(provider.id),
    api,
    baseURL: ep.baseUrl,
    models: Array.from(new Set([input.model, ...models])).map((id) => ({ id })),
  };
  list.push({ id: DEFAULT, config: { provider: name, model: input.model } });

  fs.mkdirSync(DSH_HOME, { recursive: true });
  fs.writeFileSync(FILE, yaml.dump(list, { lineWidth: 120 }));
  writeEnvKey(ENV_FILE, keyEnv(provider.id), input.apiKey);
  return FILE;
}

export function currentDsh(): CurrentConfig | undefined {
  if (!fs.existsSync(FILE)) return undefined;
  const list = load();
  const def = list.find((e: any) => e?.id === DEFAULT)?.config;
  // 没改默认模型就是 DeepSeek 官方
  if (!def?.provider) return { official: true };
  const p = list.find((e: any) => e?.id === LLM)?.config?.providers?.[def.provider];
  return { baseUrl: p?.baseURL, model: def.model };
}
