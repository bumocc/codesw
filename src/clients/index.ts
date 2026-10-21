import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProtocolKind, ProviderDef } from "../providers";
import { applyClaudeCode, currentClaudeCode, restoreClaudeCode } from "./claude-code";
import { applyOpenCode, currentOpenCode } from "./opencode";
import { applyOpenClaw, currentOpenClaw } from "./openclaw";
import { applyHermes, currentHermes } from "./hermes";
import { applyCline, currentCline } from "./cline";
import { applyKilo, currentKilo } from "./kilo";
import { applyContinue, currentContinue } from "./continue";
import { applyQwenCode, currentQwenCode } from "./qwen-code";
import { applyAider, currentAider } from "./aider";
import { applyPi, currentPi } from "./pi";
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
  /** 客户端只会说的协议；不填表示两种都行，优先 OpenAI 兼容 */
  protocol?: ProtocolKind;
  /** 判断是否已安装：命令可用或配置目录存在 */
  command: string;
  configDir: string;
}

const home = os.homedir();

export const CLIENTS: ClientDef[] = [
  {
    id: "claude-code", displayName: "Claude Code", command: "claude", configDir: path.join(home, ".claude"), protocol: "anthropic",
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
  {
    id: "cline", displayName: "Cline", command: "cline", configDir: path.join(home, ".cline"), protocol: "openai",
    apply: applyCline, current: currentCline,
  },
  {
    id: "kilo", displayName: "Kilo Code", command: "kilo", configDir: path.join(home, ".config", "kilo"), protocol: "openai",
    apply: applyKilo, current: currentKilo,
  },
  {
    id: "qwen-code", displayName: "Qwen Code", command: "qwen", configDir: path.join(home, ".qwen"), protocol: "openai",
    apply: applyQwenCode, current: currentQwenCode,
  },
  {
    id: "continue", displayName: "Continue", command: "cn", configDir: path.join(home, ".continue"), protocol: "openai",
    apply: applyContinue, current: currentContinue,
  },
  {
    id: "aider", displayName: "Aider", command: "aider", configDir: path.join(home, ".aider.conf.yml"), protocol: "openai",
    apply: applyAider, current: currentAider,
  },
  {
    id: "pi", displayName: "pi", command: "pi", configDir: path.join(home, ".pi"), protocol: "openai",
    apply: applyPi, current: currentPi,
  },
];

export function getClient(id: string): ClientDef | undefined {
  // kilo-code / kilocode / "Kilo Code" 都认
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const k = norm(id);
  return CLIENTS.find((c) => [c.id, c.command, c.displayName].some((x) => norm(x) === k));
}

export function isInstalled(client: ClientDef): boolean {
  return hasCommand(client.command) || fs.existsSync(client.configDir);
}
