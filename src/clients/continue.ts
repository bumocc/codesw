import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as yaml from "js-yaml";
import { ProviderDef } from "../providers";
import { ApplyInput, CurrentConfig, openaiEndpoint, readJson, sameUrl } from "./shared";

// VS Code / JetBrains 插件和 cn 命令行共用这一份本地配置
const FILE = path.join(os.homedir(), ".continue", "config.yaml");

export function applyContinue(input: ApplyInput, provider: ProviderDef): string {
  const ep = openaiEndpoint(provider);

  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const cfg: any = readJson(FILE, (s) => yaml.load(s));
  cfg.name = cfg.name ?? "Local Config";
  cfg.version = cfg.version ?? "1.0.0";
  cfg.schema = cfg.schema ?? "v1";

  // 同一供应商只留一条，放在最前面：Continue 默认用第一个聊天模型
  const others = (Array.isArray(cfg.models) ? cfg.models : []).filter(
    (m: any) => !(m && typeof m.apiBase === "string" && sameUrl(m.apiBase, provider)),
  );
  cfg.models = [
    {
      name: `${provider.displayName} · ${input.model}`,
      provider: "openai",
      model: input.model,
      apiBase: ep.baseUrl,
      apiKey: input.apiKey,
      roles: ["chat", "edit", "apply"],
      // 默认 UA 是 OpenAI SDK 的，带上应用名供应商才能在用量里认出 Continue
      requestOptions: { headers: { "X-Title": "Continue" } },
    },
    ...others,
  ];

  fs.writeFileSync(FILE, yaml.dump(cfg, { lineWidth: 120 }));
  return FILE;
}

export function currentContinue(): CurrentConfig | undefined {
  if (!fs.existsSync(FILE)) return undefined;
  const cfg = readJson(FILE, (s) => yaml.load(s));
  const m = (Array.isArray(cfg.models) ? cfg.models : []).find((x: any) => x?.apiBase);
  return m ? { baseUrl: m.apiBase, model: m.model } : undefined;
}
