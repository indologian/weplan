import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 480, height: 853 },
    deviceScaleFactor: 2
  });

  const outputDir = path.join(process.cwd(), 'public', 'theme-previews');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const themes = ['modern-editorial', 'romantic-floral', 'javanese-heritage', 'luxury-midnight'];

  for (const slug of themes) {
    console.log(`Processing theme: ${slug}...`);
    await page.goto(`http://localhost:3000/demo/${slug}`, { waitUntil: 'networkidle' });
    
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

    // Hide the demo toolbar safely
    await page.evaluate(() => {
      const toolbar = document.querySelector('[data-demo-toolbar]');
      if (toolbar) toolbar.style.display = 'none';
      const frame = document.querySelector('[data-demo-frame]');
      if (frame) frame.style.paddingTop = '0px';
    });

    const pngPath = path.join(outputDir, `${slug}.png`);
    const webpPath = path.join(outputDir, `${slug}.webp`);

    // Capture deterministic PNG
    await page.screenshot({ path: pngPath, type: 'png' });

    // Convert to optimized WebP
    await sharp(pngPath)
      .webp({ quality: 85 })
      .toFile(webpPath);

    // Verify format and log
    const metadata = await sharp(webpPath).metadata();
    console.log(`✔ Verified ${slug}.webp -> Format: ${metadata.format}, Size: ${metadata.size} bytes, Dimensions: ${metadata.width}x${metadata.height}`);

    // Cleanup PNG
    fs.unlinkSync(pngPath);
  }

  await browser.close();
})();
