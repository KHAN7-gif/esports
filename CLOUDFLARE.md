# The Elite → the-elite.esukan.app

The Elite menjadi pusat login bersama dan hos dashboard kejohanan serta Tekken. Rujuk [SSO.md](SSO.md) untuk status rollout dan konfigurasi subweb.
Worker menyajikan laman sedia ada dan API D1. Supabase tidak lagi diperlukan untuk The Elite.
Database baharu bermula tanpa pelumba; tiada data lama diimport atau dummy dimasukkan secara automatik.

## Registration 2026 · D1 sudah diaktifkan

Jika database D1 `esukan-elite` telah dibuat, **gunakan database yang sama**; jangan cipta D1 baharu atau jalankan reset.

1. Cloudflare → **Workers & Pages → the-elite → Settings → Bindings**: semak D1 binding bernama tepat `DB` menunjuk ke `esukan-elite`.
2. Cloudflare → **Workers & Pages → the-elite → Settings → Builds**: repository `KHAN7-gif/esports`, branch `main`, root directory `the-elite`, dan build variable `D1_DATABASE_ID` mesti sama dengan UUID database itu.
3. Build command: `pnpm install --frozen-lockfile && pnpm run build`; deploy command: `pnpm run deploy`. Skrip deploy menjalankan **migrations D1 --remote sebelum deploy Worker**, termasuk `0004_registrations.sql`, dan tidak reset data pelumba.
4. Selepas deployment berjaya, semak `https://the-elite.esukan.app/elite-registration.js` dan `https://the-elite.esukan.app/elite-admin-registrations.js` memulangkan JavaScript (bukan 404). Fail ini kini dibundel oleh `scripts/prepare-elite.mjs`.
5. Semak `https://the-elite.esukan.app/api/drivers` dan `https://the-elite.esukan.app/api/admin/session`. `/api/registrations` GET tanpa resit/admin **sepatutnya menolak permintaan**, bukannya memaparkan data peribadi.
6. Semak jadual D1 `elite_registrations` dan `elite_registration_limits`; jangan cipta secara manual jika migration sudah direkodkan dalam `d1_migrations`.
7. Uji borang menggunakan rekod ujian dengan izin; pastikan status Pending boleh dilihat Admin, diluluskan dan kemudian dimasukkan ke Race Control menggunakan butang Add to Race Control. Padam rekod ujian melalui prosedur pentadbir sebelum penggunaan rasmi.

**Nota:** GitHub Pages hanya menerbitkan frontend. API berasaskan Cloudflare perlu dipanggil dari domain Worker `the-elite.esukan.app`, kerana `elite-config.js` menggunakan API same-origin. Worker & D1 production hanya dianggap aktif selepas deployment dan ujian endpoint berjaya. Jangan masukkan secret atau token Cloudflare dalam GitHub repository.

## 1. Cipta D1 baharu

Cloudflare → Storage & databases → D1 → Create database → nama `esukan-elite`.
Salin **Database ID** (UUID), bukan Account ID.

## 2. Sambungkan GitHub melalui Workers Builds

Workers & Pages → Create application → Import repository → `KHAN7-gif/esports`.

| Tetapan | Nilai |
| --- | --- |
| Worker name | `the-elite` |
| Production branch | `main` |
| Root directory | `the-elite` |
| Build command | `pnpm install --frozen-lockfile && pnpm run build` |
| Deploy command | `pnpm run deploy` |
| Build variable `NODE_VERSION` | `24` |
| Build variable `D1_DATABASE_ID` | UUID database `esukan-elite` anda |
| Build variable `TURNSTILE_SITE_KEY` | Site Key widget Turnstile untuk `the-elite.esukan.app` |

pnpm mesti **11.25.0** seperti `packageManager` projek. Gunakan lockfile sedia ada.
Script memerlukan keseluruhan checkout GitHub, termasuk `../scripts`, `../cloudflare`, dan fail HTML di root. Jangan muat naik direktori `the-elite` sahaja sebagai zip.
Site Key ialah kunci awam dan dihantar kepada pelayar. Jangan letakkan Secret Key sebagai build variable.

Deploy script menjalankan migrasi D1 remote bernombor, kemudian menerbitkan Worker dengan Custom Domain `the-elite.esukan.app`. Migrasi yang sudah direkodkan tidak diulang. Ia tidak reset database dan tidak memerlukan rekod A atau alamat IP manual.
Domain `esukan.app` mesti berada dalam akaun Cloudflare yang sama. Jika rekod DNS bagi subdomain itu sudah wujud, semak tujuannya sebelum menggantikannya.

