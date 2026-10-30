import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const draw = (page: Page, _index: number) => page.locator("#go").click();
const ready = async (page: Page) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // The first worker takes control on the next navigation.
};

test("production PWA reopens offline, retains the original controls and generates all share themes", async ({
  page,
  context,
  baseURL,
}) => {
  const external: string[] = [],
    errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith(baseURL!))
      external.push(request.url());
  });
  await ready(page);
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  const manifest = await (await page.request.get(manifestHref!)).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toHaveLength(3);
  for (const icon of manifest.icons) {
    const response = await page.request.get("/" + icon.src);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
  }
  // The original lottery controls remain intact, with a separate PWA panel below.
  await expect(page.locator("#pwaStatus")).toBeVisible();
  await expect(page.locator("#pwaMessage")).toContainText("พร้อมใช้งานออฟไลน์");
  await expect(page.locator("#installApp")).toBeVisible();
  await expect(page.locator(".wrap > *")).toHaveCount(5);
  await draw(page, 1);
  await expect(page.locator("#display")).toHaveText(/^\d{2}$/);
  const first = await page.locator("#display").textContent();
  await context.setOffline(true);
  expect(
    await page.evaluate(() =>
      fetch("/offline-network-probe", { cache: "no-store" }).then(
        () => false,
        () => true,
      ),
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.locator("#display")).toHaveText(first!);
  await expect(page.locator("#pwaMessage")).toHaveText(
    "🔴 · พร้อมใช้งานออฟไลน์",
  );
  await draw(page, 2);
  await expect(page.locator("#display")).toHaveText(/^\d{3}$/);
  await draw(page, 3);
  await expect(page.locator("#display")).toHaveText(/^\d{6}$/);
  const latest = await page.locator("#display").textContent();
  await expect(page.locator("#histList li")).toHaveCount(3);
  await page.locator("#share").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 1; i <= 5; i++) {
    await page.getByRole("button", { name: `ธีม ${i}`, exact: true }).click();
    await expect(page.locator("#shareSave")).toBeEnabled();
    await expect
      .poll(() =>
        page
          .locator("#shareImg")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth === 2160,
          ),
      )
      .toBe(true);
    await expect(
      page.getByRole("button", { name: `ธีม ${i}`, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  const downloadEvent = page.waitForEvent("download");
  await page.locator("#shareSave").click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe(`lotto-${latest}.png`);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).subarray(0, 8).toString("hex")).toBe(
    "89504e470d0a1a0a",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/");
  await expect(reopened.locator("#display")).toHaveText(latest!);
  await expect(reopened.locator("#histList li")).toHaveCount(3);
  await reopened.locator("#back").click();
  await draw(reopened, 3);
  await expect(reopened.locator("#histList li")).toHaveCount(4);
  await reopened.locator("#reset").click();
  await expect(reopened.locator("#display")).toHaveAttribute(
    "aria-label",
    "ยังไม่ได้สุ่ม",
  );
  await expect(reopened.locator("#histList li")).toHaveCount(4);
  await reopened.locator("#clear").click();
  await expect(reopened.locator("#histList")).toContainText("ยังไม่มีผล");
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test("restores valid legacy history", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "lotto-random-v1",
      JSON.stringify({
        step: 1,
        rounds: 0,
        lastValue: "00",
        lastTs: 1000,
        history: [{ idx: 1, n: 2, value: "00", ts: 1000, time: "" }],
      }),
    );
  });
  await page.goto("/");
  await expect(page.locator("#display")).toHaveText("00");
  await draw(page, 2);
  await expect(page.locator("#histList li")).toHaveCount(2);
});

test("original dark UI, keyboard dismissal and double click", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });
  await page.goto("/");
  await page.locator("#go").evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(page.locator("#histList li")).toHaveCount(1);
  await expect(page.locator("#display")).toHaveText(/^\d{2}$/);
  await page.screenshot({
    path: testInfo.outputPath("mobile-dark.png"),
    fullPage: true,
  });
  await page.locator("#share").click();
  await expect(page.locator("#shareImg")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#share")).toBeFocused();
});

for (const storageMode of ["corrupt", "blocked"]) {
  test(`works with ${storageMode} localStorage`, async ({ page }) => {
    await page.addInitScript((mode) => {
      if (mode === "corrupt")
        localStorage.setItem("lotto-random-v1", "{invalid JSON");
      else {
        Storage.prototype.getItem = () => {
          throw new DOMException("Blocked", "SecurityError");
        };
        Storage.prototype.setItem = () => {
          throw new DOMException("Blocked", "SecurityError");
        };
      }
    }, storageMode);
    await page.goto("/");
    await expect(page.locator("#display")).toHaveAttribute(
      "aria-label",
      "ยังไม่ได้สุ่ม",
    );
    await draw(page, 1);
    await expect(page.locator("#display")).toHaveText(/^\d{2}$/);
    await expect(page.locator("#histList li")).toHaveCount(1);
  });
}

