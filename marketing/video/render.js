const { chromium } = require('playwright');
const FPS = 30, DUR = 33000, amostra = process.argv[2] === 'amostra';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + __dirname + '/video.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
  const quadro = async (t, arq) => { await p.evaluate(t => new Promise(ok => { document.getAnimations().forEach(a => { a.pause(); a.currentTime = t; }); document.querySelectorAll('.cena').forEach(c => { const s = +c.style.getPropertyValue('--s'), l = +c.style.getPropertyValue('--l'); c.style.visibility = t >= s && t <= s + l ? 'visible' : 'hidden'; }); requestAnimationFrame(() => requestAnimationFrame(ok)); }), t); await p.screenshot({ path: arq, type: 'jpeg', quality: 92 }); };
  if (amostra) { for (const t of [2600, 6200, 11500, 17500, 22500, 27200, 31500]) await quadro(t, `amostra-${t}.jpg`); }
  else { require('fs').mkdirSync('quadros', { recursive: true }); const n = Math.round(DUR / 1000 * FPS); for (let f = 0; f < n; f++) await quadro(f * 1000 / FPS, `quadros/${String(f).padStart(5, '0')}.jpg`); }
  await b.close();
})();
