import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://travel.eu1.pipes.meiro.io/**", async (route) => {
    if (route.request().url().endsWith("/mpt.js"))
      await route.fulfill({
        contentType: "text/javascript",
        body: "window.__sdkCalls=window.mpt.q || [];window.mpt=function(){window.__sdkCalls.push(Array.from(arguments))}",
      });
    else await route.fulfill({ contentType: "application/json", body: "{}" });
  });
});

test("consent gates events, full booking and confirmation survives refresh", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nur notwendige", exact: true })
    .click();
  expect(await page.evaluate(() => window.mpt)).toBeUndefined();
  await page
    .getByRole("button", { name: "Cookie-Einstellungen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Alle akzeptieren", exact: true })
    .click();
  await page.getByRole("button", { name: /2 Erwachsene/ }).click();
  await page
    .getByRole("button", { name: "Erwachsene mehr", exact: true })
    .click();
  await page.getByRole("button", { name: "Übernehmen", exact: true }).click();
  await page.getByRole("button", { name: "Reise finden", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "5 Angebote für Mallorca" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Calimera Fido Gardens merken", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Hotel ansehen", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Angebot prüfen", exact: true })
    .click();
  await page.locator("[name=first]").fill("Synthetic");
  await page.locator("[name=last]").fill("Traveller");
  await page.locator("[name=email]").fill("synthetic@example.com");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Demo-Buchung abschließen", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Deine Demo-Reise ist bestätigt!" }),
  ).toBeVisible();
  const events = await page.evaluate(() => window.__dtrEvents);
  expect(events.filter((e) => e.name === "purchase")).toHaveLength(1);
  expect(JSON.stringify(events)).not.toContain("synthetic@example.com");
  expect(JSON.stringify(events)).not.toContain("Synthetic");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Deine Demo-Reise ist bestätigt!" }),
  ).toBeVisible();
  expect(
    (await page.evaluate(() => window.__dtrEvents)).filter(
      (e) => e.name === "purchase",
    ),
  ).toHaveLength(0);
  await page
    .getByRole("button", { name: "Cookie-Einstellungen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nur notwendige", exact: true })
    .click();
  const before = await page.evaluate(() => window.__dtrEvents.length);
  await page
    .getByRole("button", { name: "Weiter träumen", exact: true })
    .click();
  expect(await page.evaluate(() => window.__dtrEvents.length)).toBe(before);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});

test("destination selection, filters and empty state work", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nur notwendige", exact: true })
    .click();
  await page.locator(".search-field").first().click();
  await page
    .getByRole("button", { name: "Malediven Land", exact: true })
    .click();
  await page.getByRole("button", { name: "Reise finden", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "1 Angebote für Malediven" }),
  ).toBeVisible();
  if (
    await page
      .getByRole("button", { name: "Filtern & Sortieren", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Filtern & Sortieren", exact: true })
      .click();
  await page.getByRole("slider").fill("500");
  if (
    await page
      .getByRole("button", { name: "0 Angebote anzeigen", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "0 Angebote anzeigen", exact: true })
      .click();
  await expect(
    page.getByRole("heading", { name: "Keine passenden Angebote" }),
  ).toBeVisible();
});

test("All Inclusive survives translated room controls and updates the booking", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/hotel/red-sea-garden-resort");
  await page
    .getByRole("button", { name: "Nur notwendige", exact: true })
    .click();
  // Browser translators replace React-owned text nodes with font wrappers.
  // Reproduce that DOM mutation without relying on an installed extension.
  await page.locator(".room > button").evaluateAll((buttons) => {
    for (const button of buttons) {
      const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          const wrapper = document.createElement("font");
          wrapper.textContent = node.textContent;
          node.parentNode.replaceChild(wrapper, node);
        }
      }
    }
  });
  await page.locator(".room select").nth(1).selectOption("All Inclusive");
  expect(errors).toEqual([]);
  await expect(page.locator(".selected-room h3")).toHaveText(
    "Doppelzimmer Superior",
  );
  await expect(page.locator(".booking-summary")).toContainText("All Inclusive");
  await expect(page.locator(".booking-summary .total")).toContainText("1.712");
  await page.locator(".room select").first().selectOption("Halbpension");
  await expect(page.locator(".selected-room h3")).toHaveText(
    "Doppelzimmer Standard",
  );
  await page.locator(".room select").first().selectOption("All Inclusive");
  await expect(page.locator(".booking-summary .total")).toContainText("1.652");
  await page
    .getByRole("button", { name: "Angebot prüfen", exact: true })
    .click();
  await expect(page.locator(".booking-summary")).toContainText("All Inclusive");
  expect(errors).toEqual([]);
});
