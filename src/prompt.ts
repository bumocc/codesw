import * as readline from "readline";
import { c } from "./color";
import { t } from "./i18n";

const isTTY = () => !!(process.stdin.isTTY && process.stdout.isTTY);

function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

export function ask(question: string, def?: string): Promise<string> {
  const rl = createRL();
  const hint = def ? c.dim(` (${def})`) : "";
  return new Promise((resolve) => {
    rl.question(`${c.cyan("?")} ${c.bold(question)}${hint} `, (a) => {
      rl.close();
      resolve(a.trim() || def || "");
    });
  });
}

/** 隐藏输入；done 给出时，输入完成后把这一行替换成 ✔ 摘要 */
export async function askSecret(question: string, done?: (value: string) => string): Promise<string> {
  const prompt = `${c.cyan("?")} ${c.bold(question)} `;
  process.stdout.write(prompt);
  if (done && isTTY()) {
    const value = await readSecret();
    const rows = Math.max(1, Math.ceil((strWidth(prompt) + value.length) / (process.stdout.columns || 80)));
    if (value) process.stdout.write(`\x1b[${rows}A\r\x1b[J${c.green("✔")} ${c.bold(done(value))}\n`);
    return value;
  }
  return readSecret();
}

function readSecret(): Promise<string> {
  if (!process.stdin.isTTY) {
    // 非终端（如管道输入）没法隐藏输入，直接按行读
    const rl = readline.createInterface({ input: process.stdin });
    return new Promise((resolve) => {
      let line = "";
      rl.once("line", (l) => { line = l.trim(); rl.close(); });
      rl.once("close", () => { process.stdout.write("\n"); resolve(line); });
    });
  }
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let buf = "";
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\n" || ch === "\r" || ch === "\u0004") {
          stdin.setRawMode(wasRaw);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(buf.trim());
          return;
        } else if (ch === "\u0003") {
          process.stdout.write("\n");
          process.exit(130);
        } else if (ch === "\u007f" || ch === "\b") {
          if (buf.length > 0) {
            buf = buf.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else if (ch >= " ") {
          buf += ch;
          process.stdout.write(c.dim("*"));
        }
      }
    };
    stdin.on("data", onData);
  });
}

export interface Choice<T> {
  label: string;
  /** 右侧灰色说明 */
  hint?: string;
  value: T;
  /** 分组标题，不可选 */
  separator?: boolean;
}

const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");

/** 终端显示宽度：中日韩字符和 emoji 占两列 */
export function strWidth(s: string): number {
  let w = 0;
  for (const ch of stripAnsi(s)) {
    const cp = ch.codePointAt(0)!;
    w += (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0xa4cf) || (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe4f) || (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6) || (cp >= 0x1f300 && cp <= 0x1faff) || cp >= 0x20000 ? 2 : 1;
  }
  return w;
}

const pad = (s: string, width: number) => s + " ".repeat(Math.max(0, width - strWidth(s)));

/** 按显示宽度截断纯文本，超出部分用 … 代替 */
function truncate(s: string, width: number): string {
  if (strWidth(s) <= width) return s;
  let out = "";
  for (const ch of s) {
    if (strWidth(out + ch) > width - 1) break;
    out += ch;
  }
  return out + "…";
}

let cursorHidden = false;
function hideCursor(hide: boolean) {
  if (hide === cursorHidden) return;
  cursorHidden = hide;
  process.stdout.write(hide ? "\x1b[?25l" : "\x1b[?25h");
}
process.on("exit", () => hideCursor(false));

