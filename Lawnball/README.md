# Lawnball — 64 pasukan

Web app statik kejohanan lawn bowls triples dengan 64 pasukan dan 192 pemain demo.

## Format

- 8 kumpulan A–H, masing-masing 8 pasukan.
- Round robin penuh dalam kumpulan: setiap pasukan bertemu 7 lawan sekali, 28 perlawanan setiap kumpulan, 224 keseluruhan.
- Top 4 setiap kumpulan layak ke Top 32: 16 perlawanan Top 32, 8 Top 16, 4 suku akhir, 2 separuh akhir, 1 akhir dan 1 tempat ke-3/4.
- Jumlah 256 perlawanan, 8 rink, 13 Ends dan slot anggaran 90 minit.
- Kumpulan membenarkan seri. Kalah mati seri selepas Ends 13 meneruskan Extra Ends 14; extra ends diteruskan sehingga ada pemenang.
- Susunan kumpulan: mata (menang 2/seri 1/kalah 0), beza shot, jumlah shot diperoleh, kemudian kod pasukan jika masih sama.
- Kelayakan dan keputusan pusingan susulan dikemas kini secara automatik apabila pasukan yang mara berubah.

## Jadual: 28 Januari–1 Februari 2027

- 28–30 Januari (Khamis–Sabtu): round robin penuh. Sesi bermula 09:00; 28 Januari tamat 00:30 pada 29 Januari, sesi 29 dan 30 Januari tamat 23:00. Lapan rink digunakan; slot diagihkan 10/9/9 sesi harian, setiap sesi 90 minit dengan rehat 30 minit selepas tiga sesi pertama.
- 31 Januari (Ahad): Top 32 pada 09:00 dan 10:30, tamat anggaran 12:00.
- 1 Februari (Isnin): Top 16 pada 09:00, suku akhir 10:30, separuh akhir 12:00, akhir dan tempat ke-3/4 pada 14:00; tamat anggaran 15:30.

Semua tarikh ialah tarikh kalendar sebenar, menggunakan hari Malaysia. Jadual lama dalam pelayar admin dipindahkan kepada tarikh dan masa baharu mengikut ID perlawanan, sambil mengekalkan nama, profil, gambar dan skor yang tersimpan. `calendarRevision: 2` mengelakkan pemindahan ini berulang. Slot adalah anggaran; masa tambahan sebenar atau extra ends boleh menjejaskan slot seterusnya.

## Jalankan dan semak

Tiada pemasangan pakej atau build diperlukan. Dari root repositori:

```sh
python3 -m http.server 8080
node Lawnball/tests/validate.cjs
```

- Awam: <http://localhost:8080/Lawnball/>
- Pasukan: <http://localhost:8080/Lawnball/#pasukan>
- Admin: <http://localhost:8080/Lawnball/admin/#pasukan>

Semakan mengesahkan bilangan pasukan/perlawanan, round robin tanpa pasangan berulang, Top 32, kemaraan pemenang, extra ends, paparan utama dan pertindihan jadual.

## Paparan

Ringkasan, jadual dengan penapis semua kumpulan dan halaman, kedudukan Top 4, progresif kumpulan, serta kalah mati dengan All/Bracket dan navigasi Top 32 hingga akhir. Butang Remarks membuka keputusan besar, logo, bendera, maklumat perlawanan dan semua Ends. Hijau = menang/mendahului, kuning = seri, merah = kalah/ketinggalan.

Tab Pasukan memaparkan tiga pemain bersama gambar, nama, posisi, nombor dan kapten dalam kad pasukan. Rekod Win/Lose/Draw berada pada peringkat pasukan sahaja. Admin boleh mengedit profil, logo, negeri, bendera dan gambar pemain melalui muat naik PNG/JPG/WebP (maksimum 2 MB) atau pautan fail Google Drive. Akses gambar Drive perlu ditetapkan kepada sesiapa sahaja yang mempunyai pautan.

## Data dan akses

Data ini ialah demo. Admin menyimpan perubahan dalam localStorage pelayar (`gelanggang-64-v1`); belum ada pangkalan data atau penyegerakan ke awam/peranti lain. Data versi enam pasukan (`gelanggang-v2`) tidak dipadam. Profil enam pasukan asal, termasuk gambar tersimpan, disalin ke enam slot pertama apabila dataset baharu dimulakan.

`admin/` ialah versi statik berasingan tanpa pengesahan pengguna sendiri. Laluan ini memerlukan kawalan akses hosting jika diterbitkan. Versi Sites admin di bawah dilindungi secara peribadi oleh platform Sites. Fail tempatan tidak mengandungi token, konfigurasi projek Sites, arkib deployment atau data yang hanya disimpan dalam pelayar pengguna.

- Awam: <https://gelanggang-lawn-bowls-awam.apengtakahashi.chatgpt.site>
- Admin peribadi: <https://gelanggang-lawn-bowls-6team.apengtakahashi.chatgpt.site>

Bendera negeri/Wilayah ialah aset Wikimedia Commons. Logo dan inisial ialah placeholder demo; font DM Sans/Manrope menggunakan Google Fonts dengan fallback sistem.