// Render the original HTML with the same bundled fonts, so the comparison needs no CDN.
// The original source remains untouched and supplies both CSS and behavior for the reference.
for (const width of [390, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`preserves lottery UI at ${width}px in ${colorScheme} mode`, async ({
      browser,
      baseURL,
    }, testInfo) => {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        colorScheme,
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      try {
        await context.addInitScript(() =>
          localStorage.setItem(
            "lotto-random-v1",
            JSON.stringify({
              step: 0,
              rounds: 1,
              lastValue: "001234",
              lastTs: 1793206800000,
              history: [
                { idx: 3, n: 6, value: "001234", ts: 1793206800000, time: "" },
              ],
            }),
          ),
        );
        const actual = await context.newPage();
        await actual.goto(baseURL!);
        // Compare the original lottery UI separately from the requested PWA controls.
        await actual.addStyleTag({
          content: "#appFooter { display: none !important; }",
        });
        await actual.evaluate(() => document.fonts.ready);
        const cssHref = await actual
          .locator('link[rel="stylesheet"]')
          .getAttribute("href");
        const css = await (await actual.request.get(cssHref!)).text();
        const fontFaces =
          css.match(/@font-face\s*\{[^}]*\}/g)?.join("\n") ?? "";
        expect(fontFaces.length).toBeGreaterThan(0);
        let referenceHtml = await readFile(
          new URL("../../เครื่องสุ่มหวย.html", import.meta.url),
          "utf8",
        );
        // Preserve the existing local .note b customization as well as the original layout.
        const existingShareNoteStyle =
          ".note b { color: var(--ink); font-weight: 600; } #plain { display: none; }";
        referenceHtml = referenceHtml
          .replace(/<link\b[^>]*>/g, "")
          .replace(/<script src="[^"]*"><\/script>/g, "")
          .replace(
            "</head>",
            `<style>${fontFaces}${existingShareNoteStyle}</style></head>`,
          );
        const reference = await context.newPage();
        await reference.route("**/__original.html", (route) =>
          route.fulfill({
            contentType: "text/html; charset=utf-8",
            body: referenceHtml,
          }),
        );
        await reference.goto(`${baseURL}/__original.html`);
        await reference.evaluate(() => document.fonts.ready);
        const before = await reference.screenshot({
          path: testInfo.outputPath("original.png"),
          fullPage: true,
        });
        const after = await actual.screenshot({
          path: testInfo.outputPath("pwa.png"),
          fullPage: true,
        });
        expect(
          after.equals(before),
          "PWA screenshot must match the original HTML exactly",
        ).toBe(true);
        await actual.locator("#share").click();
        await reference.locator("#share").click();
        await expect(actual.locator("#shareImg")).toBeVisible();
        await expect(reference.locator("#shareImg")).toBeVisible();
        // The share actions were intentionally updated; retain coverage of the original lottery UI.
        await expect(actual.locator("#shareSave")).toBeEnabled();
        await expect(actual.locator("#shareNative")).toBeVisible();
        await expect(actual.locator(".sheet .note, #shareCopy")).toHaveCount(0);
        await actual.keyboard.press("Escape");
        await reference.keyboard.press("Escape");
        for (const page of [actual, reference]) {
          await page.locator("#reset").click();
          await page.locator("#clear").click();
          await page.locator("#go").focus();
        }
        const originalEmpty = await reference.screenshot({
          path: testInfo.outputPath("original-empty.png"),
          mask: [reference.locator("#toast")],
          fullPage: true,
        });
        const pwaEmpty = await actual.screenshot({
          path: testInfo.outputPath("pwa-empty.png"),
          mask: [actual.locator("#toast")],
          fullPage: true,
        });
        expect(
          pwaEmpty.equals(originalEmpty),
          "Empty state UI must match the original HTML exactly",
        ).toBe(true);
      } finally {
        await context.close();
      }
    });
  }
}

// Browsers decide when to offer installation; emulate that event to verify the button lifecycle.
test("install button handles the browser prompt and installed state", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    const prompt = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(prompt, {
      prompt: async () => {
        document.documentElement.dataset.installPrompted = "true";
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(prompt);
  });
  await expect(page.locator("#installApp")).toBeEnabled();
  await page.locator("#installApp").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-install-prompted",
    "true",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(page.locator("#installApp")).toHaveText("ติดตั้งแล้ว");
  await expect(page.locator("#installApp")).toBeDisabled();
});

test("draw button keeps its original appearance while busy and output remains removed", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("output")).toHaveCount(0);
  for (const [index, n] of [2, 3, 6].entries()) {
    const label = await page.locator("#go").textContent();
    await page.locator("#go").click();
    await expect(page.locator("#go")).toHaveText(label!);
    await expect(page.locator("#go")).toHaveClass("go");
    await expect(page.locator("#go")).toHaveCSS("cursor", "progress");
    await expect(page.locator("#go")).toHaveAttribute("aria-busy", "true");
    await expect(page.locator("#go")).toBeDisabled();
    await expect(page.locator("#display")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    await expect(page.locator("#display")).toHaveText(
      new RegExp(`^\\d{${n}}$`),
    );
    await expect(page.locator("#go")).toBeEnabled();
    await expect(page.locator("#go")).not.toHaveClass(/inprogress/);
    await expect(page.locator("#go")).toHaveAttribute("aria-busy", "false");
    await expect(page.locator("#go")).toContainText(
      `กดสุ่มครั้งที่ ${((index + 1) % 3) + 1}`,
    );
  }
});

test("shares the rendered PNG file and handles unavailable sharing", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        const file = data.files![0];
        document.documentElement.dataset.sharedFile = `${file.name}|${file.type}|${file.size}`;
      },
    });
  });
  await page.goto("/");
  await page.locator("#go").click();
  await expect(page.locator("#share")).toBeEnabled();
  const value = await page.locator("#display").textContent();
  await page.locator("#share").click();
  await expect(page.locator("#shareNative")).toBeEnabled();
  await page.locator("#shareNative").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-shared-file",
    new RegExp(`^lotto-${value}\\.png\\|image/png\\|[1-9][0-9]*$`),
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => false,
    }),
  );
  await page.locator("#shareNative").click();
  await expect(page.locator("#toast")).toContainText("ไม่รองรับการแชร์รูป");
  await expect(page.locator("#shareSave")).toBeEnabled();
});
