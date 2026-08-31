import { chromium } from 'playwright';

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
  
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000); // Wait for animations
    
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const hasHorizontalOverflow = scrollWidth > clientWidth;
    
    console.log(`Viewport ${vp.width}x${vp.height} | Overflow: ${hasHorizontalOverflow}`);
    await page.close();
  }

  await browser.close();
})();
