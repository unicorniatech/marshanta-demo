import { test, expect } from '@playwright/test'

const home = '/'

// Helpers to set localStorage before page load
async function setRoleStorage(page, role: 'guest' | 'client' | 'admin' | 'staff' | 'delivery') {
  await page.addInitScript(({ role }) => {
    try {
      localStorage.setItem('apiBase', 'http://localhost:4000')
      if (role === 'admin' || role === 'staff' || role === 'delivery' || role === 'client') {
        localStorage.setItem('authToken', 'test-token')
        localStorage.setItem('lastUserRole', role)
      } else {
        localStorage.removeItem('authToken')
        localStorage.removeItem('lastUserRole')
      }
    } catch {}
  }, { role })
}

test.describe('Restaurant Console gating', () => {
  test('rcSection is hidden for guests', async ({ page }) => {
    await setRoleStorage(page, 'guest')
    await page.goto(home)
    const rcGuest = page.locator('#rcSection')
    await expect(rcGuest).toBeHidden()
  })

  test('rcSection visible for admin', async ({ browser }) => {
    const page = await browser.newPage()
    await setRoleStorage(page, 'admin')
    await page.goto(home)
    const rc = page.locator('#rcSection')
    await expect(rc).toBeVisible()
  })
})
