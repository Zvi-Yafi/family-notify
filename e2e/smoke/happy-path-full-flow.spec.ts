import { test, expect, type Page } from '@playwright/test'

const uniqueTitle = () => `Smoke Test ${Date.now()}`

test.describe('@smoke Happy Path Full Flow', () => {
  let announcementTitle: string

  test('admin creates announcement and member sees it', async ({ browser }) => {
    announcementTitle = uniqueTitle()

    const adminContext = await browser.newContext({
      storageState: 'e2e/.auth/admin.json',
    })
    const adminPage = adminContext.newPage()

    const memberContext = await browser.newContext({
      storageState: 'e2e/.auth/member.json',
    })
    const memberPage = memberContext.newPage()

    const admin = await adminPage
    const member = await memberPage

    await createAnnouncementAsAdmin(admin, announcementTitle)
    await verifyAnnouncementAsMember(member, announcementTitle)

    await adminContext.close()
    await memberContext.close()
  })
})

async function createAnnouncementAsAdmin(page: Page, title: string) {
  await page.goto('/admin?tab=announcements')

  await page.waitForLoadState('networkidle')

  const titleInput = page.locator('#title')
  await expect(titleInput).toBeVisible({ timeout: 15000 })
  await titleInput.fill(title)

  const bodyInput = page.locator('#body')
  await expect(bodyInput).toBeVisible()
  await bodyInput.fill('Automated smoke test announcement body')

  const submitButton = page.getByRole('button', { name: /שלח עכשיו/i })
  await expect(submitButton).toBeVisible()
  await submitButton.click()

  await expect(
    page.getByText(/הודעה נוצרה בהצלחה/i)
  ).toBeVisible({ timeout: 15000 })
}

async function verifyAnnouncementAsMember(page: Page, title: string) {
  await page.goto('/feed')

  await page.waitForLoadState('networkidle')

  await expect(
    page.getByText(title)
  ).toBeVisible({ timeout: 15000 })
}
