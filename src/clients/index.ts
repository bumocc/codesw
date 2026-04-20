import { Profile } from "../profiles";
import { ProviderDef } from "../providers";
import { applyClaudeCode } from "./claude-code";
import { applyOpenCode } from "./opencode";
import { applyOpenClaw } from "./openclaw";
import { applyHermes } from "./hermes";

export interface ClientDef {
  id: string;
  displayName: string;
  apply: (profile: Profile, provider: ProviderDef) => string; // returns config path written
}

export const CLIENTS: ClientDef[] = [
  { id: "claude-code", displayName: "Claude Code", apply: applyClaudeCode },
  { id: "opencode",    displayName: "OpenCode",     apply: applyOpenCode },
  { id: "openclaw",    displayName: "OpenClaw",     apply: applyOpenClaw },
  { id: "hermes",      displayName: "Hermes Agent", apply: applyHermes },
];

export function getClient(id: string): ClientDef | undefined {
  return CLIENTS.find((c) => c.id === id);
}
