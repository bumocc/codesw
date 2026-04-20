import * as readline from "readline";
import { c } from "./color";

function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

export function ask(question: string, def?: string): Promise<string> {
  const rl = createRL();
  const hint = def ? c.dim(` [${def}]`) : "";
  return new Promise((resolve) => {
    rl.question(`${c.cyan("?")} ${c.bold(question)}${hint}: `, (a) => {
      rl.close();
      resolve(a.trim() || def || "");
    });
  });
}

export async function askSecret(question: string): Promise<string> {
  process.stdout.write(`${c.cyan("?")} ${c.bold(question)}: `);
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isTTY ? stdin.isRaw : false;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let buf = "";
    const onData = (ch: string) => {
      for (const ch2 of ch) {
        if (ch2 === "\n" || ch2 === "\r" || ch2 === "\u0004") {
          if (stdin.isTTY) stdin.setRawMode(wasRaw);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(buf);
          return;
        } else if (ch2 === "\u0003") {
          process.stdout.write("\n");
          process.exit(130);
        } else if (ch2 === "\u007f" || ch2 === "\b") {
          if (buf.length > 0) {
            buf = buf.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          buf += ch2;
          process.stdout.write(c.dim("*"));
        }
      }
    };
    stdin.on("data", onData);
  });
}

export async function choose<T>(question: string, items: T[], render: (t: T) => string): Promise<T> {
  console.log(`${c.cyan("?")} ${c.bold(question)}`);
  items.forEach((it, i) => console.log(`  ${c.yellow(String(i + 1))}) ${render(it)}`));
  while (true) {
    const a = await ask("请选择序号");
    const n = parseInt(a, 10);
    if (Number.isFinite(n) && n >= 1 && n <= items.length) return items[n - 1];
    console.log(c.red("无效输入，请重试"));
  }
}
