import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
for (const [source, output, width, height] of [
  ['public/brand/gamma-recover-dark.svg','public/brand/gamma-recover-dark.png',1536,384],
  ['public/brand/gamma-recover-light.svg','public/brand/gamma-recover-light.png',1536,384],
  ['public/brand/gamma-symbol.svg','public/brand/gamma-symbol.png',512,512],
  ['public/favicon.svg','artifacts/brand/favicon-512.png',512,512],
]) {
  await page.setViewportSize({width,height});
  await page.setContent('<style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{display:block;width:100%;height:100%}</style>'+await readFile(source,'utf8'));
  await page.screenshot({path:output,omitBackground:true});
}
await browser.close();
