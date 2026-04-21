# codesw

在多个 Code 客户端之间一键切换模型供应商的 CLI 工具。

原理是写入各客户端自己的配置文件（`~/.claude/settings.json`、`~/.config/opencode/opencode.json` 等），不做任何代理或中转。

## 支持的客户端

| 客户端                                                     | 配置文件                                   |
| ---------------------------------------------------------- | ------------------------------------------ |
| [Claude Code](https://docs.claude.com/en/docs/claude-code) | `~/.claude/settings.json`                  |
| [OpenCode](https://opencode.ai/)                           | `~/.config/opencode/opencode.json`         |
| [OpenClaw](https://openclaw.ai/)                           | `~/.openclaw/openclaw.json`                |
| [Hermes Agent](https://hermes-agent.nousresearch.com/)     | `~/.hermes/config.yaml` + `~/.hermes/.env` |

## 支持的供应商

| id                  | 名称                             | 默认模型               |
| ------------------- | -------------------------------- | ---------------------- |
| `bumo-cc`           | [不墨 API](https://api.bumo.cc/) | `glm/glm-5.1`          |
| `bumo-ai`           | [BUMO API](https://api.bumo.ai/) | `claude-sonnet-4-6`    |
| `zhipu`             | 智谱 AI (GLM)                    | `glm-5.1`              |
| `zhipu-coding`      | 智谱 AI Coding Plan              | `glm-5.1`              |
| `bailian`           | 百炼 API                         | `glm-5.1`              |
| `bailian-coding`    | 百炼 Coding Plan                 | `glm-5`                |
| `volcengine`        | 火山方舟 API                     | `doubao-seed-2.0-code` |
| `volcengine-coding` | 火山方舟 Coding Plan             | `kimi-k2.5`            |
| `minimax`           | MiniMax                          | `MiniMax-M2`           |
| `kimi`              | Kimi API                         | `kimi-k2.6`            |
| `kimi-coding`       | Kimi Coding Plan                 | `kimi-for-coding`      |

每家供应商同时支持 Anthropic 兼容和 OpenAI 兼容协议端点，codesw 会按客户端所需自动选择。

## 安装

```bash
npm i -g @bumocc/codesw
# 或
yarn global add @bumocc/codesw
```

从源码安装：

```bash
git clone git@github.com:bumocc/codesw.git
cd codesw
yarn install
yarn build
npm link
```

## 使用

### 交互模式

```bash
codesw
```

会引导你：

1. 选择 / 新建一个 profile（供应商 + API Key + 模型）
2. 选择要应用到哪个 Code 客户端

### 命令行

```bash
codesw list                      # 列出所有 profile
codesw add                       # 交互式添加 profile
codesw use <profile>             # 交互选择客户端后应用
codesw use <profile> <client>    # 直接应用到指定客户端
codesw show <profile>            # 查看 profile（API Key 脱敏）
codesw remove <profile>          # 删除 profile
codesw help                      # 帮助
```

示例：

```bash
codesw add                              # 新建一个叫 "my-glm" 的 profile
codesw use my-glm claude-code           # 应用到 Claude Code
codesw use my-glm opencode              # 同一个 profile 也可应用到 OpenCode
```

## Profile 存储

Profile 保存在 `~/.codesw/profiles.json`（权限 `0600`），包含 API Key、选择的模型等。codesw 自己维护这份数据，每次 `use` 时同步到目标客户端的配置文件。

```json
{
  "profiles": {
    "my-glm": {
      "name": "my-glm",
      "provider": "zhipu",
      "apiKey": "...",
      "model": "glm-4.6"
    }
  },
  "active": {
    "claude-code": "my-glm"
  }
}
```

## 环境变量

- `NO_COLOR=1`：关闭彩色输出

## 跨平台

Linux / macOS / Windows 均支持。Windows 上通过 npm 安装时会自动生成 `codesw.cmd`。

## 许可证

MIT
