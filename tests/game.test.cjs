const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const values = [.01, .3, .6, .9]; let index = 0;
      Math.random = () => values[index++ % values.length];
    });
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8000');
    await page.clock.install();
    const state = () => page.locator('#board').getAttribute('data-state');
    const advance = ms => page.clock.runFor(ms);
    const press = n => page.keyboard.press(String(n));
    assert.equal(await state(), 'idle');
    await page.screenshot({ path: '/workspace/color-echo-desktop.png', fullPage: true });
    await press(1);
    assert.equal(await state(), 'idle', 'Inputs before starting must be ignored');
    await page.locator('#start').click();
    assert.equal(await state(), 'watch');
    await press(2);
    await advance(1700);
    assert.equal(await state(), 'input', 'Watch must finish before input is accepted');
    await press(1);
    assert.equal(await state(), 'success');
    assert.equal(await page.locator('#best').innerText(), '01');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await state(), 'paused');
    await page.locator('#start').click();
    await advance(3700);
    assert.equal(await state(), 'input');
    assert.equal(await page.locator('#round').innerText(), '02');
    await press(1);
    await page.locator('#replay').click();
    assert.equal(await state(), 'watch');
    await advance(2700);
    await press(1); await press(2);
    assert.equal(await state(), 'success', 'Replay must reset the response to the start');
    assert.equal(await page.locator('#best').innerText(), '02');
    await advance(4700);
    assert.equal(await state(), 'input');
    await press(4);
    assert.equal(await state(), 'over');
    assert.match(await page.locator('#status-detail').innerText(), /2 rounds/);
    await page.locator('input[value="classic"]').check();
    assert.equal(await page.locator('#best').innerText(), '00', 'Each speed has its own score');
    await page.locator('input[value="cozy"]').check();
    assert.equal(await page.locator('#best').innerText(), '02');
    await page.locator('#start').click();
    await advance(200);
    await page.locator('#start').click();
    await advance(1800);
    assert.equal(await state(), 'input', 'Restart must cancel old pattern playback');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await state(), 'paused');
    await page.locator('#start').click();
    await advance(1800);
    assert.equal(await state(), 'input');
    await page.locator('#sound').click();
    await page.reload();
    assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#best').innerText(), '02', 'Best score must persist');
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow at ${width}px`);
      const pad = await page.locator('.pad').first().boundingBox();
      assert.ok(pad.width >= 90 && pad.height >= 90, 'Touch targets must be roomy');
    }
    await page.setViewportSize({ width: 375, height: 900 });
    await page.screenshot({ path: '/workspace/color-echo-mobile.png', fullPage: true });
    const privatePage = await browser.newPage();
    await privatePage.addInitScript(() => {
      Storage.prototype.getItem = () => { throw new Error('Storage disabled'); };
      Storage.prototype.setItem = () => { throw new Error('Storage disabled'); };
    });
    await privatePage.goto(process.env.GAME_URL || 'http://127.0.0.1:8000');
    await privatePage.locator('#start').click();
    assert.equal(await privatePage.locator('#board').getAttribute('data-state'), 'watch', 'Storage must be optional');
    assert.deepEqual(errors, [], 'No browser runtime errors');
    console.log('PASS: progression, input locking, replay, mistakes, pace scores, restart cancellation, pause/resume, persistence, optional storage, responsive touch layout.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
