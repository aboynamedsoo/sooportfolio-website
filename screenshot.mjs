import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const existing = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outPath = path.join(dir, filename);

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox',
         '--autoplay-policy=no-user-gesture-required']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
await new Promise(r => setTimeout(r, 1400));

// Inject gradient placeholders (videos are black in headless)
await page.evaluate(() => {
  const fills = [
    'radial-gradient(ellipse 65% 75% at 50% 52%, #4c1d95 0%, #1e0a3c 50%, #0A0E14 100%)',
    'radial-gradient(ellipse 65% 75% at 50% 52%, #1e3a5f 0%, #0c1a30 50%, #0A0E14 100%)',
    'radial-gradient(ellipse 65% 75% at 50% 52%, #5b1db5 0%, #22094a 50%, #0A0E14 100%)',
  ];
  document.querySelectorAll('.panel').forEach((panel, i) => {
    const vid = panel.querySelector('video');
    if (vid) vid.style.display = 'none';
    const bg = document.createElement('div');
    bg.style.cssText = `position:absolute;inset:0;z-index:0;background:${fills[i]};`;
    panel.insertBefore(bg, panel.firstChild);
  });
});

await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log(`Saved: ${outPath}`);
