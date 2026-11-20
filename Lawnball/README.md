# Lawnball — Gelanggang Lawn Bowls

Web app statik kejohanan lawn bowls triples: 6 pasukan, 2 kumpulan, top 2 ke separuh akhir, final dan tempat ketiga.

## Struktur

- `index.html`, `app.js`, `style.css`, `flags/`: paparan awam baca sahaja.
- `admin/`: versi admin untuk mengemas kini keputusan, pasukan, pemain dan gambar.

## Jalankan secara tempatan

Tiada pemasangan pakej atau proses build diperlukan. Dari root repositori:

```sh
python3 -m http.server 8080
```

- Awam: <http://localhost:8080/Lawnball/>
- Senarai pasukan: <http://localhost:8080/Lawnball/#pasukan>
- Admin: <http://localhost:8080/Lawnball/admin/#pasukan>

## Fungsi

- Jadual dummy lengkap: 13 end setiap perlawanan, anggaran 90 minit, dua rink.
- Pop-up keputusan end dan pengiraan kedudukan kumpulan automatik.
- Padanan kalah mati dan pengosongan keputusan susulan apabila keputusan awal berubah.
- Profil pasukan: logo, negeri, bendera dan tepat tiga pemain.
- Satu tab Pasukan: ketiga-tiga gambar pemain, nama, posisi Lead/Second/Skip, nombor dan kapten dipaparkan dalam kad pasukan. Maklumat pemain diedit dalam profil pasukan yang sama.
- Statistik Win/Lose/Draw pada peringkat pasukan sahaja, tanpa rekod atau tab pemain berasingan.
- Gambar pemain melalui muat naik PNG/JPG/WebP (maksimum 2 MB) atau pautan Google Drive, pratonton dan pop-up gambar penuh.
- Carian, penapis kumpulan/negeri, eksport CSV dan cetak.
- Tema jingga kemerahan/putih dan susun atur responsif.

## Data dan akses admin

Versi ini menggunakan data contoh. Perubahan admin disimpan dalam `localStorage` pelayar admin (`gelanggang-v2`), bukan dalam GitHub atau pangkalan data. Perubahan dan gambar tersebut belum disegerakkan kepada paparan awam atau peranti lain. Folder ini tidak mengandungi gambar atau data yang hanya disimpan dalam pelayar pengguna.

Paparan awam dan admin ialah dua aplikasi statik berasingan. `admin/` tidak menyediakan pengesahan pengguna sendiri. Jika disajikan pada hosting awam, laluan admin juga boleh diakses; gunakan kawalan akses hosting untuk menghadkan akses. Versi Sites admin di bawah dilindungi sebagai laman peribadi oleh platform Sites. Pengesahan dan pangkalan data bersama diperlukan sebelum menggunakan salinan statik ini sebagai sistem admin berbilang pengguna.

Untuk gambar Google Drive, tetapkan fail kepada **Sesiapa sahaja yang mempunyai pautan → Pelihat**, kemudian tampal pautan fail gambar ke profil pemain. Pautan folder tidak diterima.

## Versi Sites

- Awam: <https://gelanggang-lawn-bowls-awam.apengtakahashi.chatgpt.site>
- Admin peribadi: <https://gelanggang-lawn-bowls-6team.apengtakahashi.chatgpt.site>

Tiada konfigurasi hosting, identiti projek Sites, token, atau arkib deployment disalin ke folder ini.

## Aset

Bendera negeri/Wilayah dimuat turun daripada Wikimedia Commons (`Special:FilePath/Flag_of_….svg`). Logo pasukan dan inisial pemain ialah placeholder demo. Font DM Sans dan Manrope dimuatkan melalui Google Fonts; font sans-serif sistem digunakan jika tiada sambungan.
