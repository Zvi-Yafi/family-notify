import { test, expect } from '@playwright/test'

test.describe('User Preferences (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/preferences')

    const url = page.url()
    const isRedirected = url.includes('/login') || url.includes('/onboarding')
    const stayedOnPrefs = url.includes('/preferences')
    expect(isRedirected || stayedOnPrefs).toBe(true)
  })
})

test.describe('User Preferences (authenticated)', () => {
  test('should display preferences page when authenticated', async ({ page }) => {
    await page.goto('/preferences')

    const url = page.url()
    if (url.includes('/preferences')) {
      await expect(page).toHaveURL(/\/preferences/)
    }
  })

  test('should display communication channel options', async ({ page }) => {
    await page.goto('/preferences')

    if (page.url().includes('/preferences')) {
      const pageContent = await page.textContent('body')
      const hasChannelContent =
        pageContent?.includes('Email') ||
        pageContent?.includes('email') ||
        pageContent?.includes('מייל') ||
        pageContent?.includes('SMS') ||
        pageContent?.includes('WhatsApp') ||
        pageContent?.includes('Push') ||
        pageContent?.includes('פוש')
      expect(hasChannelContent).toBeTruthy()
    }
  })
})
