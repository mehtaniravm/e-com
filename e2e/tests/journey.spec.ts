import { test, expect, type Page } from '@playwright/test'
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  CUSTOMER_EMAIL,
  CUSTOMER_PASSWORD,
} from '../global-setup'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/dashboard')
}

async function logout(page: Page) {
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/login')
}

// ── Full user journey ─────────────────────────────────────────────────────────

test('full user journey', async ({ page }) => {
  test.setTimeout(60_000)

  // ── 1. Admin logs in ────────────────────────────────────────────────────────
  await page.goto('/login')

  await page.locator('#email').fill(ADMIN_EMAIL)
  await page.locator('#password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByText('Welcome back')).toBeVisible()
  await expect(page.getByText('ADMIN')).toBeVisible()

  // ── 2. Navigate to User Management ─────────────────────────────────────────
  await page.getByRole('link', { name: /User Management/ }).click()
  await expect(page).toHaveURL('/admin/users')
  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible()

  // ── 3. Customer appears in table ────────────────────────────────────────────
  await expect(page.locator('td').filter({ hasText: CUSTOMER_EMAIL })).toBeVisible()

  // ── 4. Open edit modal for the customer ─────────────────────────────────────
  await page.locator('tr').filter({ hasText: CUSTOMER_EMAIL })
            .getByRole('button', { name: /Edit/ })
            .click()

  await expect(page.locator('.modal-title')).toHaveText('Edit — E2E Customer')

  // ── 5. Update customer's first name ─────────────────────────────────────────
  const firstNameInput = page
    .locator('.form-row .form-group')
    .first()
    .locator('input')

  await firstNameInput.clear()
  await firstNameInput.fill('Jane')

  await page.getByRole('button', { name: 'Save changes' }).click()

  // Modal closes; table row now shows the updated name
  await expect(page.locator('.modal-overlay')).not.toBeVisible()
  await expect(page.locator('td').filter({ hasText: 'Jane' })).toBeVisible()

  // ── 6. Admin signs out ──────────────────────────────────────────────────────
  await logout(page)

  // ── 7. Customer logs in ─────────────────────────────────────────────────────
  await page.locator('#email').fill(CUSTOMER_EMAIL)
  await page.locator('#password').fill(CUSTOMER_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL('/dashboard')
  // Customer role: USER — no User Management link in nav
  await expect(page.getByRole('link', { name: /User Management/ })).not.toBeVisible()

  // ── 8. Navigate to Orders ───────────────────────────────────────────────────
  await page.getByRole('link', { name: /Orders/ }).click()
  await expect(page).toHaveURL('/orders')
  await expect(page.getByText('0 orders found')).toBeVisible()

  // ── 9. Open Create Order modal ──────────────────────────────────────────────
  await page.getByRole('button', { name: '+ New order' }).click()
  await expect(page.locator('.modal-title')).toHaveText('New order')

  // ── 10. Fill order form (1 item row pre-populated) ──────────────────────────
  await page.getByPlaceholder('Product name').fill('E2E Widget')
  // Qty defaults to 1 — leave it
  await page.getByPlaceholder('0.00').fill('25.00')
  await expect(page.getByText('Order total: $25.00')).toBeVisible()

  // ── 11. Submit order ────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Place order' }).click()

  // ── 12. Assert order appears in list with PENDING status ────────────────────
  await expect(page.locator('.modal-overlay')).not.toBeVisible()
  await expect(page.getByText('1 order found')).toBeVisible()
  await expect(page.getByText('PENDING')).toBeVisible()
  await expect(page.locator('td').filter({ hasText: '$25.00' })).toBeVisible()

  // ── 13. Open order detail modal ─────────────────────────────────────────────
  await page.locator('tr.row-clickable').first().click()
  await expect(page.locator('.modal-title')).toHaveText('Order details')
  await expect(page.getByText('E2E Widget')).toBeVisible()
  await expect(page.locator('.tl-label').first()).toHaveText('PENDING')
})

// ── Focused auth tests ────────────────────────────────────────────────────────

test.describe('Login page', () => {
  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill(ADMIN_EMAIL)
    await page.locator('#password').fill('WrongPassword!')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.locator('.login-error')).toHaveText('Invalid email or password.')
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated redirect to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('customer cannot access /admin/users', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD)
    await page.goto('/admin/users')
    // PrivateRoute with requiredRole="ADMIN" redirects customer to /dashboard
    await expect(page).toHaveURL('/dashboard')
  })
})

// ── Admin order lifecycle ─────────────────────────────────────────────────────

test.describe('Order lifecycle (admin advances status)', () => {
  test('admin advances order PENDING → CONFIRMED → SHIPPED', async ({ page }) => {
    test.setTimeout(60_000)

    // Customer creates order
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD)
    await page.getByRole('link', { name: /Orders/ }).click()
    await page.getByRole('button', { name: '+ New order' }).click()
    await page.getByPlaceholder('Product name').fill('Lifecycle Widget')
    await page.getByPlaceholder('0.00').fill('50.00')
    await page.getByRole('button', { name: 'Place order' }).click()
    await expect(page.getByText('PENDING')).toBeVisible()
    await logout(page)

    // Admin logs in and advances the order twice
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.getByRole('link', { name: /Orders/ }).click()

    // Open the PENDING order
    await page.locator('tr.row-clickable').filter({ hasText: 'Lifecycle Widget' }).click()
    await expect(page.locator('.modal-title')).toHaveText('Order details')

    // PENDING → CONFIRMED
    await page.getByRole('button', { name: /Mark CONFIRMED/ }).click()
    await expect(page.getByText('CONFIRMED')).toBeVisible()

    // CONFIRMED → SHIPPED
    await page.getByRole('button', { name: /Mark SHIPPED/ }).click()
    await expect(page.getByText('SHIPPED')).toBeVisible()

    // No further advance button (SHIPPED is terminal)
    await expect(page.getByRole('button', { name: /Mark/ })).not.toBeVisible()
  })

  test('customer cancels a PENDING order', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD)
    await page.getByRole('link', { name: /Orders/ }).click()

    // Create order
    await page.getByRole('button', { name: '+ New order' }).click()
    await page.getByPlaceholder('Product name').fill('Cancel Me')
    await page.getByPlaceholder('0.00').fill('5.00')
    await page.getByRole('button', { name: 'Place order' }).click()
    await expect(page.getByText('PENDING')).toBeVisible()

    // Open and cancel
    await page.locator('tr.row-clickable').filter({ hasText: 'Cancel Me' }).click()
    await page.getByRole('button', { name: 'Cancel order' }).click()

    // Modal closes; order now shows as CANCELLED
    await expect(page.locator('.modal-overlay')).not.toBeVisible()
    await expect(page.locator('td').filter({ hasText: 'CANCELLED' })).toBeVisible()
  })
})
