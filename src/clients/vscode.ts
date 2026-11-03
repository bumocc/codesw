import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import JSON5 from "json5";
import { ProviderDef } from "../providers";
import { ApplyInput, CurrentConfig, openaiEndpoint, readJson, sameUrl } from "./shared";

// VS Code 用户配置目录（默认 Profile），和 settings.json、mcp.json 放在一起
export const VSCODE_USER_DIR =
  process.platform === "win32"
    ? path.join(process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"), "Code", "User")
    : process.platform === "darwin"
      ? path.join(os.homedir(), "Library", "Application Support", "Code", "User")
      : path.join(os.homedir(), ".config", "Code", "User");

// Copilot Chat「Manage Language Models → Custom Endpoint」写的就是这个文件，不用装插件
const FILE = path.join(VSCODE_USER_DIR, "chatLanguageModels.json");
const VENDOR = "customendpoint";
const SUFFIX = "/chat/completions";

const entries = (cfg: any): any[] => (Array.isArray(cfg) ? cfg : []);
const baseOf = (url: unknown) => (typeof url === "string" ? url.replace(/\/chat\/completions\/?$/, "") : undefined);

export function applyVSCode(input: ApplyInput, provider: ProviderDef): string {
  const ep = openaiEndpoint(provider);

  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const others = entries(readJson(FILE, JSON5.parse)).filter(
    (e: any) => !(e?.vendor === VENDOR && entries(e.models).some((m: any) => sameUrl(baseOf(m?.url) ?? "", provider))),
  );
  const cfg = [
    {
      name: provider.displayName,
      vendor: VENDOR,
      apiKey: input.apiKey,
      apiType: "chat-completions",
      models: [
        {
          id: input.model,
          name: input.model,
          // VS Code 要求写到 /chat/completions 的完整地址
          url: ep.baseUrl.replace(/\/+$/, "") + SUFFIX,
          // 关掉就进不了 Agent 模式
          toolCalling: true,
          vision: false,
          contextWindow: 128000,
          maxOutputTokens: 8192,
          // 带上应用名供应商才能在用量里认出 Copilot Chat
          requestHeaders: { "X-Title": "VS Code Copilot Chat" },
        },
      ],
    },
    ...others,
  ];

  fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  return FILE;
}

export function currentVSCode(): CurrentConfig | undefined {
  if (!fs.existsSync(FILE)) return undefined;
  const e = entries(readJson(FILE, JSON5.parse)).find((x: any) => x?.vendor === VENDOR);
  const m = entries(e?.models)[0];
  return m ? { baseUrl: baseOf(m.url), model: m.id } : undefined;
}
