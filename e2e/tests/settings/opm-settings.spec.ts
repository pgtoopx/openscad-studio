import { test, expect } from '@playwright/test';

test.describe('OPM Settings Panel', () => {
  test('should display OPM unavailable in web fallback', async ({ page }) => {
    await page.goto('/');
    
    // Open settings dialog
    await page.click('[data-testid="settings-button"]');
    
    // Navigate to Project tab
    await page.click('[data-testid="settings-nav-project"]');
    
    // Verify OPM section exists and shows web fallback message
    await expect(page.locator('text=OpenSCAD Package Manager (OPM)')).toBeVisible();
    await expect(page.locator('text=Dependency management is only available in the desktop app.')).toBeVisible();
  });
});
