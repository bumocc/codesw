#!/usr/bin/env node
import { CLIENTS, getClient } from "./clients";
import { PROVIDERS, getProvider } from "./providers";
import { ask, askSecret, choose } from "./prompt";
import * as store from "./profiles";
import { c } from "./color";

function usage(): void {
  console.log(`${c.bold("codesw")} ${c.dim("— 切换 Code 客户端的模型供应商")}

${c.bold("用法:")}
  ${c.cyan("codesw")}                         交互模式（创建/选择 profile，应用到某个客户端）
  ${c.cyan("codesw list")}                    列出已保存 profile
  ${c.cyan("codesw add")}                     新建 profile（交互）
  ${c.cyan("codesw remove")} <profile>        删除 profile
  ${c.cyan("codesw show")} <profile>          查看 profile
  ${c.cyan("codesw use")} <profile> [client]  将 profile 应用到指定客户端（省略则交互选择）

${c.bold("支持的客户端:")} ${CLIENTS.map((cli) => c.green(cli.id)).join(", ")}
${c.bold("支持的供应商:")} ${PROVIDERS.map((p) => c.green(p.id)).join(", ")}

${c.dim(`Profile 存储: ~/.codesw/profiles.json`)}
`);
}

async function cmdAdd(): Promise<store.Profile> {
  const provider = await choose("选择供应商:", PROVIDERS, (p) => `${c.bold(p.displayName)} ${c.dim(`(${p.id})`)}`);
  const suggested = provider.id;
  const name = (await ask("Profile 名称", suggested)) || suggested;
  if (provider.apiKeyUrl) console.log(c.dim(`获取 API Key: ${provider.apiKeyUrl}`));
  const apiKey = await askSecret("API Key");
  if (!apiKey) throw new Error("API Key 不能为空");
  const defModel =
    provider.defaultModel ??
    provider.endpoints.anthropic?.defaultModel ??
    provider.endpoints.openai?.defaultModel ??
    "";
  let model = "";
  if (provider.models && provider.models.length > 0) {
    const CUSTOM = "<自定义输入>";
    const items = [...provider.models, CUSTOM];
    const defIdx = defModel ? provider.models.indexOf(defModel) : -1;
    console.log(`${c.cyan("?")} ${c.bold("可选模型")}${defIdx >= 0 ? c.dim(`（默认 ${defIdx + 1}: ${defModel}）`) : ""}:`);
    items.forEach((m, i) => {
      const label = m === CUSTOM ? c.magenta(m) : m === defModel ? c.green(`${m} (默认)`) : m;
      console.log(`  ${c.yellow(String(i + 1))}) ${label}`);
    });
    const raw = await ask("请选择模型序号", defIdx >= 0 ? String(defIdx + 1) : "");
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1 && n <= items.length) {
      model = items[n - 1] === CUSTOM ? await ask("模型 ID", defModel) : items[n - 1];
    } else {
      model = defModel;
    }
  } else {
    model = await ask("模型 ID", defModel);
  }
  const smallModel = await ask("小模型 ID (可选，回车跳过)", "");

  const profile: store.Profile = {
    name,
    provider: provider.id,
    apiKey,
    model: model || undefined,
    smallModel: smallModel || undefined,
  };
  store.upsert(profile);
  console.log(c.green(`✓ 已保存 profile: ${name}`));
  return profile;
}

function cmdList(): void {
  const s = store.load();
  const names = Object.keys(s.profiles);
  if (!names.length) {
    console.log(c.dim("暂无 profile。运行 ") + c.cyan("codesw add") + c.dim(" 创建一个。"));
    return;
  }
  for (const n of names) {
    const p = s.profiles[n];
    const prov = getProvider(p.provider);
    const active = s.active ? Object.entries(s.active).filter(([, v]) => v === n).map(([k]) => k) : [];
    const mark = active.length ? " " + c.green(`[active: ${active.join(", ")}]`) : "";
    const model = p.model ? c.dim(` / ${p.model}`) : "";
    console.log(`  ${c.yellow("•")} ${c.bold(n)}  ${c.dim("→")}  ${prov?.displayName ?? p.provider}${model}${mark}`);
  }
}

function cmdShow(name: string): void {
  const s = store.load();
  const p = s.profiles[name];
  if (!p) { console.error(c.red(`未找到 profile: ${name}`)); process.exit(1); }
  const masked = p.apiKey.length > 8 ? p.apiKey.slice(0, 4) + "..." + p.apiKey.slice(-4) : "****";
  console.log(JSON.stringify({ ...p, apiKey: masked }, null, 2));
}

