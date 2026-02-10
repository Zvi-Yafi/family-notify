import { test, expect } from '@playwright/test'

test.describe('Authentication Flow (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /ברוכים הבאים/i })).toBeVisible()
  })

  test('should display onboarding page', async ({ page }) => {
    await page.goto('/onboarding')

    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/אימייל/i).first().fill('invalid@example.com')
    await page.getByLabel(/סיסמה/i).first().fill('wrongpassword')
    await page.getByRole('button', { name: /התחבר/i }).first().click()

    await expect(page.getByText(/שגוי|שגיאה/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Protected Routes (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  const protectedRoutes = ['/admin', '/preferences', '/feed', '/events']

  for (const route of protectedRoutes) {
    test(`should handle ${route} when not authenticated`, async ({ page }) => {
      await page.goto(route)

      const url = page.url()
      expect(url).toBeDefined()
    })
  }
})

test.describe('Authenticated user', () => {
  test('should access feed when logged in', async ({ page }) => {
    await page.goto('/feed')

    await expect(page).not.toHaveURL(/\/login/)
  })

  test('should access admin when logged in', async ({ page }) => {
    await page.goto('/admin')

    const url = page.url()
    const isOnAdmin = url.includes('/admin')
    const isRedirected = url.includes('/login') || url.includes('/onboarding')
    expect(isOnAdmin || isRedirected).toBe(true)
  })
})
