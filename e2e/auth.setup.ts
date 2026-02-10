import { test as setup, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'test-admin-a@familynotify.test'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'testpassword123'
const MEMBER_EMAIL = process.env.E2E_MEMBER_EMAIL || 'test-member-a@familynotify.test'
const MEMBER_PASSWORD = process.env.E2E_MEMBER_PASSWORD || 'testpassword123'

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/אימייל/i).first().fill(ADMIN_EMAIL)
  await page.getByLabel(/סיסמה/i).first().fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /התחבר/i }).first().click()

  await page.waitForURL(/\/(feed|admin|$)/, { timeout: 15000 })

  await page.context().storageState({ path: 'e2e/.auth/admin.json' })
})

setup('authenticate as member', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/אימייל/i).first().fill(MEMBER_EMAIL)
  await page.getByLabel(/סיסמה/i).first().fill(MEMBER_PASSWORD)
  await page.getByRole('button', { name: /התחבר/i }).first().click()

  await page.waitForURL(/\/(feed|admin|$)/, { timeout: 15000 })

  await page.context().storageState({ path: 'e2e/.auth/member.json' })
})
