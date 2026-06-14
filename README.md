# Realief Expert App

Prototype UI for the **Realief Expert** clinic booking & management app — _Expert Care, Real Relief_ (physiotherapy & chiropractic, 2 clinics). A single app for two roles: **Patient** and **Admin**.

This phase is **client-only**: all data is mock, held in [Zustand](https://github.com/pmndrs/zustand) + `localStorage`, with no backend yet. It will later be integrated with a **backend/BaaS** (not yet decided) — every mutation already goes through a store action, which serves as the integration seam.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS ("Calm Clinical" design system, green `#1e9e3a` brand) · Material Symbols Outlined icons
- Zustand (`persist` → localStorage) for state & business rules
- React Router (HashRouter — friendly to static hosting & Capacitor)
- Capacitor (config prepared for native iOS/Android builds — not the initial demo path)

## Running

```bash
npm install
npm run dev      # http://localhost:5173
```

Static build for hosting:

```bash
npm run build    # outputs to dist/ (static files)
npm run preview  # preview the build
```

## Deploy the demo (static)

`dist/` is pure static output — host it on **GitHub Pages / Netlify / Vercel / Cloudflare Pages**. `base: './'` is already set in `vite.config.ts` so asset paths resolve correctly in a sub-folder. For Netlify/Vercel just point at build command `npm run build` and publish dir `dist`. A `netlify.toml` and a GitHub Pages workflow (`.github/workflows/deploy.yml`) are included.

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Patient | maria@example.com | patient123 |
| Admin | admin@reliefexpert.app | admin123 |

Or use the **"Sign in as Patient / Admin"** buttons on the Welcome screen. Mock verification/OTP code: **123456**.

Reset demo data: **Admin → Settings → Reset Demo Data** (or delete the `kuya-bong-store` key from localStorage).

## Screen coverage

- **Patient:** Welcome/Register/Verify/Login/Forgot · Home · Booking (clinic → date → time → review → confirm) · Visits (upcoming/completed/cancelled/rescheduled) · Details + reschedule/cancel · Packages + history · Family (link adult / add child) · Clinics · Profile
- **Admin:** Dashboard · Availability calendar · Appointment management (complete/cancel/no-show + deduct package) · Manual booking · Patients + profile (assign package, record purchase) · Packages (create/assign) · Products (CRUD + price) · Follow-ups · Clinic settings

## Enforced business rules

- Verification required before booking · prevent double booking · reschedule only to available slots
- **Deduct a package session only when a session is `Completed`** — cancel/reschedule never reduces the balance
- Package usage blocked when the balance is 0 or the package has expired
- Product price is stored as a snapshot at purchase time (updating the catalog price does not change history)
- Patient cancel/reschedule cutoff: 24 hours before the session

> Defaults for the client's open questions (60-minute duration, auto-confirm, OTP + email, etc.) follow the blueprint's recommendations and are easy to change in `src/store/appStore.ts` / `src/data/seed.ts`.
