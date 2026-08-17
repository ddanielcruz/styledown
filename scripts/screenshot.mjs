/*
 * The pictures in the README, taken from the running app rather than by hand.
 *
 * A screenshot in a README is documentation, and documentation drifts. This is how it stops
 * drifting: one command, a real Chrome, the real controls, and four files that can be made
 * again the day the design moves.
 *
 * Two things about it are worth knowing:
 *
 * 1. `deviceScaleFactor` is below 1 on purpose. The app only draws the document as a sheet
 *    when the pane is wide enough for a whole page — that is a container query, and the
 *    honest way to satisfy it is to give the page a wide viewport rather than to fake one.
 *    So the layout runs at 2100 CSS pixels and rasterises at two thirds, which is a 1400px
 *    image of a window nobody has to own.
 * 2. Storage is cleared before the capture. The profile directory outlives the run, so
 *    without it the second run photographs whatever the first one typed.
 *
 * Three files land in the output directory; the social card goes to `public/`, because that
 * one is not documentation — it is served.
 *
 * Usage:
 *   node scripts/screenshot.mjs <url> [outdir=docs/media]
 *
 *   node scripts/screenshot.mjs http://localhost:5173/styledown/
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [, , url, outDir = 'docs/media'] = process.argv;

if (!url) {
  console.error('usage: node scripts/screenshot.mjs <url> [outdir]');
  process.exit(1);
}

const PORT = 9335;
const CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/**
 * Wide enough that the preview pane clears the container query and the sheet is drawn: half
 * of what is left after the settings panel has to exceed the widest paper plus its gutter,
 * which is 881px for US Letter. At 2000 it misses by three pixels and the document prints
 * the shot full-bleed, which is a screenshot of the wrong thing.
 */
const LAYOUT_WIDTH = 2100;
const SCALE = 2 / 3;

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/styledown-screenshot-profile',
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
    ?.value;

await send('Page.enable');

const viewport = async (width, height, scale) =>
  send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: false,
  });

/**
 * A diagram and a typeface both arrive after the render that asked for them, and a capture
 * taken before they land shows a code fence where a drawing should be.
 */
const settled = async () => {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (await evaluate(`!!document.querySelector('.styledown-doc svg')`)) break;
    await sleep(250);
  }
  await evaluate(`(async () => { await document.fonts.ready; return 1 })()`);
  await sleep(500);
};

mkdirSync(outDir, { recursive: true });

const capture = async (file, params = {}) => {
  const { data } = await send('Page.captureScreenshot', { format: 'png', ...params });
  const target = path.join(outDir, file);

  writeFileSync(target, Buffer.from(data, 'base64'));
  console.log(target, `${Math.round(Buffer.from(data, 'base64').length / 1024)}KB`);
};

await viewport(LAYOUT_WIDTH, 1150, SCALE);
await send('Page.navigate', { url });
await sleep(2000);

// Whatever a previous run left behind is not what the README is about.
await evaluate(`localStorage.clear()`);
await send('Page.reload');
await sleep(2500);
await settled();

await capture('app.png');

/*
 * The document on its own, at its own size — the sheet is what the product makes, and in
 * the shot above it is a third of the frame. Clipped to the element rather than to a
 * guessed rectangle, so it stays right when the paper or the margins change.
 */
await viewport(LAYOUT_WIDTH, 1150, 1);
await sleep(800);

const box = JSON.parse(
  await evaluate(`(() => {
    const sheet = document.querySelector('.styledown-doc');
    const { x, y, width } = sheet.getBoundingClientRect();
    return JSON.stringify({ x, y, width });
  })()`),
);

// At its own size, so the type is the type. `clip` multiplies the device scale rather than
// replacing it, which is why the viewport went back to 1 first.
await capture('document.png', {
  clip: { x: box.x - 24, y: box.y, width: box.width + 48, height: 1000, scale: 1 },
});

/*
 * The card a pasted link unfurls into. 1200×630 is what every reader of `og:image` expects,
 * and it is the app rather than a logo — the product is the thing worth showing. Taken
 * before the settings are touched, because the default is what it is advertising.
 */
await viewport(Math.round(1200 / SCALE), Math.round(630 / SCALE), SCALE);
await sleep(1000);
await settled();

const social = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('public/og.png', Buffer.from(social.data, 'base64'));
console.log('public/og.png', `${Math.round(Buffer.from(social.data, 'base64').length / 1024)}KB`);

await viewport(LAYOUT_WIDTH, 1150, SCALE);
await sleep(800);

/*
 * The same document with four of the five controls moved, which is the only honest way to
 * show what they do — a screenshot of the panel on its own shows a list of words.
 */
const clickPanel = (label) =>
  evaluate(`(() => {
    const button = [...document.querySelectorAll('aside button')]
      .find((candidate) => candidate.textContent.trim() === ${JSON.stringify(label)});
    if (!button) return 'missing: ' + ${JSON.stringify(label)};
    button.click();
    return true;
  })()`);

const chooseFrom = async (name, option) => {
  // The options do not exist anywhere in the DOM until the listbox is open.
  await evaluate(`document.querySelector('aside [aria-label=${JSON.stringify(name)}]').click()`);
  await sleep(600);
  console.log(
    name,
    '→',
    await evaluate(`(() => {
      const item = [...document.querySelectorAll('[role=option]')]
        .find((candidate) => candidate.textContent.trim() === ${JSON.stringify(option)});
      if (!item) return 'missing: ' + ${JSON.stringify(option)};
      item.click();
      return ${JSON.stringify(option)};
    })()`),
  );
  await sleep(800);
};

await chooseFrom('Document font', 'Source Serif 4');
await chooseFrom('Code theme', 'Nord');
console.log('Margins →', (await clickPanel('Wide')) === true ? 'Wide' : 'missing');
await evaluate(`(() => {
  const swatch = [...document.querySelectorAll('aside button')]
    .find((candidate) => candidate.getAttribute('aria-label') === 'Teal');
  swatch.click();
  return true;
})()`);
await sleep(600);

// Scrolled to the part of the document where a code theme and a diagram are visible.
// Without it the second shot is the first one in a different face, which is not a second
// shot. `rehype-slug` has already given the heading its id.
await evaluate(`document.querySelector('#code').scrollIntoView({ block: 'start' })`);
await sleep(600);
await settled();

await capture('styles.png');

ws.close();
chrome.kill();
process.exit(0);
