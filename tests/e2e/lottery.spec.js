import { test, expect } from '@playwright/test';

const draw = (page, index) => page.getByRole('button', { name: `กดสุ่มครั้งที่ ${index} · เลข ${[2, 3, 6][index - 1]} ตัว`, exact: true }).click();
const ready = async page => {
  await page.goto('/');
  await expect(page.getByRole('status').filter({ hasText: 'พร้อมใช้งานออฟไลน์' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
};

test('production PWA reopens offline, draws, retains history and generates all share themes', async ({ page, context, baseURL }) => {
  const external = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') console.log(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(baseURL)) external.push(request.url()); });
  await ready(page);
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await page.request.get(manifestHref)).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons).toHaveLength(3);
  for (const icon of manifest.icons) {
    const response = await page.request.get('/' + icon.src);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
  }
  await draw(page, 1);
  await expect(page.locator('#result-output')).toHaveText(/^\d{2}$/);
  const first = await page.locator('#result-output').textContent();
  await context.setOffline(true);
  expect(await page.evaluate(() => fetch('/offline-network-probe', { cache: 'no-store' }).then(() => false, () => true))).toBe(true);
  await page.reload();
  await expect(page.locator('#result-output')).toHaveText(first);
  await expect(page.getByRole('status').filter({ hasText: 'ออฟไลน์ · พร้อมใช้งานออฟไลน์' })).toBeVisible();
  await draw(page, 2);
  await expect(page.locator('#result-output')).toHaveText(/^\d{3}$/);
  await draw(page, 3);
  await expect(page.locator('#result-output')).toHaveText(/^\d{6}$/);
  const latest = await page.locator('#result-output').textContent();
  await expect(page.locator('#history-list li')).toHaveCount(3);
  await page.getByRole('button', { name: 'แชร์ผลการสุ่ม', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('link', { name: 'บันทึกรูป' })).toBeVisible({ timeout: 15000 });
  for (let i = 1; i <= 5; i++) {
    await page.getByRole('button', { name: `ธีม ${i}`, exact: true }).click();
    await expect(page.getByRole('link', { name: 'บันทึกรูป' })).toBeVisible({ timeout: 15000 });
    await expect.poll(() => page.getByAltText('รูปผลการสุ่มหวย').evaluate(image => image.complete && image.naturalWidth === 2160)).toBe(true);
  }
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('link', { name: 'บันทึกรูป' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe(`lotto-${latest}.png`);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/');
  await expect(reopened.locator('#result-output')).toHaveText(latest);
  await expect(reopened.locator('#history-list li')).toHaveCount(3);
  await reopened.getByRole('button', { name: 'ย้อนกลับ', exact: true }).click();
  await draw(reopened, 3);
  await expect(reopened.locator('#history-list li')).toHaveCount(4);
  await reopened.getByRole('button', { name: 'รีเซ็ต', exact: true }).click();
  await expect(reopened.locator('#result-output')).toHaveText('ยังไม่ได้สุ่ม');
  await expect(reopened.locator('#history-list li')).toHaveCount(4);
  await reopened.getByRole('button', { name: 'ล้างประวัติ', exact: true }).click();
  await expect(reopened.locator('#history-list')).toContainText('ยังไม่มีผล');
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('restores valid legacy history', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lotto-random-v1', JSON.stringify({ step: 1, rounds: 0, lastValue: '00', lastTs: 1000,
      history: [{ idx: 1, n: 2, value: '00', ts: 1000, time: '' }] }));
  });
  await page.goto('/');
  await expect(page.locator('#result-output')).toHaveText('00');
  await draw(page, 2);
  await expect(page.locator('#history-list li')).toHaveCount(2);
});

test('small viewport, dark theme, keyboard dialog and double click do not break a draw', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('#draw-button').evaluate(button => { button.click(); button.click(); });
  await expect(page.locator('#history-list li')).toHaveCount(1);
  await expect(page.locator('#result-output')).toHaveText(/^\d{2}$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('mobile-dark.png'), fullPage: true });
  await page.getByRole('button', { name: 'แชร์ผลการสุ่ม', exact: true }).click();
  await expect(page.getByRole('link', { name: 'บันทึกรูป' })).toBeVisible({ timeout: 15000 });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'แชร์ผลการสุ่ม', exact: true })).toBeFocused();
});

for (const storageMode of ['corrupt', 'blocked']) {
  test(`works with ${storageMode} localStorage`, async ({ page }) => {
    await page.addInitScript(mode => {
      if (mode === 'corrupt') localStorage.setItem('lotto-random-v1', '{invalid JSON');
      else {
        Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
        Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
      }
    }, storageMode);
    await page.goto('/');
    await expect(page.locator('#result-output')).toHaveText('ยังไม่ได้สุ่ม');
    await draw(page, 1);
    await expect(page.locator('#result-output')).toHaveText(/^\d{2}$/);
    await expect(page.locator('#history-list li')).toHaveCount(1);
    if (storageMode === 'blocked') await expect(page.getByRole('status').filter({ hasText: 'บันทึกประวัติในเครื่องไม่ได้' })).toBeVisible();
  });
}