function cmdRemove(name: string): void {
  if (store.remove(name)) console.log(c.green(`✓ 已删除 profile: ${name}`));
  else { console.error(c.red(`未找到 profile: ${name}`)); process.exit(1); }
}

async function pickModel(profile: store.Profile, provider: ReturnType<typeof getProvider>): Promise<string | undefined> {
  if (!provider) return profile.model;
  const models = provider.models ?? [];
  const current =
    profile.model ??
    provider.defaultModel ??
    provider.endpoints.anthropic?.defaultModel ??
    provider.endpoints.openai?.defaultModel ??
    "";
  if (models.length === 0) {
    const m = await ask("模型 ID", current);
    return m || undefined;
  }
  const CUSTOM = "<自定义输入>";
  const items = [...models, CUSTOM];
  const curIdx = current ? models.indexOf(current) : -1;
  console.log(`${c.cyan("?")} ${c.bold("选择模型")}${curIdx >= 0 ? c.dim(`（当前 ${curIdx + 1}: ${current}）`) : ""}:`);
  items.forEach((m, i) => {
    const label = m === CUSTOM ? c.magenta(m) : m === current ? c.green(`${m} (当前)`) : m;
    console.log(`  ${c.yellow(String(i + 1))}) ${label}`);
  });
  const raw = await ask("请选择模型序号", curIdx >= 0 ? String(curIdx + 1) : "");
  const n = parseInt(raw, 10);
  if (Number.isFinite(n) && n >= 1 && n <= items.length) {
    return items[n - 1] === CUSTOM ? (await ask("模型 ID", current)) || undefined : items[n - 1];
  }
  return current || undefined;
}

async function cmdUse(profileName: string, clientId?: string): Promise<void> {
  const s = store.load();
  const profile = s.profiles[profileName];
  if (!profile) { console.error(c.red(`未找到 profile: ${profileName}`)); process.exit(1); }
  const provider = getProvider(profile.provider);
  if (!provider) { console.error(c.red(`未知供应商: ${profile.provider}`)); process.exit(1); }

  const chosen = await pickModel(profile, provider);
  if (chosen && chosen !== profile.model) {
    profile.model = chosen;
    store.upsert(profile);
  }

  let client = clientId ? getClient(clientId) : undefined;
  if (!client) {
    client = await choose("应用到哪个客户端:", CLIENTS, (cli) => `${c.bold(cli.displayName)} ${c.dim(`(${cli.id})`)}`);
  }
  const written = client.apply(profile, provider);
  store.markActive(client.id, profile.name);
  console.log(c.green(`✓ 已应用 `) + c.bold(profile.name) + c.green(` → `) + c.bold(client.displayName));
  console.log(c.dim(`  配置文件: ${written}`));
}

async function interactive(): Promise<void> {
  const s = store.load();
  const existing = Object.values(s.profiles);
  let profile: store.Profile;
  if (existing.length === 0) {
    console.log(c.dim("尚无 profile，先创建一个。"));
    profile = await cmdAdd();
  } else {
    const NEW = { name: "<添加新的供应商>", provider: "", apiKey: "" } as store.Profile;
    const picked = await choose("选择要使用的供应商:", [NEW, ...existing], (p) =>
      p === NEW
        ? c.magenta(p.name)
        : `${c.bold(p.name)} ${c.dim(`(${getProvider(p.provider)?.displayName ?? p.provider}${p.model ? ` / ${p.model}` : ""})`)}`);
    profile = picked === NEW ? await cmdAdd() : picked;
  }
  await cmdUse(profile.name);
}

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;
  try {
    switch (cmd) {
      case undefined:
      case "":
        await interactive(); break;
      case "list": case "ls":
        cmdList(); break;
      case "add":
        await cmdAdd(); break;
      case "show":
        if (!rest[0]) { usage(); process.exit(1); }
        cmdShow(rest[0]); break;
      case "remove": case "rm":
        if (!rest[0]) { usage(); process.exit(1); }
        cmdRemove(rest[0]); break;
      case "use":
        if (!rest[0]) { usage(); process.exit(1); }
        await cmdUse(rest[0], rest[1]); break;
      case "-h": case "--help": case "help":
        usage(); break;
      default:
        console.error(c.red(`未知命令: ${cmd}`));
        usage();
        process.exit(1);
    }
  } catch (e: any) {
    console.error(c.red(`错误: ${e?.message ?? e}`));
    process.exit(1);
  }
}

main();
