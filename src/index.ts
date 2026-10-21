#!/usr/bin/env node
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { CLIENTS, ClientDef, getClient, isInstalled } from "./clients";
import { PROVIDERS, ProtocolKind, ProviderDef, defaultModelOf, getProvider, loadModels, matchBaseUrl } from "./providers";
import { check } from "./check";
import { Choice, ask, askSecret, select, strWidth, withSpinner } from "./prompt";
import * as store from "./profiles";
import { c } from "./color";
import { isZh, t } from "./i18n";

const RESTORE = Symbol("restore");
const CUSTOM = Symbol("custom");

const tilde = (p: string) => (p.startsWith(os.homedir()) ? "~" + p.slice(os.homedir().length) : p);
const hostOf = (u: string) => { try { return new URL(u).host; } catch { return u; } };

function version(): string {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")).version;
  } catch {
    return "";
  }
}

/** 客户端当前状态的一句话描述；empty 表示未安装 / 未配置 */
function describe(client: ClientDef): { text: string; warn?: string; empty?: boolean } {
  const cur = client.current();
  if (!cur) return { text: isInstalled(client) ? t.notConfigured : t.notInstalled, empty: true };
  if (cur.official) return { text: t.official };
  const m = matchBaseUrl(cur.baseUrl);
  const name = m ? m.provider.displayName : cur.baseUrl ? hostOf(cur.baseUrl) : t.custom;
  return {
    text: cur.model ? `${name} · ${cur.model}` : name,
    warn: m?.legacy ? t.legacyWarn : undefined,
  };
}

/** 客户端当前在用的供应商 */
function currentProvider(client: ClientDef): ProviderDef | undefined {
  return matchBaseUrl(client.current()?.baseUrl)?.provider;
}

function supports(client: ClientDef, p: ProviderDef): boolean {
  return client.id === "claude-code" ? !!p.endpoints.anthropic : true;
}

/** 客户端实际走的协议，和各客户端 apply 里选端点的规则一致 */
function protocolOf(client: ClientDef, p: ProviderDef): ProtocolKind {
  return client.id === "claude-code" || !p.endpoints.openai ? "anthropic" : "openai";
}

/** 用客户端实际的协议、Key、模型发一次最小请求，把结果翻成一句能照着做的话 */
async function verify(client: ClientDef, p: ProviderDef, apiKey: string, model: string): Promise<boolean> {
  const r = await withSpinner(t.checking, check(p, protocolOf(client, p), apiKey, model));
  const sec = (r.ms / 1000).toFixed(1);
  if (r.outcome === "ok") {
    console.log(`${c.green("✔")} ${t.checkOk(sec)}`);
    return true;
  }
  console.log(`${c.red("✖")} ${t.checkFail[r.outcome](p.displayName, model)}`);
  if (r.detail) console.log(c.dim(`  ${r.detail.length > 160 ? r.detail.slice(0, 157) + "…" : r.detail}`));
  const fix = t.checkFix[r.outcome];
  if (fix) console.log(c.dim(`  ${fix}`));
  return false;
}

async function pickClient(): Promise<ClientDef> {
  const choices: Choice<ClientDef>[] = CLIENTS.map((cli) => {
    const d = describe(cli);
    return { label: cli.displayName, hint: d.warn ? `${d.text} · ${d.warn}` : d.text, value: cli };
  });
  const firstInstalled = Math.max(0, CLIENTS.findIndex((cli) => isInstalled(cli)));
  return select(t.askClient, choices, firstInstalled);
}

