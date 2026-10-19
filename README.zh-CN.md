# codesw

[English](./README.md) | 简体中文

一条命令，给 Claude Code / OpenCode / OpenClaw / Hermes Agent 切换模型供应商。

原理是直接写入各客户端自己的配置文件，不做任何代理或中转。

## 安装

```bash
npm i -g @bumocc/codesw
```

## 使用

```bash
codesw
```

按提示选三步，用方向键选择、回车确认：

1. **要配置哪个客户端**：列表里能看到每个客户端当前用的供应商和模型
2. **使用哪个供应商**：首次使用某个供应商时粘贴一次 API Key，之后自动复用
3. **使用哪个模型**：推荐模型排在最前；不墨 Router 会实时获取最新上架的模型

完成后重新打开客户端即可生效。界面语言跟随系统：中文系统显示中文，其他语言显示英文。以后换模型、换供应商，再运行一次 `codesw` 就行。

想换回 Claude Code 官方账号：运行 `codesw`，在供应商列表最下方选「恢复官方账号」。

## 命令

```bash
codesw                                # 交互式切换
codesw status                         # 查看各客户端当前使用的供应商和模型
codesw use <客户端> <供应商> [模型]    # 不经交互直接切换，适合脚本
codesw restore [客户端]                # 恢复客户端官方账号
codesw key [供应商]                    # 更换或删除已保存的 API Key
```

示例：

```bash
codesw use claude-code bumo.cc glm/glm-5.3
codesw use opencode bumo.ai claude-sonnet-5-5
```

省略模型时，使用上次为该供应商选择的模型，没有则用默认模型。

## 支持的客户端

| id            | 客户端                                                     | 配置文件                                   |
| ------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `claude-code` | [Claude Code](https://docs.claude.com/en/docs/claude-code) | `~/.claude/settings.json`                  |
| `opencode`    | [OpenCode](https://opencode.ai/)                           | `~/.config/opencode/opencode.json`         |
| `openclaw`    | [OpenClaw](https://openclaw.ai/)                           | `~/.openclaw/openclaw.json`                |
| `hermes`      | [Hermes Agent](https://hermes-agent.nousresearch.com/)     | `~/.hermes/config.yaml` + `~/.hermes/.env` |

## 支持的供应商

| id                  | 名称                                      | 默认模型               |
| ------------------- | ----------------------------------------- | ---------------------- |
| `bumo.cc`           | [不墨 Router](https://router.bumo.cc/)    | `glm/glm-5.3`          |
| `bumo.ai`           | [Bumo Router](https://router.bumo.ai/)    | `claude-sonnet-5-5`    |
| `zhipu`             | 智谱 AI (GLM)                             | `glm-5.1`              |
| `zhipu-coding`      | 智谱 AI Coding Plan                       | `glm-5.1`              |
| `bailian`           | 百炼 API                                  | `glm-5.1`              |
| `bailian-coding`    | 百炼 Coding Plan                          | `glm-5`                |
| `volcengine`        | 火山方舟 API                              | `doubao-seed-2.0-code` |
| `volcengine-coding` | 火山方舟 Coding Plan                      | `kimi-k2.5`            |
| `minimax`           | MiniMax                                   | `MiniMax-M2`           |
| `kimi`              | Kimi API                                  | `kimi-k2.6`            |
| `kimi-coding`       | Kimi Coding Plan                          | `kimi-for-coding`      |

不墨 Router 的模型列表在运行时从 `/v1/models` 实时获取，获取失败时使用内置列表。

## API Key 存储

API Key 按供应商保存在 `~/.codesw/profiles.json`（权限 `0600`），并记住每个供应商上次选择的模型。0.1.x 版本保存的 profile 会在首次运行时自动迁移，无需重新输入。

## 从 0.1.x 升级

- 不再需要创建、命名 profile，Key 按供应商保存，交互改为「客户端 → 供应商 → 模型」
- `codesw use` 的参数改为 `<客户端> <供应商> [模型]`；旧写法 `codesw use <供应商> <客户端>` 仍可用
- 不墨 API 更名为不墨 Router，地址改为 `router.bumo.cc` / `router.bumo.ai`。还在用旧地址的客户端，`codesw status` 会提示，重新应用一次即可

## 环境变量

- `NO_COLOR=1`：关闭彩色输出

## 跨平台

Linux / macOS / Windows 均支持。

## 许可证

MIT
