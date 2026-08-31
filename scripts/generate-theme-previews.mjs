import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

(async () => {
  const browser = await chromium.launch();
  
  const outputDir = path.join(process.cwd(), 'public', 'theme-previews');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const themes = [
    { slug: 'modern-editorial', expectedSelector: '.modern-editorial' },
    { slug: 'romantic-floral', expectedSelector: '.romantic-floral' },
    { slug: 'javanese-heritage', expectedSelector: '.javanese-heritage' },
    { slug: 'luxury-midnight', expectedSelector: '.luxury-midnight' }
  ];

  const generatedHashes = new Map();

  for (const theme of themes) {
    const slug = theme.slug;
    console.log(`Processing theme: ${slug}...`);
    
    const context = await browser.newContext({ viewport: { width: 480, height: 853 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    
    await page.goto(`http://localhost:3000/demo/${slug}`);
    
    if (!page.url().includes(`/demo/${slug}`)) {
      throw new Error(`Route mismatch for ${slug}. Actual URL: ${page.url()}`);
    }

    try {
      await page.waitForSelector(theme.expectedSelector, { state: 'visible', timeout: 5000 });
      console.log(`✔ Renderer verified: Found ${theme.expectedSelector}`);
    } catch (e) {
      throw new Error(`Renderer identity mismatch for ${slug}. Expected selector ${theme.expectedSelector} not found.`);
    }

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

    // Dismiss the access gate to reveal the actual theme
    const openBtn = await page.locator('.theme-access-gate button').first();
    if (await openBtn.isVisible()) {
      await openBtn.click();
      // Wait for the gate to disappear
      await page.waitForSelector('.theme-access-gate', { state: 'hidden', timeout: 5000 });
      // Small timeout for any intro animations
      await page.waitForTimeout(1000);
    }

    const pngPath = path.join(outputDir, `${slug}.png`);
    const webpPath = path.join(outputDir, `${slug}.webp`);

    await page.screenshot({ path: pngPath, type: 'png' });

    const pngBuf = fs.readFileSync(pngPath);
    console.log(`✔ PNG SHA-256: ${crypto.createHash('sha256').update(pngBuf).digest('hex')}`);

    await sharp(pngPath)
      .webp({ quality: 85 })
      .toFile(webpPath);

    const webpBuf = fs.readFileSync(webpPath);
    const hash = crypto.createHash('sha256').update(webpBuf).digest('hex');
    console.log(`✔ WebP SHA-256: ${hash}`);

    if (generatedHashes.has(hash)) {
       throw new Error(`Duplicate preview detected: ${slug} == ${generatedHashes.get(hash)}`);
    }
    generatedHashes.set(hash, slug);

    await context.close();
  }

  await browser.close();
})();