async function pickProvider(client: ClientDef): Promise<ProviderDef | typeof RESTORE> {
  const using = currentProvider(client);
  const saved = store.load().keys;
  const list = PROVIDERS.filter((p) => supports(client, p));
  const choices: Choice<ProviderDef | typeof RESTORE>[] = list.map((p) => {
    const tags = [p === using ? t.inUse : "", saved[p.id] ? t.keySaved : "", p.desc ?? ""].filter(Boolean);
    return { label: p.displayName, hint: tags.join(" · "), value: p };
  });
  if (client.restore) {
    choices.push({ label: "──────", value: RESTORE, separator: true });
    choices.push({ label: t.restoreLabel, hint: t.restoreHint(client.displayName), value: RESTORE });
  }
  // 没在用任何供应商时，中文环境默认国内站，其他语言默认国际站
  const fallback = Math.max(0, list.findIndex((p) => p.id === (isZh ? "bumo.cc" : "bumo.ai")));
  const initial = using ? list.indexOf(using) : fallback;
  return select(t.askProvider, choices, initial);
}

/** 已保存的 Key 直接用，没有才让用户粘贴 */
async function ensureKey(p: ProviderDef): Promise<string> {
  const saved = store.getKey(p.id);
  if (saved?.apiKey) {
    console.log(`${c.green("✔")} ${c.bold("API Key")} ${c.dim(t.usingSavedKey(store.maskKey(saved.apiKey)))}`);
    return saved.apiKey;
  }
  if (p.apiKeyUrl) console.log(c.dim(t.noKeyYet(p.apiKeyUrl)));
  const key = await askSecret(t.pasteKey(p.displayName), (v) => `API Key ${c.dim(t.keyDone(store.maskKey(v)))}`);
  if (!key) throw new Error(t.keyCancelled);
  store.setKey(p.id, { apiKey: key });
  return key;
}

async function pickModel(client: ClientDef, p: ProviderDef, preferred?: string): Promise<{ model: string; all: string[] }> {
  const list = await withSpinner(t.loadingModels, loadModels(p));
  if (!list.models.length) {
    const model = await ask(t.modelId, preferred || defaultModelOf(p));
    if (!model) throw new Error(t.modelCancelled);
    return { model, all: [model] };
  }
  const inUse = currentProvider(client) === p ? client.current()?.model : undefined;
  const featured = list.models.filter((m) => list.featured.includes(m));
  const ordered = [...featured, ...list.models.filter((m) => !featured.includes(m))];
  const choices: Choice<string | typeof CUSTOM>[] = ordered.map((m) => ({
    label: m,
    hint: [m === inUse ? t.inUse : "", featured.includes(m) ? t.recommended : ""].filter(Boolean).join(" · "),
    value: m,
  }));
  choices.push({ label: t.customModel, value: CUSTOM });

  const want = [inUse, preferred, defaultModelOf(p), featured[0]].find((m) => m && ordered.includes(m));
  const picked = await select(t.askModel, choices, want ? ordered.indexOf(want) : 0);
  if (picked !== CUSTOM) return { model: picked, all: list.models };
  const model = await ask(t.modelId, inUse ?? preferred);
  if (!model) throw new Error(t.modelCancelled);
  return { model, all: list.models };
}

async function applyTo(client: ClientDef, p: ProviderDef, apiKey: string, model: string, all: string[]): Promise<void> {
  const file = client.apply({ apiKey, model }, p, all);
  store.setKey(p.id, { apiKey, model });
  const [prefix, target] = t.switched(client.displayName, `${p.displayName} · ${model}`);
  console.log("");
  console.log(`${c.green("✔")} ${c.bold(prefix)}${c.cyan(c.bold(target))}`);
  console.log(c.dim(t.writtenTo(tilde(file), client.displayName)));
  // 写完顺手测一次：配错了当场知道错在哪，不用等打开客户端才发现
  if (!(await verify(client, p, apiKey, model))) process.exitCode = 1;
}

function restore(client: ClientDef): void {
  if (!client.restore) throw new Error(t.restoreUnsupported(client.displayName));
  const file = client.restore();
  console.log(`${c.green("✔")} ${c.bold(t.restored(client.displayName))}`);
  console.log(c.dim(t.restoredFile(tilde(file), client.displayName)));
}

async function interactive(): Promise<void> {
  console.log(`${c.bold("codesw")} ${c.dim(`v${version()} · ${t.tagline}`)}\n`);
  const client = await pickClient();
  const p = await pickProvider(client);
  if (p === RESTORE) return restore(client);
  const apiKey = await ensureKey(p);
  const { model, all } = await pickModel(client, p, store.getKey(p.id)?.model);
  await applyTo(client, p, apiKey, model, all);
}

