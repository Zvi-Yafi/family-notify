import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display the app name and logo', async ({ page }) => {
    await page.goto('/')
    
    // Check for app name
    await expect(page.getByRole('heading', { name: 'FamilyNotify' })).toBeVisible()
    
    // Check for navigation
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('should show login and signup buttons when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Should show login button
    await expect(page.getByRole('link', { name: 'התחברות' })).toBeVisible()
    
    // Should show signup button
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
    
    // Check that the page renders on mobile viewport
    if (viewport && viewport.width < 768) {
      // Mobile view
      await expect(page.getByText('FamilyNotify')).toBeVisible()
    } else {
      // Desktop view
      await expect(page.getByRole('heading', { name: 'FamilyNotify' })).toBeVisible()
    }
  })
})


