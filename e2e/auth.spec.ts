import { test, expect } from '@playwright/test'
import { installMockManggaleh } from './mockManggaleh'

test.beforeEach(async ({ page }) => {
  await installMockManggaleh(page)
})

test('welcome shows Register + Log In and no demo affordances', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/welcome/)
  await expect(page.getByRole('button', { name: 'Register' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible()
  await expect(page.getByText(/Quick demo/i)).toHaveCount(0)
})

test('patient can log in and reach home', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByLabel('Email').fill('patient@test.com')
  await page.getByLabel('Password').fill('patient123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL(/#\/patient\/home/, { timeout: 10_000 })
})

test('admin can log in and reach the dashboard', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByLabel('Email').fill('admin@test.com')
  await page.getByLabel('Password').fill('admin123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL(/#\/admin\/dashboard/, { timeout: 10_000 })
})

test('wrong password is rejected', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByLabel('Email').fill('patient@test.com')
  await page.getByLabel('Password').fill('nope')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page.getByText(/Incorrect email or password/i)).toBeVisible()
})

test('new patient can register and verify their email', async ({ page }) => {
  await page.goto('/#/register')
  await page.getByLabel('Full name').fill('New User')
  await page.getByLabel('Email').fill('new@test.com')
  await page.getByLabel('Mobile number').fill('+971500000000')
  await page.getByLabel('Password').fill('secret123')
  await page.getByRole('button', { name: /Continue to Verification/i }).click()
  await expect(page).toHaveURL(/#\/verify-email/, { timeout: 10_000 })
  await page.getByLabel('Verification code').fill('123456')
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page).toHaveURL(/#\/patient\/home/, { timeout: 10_000 })
})