function cmdStatus(): void {
  const width = Math.max(...CLIENTS.map((cli) => cli.displayName.length));
  for (const cli of CLIENTS) {
    const d = describe(cli);
    const text = d.empty ? c.dim(d.text) : d.text;
    console.log(`  ${c.bold(cli.displayName.padEnd(width))}  ${text}${d.warn ? "  " + c.yellow(d.warn) : ""}`);
  }
  const keys = Object.entries(store.load().keys);
  if (keys.length) {
    console.log(`\n${c.dim(t.savedKeys)}`);
    for (const [id, k] of keys) {
      console.log(`  ${getProvider(id)?.displayName ?? id}  ${c.dim(store.maskKey(k.apiKey))}`);
    }
  }
}

/** 取出 --key <key> / --key=<key>，其余按位置参数返回 */
function takeKeyFlag(args: string[]): { key?: string; rest: string[] } {
  const rest: string[] = [];
  let key: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--key") key = args[++i];
    else if (a.startsWith("--key=")) key = a.slice(6);
    else rest.push(a);
  }
  return { key: key?.trim() || undefined, rest };
}

/** 非交互：codesw use <client> <provider> [model] [--key <key>]，兼容旧写法 use <provider> <client> */
async function cmdUse(args: string[]): Promise<void> {
  const flags = takeKeyFlag(args);
  let [a, b, model] = flags.rest;
  if (!a || !b) throw new Error(t.useUsage);
  if (!getClient(a) && getClient(b)) [a, b] = [b, a];
  const client = getClient(a);
  if (!client) throw new Error(t.unknownClient(a, CLIENTS.map((x) => x.id).join(", ")));
  const p = getProvider(b);
  if (!p) throw new Error(t.unknownProvider(b, PROVIDERS.map((x) => x.id).join(", ")));
  if (!supports(client, p)) throw new Error(t.unsupported(p.displayName, client.displayName));
  // 带 --key 时直接用并保存，一条命令就能配好，不再停下来等粘贴
  const apiKey = flags.key ?? (await ensureKey(p));
  const list = await loadModels(p);
  const chosen = model || store.getKey(p.id)?.model || defaultModelOf(p);
  if (!chosen) throw new Error(t.needModel);
  await applyTo(client, p, apiKey, chosen, list.models);
}

/** codesw test [client]：按客户端当前配置测一次连通，不写任何文件 */
async function cmdTest(id?: string): Promise<void> {
  const targets = id ? [getClient(id)] : CLIENTS.filter((cli) => matchBaseUrl(cli.current()?.baseUrl));
  if (id && !targets[0]) throw new Error(t.unknownClient(id, CLIENTS.map((x) => x.id).join(", ")));
  if (!targets.length) throw new Error(t.nothingToTest);
  let failed = false;
  for (const client of targets as ClientDef[]) {
    const cur = client.current();
    const p = currentProvider(client);
    console.log(`${c.bold(client.displayName)}${cur?.model && p ? c.dim(`  ${p.displayName} · ${cur.model}`) : ""}`);
    if (!p || !cur?.model) {
      console.log(c.dim(`  ${t.cannotTest(client.displayName)}`));
      failed = true;
      continue;
    }
    const apiKey = store.getKey(p.id)?.apiKey;
    if (!apiKey) {
      console.log(c.dim(`  ${t.noKeyToTest(p.displayName)}`));
      failed = true;
      continue;
    }
    if (!(await verify(client, p, apiKey, cur.model))) failed = true;
  }
  if (failed) process.exitCode = 1;
}

async function cmdRestore(id?: string): Promise<void> {
  const candidates = CLIENTS.filter((cli) => cli.restore);
  const client = id
    ? getClient(id)
    : candidates.length === 1
      ? candidates[0]
      : await select(t.askRestore, candidates.map((cli) => ({ label: cli.displayName, value: cli })));
  if (!client) throw new Error(t.unknownClient(id ?? "", candidates.map((x) => x.id).join(", ")));
  restore(client);
}

