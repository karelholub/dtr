import { test, expect } from "@playwright/test";

// Exercise SDK-owned DOM without sending synthetic traffic to Meiro.
// Live delivery, caps and native interaction events are verified separately.
test("SDK-owned slot survives React updates, navigation and consent withdrawal", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://travel.eu1.pipes.meiro.io/**", (route) =>
    route.fulfill({ contentType: "application/json", body: "{}" }),
  );
  await page.route("https://travel.eu1.pipes.meiro.io/mpt.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
    window.mpt = function(command, config) {
      if (command !== 'config' || !config.web_banners) return;
      document.querySelectorAll('[data-test-sdk-banner]').forEach(node => node.remove());
      if (!config.web_banners.enabled) return;
      const anchor = document.querySelector('#dtr-meiro-inpage');
      if (anchor && location.pathname === '/') {
        const iframe = document.createElement('iframe');
        iframe.dataset.testSdkBanner = 'true';
        iframe.srcdoc = '<h2>Remote creative fixture</h2>';
        anchor.appendChild(iframe);
      }
    };
  `,
    }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Alle akzeptieren", exact: true })
    .click();
  const banner = page.locator("#dtr-meiro-inpage iframe");
  await expect(banner).toHaveCount(1);
  await page
    .getByRole("button", { name: "Meiro · Demo Studio", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Meiro banners", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Creative owned by Meiro" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close demo studio", exact: true })
    .click();
  await expect(banner).toHaveCount(1);
  await page
    .getByRole("button", { name: "Cookie-Einstellungen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nur notwendige", exact: true })
    .click();
  await expect(banner).toHaveCount(0);
  await page
    .getByRole("button", { name: "Cookie-Einstellungen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Alle akzeptieren", exact: true })
    .click();
  await expect(banner).toHaveCount(1);
  await page
    .getByRole("button", { name: "Meiro · Demo Studio", exact: true })
    .click();
  await page.getByRole("button", { name: "Journey", exact: true }).click();
  await page
    .getByRole("button", { name: "4 · Confirm demo booking", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Close demo studio", exact: true })
    .click();
  await expect(page).toHaveURL(/meine-reise/);
  await expect(page.locator("[data-test-sdk-banner]")).toHaveCount(0);
  expect(errors).toEqual([]);
});
