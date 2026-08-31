import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const viewports = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 }
];

(async () => {
  const browser = await chromium.launch();
  
  const qaDir = path.join(process.cwd(), '.qa-screenshots');
  if (!fs.existsSync(qaDir)) {
    fs.mkdirSync(qaDir, { recursive: true });
  }

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto('http://localhost:3000');
    
    // Explicitly wait for fonts and images to load completely
    await page.evaluate(async () => {
      await document.fonts.ready;
      const images = Array.from(document.images);
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));
    });

    await page.waitForTimeout(1000); // Wait for animations
    
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const hasHorizontalOverflow = scrollWidth > clientWidth;
    
    const screenshotPath = path.join(qaDir, `marketing-${vp.width}x${vp.height}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`Viewport ${vp.width}x${vp.height} | Overflow: ${hasHorizontalOverflow} | Captured: ${screenshotPath}`);
    await page.close();
  }

  await browser.close();
})();
