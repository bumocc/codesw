/** 跟随系统语言：中文环境显示中文，其他一律英文 */
function detectZh(): boolean {
  const env = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || process.env.LANGUAGE || "";
  // C / POSIX 是未设置语言时的默认值，不代表用户选择了英文，交给系统区域设置判断
  if (env && !/^(C|POSIX)(\.|$)/i.test(env)) return /^zh/i.test(env);
  try {
    return /^zh/i.test(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return false;
  }
}

export const isZh = detectZh();

const zh = {
  tagline: "一键切换 Code 客户端的模型供应商",
  selectHint: "↑↓ 选择 · 回车确认",
  moreItems: (n: number) => `（共 ${n} 项，上下滚动查看更多）`,
  noChoices: "没有可选项",
  enterNumber: "请输入序号",
  invalidInput: "无效输入，请重试",

  notInstalled: "未安装",
  notConfigured: "未配置",
  official: "官方账号",
  custom: "自定义",
  legacyWarn: "仍在使用旧地址，重新应用一次即可更新",
  inUse: "当前使用",
  keySaved: "已保存 Key",
  recommended: "推荐",

  askClient: "要配置哪个客户端？",
  askProvider: "使用哪个供应商？",
  askModel: "使用哪个模型？",
  restoreLabel: "恢复官方账号",
  restoreHint: (client: string) => `移除第三方配置，使用 ${client} 自带登录`,
  customModel: "手动输入模型 ID…",
  modelId: "模型 ID",
  loadingModels: "正在获取最新模型列表…",

  usingSavedKey: (masked: string) => `使用已保存的 ${masked}（更换请运行 codesw key）`,
  noKeyYet: (url: string) => `  还没有 Key？在这里创建：${url}`,
  pasteKey: (name: string) => `粘贴 ${name} 的 API Key`,
  keyDone: (masked: string) => `${masked}，已保存，下次无需再输`,
  keyCancelled: "未输入 API Key，已取消",
  modelCancelled: "未填写模型，已取消",

  switched: (client: string, target: string) => [`${client} 已切换到 `, target],
  writtenTo: (file: string, client: string) => `  已写入 ${file}，重新打开 ${client} 即可生效`,
  restored: (client: string) => `${client} 已恢复为官方账号`,
  restoredFile: (file: string, client: string) => `  已更新 ${file}，重新打开 ${client} 即可生效`,
  restoreUnsupported: (client: string) => `${client} 暂不支持恢复官方配置`,
  askRestore: "恢复哪个客户端？",

  savedKeys: "已保存的 Key:",
  useUsage: "用法: codesw use <客户端> <供应商> [模型]",
  unknownClient: (id: string, all: string) => `未知客户端: ${id}，可选: ${all}`,
  unknownProvider: (id: string, all: string) => `未知供应商: ${id}，可选: ${all}`,
  unsupported: (p: string, client: string) => `${p} 不支持 ${client}`,
  needModel: "请指定模型",

  askKeyProvider: "管理哪个供应商的 Key？",
  notSaved: "未保存",
  keyOf: (name: string, masked: string) => `${name} 的 Key（${masked}）`,
  replaceKey: "更换 Key",
  removeKey: "删除 Key",
  keyRemoved: (name: string) => `已删除 ${name} 的 Key`,
  clientUnaffected: "  已写入客户端的配置不受影响",
  createKeyAt: (url: string) => `  在这里创建 Key：${url}`,
  pasteNewKey: (name: string) => `粘贴 ${name} 的新 API Key`,
  newKeyDone: (masked: string) => `新 API Key ${masked}`,
  keySavedFor: (name: string) => `已保存 ${name} 的 Key`,
  runAgain: "  再运行一次 codesw 应用到客户端",
  rmUsage: "用法: codesw rm <供应商>",
  noSavedKey: (id: string) => `没有保存 ${id} 的 Key`,
  unknownCommand: (cmd: string) => `未知命令: ${cmd}`,

  usageTitle: "用法",
  usageRows: [
    ["codesw", "", "按提示选择 客户端 → 供应商 → 模型"],
    ["codesw status", "", "查看各客户端当前使用的供应商和模型"],
    ["codesw use", "<客户端> <供应商> [模型]", "不经交互直接切换，适合脚本"],
    ["codesw restore", "[客户端]", "恢复客户端官方账号"],
    ["codesw key", "[供应商]", "更换或删除已保存的 API Key"],
  ] as [string, string, string][],
  clientsTitle: "客户端",
  providersTitle: "供应商",
  example: "示例",
  keyStoredAt: (file: string) => `API Key 保存在 ${file}（权限 0600）`,

  noEndpoint: (name: string) => `${name} 没有可用端点`,
  noAnthropic: (name: string) => `${name} 未提供 Anthropic 兼容端点，无法用于 Claude Code`,
};

const en: typeof zh = {
  tagline: "Switch model providers for your coding agents",
  selectHint: "↑↓ to move · Enter to select",
  moreItems: (n: number) => `(${n} items, scroll for more)`,
  noChoices: "Nothing to choose from",
  enterNumber: "Enter a number",
  invalidInput: "Invalid input, please try again",

  notInstalled: "not installed",
  notConfigured: "not configured",
  official: "official account",
  custom: "custom",
  legacyWarn: "using an old address — apply again to update",
  inUse: "in use",
  keySaved: "key saved",
  recommended: "recommended",

  askClient: "Which client to configure?",
  askProvider: "Which provider?",
  askModel: "Which model?",
  restoreLabel: "Restore official account",
  restoreHint: (client: string) => `remove third-party settings and use ${client}'s own login`,
  customModel: "Enter a model ID…",
  modelId: "Model ID",
  loadingModels: "Fetching the latest models…",

  usingSavedKey: (masked: string) => `using saved key ${masked} (run codesw key to change it)`,
  noKeyYet: (url: string) => `  No key yet? Create one at ${url}`,
  pasteKey: (name: string) => `Paste your ${name} API key`,
  keyDone: (masked: string) => `${masked}, saved for next time`,
  keyCancelled: "No API key entered, cancelled",
  modelCancelled: "No model entered, cancelled",

  switched: (client: string, target: string) => [`${client} now uses `, target],
  writtenTo: (file: string, client: string) => `  Wrote ${file}. Restart ${client} to apply.`,
  restored: (client: string) => `${client} restored to the official account`,
  restoredFile: (file: string, client: string) => `  Updated ${file}. Restart ${client} to apply.`,
  restoreUnsupported: (client: string) => `${client} does not support restoring the official account yet`,
  askRestore: "Restore which client?",

  savedKeys: "Saved keys:",
  useUsage: "Usage: codesw use <client> <provider> [model]",
  unknownClient: (id: string, all: string) => `Unknown client: ${id}. Available: ${all}`,
  unknownProvider: (id: string, all: string) => `Unknown provider: ${id}. Available: ${all}`,
  unsupported: (p: string, client: string) => `${p} cannot be used with ${client}`,
  needModel: "Please specify a model",

  askKeyProvider: "Manage the key for which provider?",
  notSaved: "not saved",
  keyOf: (name: string, masked: string) => `${name} key (${masked})`,
  replaceKey: "Replace key",
  removeKey: "Delete key",
  keyRemoved: (name: string) => `Deleted the ${name} key`,
  clientUnaffected: "  Client settings already written are not affected",
  createKeyAt: (url: string) => `  Create a key at ${url}`,
  pasteNewKey: (name: string) => `Paste your new ${name} API key`,
  newKeyDone: (masked: string) => `New API key ${masked}`,
  keySavedFor: (name: string) => `Saved the ${name} key`,
  runAgain: "  Run codesw again to apply it to a client",
  rmUsage: "Usage: codesw rm <provider>",
  noSavedKey: (id: string) => `No saved key for ${id}`,
  unknownCommand: (cmd: string) => `Unknown command: ${cmd}`,

  usageTitle: "Usage",
  usageRows: [
    ["codesw", "", "Pick client → provider → model interactively"],
    ["codesw status", "", "Show the provider and model each client uses"],
    ["codesw use", "<client> <provider> [model]", "Switch without prompts, for scripts"],
    ["codesw restore", "[client]", "Restore a client's official account"],
    ["codesw key", "[provider]", "Replace or delete a saved API key"],
  ],
  clientsTitle: "Clients",
  providersTitle: "Providers",
  example: "Example",
  keyStoredAt: (file: string) => `API keys are stored in ${file} (mode 0600)`,

  noEndpoint: (name: string) => `${name} has no usable endpoint`,
  noAnthropic: (name: string) => `${name} has no Anthropic-compatible endpoint and cannot be used with Claude Code`,
};

export const t = isZh ? zh : en;
