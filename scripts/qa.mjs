import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base = process.env.QA_BASE_URL || "http://localhost:3000";
const viewports = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const routes = ["/", "/en", "/about", "/services", "/portfolio", "/ruaa", "/ruaa/website-importance", "/contact", "/consultation", "/en/contact", "/en/ruaa/website-importance", "/this-page-does-not-exist", "/en/this-page-does-not-exist", "/sitemap.xml", "/robots.txt"];
const outDir = path.join(process.cwd(), "qa-output");

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const results = [];
const allConsoleMessages = [];

for (const width of viewports) {
  const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 1000 } });
  const page = await context.newPage();
  const consoleMessages = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  for (const route of routes) {
    const response = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" });
    const isHtml = (response?.headers()["content-type"] || "").includes("text/html");
    const metrics = await page.evaluate(() => ({
      title: document.title,
      lang: document.documentElement.lang,
      dir: document.querySelector("[dir]")?.getAttribute("dir") || document.documentElement.dir,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      h1Count: document.querySelectorAll("h1").length,
      hashLinks: [...document.querySelectorAll("a[href='#']")].length,
      emptyLinks: [...document.querySelectorAll("a[href=''], a:not([href])")].length
    }));

    let axeViolations = [];
    const shouldRunAxe = isHtml && [390, 1440].includes(width) && ["/", "/en", "/contact", "/en/contact"].includes(route);
    if (shouldRunAxe) {
      const axe = await new AxeBuilder({ page }).analyze();
      axeViolations = axe.violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`);
    }

    if (width === 390 && ["/", "/en", "/portfolio", "/contact"].includes(route)) {
      await page.screenshot({ path: path.join(outDir, `${route.replaceAll("/", "_") || "home"}-${width}.png`), fullPage: true });
    }
    if (width === 1440 && ["/", "/en"].includes(route)) {
      await page.screenshot({ path: path.join(outDir, `${route.replaceAll("/", "_") || "home"}-${width}.png`), fullPage: true });
    }

    results.push({
      width,
      route,
      status: response?.status(),
      overflow: metrics.scrollWidth > metrics.clientWidth,
      overflowBy: metrics.scrollWidth - metrics.clientWidth,
      ...metrics,
      axeViolations
    });
  }

  await context.close();
  allConsoleMessages.push(...consoleMessages);
}

const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
await page.locator(".menu-toggle").click();
await page.waitForTimeout(100);
const menuOpened = await page.locator(".mobile-panel").evaluate((el) => el.getAttribute("data-open") === "true" && !!(el.clientWidth || el.clientHeight || el.getClientRects().length));
await page.keyboard.press("Escape");
const menuClosedAfterEscape = !(await page.locator(".mobile-panel[data-open='true']").isVisible());
await page.goto(`${base}/contact`, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: /^Send$/ }).click();
const formInvalid = await page.locator("input:invalid, textarea:invalid").count();

await browser.close();

const summary = {
  overflow: results.filter((r) => r.overflow),
  statuses: results.filter((r) => r.status && r.status >= 400 && r.route !== "/this-page-does-not-exist"),
  axe: results.filter((r) => r.axeViolations.length),
  consoleMessages: [...new Set(allConsoleMessages)],
  mobileMenu: { menuOpened, menuClosedAfterEscape },
  forms: { invalidFieldsAfterEmptySubmit: formInvalid }
};

await fs.writeFile(path.join(outDir, "results.json"), JSON.stringify({ results, summary }, null, 2));
console.log(JSON.stringify(summary, null, 2));
