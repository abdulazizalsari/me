import { chromium } from "playwright";
import fs from "node:fs";

fs.mkdirSync("qa-output/hero", { recursive: true });

const browser = await chromium.launch();
const widths = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const metrics = [];

for (const width of widths) {
  for (const route of ["/", "/en"]) {
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 860 : 1000 } });
    const page = await context.newPage();
    await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const routeMetrics = await page.evaluate(() => {
      function rect(selector) {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right };
      }

      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1: document.querySelector("h1")?.textContent,
        card: rect(".portrait-card"),
        image: rect(".portrait-image-wrap"),
        status: rect(".portrait-status"),
        focus: rect(".portrait-focus"),
        location: rect(".portrait-location")
      };
    });

    metrics.push({ width, route, ...routeMetrics });

    if (width === 390 || width === 1440) {
      const prefix = route === "/" ? "en" : "ar";
      await page.screenshot({ path: `qa-output/hero/${prefix}-${width}.png`, fullPage: false });
    }

    await context.close();
  }
}

await browser.close();
console.log(JSON.stringify(metrics, null, 2));
