import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Home Page', () => {
  test('should display the app name and logo', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'FamilyNotify' })).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('should show login and signup buttons when not authenticated', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'התחברות' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'הרשמה' })).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'התחברות' }).click()

    await expect(page).toHaveURL(/\/login/)
  })

  test('should navigate to onboarding page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'הרשמה' }).click()

    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('should be mobile responsive', async ({ page, viewport }) => {
    await page.goto('/')

    if (viewport && viewport.width < 768) {
      await expect(page.getByText('FamilyNotify')).toBeVisible()
    } else {
      await expect(page.getByRole('heading', { name: 'FamilyNotify' })).toBeVisible()
    }
  })
})
