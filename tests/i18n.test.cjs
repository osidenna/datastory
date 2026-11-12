const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {readFile} = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');

let server, browser, base;
before(async () => {
  const root = path.resolve(__dirname, '..');
  server = createServer(async (req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
    try {
      const name = file === root ? path.join(root, 'index.html') : file;
      const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.csv': 'text/csv', '.svg': 'image/svg+xml'};
      res.setHeader('Content-Type', types[path.extname(name)] || 'application/octet-stream');
      res.end(await readFile(name));
    } catch (_) { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {})});
});
after(async () => { await browser?.close(); await new Promise(resolve => server.close(resolve)); });

async function language(page, value) {
  await page.selectOption('#language', value);
  await page.waitForFunction(value => document.documentElement.lang === value, value);
}

test('French is the default; English persists across navigation and reloads', async () => {
  const page = await browser.newPage();
  await page.goto(base);
  assert.equal(await page.locator('html').getAttribute('lang'), 'fr');
  const french = await page.locator('h1').textContent();
  await language(page, 'en');
  assert.equal(await page.locator('h1').textContent(), 'Data storytelling and communicating results');
  assert.equal(await page.locator('#language').getAttribute('aria-label'), 'Language');
  assert.equal(await page.locator('#language option[value="fr"]').textContent(), 'Français');
  await page.locator('a[href="#/cm1"]').click();
  await page.waitForSelector('[data-all]');
  assert.equal(await page.locator('[data-all]').textContent(), 'Show all');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('[data-all]').textContent(), 'Show all');
  await page.goto(base);
  await language(page, 'fr');
  assert.equal(await page.locator('h1').textContent(), french);
  assert.equal(await page.locator('#translation-note').isHidden(), true);
  await page.close();
});

test('all available routes translate and restore the original text', async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const id of ['cm1', 'cm2', 'cm3', 'cm4', 'cm5', 'td1', 'td2', 'td3', 'td-d3', 'td-dash']) {
    await page.goto(base + '/#/' + id);
    await page.waitForSelector('h1');
    if (await page.locator('[data-all]').count()) await page.locator('[data-all]').click();
    const heading = await page.locator('h1').textContent();
    const lead = await page.locator('.lede').textContent();
    const title = await page.title();
    const count = await page.locator('.step').count();
    await language(page, 'en');
    assert.notEqual(await page.locator('.lede').textContent(), lead, id);
    assert.equal(await page.locator('.step').count(), count, id);
    await language(page, 'fr');
    assert.equal(await page.locator('h1').textContent(), heading, id);
    assert.equal(await page.locator('.lede').textContent(), lead, id);
    assert.equal(await page.title(), title, id);
  }
  assert.deepEqual(errors, []);
  await page.close();
});

test('switching preserves unsaved code, completion marks, hash and scroll', async () => {
  const page = await browser.newPage();
  await page.goto(base + '/#/td1');
  const cell = page.locator('.cell-code:visible').first();
  await cell.fill('# Mon travail\nmessage = "Ne pas traduire"');
  await page.locator('.td-mark').first().click();
  await page.evaluate(() => window.scrollTo(0, 400));
  const scroll = await page.evaluate(() => scrollY);
  await language(page, 'en');
  assert.equal(await cell.inputValue(), '# Mon travail\nmessage = "Ne pas traduire"');
  assert.equal(await cell.getAttribute('aria-label'), 'Python code');
  assert.equal(await page.locator('.td-mark').first().getAttribute('aria-pressed'), 'true');
  assert.ok(page.url().endsWith('#/td1'));
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - scroll) < 150);
  await language(page, 'fr');
  assert.equal(await cell.inputValue(), '# Mon travail\nmessage = "Ne pas traduire"');
  await page.close();
});

test('new activities, quiz feedback, presentation labels and dynamic chart text translate', async () => {
  const page = await browser.newPage({reducedMotion: 'reduce'});
  await page.goto(base + '/#/cm1');
  await language(page, 'en');
  await page.locator('[data-all]').click();
  const answer = page.locator('.q-show').first();
  await answer.click();
  assert.equal(await page.locator('.q-feedback strong').first().textContent(), 'Answer');
  await language(page, 'fr');
  assert.equal(await page.locator('.q-feedback strong').first().textContent(), 'Réponse');
  await language(page, 'en');
  await page.locator('[data-present]').click();
  assert.equal(await page.locator('[data-next]').getAttribute('aria-label'), 'Next step');
  await page.keyboard.press('ArrowRight');
  assert.ok((await page.locator('[data-pos]').textContent()).startsWith('2 /'));
  await page.keyboard.press('Escape');
  await page.goto(base + '/#/td-d3');
  await page.waitForSelector('[data-metric="ratio"]');
  await page.locator('[data-metric="ratio"]').click();
  await page.waitForFunction(() => document.querySelector('[data-demo="library-rank"] [data-head]').textContent.startsWith('Per book'));
  await language(page, 'fr');
  assert.match(await page.locator('[data-demo="library-rank"] [data-head]').textContent(), /^Par livre/);
  assert.equal(await page.locator('[data-metric="ratio"]').getAttribute('aria-pressed'), 'true');
  await page.close();
});

test('storage denial, unknown preferences and narrow screens remain usable', async () => {
  const page = await browser.newPage({viewport: {width: 360, height: 800}});
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {get() { throw new Error('blocked'); }}));
  await page.goto(base);
  await language(page, 'en');
  assert.equal(await page.locator('h1').textContent(), 'Data storytelling and communicating results');
  const box = await page.locator('#language').boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 360);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.close();
  const invalid = await browser.newPage();
  await invalid.addInitScript(() => localStorage.setItem('ds-language', 'xx'));
  await invalid.goto(base);
  assert.equal(await invalid.locator('html').getAttribute('lang'), 'fr');
  await invalid.close();
});

test('PDF export restores its source label and progress after English printing', async () => {
  const page = await browser.newPage();
  await page.addInitScript(() => { window.print = () => window.dispatchEvent(new Event('afterprint')); });
  await page.goto(base + '/#/cm5');
  await language(page, 'en');
  const progress = await page.evaluate(() => localStorage.getItem('ds-unlock-cm5'));
  await page.locator('[data-pdf]').click();
  await page.waitForFunction(() => !document.querySelector('[data-pdf]').disabled);
  assert.equal(await page.locator('[data-pdf]').textContent(), '⬇ Export as PDF');
  assert.equal(await page.evaluate(() => localStorage.getItem('ds-unlock-cm5')), progress);
  await language(page, 'fr');
  assert.equal(await page.locator('[data-pdf]').textContent(), '⬇ Exporter en PDF');
  await page.close();
});
