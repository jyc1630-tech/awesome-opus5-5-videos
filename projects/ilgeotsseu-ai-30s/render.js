// 사용법: node render.js [출력파일]  → 1080×1920, 30fps, 30초 MP4
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

(async () => {
  const out = process.argv[2] || path.join(__dirname, 'ilgeotsseu-ai-30s.mp4');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?render');
  await page.evaluate(() => document.fonts.ready);
  const { DUR, FPS } = await page.evaluate(() => ({ DUR: window.DUR, FPS: window.FPS }));

  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'ignore', 'inherit'] });

  const total = DUR * FPS;
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.render(t), i / FPS);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${total}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done:', out);
})();
