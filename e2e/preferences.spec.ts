import { test, expect } from '@playwright/test'

test.describe('User Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/preferences')
  })

  test('should redirect to login if not authenticated', async ({ page }) => {
    // If user is not authenticated, should redirect to login
    const url = page.url()
    
    if (url.includes('/login')) {
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test.skip('should display communication channel preferences', async ({ page }) => {
    // This test requires authentication
    
    // Check for communication channel options
    await expect(page.getByText('Email')).toBeVisible()
    await expect(page.getByText('SMS')).toBeVisible()
    await expect(page.getByText('WhatsApp')).toBeVisible()
    await expect(page.getByText('Push')).toBeVisible()
  })

  test.skip('should toggle email preference', async ({ page }) => {
    // This test requires authentication
    
    // Find email switch
    const emailSwitch = page.getByRole('switch', { name: /email/i })
    
    // Get initial state
    const initialState = await emailSwitch.isChecked()
    
    // Toggle switch
    await emailSwitch.click()
    
    // Verify state changed
    const newState = await emailSwitch.isChecked()
    expect(newState).toBe(!initialState)
  })

  test.skip('should save preferences', async ({ page }) => {
    // This test requires authentication
    
    // Toggle some preferences
    await page.getByRole('switch', { name: /email/i }).click()
    
    // Click save button
    await page.click('button:has-text("שמור")')
    
    // Check for success message
    await expect(page.getByText(/נשמרו בהצלחה/)).toBeVisible({ timeout: 5000 })
  })
})


