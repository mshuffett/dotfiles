import { chromium } from "playwright";

async function smoothMove(page: any, fromX: number, fromY: number, toX: number, toY: number, steps = 50, arc = -40) {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = 1 - Math.pow(1 - t, 3);
    await page.mouse.move(
      fromX + (toX - fromX) * ease,
      fromY + (toY - fromY) * ease + Math.sin(t * Math.PI) * arc
    );
    await page.waitForTimeout(16);
  }
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: "/tmp/rec-v7", size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const cursor = document.createElement("div");
      cursor.id = "fake-cursor";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "36");
      svg.setAttribute("height", "36");
      svg.setAttribute("viewBox", "0 0 24 24");
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", "M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z");
      p.setAttribute("fill", "white");
      p.setAttribute("stroke", "black");
      p.setAttribute("stroke-width", "1.2");
      svg.appendChild(p);
      cursor.appendChild(svg);
      cursor.style.cssText = "position:fixed;top:0;left:0;z-index:999999;pointer-events:none;transform-origin:top left;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));transition:left 0.08s ease-out,top 0.08s ease-out";
      document.body.appendChild(cursor);

      let curX = 0, curY = 0;
      document.addEventListener("mousemove", (e) => {
        curX = e.clientX;
        curY = e.clientY;
        cursor.style.left = curX + "px";
        cursor.style.top = curY + "px";
      });

      document.addEventListener("mousedown", () => {
        cursor.style.transform = "scale(0.8)";

        // Animated red ring using rAF loop (not CSS transitions)
        const ring = document.createElement("div");
        ring.style.cssText = "position:fixed;pointer-events:none;z-index:999998;border-radius:50%;box-sizing:border-box;";
        ring.style.left = curX + "px";
        ring.style.top = curY + "px";
        document.body.appendChild(ring);

        const startTime = performance.now();
        const duration = 500; // ms
        const maxSize = 50;
        const borderWidth = 3;

        function animate() {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 2); // ease-out quad

          const size = maxSize * eased;
          const opacity = 1 - progress;

          ring.style.width = size + "px";
          ring.style.height = size + "px";
          ring.style.marginLeft = -(size / 2) + "px";
          ring.style.marginTop = -(size / 2) + "px";
          ring.style.border = borderWidth + "px solid rgba(255, 59, 48, " + (opacity * 0.9) + ")";
          ring.style.background = "rgba(255, 59, 48, " + (opacity * 0.2) + ")";

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            ring.remove();
          }
        }
        requestAnimationFrame(animate);
      });

      document.addEventListener("mouseup", () => {
        cursor.style.transform = "scale(1)";
      });
    });
  });

  await page.goto("http://localhost:5199");
  await page.waitForLoadState("networkidle");
  await page.mouse.move(100, 400);
  await page.waitForTimeout(1000);

  const target = page.locator('button[aria-label*="Switch to"]').first();
  const box = await target.boundingBox();
  if (!box) { await context.close(); await browser.close(); return; }
  const tx = box.x + box.width / 2, ty = box.y + box.height / 2;

  await smoothMove(page, 100, 400, tx, ty);
  await page.waitForTimeout(400);
  await page.mouse.click(tx, ty);
  await page.waitForTimeout(2000);
  await smoothMove(page, tx, ty, tx + 80, ty + 60, 15, -10);
  await page.waitForTimeout(800);
  await smoothMove(page, tx + 80, ty + 60, tx, ty, 20, -20);
  await page.waitForTimeout(400);
  await page.mouse.click(tx, ty);
  await page.waitForTimeout(1500);
  await smoothMove(page, tx, ty, 200, 500, 20, -15);
  await page.waitForTimeout(500);
  await context.close();
  await browser.close();
})();
