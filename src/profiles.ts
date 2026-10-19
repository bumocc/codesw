import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getProvider } from "./providers";

/** 每个供应商保存一份：Key 只输一次，并记住上次选的模型 */
export interface SavedKey {
  apiKey: string;
  model?: string;
}

export interface Store {
  version: 2;
  keys: Record<string, SavedKey>;
}

/** 0.1.x 的旧格式：按用户自起名的 profile 保存 */
interface LegacyStore {
  profiles?: Record<string, { name: string; provider: string; apiKey: string; model?: string }>;
  active?: Record<string, string>;
}

const DIR = path.join(os.homedir(), ".codesw");
const FILE = path.join(DIR, "profiles.json");

function ensureDir(): void {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
}

function migrate(old: LegacyStore): Store {
  const keys: Record<string, SavedKey> = {};
  const profiles = Object.values(old.profiles ?? {});
  // 同一供应商有多个 profile 时，优先保留正在被客户端使用的那个
  const activeNames = new Set(Object.values(old.active ?? {}));
  profiles.sort((a, b) => Number(activeNames.has(a.name)) - Number(activeNames.has(b.name)));
  for (const p of profiles) {
    if (!p?.apiKey) continue;
    const id = getProvider(p.provider)?.id ?? p.provider;
    keys[id] = { apiKey: p.apiKey, model: p.model };
  }
  return { version: 2, keys };
}

export function load(): Store {
  if (!fs.existsSync(FILE)) return { version: 2, keys: {} };
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (data?.version === 2) return { version: 2, keys: data.keys ?? {} };
    const migrated = migrate(data);
    save(migrated);
    return migrated;
  } catch {
    return { version: 2, keys: {} };
  }
}

export function save(store: Store): void {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

export function getKey(providerId: string): SavedKey | undefined {
  return load().keys[providerId];
}

export function setKey(providerId: string, value: SavedKey): void {
  const s = load();
  s.keys[providerId] = value;
  save(s);
}

export function removeKey(providerId: string): boolean {
  const s = load();
  if (!s.keys[providerId]) return false;
  delete s.keys[providerId];
  save(s);
  return true;
}

export function maskKey(key: string): string {
  return key.length > 10 ? `${key.slice(0, 5)}…${key.slice(-4)}` : "****";
}

export const profilesPath = FILE;