Token Workers Builds perlu izin akaun **Workers Scripts: Edit**, **D1: Edit**, dan izin zone `esukan.app` untuk **Workers Routes: Edit**. Jika token automatik tidak cukup izin, konfigurasi token berskop melalui tetapan selamat Cloudflare. Jangan masukkan token ke source, GitHub atau chat.
Untuk branch preview, gunakan deploy command `node ../scripts/deploy-cloudflare.mjs elite --dry-run` sahaja; jangan deploy preview ke domain/database production.

## 3. Sediakan Cloudflare Turnstile

Cloudflare Dashboard → Turnstile → Add widget. Pilih jenis **Managed** dan benarkan hostname tepat `the-elite.esukan.app`. Salin Site Key ke Workers Builds build variable `TURNSTILE_SITE_KEY`, kemudian set Secret Key sebagai runtime secret (bukan variable, source atau chat):

```sh
pnpm --dir the-elite exec wrangler secret put TURNSTILE_SECRET_KEY --name the-elite --config ../.cloudflare/elite/wrangler.json
```

Jalankan arahan tersebut dalam terminal komputer sendiri dan masukkan Secret Key pada prompt Wrangler. Selepas kedua-dua kunci ditetapkan, deploy semula Worker supaya binding Site Key tersedia. Login hanya akan diterima selepas token Turnstile disahkan oleh Cloudflare, dan hostname serta action mesti sepadan.

## 4. Tetapkan akaun admin

Selesai deploy pertama, Worker akan memaparkan data awam tetapi login kekal tertutup sehingga secrets disediakan.
Empat **runtime secrets** diperlukan: `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_PASSWORD_SALT`, `ADMIN_SESSION_SECRET`. Ini berbeza daripada build variables.

Cara mudah dari komputer sendiri (Node >=22.13 dan pnpm 11.25.0):

```sh
pnpm --dir the-elite install --frozen-lockfile
pnpm --dir the-elite exec wrangler login
node scripts/admin-secrets.mjs elite
```

Helper meminta e-mel dan kata laluan tanpa echo. Kata laluan mesti 12–256 aksara dan disahkan dua kali. Ia menghantar e-mel, hash PBKDF2-SHA256 (100000 iterasi, hasil 32 bytes hex), salt rawak 16 bytes hex dan session secret rawak 32 bytes hex terus ke Cloudflare. Nilai tidak dipaparkan atau disimpan dalam fail. Jangan letakkan kata laluan asal ke `ADMIN_PASSWORD_HASH`. Mengulang helper menukar kata laluan dan membatalkan sesi lama.
Gunakan akaun Cloudflare yang sama semasa login Wrangler. Jika anda mempunyai beberapa akaun, tetapkan `CLOUDFLARE_ACCOUNT_ID` yang betul dalam terminal sebelum menjalankan helper.

Admin: `https://the-elite.esukan.app/admin`.

## 5. Sahkan selepas deploy

1. Buka root domain melalui HTTPS; ia mesti memaparkan The Elite.
2. `/api/drivers` pada mulanya memberi `{"data":[]}`.
3. `/api/admin/config` mesti memulangkan Site Key awam yang dikonfigurasi.
4. Halaman `/admin` mesti memaparkan widget Turnstile dan menolak login jika token tiada/tidak sah.
5. Login admin dengan akaun sah, tambah pelumba sebenar, refresh dan pastikan data kekal. Logout; akses tulis mesti ditolak semula.

Build/dry-run tidak membuktikan DNS atau deploy production berjaya. GitHub Pages dan URL lama tidak dipadam atau diarahkan semula secara automatik. Fail `elite-supabase-setup.sql` kekal sebagai rujukan lama sahaja.

## Semakan setempat

Cloud task sudah terasing; guna checkout sedia ada dan jangan cipta worktree tanpa permintaan.

```sh
pnpm --dir the-elite install --frozen-lockfile
pnpm --dir the-elite run build
node scripts/deploy-cloudflare.mjs elite --dry-run
pnpm --dir the-elite exec wrangler d1 migrations apply DB --local --config ../.cloudflare/elite/wrangler.json
pnpm --dir the-elite exec wrangler dev --local --config ../.cloudflare/elite/wrangler.json --port 8790
```

Dry-run menjana konfigurasi dalam `.cloudflare/` tanpa mengakses D1 remote. Konfigurasi dan state tempatan tidak dikomit. Jika konfigurasi Wrangler di rumah tidak boleh ditulis, tetapkan `XDG_CONFIG_HOME` kepada direktori tempatan yang boleh ditulis.
Untuk menguji login setempat, sediakan empat secrets percubaan dalam `.cloudflare/elite/.dev.vars` (diabaikan Git); jangan gunakan atau komit secrets production.
