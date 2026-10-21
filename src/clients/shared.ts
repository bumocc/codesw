import * as fs from "fs";
import * as path from "path";
import { ProviderDef, ProviderEndpoint, matchBaseUrl } from "../providers";
import { t } from "../i18n";

export interface ApplyInput {
  apiKey: string;
  model: string;
}

/** 从客户端配置文件读出来的当前状态 */
export interface CurrentConfig {
  /** 使用客户端自带的官方账号（未接入第三方供应商） */
  official?: boolean;
  baseUrl?: string;
  model?: string;
}

export function readJson(file: string, parse: (s: string) => any = JSON.parse): any {
  try {
    const v = parse(fs.readFileSync(file, "utf8"));
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

/** 命令在 PATH 里能找到（Windows 下兼容 .cmd / .exe） */
export function hasCommand(cmd: string): boolean {
  const exts = process.platform === "win32" ? ["", ".cmd", ".exe", ".bat"] : [""];
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      if (fs.existsSync(path.join(dir, cmd + ext))) return true;
    }
  }
  return false;
}

/** 只说 OpenAI 协议的客户端（Continue / Aider / pi / Qwen Code / Cline / Kilo）用的端点 */
export function openaiEndpoint(provider: ProviderDef): ProviderEndpoint {
  const ep = provider.endpoints.openai;
  if (!ep) throw new Error(t.noEndpoint(provider.displayName));
  return ep;
}

/** 配置里的地址是不是这个供应商的（含旧地址），换供应商时用来找出要替换的旧条目 */
export function sameUrl(url: string, provider: ProviderDef): boolean {
  return matchBaseUrl(url)?.provider.id === provider.id;
}
