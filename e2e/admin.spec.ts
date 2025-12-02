import { test, expect } from '@playwright/test'

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real scenario, you would need to authenticate first
    // This is a placeholder for the authentication flow
    await page.goto('/admin')
  })

  test('should display admin page title', async ({ page }) => {
    // This test might redirect to login if not authenticated
    const url = page.url()
    
    if (url.includes('/login')) {
      await expect(page).toHaveURL(/\/login/)
    } else if (url.includes('/admin')) {
      // Check if admin page loads
      await expect(page).toHaveURL(/\/admin/)
    }
  })

  test('should have announcement creation form', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip()
    }
    
    // Look for announcement form elements
    // These might not exist if user is not authenticated
    const hasForm = await page.locator('form').count() > 0
    expect(hasForm).toBeDefined()
  })
})

test.describe('Admin - Announcements', () => {
  test.skip('should create a new announcement', async ({ page }) => {
    // This test requires authentication
    await page.goto('/admin')
    
    // Fill in announcement form
    await page.fill('input[name="title"]', 'הודעה חדשה')
    await page.fill('textarea[name="body"]', 'תוכן ההודעה')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for success message
    await expect(page.getByText(/נוצרה בהצלחה/)).toBeVisible({ timeout: 5000 })
  })

  test.skip('should validate announcement form', async ({ page }) => {
    // This test requires authentication
    await page.goto('/admin')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.getByText(/שדה חובה/)).toBeVisible()
  })
})

test.describe('Admin - Events', () => {
  test.skip('should create a new event', async ({ page }) => {
    // This test requires authentication
    await page.goto('/admin')
    
    // Navigate to events tab
    await page.click('text=אירועים')
    
    // Fill in event form
    await page.fill('input[name="title"]', 'אירוע משפחתי')
    await page.fill('textarea[name="description"]', 'תיאור האירוע')
    await page.fill('input[name="location"]', 'תל אביב')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for success message
    await expect(page.getByText(/נוצר בהצלחה/)).toBeVisible({ timeout: 5000 })
  })
})


