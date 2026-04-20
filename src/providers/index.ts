import { ProviderDef } from "./types";
import { zhipu } from "./zhipu";
import { bailian } from "./bailian";
import { bailianCoding } from "./bailian-coding";
import { volcengine } from "./volcengine";
import { volcengineCoding } from "./volcengine-coding";
import { minimax } from "./minimax";
import { kimi } from "./kimi";
import { kimiCoding } from "./kimi-coding";
import { bumoCc } from "./bumo-cc";
import { bumoAi } from "./bumo-ai";

export { ProviderDef, ProviderEndpoint, ProtocolKind } from "./types";

export const PROVIDERS: ProviderDef[] = [
  zhipu,
  bailian,
  bailianCoding,
  volcengine,
  volcengineCoding,
  minimax,
  kimi,
  kimiCoding,
  bumoCc,
  bumoAi,
];

export function getProvider(id: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
