import { test, expect } from '@playwright/test'
import { gotoWelcome, gotoRoute, login, manggalehConfigured, runMarker } from './helpers'

/**
 * Backend-agnostic smoke tests. These exercise the app SHELL, routing, and the
 * client-side auth flow that works even without a backend — so they run green in
 * mock mode (no manggaleh env) and are the fast guard for CI without secrets.
 */
test.describe('smoke — app shell & routing', () => {
  test('boots to the Welcome screen with entry actions', async ({ page }) => {
    await gotoWelcome(page)
    await expect(page.getByText('Realief Expert', { exact: false })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible()
  })

  test('Welcome → Log In navigates to the login form', async ({ page }) => {
    await gotoWelcome(page)
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page).toHaveURL(/#\/login/)
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('login with unknown credentials shows an error', async ({ page }) => {
    await login(page, `nobody-${runMarker()}@example.com`, 'wrong-password')
    await expect(page.getByText('Incorrect email or password.')).toBeVisible()
    // Must NOT navigate into an authenticated area.
    await expect(page).toHaveURL(/#\/login/)
  })

  test('register requires all fields and a 6+ char password', async ({ page }) => {
    await gotoRoute(page, 'register')
    // Empty submit → required-field error.
    await page.getByRole('button', { name: /Continue to Verification/ }).click()
    // Fill everything but a too-short password → password error.
    await page.getByLabel('Full name').fill('QA Tester')
    await page.getByLabel('Email').fill(`qa-${runMarker()}@example.com`)
    await page.getByLabel('Mobile number').fill('+971 50 123 4567')
    await page.getByLabel('Password').fill('123')
    await page.getByRole('button', { name: /Continue to Verification/ }).click()
    await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible()
  })
})

/**
 * Mock-mode-only: the register → verify → home journey uses the in-memory demo
 * OTP (123456). Under manggaleh, registration goes through the real SDK instead,
 * so this variant is skipped there (covered by the manggaleh auth spec).
 */
test.describe('smoke — register & verify (mock mode)', () => {
  test.skip(manggalehConfigured, 'mock-only flow; manggaleh has its own auth spec')

  test('register → verify with demo OTP → patient home', async ({ page }) => {
    const name = 'QA Newcomer'
    await gotoRoute(page, 'register')
    await page.getByLabel('Full name').fill(name)
    await page.getByLabel('Email').fill(`qa-${runMarker()}@example.com`)
    await page.getByLabel('Mobile number').fill(`+9715${Math.floor(Math.random() * 1e7)}`)
    await page.getByLabel('Password').fill('secret123')
    await page.getByRole('button', { name: /Continue to Verification/ }).click()

    await expect(page).toHaveURL(/#\/verify\//)
    await expect(page.getByText(/Demo: use code 123456/)).toBeVisible()
    await page.getByLabel('Verification code').fill('123456')
    await page.getByRole('button', { name: /^Verify$/ }).click()

    await expect(page).toHaveURL(/#\/patient\/home/)
    await expect(page.getByRole('heading', { name: `Hello, ${name}` })).toBeVisible()
  })
})
