import { test, expect } from '@playwright/test';

test.describe('Marketing & Dashboard Flow', () => {
  // Test landing page
  test('Landing page renders correctly', async ({ page }) => {
    await page.goto('/');
    
    // Memastikan judul utama ada
    await expect(page.locator('h1')).toContainText('Undangan yang terasa seperti milik kalian.');
    
    // Memastikan CTA ada
    const ctaButton = page.locator('text=Coba Tema Gratis');
    await expect(ctaButton.first()).toBeVisible();
    
    // Navbar dan Footer render
    await expect(page.locator('footer')).toContainText('Hak cipta dilindungi');
  });

  // Test navigasi dasar (unauthenticated) - expect redirect to login
  test('Create flow redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/create');
    
    // Next.js middleware seharusnya meredirect ke login jika tidak login
    await expect(page).toHaveURL(/.*\/login.*/);
    
    // Pastikan form login muncul
    await expect(page.locator('h1')).toContainText('Masuk ke weplan');
  });

  // Catatan: Flow "create -> edit" penuh dengan auth
  // memerlukan setup local Supabase credentials yang
  // spesifik. Test di atas merupakan test minimal untuk memastikan
  // surface marketing tidak crash dan routing dilindungi.
});