/** 更换或删除已保存的 Key */
async function cmdKey(id?: string): Promise<void> {
  const keys = store.load().keys;
  const p = id
    ? getProvider(id)
    : await select(
        t.askKeyProvider,
        PROVIDERS.map((x) => ({ label: x.displayName, hint: keys[x.id] ? store.maskKey(keys[x.id].apiKey) : t.notSaved, value: x })),
      );
  if (!p) throw new Error(t.unknownProvider(id ?? "", PROVIDERS.map((x) => x.id).join(", ")));
  const saved = keys[p.id];
  if (saved) {
    const action = await select(t.keyOf(p.displayName, store.maskKey(saved.apiKey)), [
      { label: t.replaceKey, value: "replace" },
      { label: t.removeKey, value: "remove" },
    ]);
    if (action === "remove") {
      store.removeKey(p.id);
      console.log(`${c.green("✔")} ${t.keyRemoved(p.displayName)}`);
      console.log(c.dim(t.clientUnaffected));
      return;
    }
  }
  if (p.apiKeyUrl) console.log(c.dim(t.createKeyAt(p.apiKeyUrl)));
  const apiKey = await askSecret(t.pasteNewKey(p.displayName), (v) => t.newKeyDone(c.dim(store.maskKey(v))));
  if (!apiKey) throw new Error(t.keyCancelled);
  store.setKey(p.id, { apiKey, model: saved?.model });
  console.log(`${c.green("✔")} ${t.keySavedFor(p.displayName)}`);
  console.log(c.dim(t.runAgain));
}

function usage(): void {
  const rows = t.usageRows;
  const col = Math.max(...rows.map(([cmd, args]) => strWidth(`${cmd} ${args}`))) + 4;
  const lines = rows.map(([cmd, args, desc]) => {
    const used = strWidth(`${cmd} ${args}`);
    return `  ${c.cyan(cmd)} ${args}${" ".repeat(col - used)}${desc}`;
  });
  const example = isZh ? "codesw use claude-code bumo.cc glm/glm-5.3" : "codesw use claude-code bumo.ai claude-sonnet-5-5";
  console.log(`${c.bold("codesw")} ${c.dim(`v${version()} · ${t.tagline}`)}

${c.bold(t.usageTitle)}
${lines.join("\n")}

${c.bold(t.clientsTitle)}  ${CLIENTS.map((x) => `${c.green(x.id)} ${c.dim(x.displayName)}`).join("  ")}
${c.bold(t.providersTitle)}  ${PROVIDERS.map((x) => c.green(x.id)).join("  ")}

${c.dim(`${t.example}: ${example}`)}
${c.dim(t.keyStoredAt(tilde(store.profilesPath)))}
`);
}

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;
  try {
    switch (cmd) {
      case undefined:
      case "":
        await interactive(); break;
      case "status": case "list": case "ls":
        cmdStatus(); break;
      case "use":
        await cmdUse(rest); break;
      case "test": case "check":
        await cmdTest(rest[0]); break;
      case "restore":
        await cmdRestore(rest[0]); break;
      case "key": case "keys": case "add":
        await cmdKey(rest[0]); break;
      case "remove": case "rm":
        if (!rest[0]) throw new Error(t.rmUsage);
        if (!store.removeKey(getProvider(rest[0])?.id ?? rest[0])) throw new Error(t.noSavedKey(rest[0]));
        console.log(`${c.green("✔")} ${t.keyRemoved(rest[0])}`); break;
      case "-v": case "--version": case "version":
        console.log(version()); break;
      case "-h": case "--help": case "help":
        usage(); break;
      default:
        console.error(c.red(t.unknownCommand(cmd)) + "\n");
        usage();
        process.exit(1);
    }
  } catch (e: any) {
    console.error(`${c.red("✖")} ${e?.message ?? e}`);
    process.exit(1);
  }
}

main();