/** 方向键选择；数字键直接跳到对应项。非终端环境退化为输入序号。 */
export async function select<T>(question: string, choices: Choice<T>[], initial = 0): Promise<T> {
  const selectable = choices.map((ch, i) => (ch.separator ? -1 : i)).filter((i) => i >= 0);
  if (!selectable.length) throw new Error(t.noChoices);
  if (!isTTY()) return selectByNumber(question, choices);

  let cur = selectable.includes(initial) ? initial : selectable[0];
  const labelWidth = Math.max(...choices.filter((ch) => !ch.separator).map((ch) => strWidth(ch.label)));
  const pageSize = Math.max(5, Math.min(choices.length, (process.stdout.rows || 24) - 4, 14));
  let top = 0;
  let drawn = 0;

  const lineCount = (s: string) => Math.max(1, Math.ceil(strWidth(s) / (process.stdout.columns || 80)));
  const clear = () => {
    if (drawn > 0) process.stdout.write(`\x1b[${drawn}A\r\x1b[J`);
    drawn = 0;
  };
  const render = () => {
    clear();
    if (cur < top) top = cur;
    if (cur >= top + pageSize) top = cur - pageSize + 1;
    const lines = [`${c.cyan("?")} ${c.bold(question)} ${c.dim(t.selectHint)}`];
    for (let i = top; i < Math.min(choices.length, top + pageSize); i++) {
      const ch = choices[i];
      if (ch.separator) { lines.push(`  ${c.dim(ch.label)}`); continue; }
      const on = i === cur;
      const label = on ? c.cyan(c.bold(pad(ch.label, labelWidth))) : pad(ch.label, labelWidth);
      // 说明文字截断到一行内，避免折行打乱重绘
      const room = (process.stdout.columns || 80) - 1 - (2 + labelWidth + 2);
      const hint = ch.hint && room > 3 ? "  " + c.dim(truncate(ch.hint, room)) : "";
      lines.push(`${on ? c.cyan("❯") : " "} ${label}${hint}`);
    }
    if (choices.length > pageSize) lines.push(c.dim("  " + t.moreItems(selectable.length)));
    const out = lines.join("\n") + "\n";
    drawn = lines.reduce((n, l) => n + lineCount(l), 0);
    process.stdout.write(out);
  };

  return new Promise((resolve) => {
    const stdin = process.stdin;
    readline.emitKeypressEvents(stdin);
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    hideCursor(true);
    render();

    const move = (step: number) => {
      const pos = selectable.indexOf(cur);
      cur = selectable[(pos + step + selectable.length) % selectable.length];
      render();
    };
    const done = () => {
      stdin.off("keypress", onKey);
      stdin.setRawMode(wasRaw);
      stdin.pause();
      clear();
      hideCursor(false);
      process.stdout.write(`${c.green("✔")} ${c.bold(question)} ${c.cyan(choices[cur].label)}\n`);
      resolve(choices[cur].value);
    };
    const onKey = (str: string | undefined, key: readline.Key) => {
      if (key?.ctrl && key.name === "c") { clear(); hideCursor(false); process.exit(130); }
      if (key?.name === "escape") { clear(); hideCursor(false); process.exit(0); }
      if (key?.name === "up" || key?.name === "k") return move(-1);
      if (key?.name === "down" || key?.name === "j" || key?.name === "tab") return move(1);
      if (key?.name === "return" || key?.name === "enter") return done();
      if (str && /^[1-9]$/.test(str)) {
        const idx = selectable[Number(str) - 1];
        if (idx !== undefined) { cur = idx; render(); }
      }
    };
    stdin.on("keypress", onKey);
  });
}

async function selectByNumber<T>(question: string, choices: Choice<T>[]): Promise<T> {
  const items = choices.filter((ch) => !ch.separator);
  console.log(`${c.cyan("?")} ${c.bold(question)}`);
  items.forEach((ch, i) => console.log(`  ${c.yellow(String(i + 1))}) ${ch.label}${ch.hint ? "  " + c.dim(ch.hint) : ""}`));
  while (true) {
    const n = parseInt(await ask(t.enterNumber), 10);
    if (Number.isFinite(n) && n >= 1 && n <= items.length) return items[n - 1].value;
    console.log(c.red(t.invalidInput));
  }
}

/** 等待异步任务时显示转圈提示，结束后清掉这一行 */
export async function withSpinner<T>(text: string, task: Promise<T>): Promise<T> {
  if (!process.stdout.isTTY) return task;
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  hideCursor(true);
  const timer = setInterval(() => process.stdout.write(`\r${c.cyan(frames[i++ % frames.length])} ${c.dim(text)}`), 80);
  try {
    return await task;
  } finally {
    clearInterval(timer);
    process.stdout.write("\r\x1b[K");
    hideCursor(false);
  }
}
