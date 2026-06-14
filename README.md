# Realief Expert App

Prototype UI aplikasi booking & manajemen klinik **Realief Expert** — _Expert Care, Real Relief_ (fisioterapi & chiropractic, 2 klinik). Satu aplikasi untuk dua peran: **Pasien** dan **Admin**.

Fase ini **client-only**: semua data berupa mock di [Zustand](https://github.com/pmndrs/zustand) + `localStorage`, belum terhubung backend. Nantinya akan diintegrasikan ke **manggaleh.com** (BaaS dengan optimistic live data) — semua mutasi sudah dirancang lewat action di store sebagai titik integrasi.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (tema **"Calm Clinical"**, teal `#0E7C7B`) · ikon `lucide-react`
- Zustand (`persist` → localStorage) untuk state & business rules
- React Router (HashRouter, ramah static hosting & Capacitor)
- Capacitor (config disiapkan untuk native build iOS/Android — bukan jalur demo awal)

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
```

Build static untuk hosting:

```bash
npm run build    # output ke dist/ (static files)
npm run preview  # pratinjau hasil build
```

## Deploy demo (static)

`dist/` adalah file statis murni — host ke **GitHub Pages / Netlify / Vercel / Cloudflare Pages**. `base: './'` sudah diset di `vite.config.ts` agar path aset benar di sub-folder. Untuk Netlify/Vercel cukup arahkan ke perintah build `npm run build` dan publish dir `dist`.

## Akun demo

| Peran | Email | Sandi |
|-------|-------|-------|
| Pasien | maria@example.com | patient123 |
| Admin | admin@reliefexpert.app | admin123 |

Atau pakai tombol **"Masuk sebagai Pasien / Admin"** di layar Welcome. Kode verifikasi/OTP mock: **123456**.

Reset data demo: menu **Admin → Pengaturan → Reset Data Demo** (atau hapus key `kuya-bong-store` di localStorage).

## Cakupan layar

- **Pasien:** Welcome/Register/Verify/Login/Forgot · Home · Booking (klinik→tanggal→jam→review→konfirmasi) · Jadwal (upcoming/selesai/dibatalkan/dijadwal ulang) · Detail+reschedule/cancel · Paket+riwayat · Keluarga (link dewasa/tambah anak) · Klinik · Profil
- **Admin:** Dashboard · Kalender ketersediaan · Manajemen janji (complete/cancel/no-show + potong paket) · Booking manual · Pasien+profil (assign paket, catat pembelian) · Paket (buat/assign) · Produk (CRUD+harga) · Follow-up · Pengaturan klinik

## Business rules yang ditegakkan

- Verifikasi wajib sebelum booking · cegah double booking · reschedule hanya ke slot tersedia
- **Potong paket hanya saat sesi `Completed`** — cancel/reschedule tidak mengurangi saldo
- Paket terblokir bila saldo 0 atau kedaluwarsa
- Harga produk disimpan sebagai snapshot saat pembelian (update harga katalog tidak mengubah riwayat)
- Cutoff cancel/reschedule pasien: 24 jam sebelum sesi

> Default untuk open questions klien (durasi 60', auto-confirm, OTP+email, dll) mengikuti rekomendasi blueprint dan mudah diubah di `src/store/appStore.ts` / `src/data/seed.ts`.
