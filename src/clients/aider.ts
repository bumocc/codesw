import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as yaml from "js-yaml";
import { ProviderDef } from "../providers";
import { ApplyInput, CurrentConfig, openaiEndpoint, readJson } from "./shared";

const FILE = path.join(os.homedir(), ".aider.conf.yml");

export function applyAider(input: ApplyInput, provider: ProviderDef): string {
  const ep = openaiEndpoint(provider);

  const cfg: any = readJson(FILE, (s) => yaml.load(s));
  // Aider 经 LiteLLM 调用，openai/ 前缀表示走 OpenAI 兼容接口
  cfg.model = `openai/${input.model}`;
  cfg["openai-api-base"] = ep.baseUrl;
  cfg["openai-api-key"] = input.apiKey;

  fs.writeFileSync(FILE, yaml.dump(cfg, { lineWidth: 120 }), { mode: 0o600 });
  return FILE;
}

export function currentAider(): CurrentConfig | undefined {
  if (!fs.existsSync(FILE)) return undefined;
  const cfg = readJson(FILE, (s) => yaml.load(s));
  if (!cfg["openai-api-base"]) return undefined;
  const model = typeof cfg.model === "string" ? cfg.model.replace(/^openai\//, "") : undefined;
  return { baseUrl: cfg["openai-api-base"], model };
}
