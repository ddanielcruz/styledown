/*
 * Print the app to a PDF the way the print dialog would, with the controls set from the
 * panel first.
 *
 * `docs/DESIGN.md` puts pagination among the two risks the whole build order exists to
 * face early, and `CLAUDE.md` is explicit that it cannot be checked by reasoning about the
 * CSS. This is how it gets checked: drive a real Chrome, click the real controls, print,
 * and measure the file that comes out with `measure-pdf.mjs`.
 *
 * Two things about it are load-bearing:
 *
 * 1. `preferCSSPageSize: true`. Without it Chrome ignores `@page` and quietly prints US
 *    Letter, so every margin measured off the result is meaningless — a check that passes
 *    while proving nothing. Generic screenshot tooling does not set it.
 * 2. The settings are clicked, not injected. Setting the state directly would exercise the
 *    stylesheet and leave the control untested, and the control is where the bugs have
 *    been: choosing a paper you had already chosen once printed the paper before last.
 *
 * Usage:
 *   node scripts/print-to-pdf.mjs <url> <markdown-file> <out.pdf> [paper] [margins] [theme] [accent]
 *
 * Paper and margins accept a comma-separated list, clicked in order, so a run can walk
 * back to a setting it has already been on:
 *
 *   node scripts/print-to-pdf.mjs http://localhost:5173/styledown/ \
 *     docs/sample-document.md /tmp/out.pdf Legal,A4,Legal Wide,Narrow,Wide
 */
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const [, , url, markdownPath, outPath, paper, margins, theme, accent] = process.argv;

if (!url || !markdownPath || !outPath) {
  console.error(
    'usage: node scripts/print-to-pdf.mjs <url> <markdown-file> <out.pdf> [paper] [margins] [theme] [accent]',
  );
  process.exit(1);
}

const PORT = 9333;
const CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/styledown-print-profile',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  'about:blank',
]);

chrome.on('error', (error) => {
  console.error(`could not start Chrome at ${CHROME} — set CHROME_PATH`, error.message);
  process.exit(1);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let wsUrl;
for (let attempt = 0; attempt < 40 && !wsUrl; attempt++) {
  try {
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    wsUrl = targets.find((target) => target.type === 'page')?.webSocketDebuggerUrl;
  } catch {
    /* not up yet */
  }
  if (!wsUrl) await sleep(250);
}

if (!wsUrl) {
  console.error('Chrome never came up');
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
await new Promise((resolve) => (ws.onopen = resolve));

let id = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message.result);
    pending.delete(message.id);
  }
};

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const messageId = ++id;
    pending.set(messageId, resolve);
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });

const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result
    .value;

await send('Page.enable');
// Wide enough that the preview pane clears the container query with the panel open, so the
// sheet is wearing its gutter and shadow when we print — the state the print rules undo.
// Printing from a narrow pane would pass without testing anything.
await send('Emulation.setDeviceMetricsOverride', {
  width: 2200,
  height: 1200,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url });
await sleep(2500);

// CodeMirror owns its own document, and `execCommand('selectAll')` no-ops against its
// selection — which leaves the paste appending to the default document rather than
// replacing it. The editing command reaches the real selection.
const markdown = readFileSync(markdownPath, 'utf8');
await evaluate(`document.querySelector('.cm-content').focus()`);
await send('Input.dispatchKeyEvent', {
  type: 'rawKeyDown',
  modifiers: 4, // Meta
  key: 'a',
  code: 'KeyA',
  windowsVirtualKeyCode: 65,
  nativeVirtualKeyCode: 65,
  commands: ['selectAll'],
});
await send('Input.dispatchKeyEvent', { type: 'keyUp', modifiers: 4, key: 'a', code: 'KeyA' });
await evaluate(`(() => {
  const editor = document.querySelector('.cm-content');
  const data = new DataTransfer();
  data.setData('text/plain', ${JSON.stringify(markdown)});
  editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  return true;
})()`);
await sleep(2500);

const clickPanel = (label) =>
  evaluate(`(() => {
    const button = [...document.querySelectorAll('aside button')]
      .find((candidate) => candidate.textContent.trim() === ${JSON.stringify(label)});
    if (!button) return 'missing: ' + ${JSON.stringify(label)};
    button.click();
    return 'set ' + ${JSON.stringify(label)};
  })()`);

for (const label of [...(paper?.split(',') ?? []), ...(margins?.split(',') ?? [])]) {
  console.log(await clickPanel(label));
  await sleep(400);
}

if (accent) {
  // Swatches carry their colour name as a label rather than as text.
  console.log(
    await evaluate(`(() => {
      const swatch = [...document.querySelectorAll('aside button')]
        .find((candidate) => candidate.getAttribute('aria-label') === ${JSON.stringify(accent)});
      if (!swatch) return 'missing accent: ' + ${JSON.stringify(accent)};
      swatch.click();
      return 'set accent ' + ${JSON.stringify(accent)};
    })()`),
  );
  await sleep(400);
}

if (theme) {
  // The options do not exist anywhere in the DOM until the listbox is open.
  await evaluate(`document.querySelector('aside [aria-label="Code theme"]').click()`);
  await sleep(600);
  console.log(
    await evaluate(`(() => {
      const option = [...document.querySelectorAll('[role=option]')]
        .find((candidate) => candidate.textContent.trim() === ${JSON.stringify(theme)});
      if (!option) return 'missing theme: ' + ${JSON.stringify(theme)};
      option.click();
      return 'set theme ' + ${JSON.stringify(theme)};
    })()`),
  );
  await sleep(600);
}

// A chosen family and KaTeX both arrive after the render that asks for them, and a capture
// taken before the fonts land shows mangled type that looks like a CSS bug and is not one.
await evaluate(`(async () => { await document.fonts.ready; return document.fonts.status })()`);
await sleep(1500);

console.log(
  'state:',
  await evaluate(`JSON.stringify({
    pageRules: [...document.querySelectorAll('style')]
      .map((style) => style.textContent)
      .filter((css) => css.includes('@page')),
    pageSize: document.querySelector('.styledown-doc').dataset.pageSize,
    codeBackground: getComputedStyle(document.querySelector('.styledown-doc pre code')).backgroundColor,
  })`),
);

const { data } = await send('Page.printToPDF', {
  printBackground: true,
  // The whole point of this script.
  preferCSSPageSize: true,
  displayHeaderFooter: false,
});

writeFileSync(outPath, Buffer.from(data, 'base64'));
console.log('wrote', outPath);

ws.close();
chrome.kill();
process.exit(0);
