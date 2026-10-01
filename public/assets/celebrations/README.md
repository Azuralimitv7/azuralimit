# Almanak Nusantara — aset SVG orisinal Azuralimit

Seluruh gambar dalam direktori ini dirancang melalui bentuk/path SVG di `scripts/generate-celebration-assets.mjs`, bukan hasil unduhan atau salinan ikon dari penyedia pihak ketiga. Berlaku lisensi MIT proyek (2026).

Setiap direktori perayaan memuat:

- `poster.svg` — ilustrasi editorial 760 × 420, lengkap dengan tekstur titik cetak;
- `motif.svg` — ornamen transparan 240 × 300 untuk gerakan ringan;
- `pattern.svg` — pola latar berulang 120 × 120.

Tidak ada JavaScript, SMIL, font eksternal, gambar raster, emoji, atau referensi aset jarak jauh dalam SVG. File aman dilihat tanpa animasi. Pergerakan dikontrol CSS halaman supaya tombol animasi dan `prefers-reduced-motion` dapat menghentikannya.

## Membuat ulang

Dari root proyek: `node scripts/generate-celebration-assets.mjs`.

Generator membaca `src/lib/celebrations.json`, menulis 90 file SVG, manifest ini, dan `src/app/celebrations.css`. Semua hasil harus ikut dikomit ke Git; deployment tidak memerlukan generator maupun akses layanan gambar.

## Cakupan

30 tema: seluruh 16 perayaan libur nasional menurut pengumuman kalender 2026 (17 hari karena Idulfitri dua hari), 13 hari peringatan, dan suasana Ramadan. Referensi kalender tersimpan di `src/lib/celebrations.ts`. Cuti bersama memakai ilustrasi perayaan yang sama, tidak dibuat sebagai perayaan berbeda. Tidak mencakup seluruh hari peringatan lokal/daerah. Tanggal tahun bergerak tidak diasumsikan berlaku pada tahun lain.

Ilustrasi bersifat interpretasi editorial, bukan lambang pemerintah, logo organisasi, atau representasi figur suci. Semua aset disajikan dari origin aplikasi. Ini tidak berarti seluruh aplikasi dijamin dapat dimuat ulang tanpa koneksi; proyek tidak memasang service worker untuk offline navigation.
