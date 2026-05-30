# Penyelesaian Studi Auth Vercel

Fitur:
- Login Admin dan Mahasiswa
- Registrasi mahasiswa memakai email
- Verifikasi email nyata lewat Supabase Auth
- Tugas selesai/belum selesai
- Jadwal kuliah
- Upload foto bukti/catatan tugas ukuran kecil
- Cetak laporan PDF lewat tombol PDF / Print browser
- Mobile responsive

## Jalankan lokal

```bash
npm install
npm run dev
```

## Setup Supabase

1. Buat project di Supabase.
2. Buka SQL Editor, jalankan isi file `supabase-schema.sql`.
3. Buka Authentication > Providers > Email, aktifkan Confirm email.
4. Copy Project URL dan anon key.
5. Buat file `.env` dari `.env.example`.

```env
VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=ISI_ANON_PUBLIC_KEY_SUPABASE
```

## Membuat Admin

Daftar dulu melalui menu Registrasi Mahasiswa menggunakan email admin, lalu jalankan SQL ini di Supabase SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'emailadmin@gmail.com';
```

Setelah itu login dari menu Login Admin.

## Deploy Vercel

- Upload ke GitHub.
- Import di Vercel.
- Tambahkan Environment Variables:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
- Build Command: `npm run build`
- Output Directory: `dist`
