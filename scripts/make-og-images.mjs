/**
 * Generates the Open Graph cards in public/og/.
 *
 *   npm run build && npm start            (in one terminal)
 *   node scripts/make-og-images.mjs       (in another; needs `npm i -D playwright`)
 *
 * Pass a different origin as the first argument if the site is not on :3000.
 * The script reads each project's name, summary and screenshots from the
 * running site, so new projects get a card without editing this file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const origin = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og');

const esc = (text) =>
  String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function card({ eyebrow, title, summary, shots, shape, site }) {
  const size = title.length > 44 ? 50 : title.length > 22 ? 60 : 74;
  let visual = '';
  if (shape === 'portrait') {
    visual = `<div class="phones">${shots
      .slice(0, 2)
      // Store art that already shows a device gets no second frame.
      .map((src) => `<div class="phone${/android/.test(src) ? ' plain' : ''}"><img src="${src}"></div>`)
      .join('')}</div>`;
  } else if (shape === 'tablet') {
    visual = `<div class="tablet"><img src="${shots[0]}"></div>`;
  } else if (shape === 'home') {
    visual = `<div class="browser home"><div class="bar"><i></i><i></i><i></i></div><img src="${shots[0]}"></div>
      <div class="phone solo"><img src="${shots[1]}"></div>`;
  } else if (shots[0]) {
    visual = `<div class="browser"><div class="bar"><i></i><i></i><i></i></div><img src="${shots[0]}"></div>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: Manrope; src: url('/fonts/manrope-latin.woff2') format('woff2'); font-weight: 200 800; }
    * { box-sizing: border-box; margin: 0; }
    body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: #faf9f6; color: #15171c;
      font-family: Manrope, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    body::after { content: ''; position: absolute; inset: 0 0 auto 0; height: 8px; background: #d63a17; }
    .copy { position: absolute; left: 64px; top: 0; bottom: 0; width: ${visual ? 500 : 980}px; display: flex; flex-direction: column; padding: 60px 0 52px; }
    .who { display: flex; align-items: center; gap: 14px; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .mark { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; background: #15171c; color: #fff; font-size: 16px; letter-spacing: 0.02em; }
    .eyebrow { margin-top: auto; color: #b52f11; font-size: 18px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
    h1 { margin-top: 16px; font-size: ${size}px; font-weight: 800; letter-spacing: -0.04em; line-height: 1.02; }
    p { margin-top: 20px; color: #4a505a; font-size: 25px; line-height: 1.38; font-weight: 500;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .site { margin-top: auto; color: #5d636e; font-size: 20px; font-weight: 700; }
    .browser { position: absolute; left: 620px; top: 92px; width: 760px; border: 1px solid #cfcbc1; border-radius: 16px; overflow: hidden;
      background: #fff; box-shadow: 0 30px 70px rgb(21 23 28 / 0.18), 0 4px 12px rgb(21 23 28 / 0.06); }
    .browser .bar { display: flex; gap: 8px; align-items: center; height: 40px; padding: 0 18px; background: #f6f4ef; border-bottom: 1px solid #e3e0d8; }
    .browser .bar i { width: 11px; height: 11px; border-radius: 50%; background: #d9d5cb; }
    .browser img { display: block; width: 100%; height: 560px; object-fit: cover; object-position: top left; }
    .browser.home { left: 610px; top: 78px; width: 720px; }
    .phones { position: absolute; left: 640px; top: 78px; display: flex; gap: 32px; }
    .phone { width: 244px; padding: 9px; border-radius: 42px; background: #16181d; box-shadow: 0 30px 70px rgb(21 23 28 / 0.22); }
    .phone img { display: block; width: 100%; border-radius: 33px; }
    .phone.plain { padding: 0; background: none; border-radius: 22px; overflow: hidden; }
    .phone.plain img { border-radius: 0; }
    .phone.solo { position: absolute; left: 940px; top: 150px; width: 216px; padding: 8px; border-radius: 38px; }
    .phone.solo img { border-radius: 30px; }
    .tablet { position: absolute; left: 600px; top: 110px; width: 700px; padding: 13px; border-radius: 30px; background: #16181d; box-shadow: 0 30px 70px rgb(21 23 28 / 0.22); }
    .tablet img { display: block; width: 100%; border-radius: 18px; }
  </style></head><body>
    <div class="copy">
      <div class="who"><span class="mark">AF</span>Alisher Farhadi</div>
      <div class="eyebrow">${esc(eyebrow)}</div>
      <h1>${esc(title)}</h1>
      <p>${esc(summary)}</p>
      <div class="site">${esc(site)}</div>
    </div>
    ${visual}
  </body></html>`;
}

let site = '';
async function shoot(page, file, data) {
  await page.setContent(card({ ...data, site }), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  await page.screenshot({ path: path.join(out, file), type: 'jpeg', quality: 90 });
  console.log('wrote', file);
}

{
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const reader = await context.newPage();
  const canvas = await context.newPage();
  await canvas.goto(`${origin}/robots.txt`); // gives setContent the site's origin for /fonts and images

  // The address printed on each card is the one the site itself declares (src/lib/site.ts).
  await reader.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  site = await reader.evaluate(() => {
    const image = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    return image ? new URL(image).host.replace(/^www\./, '') : location.host;
  });

  await shoot(canvas, 'home.jpg', {
    eyebrow: 'AI builder · Educator',
    title: 'I build AI tools people actually use, and teach them how.',
    summary: 'Pixio, TSI Hub, native apps and classroom software.',
    shots: ['/screenshots/pixio-home-desktop.webp', '/work/pixio-ai-pix.webp'],
    shape: 'home',
  });

  await reader.goto(`${origin}/work`, { waitUntil: 'networkidle' });
  const ids = await reader.evaluate(() => [
    ...new Set([...document.querySelectorAll('a[href^="/work/"]')].map((a) => a.getAttribute('href').split('/')[2])),
  ]);
  for (const id of ids) {
    await reader.goto(`${origin}/work/${id}`, { waitUntil: 'domcontentloaded' });
    const data = await reader.evaluate(() => {
      const original = (img) => {
        const src = img.getAttribute('src') || '';
        const match = src.match(/[?&]url=([^&]+)/);
        return match ? decodeURIComponent(match[1]) : src;
      };
      const stage = document.querySelector('.project-stage');
      const hero = document.querySelector('.project-page > .frame-browser img');
      return {
        eyebrow: document.querySelector('.page-heading .eyebrow')?.textContent ?? 'Project',
        title: document.querySelector('h1')?.textContent ?? '',
        summary: document.querySelector('.page-heading .lead')?.textContent ?? '',
        shape: stage ? (stage.classList.contains('tone-tablet') ? 'tablet' : 'portrait') : 'landscape',
        shots: stage ? [...stage.querySelectorAll('img')].map(original) : hero ? [original(hero)] : [],
      };
    });
    await shoot(canvas, `${id}.jpg`, data);
  }
  await browser.close();
}
