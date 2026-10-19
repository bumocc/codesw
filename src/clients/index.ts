import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProviderDef } from "../providers";
import { applyClaudeCode, currentClaudeCode, restoreClaudeCode } from "./claude-code";
import { applyOpenCode, currentOpenCode } from "./opencode";
import { applyOpenClaw, currentOpenClaw } from "./openclaw";
import { applyHermes, currentHermes } from "./hermes";
import { ApplyInput, CurrentConfig, hasCommand } from "./shared";

export { ApplyInput, CurrentConfig } from "./shared";

export interface ClientDef {
  id: string;
  displayName: string;
  /** 写入配置，返回写入的配置文件路径；models 为供应商可选模型，写入客户端的模型列表 */
  apply: (input: ApplyInput, provider: ProviderDef, models: string[]) => string;
  /** 读取客户端当前使用的供应商与模型 */
  current: () => CurrentConfig | undefined;
  /** 恢复为客户端官方账号 */
  restore?: () => string;
  /** 判断是否已安装：命令可用或配置目录存在 */
  command: string;
  configDir: string;
}

const home = os.homedir();

export const CLIENTS: ClientDef[] = [
  {
    id: "claude-code", displayName: "Claude Code", command: "claude", configDir: path.join(home, ".claude"),
    apply: applyClaudeCode, current: currentClaudeCode, restore: restoreClaudeCode,
  },
  {
    id: "opencode", displayName: "OpenCode", command: "opencode", configDir: path.join(home, ".config", "opencode"),
    apply: applyOpenCode, current: currentOpenCode,
  },
  {
    id: "openclaw", displayName: "OpenClaw", command: "openclaw", configDir: path.join(home, ".openclaw"),
    apply: applyOpenClaw, current: currentOpenClaw,
  },
  {
    id: "hermes", displayName: "Hermes Agent", command: "hermes", configDir: path.join(home, ".hermes"),
    apply: applyHermes, current: currentHermes,
  },
];

export function getClient(id: string): ClientDef | undefined {
  const k = id.toLowerCase();
  return CLIENTS.find((c) => c.id === k || c.command === k);
}

export function isInstalled(client: ClientDef): boolean {
  return hasCommand(client.command) || fs.existsSync(client.configDir);
}
