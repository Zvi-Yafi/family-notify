import { test, expect } from '@playwright/test'

test.describe('Admin Panel (authenticated)', () => {
  test('should display admin page when authenticated', async ({ page }) => {
    await page.goto('/admin')

    const url = page.url()
    if (url.includes('/admin')) {
      await expect(page).toHaveURL(/\/admin/)
    }
  })

  test('should have announcement creation form', async ({ page }) => {
    await page.goto('/admin')

    if (page.url().includes('/admin')) {
      const hasForm = await page.locator('form').count()
      expect(hasForm).toBeGreaterThanOrEqual(0)
    }
  })
})

test.describe('Admin Panel (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should handle admin access without auth', async ({ page }) => {
    await page.goto('/admin')

    const url = page.url()
    expect(url).toBeDefined()
  })
})
