import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface Profile {
  name: string;
  provider: string;
  apiKey: string;
  model?: string;
  smallModel?: string;
}

export interface Store {
  profiles: Record<string, Profile>;
  /** name -> last applied profile for each client */
  active?: Record<string, string>;
}

const DIR = path.join(os.homedir(), ".codesw");
const FILE = path.join(DIR, "profiles.json");

function ensureDir(): void {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
}

export function load(): Store {
  if (!fs.existsSync(FILE)) return { profiles: {} };
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const data = JSON.parse(raw) as Store;
    if (!data.profiles) data.profiles = {};
    return data;
  } catch {
    return { profiles: {} };
  }
}

export function save(store: Store): void {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

export function upsert(profile: Profile): void {
  const s = load();
  s.profiles[profile.name] = profile;
  save(s);
}

export function remove(name: string): boolean {
  const s = load();
  if (!s.profiles[name]) return false;
  delete s.profiles[name];
  if (s.active) {
    for (const k of Object.keys(s.active)) {
      if (s.active[k] === name) delete s.active[k];
    }
  }
  save(s);
  return true;
}

export function markActive(client: string, profile: string): void {
  const s = load();
  if (!s.active) s.active = {};
  s.active[client] = profile;
  save(s);
}

export const profilesPath = FILE;
