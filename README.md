# codesw

English | [简体中文](https://github.com/bumocc/codesw/blob/main/README.zh-CN.md)

One command to switch model providers for Claude Code / OpenCode / OpenClaw / Hermes Agent.

codesw writes each client's own config file directly — no proxy, no middleman.

## Install

```bash
npm i -g @bumocc/codesw
```

## Usage

```bash
codesw
```

Three steps, using the arrow keys and Enter:

1. **Which client to configure** — the list shows the provider and model each client currently uses
2. **Which provider** — paste your API key the first time you use a provider; it is saved and reused afterwards
3. **Which model** — recommended models come first; Bumo Router fetches its latest model list live

Restart the client to apply. To switch models or providers later, just run `codesw` again. The interface follows your system language: Chinese on Chinese systems, English everywhere else.

To go back to your official Claude Code account, run `codesw` and choose "Restore official account" at the bottom of the provider list.

## Commands

```bash
codesw                                  # switch interactively
codesw status                           # show the provider and model each client uses
codesw use <client> <provider> [model]  # switch without prompts, for scripts
codesw restore [client]                 # restore a client's official account
codesw key [provider]                   # replace or delete a saved API key
```

Examples:

```bash
codesw use claude-code bumo.ai claude-sonnet-5-5
codesw use opencode bumo.cc glm/glm-5.3
```

When the model is omitted, codesw uses the model you last picked for that provider, or the provider's default.

## Supported clients

| id            | Client                                                     | Config file                                |
| ------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `claude-code` | [Claude Code](https://docs.claude.com/en/docs/claude-code) | `~/.claude/settings.json`                  |
| `opencode`    | [OpenCode](https://opencode.ai/)                           | `~/.config/opencode/opencode.json`         |
| `openclaw`    | [OpenClaw](https://openclaw.ai/)                           | `~/.openclaw/openclaw.json`                |
| `hermes`      | [Hermes Agent](https://hermes-agent.nousresearch.com/)     | `~/.hermes/config.yaml` + `~/.hermes/.env` |

## Supported providers

| id                  | Name                                           | Default model          |
| ------------------- | ---------------------------------------------- | ---------------------- |
| `bumo.ai`           | [Bumo Router](https://router.bumo.ai/)         | `claude-sonnet-5-5`    |
| `bumo.cc`           | [Bumo Router (China)](https://router.bumo.cc/) | `glm/glm-5.3`          |
| `zhipu`             | Zhipu AI (GLM)                                 | `glm-5.1`              |
| `zhipu-coding`      | Zhipu AI Coding Plan                           | `glm-5.1`              |
| `bailian`           | Alibaba Bailian API                            | `glm-5.1`              |
| `bailian-coding`    | Alibaba Bailian Coding Plan                    | `glm-5`                |
| `volcengine`        | Volcengine Ark API                             | `doubao-seed-2.0-code` |
| `volcengine-coding` | Volcengine Ark Coding Plan                     | `kimi-k2.5`            |
| `minimax`           | MiniMax                                        | `MiniMax-M2`           |
| `kimi`              | Kimi API                                       | `kimi-k2.6`            |
| `kimi-coding`       | Kimi Coding Plan                               | `kimi-for-coding`      |

Bumo Router model lists are fetched live from `/v1/models`, falling back to a built-in list if the request fails.

## API key storage

API keys are stored per provider in `~/.codesw/profiles.json` (mode `0600`), together with the last model you picked for each provider. Profiles saved by 0.1.x are migrated automatically on first run — no need to re-enter keys.

## Upgrading from 0.1.x

- No more creating or naming profiles: keys are saved per provider, and the flow is now client → provider → model
- `codesw use` now takes `<client> <provider> [model]`; the old form `codesw use <provider> <client>` still works
- Bumo API is now Bumo Router, at `router.bumo.ai` / `router.bumo.cc`. `codesw status` flags clients still on the old address — apply once more to update

## Environment variables

- `NO_COLOR=1`: disable colored output

## Platforms

Linux / macOS / Windows.

## License

MIT
