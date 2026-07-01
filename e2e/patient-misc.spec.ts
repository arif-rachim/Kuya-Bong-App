import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasPatientCreds, creds, loginAsPatient, gotoRoute } from './helpers'

/** Read-only patient screens: clinics, announcements, packages, home (US §3, §9, §21). */
test.describe('manggaleh — patient read-only screens', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPatientCreds, 'needs patient credentials')

  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page, creds.patient.email, creds.patient.password)
  })

  test('clinics screen lists clinic info', async ({ page }) => {
    await gotoRoute(page, 'patient/clinics')
    await expect(page.getByRole('heading', { name: 'Clinics' })).toBeVisible()
    await expect(page.getByText(/Clinic A/i).first()).toBeVisible()
  })

  test('announcements screen loads', async ({ page }) => {
    await gotoRoute(page, 'patient/announcements')
    await expect(page.getByRole('heading', { name: 'Announcements' })).toBeVisible()
  })

  test('packages screen loads', async ({ page }) => {
    await gotoRoute(page, 'patient/packages')
    await expect(page.getByRole('heading', { name: 'My Packages' })).toBeVisible()
  })

  test('home shows the greeting and quick actions', async ({ page }) => {
    await gotoRoute(page, 'patient/home')
    await expect(page.getByRole('heading', { name: /^Hello,/ })).toBeVisible()
    await expect(page.getByText('How are you feeling today?')).toBeVisible()
  })
})
