# Azuralimit — Meja Potong Grid & Studio Sprite

Aplikasi web interaktif untuk memotong lembaran gambar grid dari **1×1 hingga 100×100**, memperbesar atau memperkecil resolusi tiap keping hasil potongan (**0.25× hingga 10×**, misalnya dari `500×500px` menjadi `5000×5000px`), memproses banyak gambar sekaligus (dengan ukuran grid seragam maupun berbeda-beda), serta mengunduh bundel arsip `.zip` sesuai nama berkas.

Seluruh pemrosesan gambar berjalan **100% di dalam browser** menggunakan HTML5 Canvas 2D dan Web Audio API — tidak ada gambar yang dikirim ke server eksternal.

---

## Fitur Utama

- **Pemotong Grid 1×1 s/d 100×100**: Pengaturan kolom & baris presisi dengan tombol stepper, input angka, preset cepat (`1×1` hingga `100×100`), garis bantu langsung di atas kanvas, koordinat keping saat kursor diarahkan, dan penomoran sel.
- **Unggah Fleksibel & Lembar Uji Sekali Klik**: Tarik & lepas (*drag & drop*) banyak berkas sekaligus, pilih dari perangkat, tempel langsung dari papan klip (`Ctrl+V`), atau muat **Lembar Uji 4×4** untuk mencoba fitur pemotongan secara instan.
- **Ubah Nama Berkas**: Penamaan langsung pada tiap kartu yang otomatis diterapkan ke nama setiap keping (`{nama}_rowNN_colNN.ext`) dan nama arsip unduhan (`{nama}.zip`).
- **Skala Resolusi Individu (0.25× – 10×)**: Tingkatkan atau kurangi ukuran piksel setiap hasil potongan (contoh: keping `500×500px` diperbesar menjadi `5000×5000px`).
- **Kupas Tepi (Trim 0% – 10%)**: Buang margin luar lembaran gambar sebelum dibagi menjadi grid.
- **Pemrosesan Serentak (Batch)**:
  - **Format Grid Sama Sekaligus**: Gunakan tombol *Samakan Grid ke Semua* lalu klik *Potong Semua*.
  - **Format Grid Berbeda Sekaligus**: Atur kolom, baris, skala, dan format (`PNG`/`JPG`) secara terpisah di tiap lembar, lalu jalankan *Potong Semua* dalam satu klik.
- **Almanak Nusantara — 40 Tema**:
  - 10 tema studio klasik + **30 tema hari besar Indonesia**. Galeri menyediakan pencarian, filter kategori/bulan, filter libur nasional, favorit, serta pratinjau.
  - Seluruh 16 momen libur nasional (17 hari pada kalender 2026), 13 hari peringatan, dan suasana Ramadan. Hari peringatan tidak disamakan dengan libur nasional.
  - **90 SVG orisinal lokal**: setiap perayaan memiliki poster, ornamen, dan pola latarnya sendiri. Aset ikut di dalam repositori, tidak mengambil gambar dari CDN atau API eksternal.
  - 8 aksen kustom, 6 tekstur termasuk Motif SVG, dan pilihan menyembunyikan dekorasi. Tema dipilih manual dan tersimpan di browser; tidak berubah otomatis berdasarkan tanggal.
  - **Animasi latar per perayaan**: kembang api meledak (Tahun Baru, Imlek, Kemerdekaan, Natal), lampion terbang (Imlek, Ramadan, Waisak), salju (Natal), konfeti merah-putih (Kemerdekaan), ketupat jatuh (Idulfitri), bara api (Pahlawan, Buruh), kelopak bunga (Kartini, Ibu, Paskah), balon (Anak, Pendidikan), dan 20+ koreografi lainnya — semua digambar lokal di canvas, tanpa video/GIF dari luar.
  - Intensitas efek **Meriah / Lembut / Mati** di banner dan Preferensi. Animasi, suara Web Audio, dan konfeti dapat dimatikan. Preferensi sistem `prefers-reduced-motion` menonaktifkan gerakan. Pergantian tema tidak mereset pekerjaan pemotongan.
- **Halaman Donasi & Dukungan Kreator**:
  - **DANA**: `https://link.dana.id/minta?full_url=https://qr.dana.id/v1/281012012025053106592119` (lengkap dengan kode QR SVG yang dapat dipindai dan tombol buka langsung).
  - **USDT jaringan BCS(bep20)**: `0x8B10E4D8aa6eB65071992BebBEa863b93F2a3B82`
  - **USDT jaringan Polygon**: `0x8B10E4D8aa6eB65071992BebBEa863b93F2a3B82`
  - **ETH jaringan base**: `0x8B10E4D8aa6eB65071992BebBEa863b93F2a3B82`
  - **ETH jaringan arb_one**: `0x8B10E4D8aa6eB65071992BebBEa863b93F2a3B82`
  - **BNB jaringan BSC(bep20)**: `0x8B10E4D8aa6eB65071992BebBEa863b93F2a3B82`
  - **MATIC jaringan polygon**: `0x8B10E4D8aa6eB65071992BebBEa863b93F2a3B82`
  - **PEPE jaringan Ethereum (erc20)**: `0x8B10E4D8aa6eB65071992BebBEa863b93F2a3B82`

---

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di browser.

## Build Produksi & Deploy ke Vercel

```bash
npm run build
npm start
```

Proyek ini siap diunggah ke GitHub dan di-deploy langsung ke **Vercel** menggunakan preset bawaan Next.js tanpa memerlukan konfigurasi variabel lingkungan tambahan.

## Koleksi hari besar & aset offline

Buka **Tema → Hari besar** atau **Buka almanak tema** di atas meja kerja. Pilihan tema disimpan di browser dan diterapkan sebelum render awal agar tidak berkedip ke tema lain. Favorit juga disimpan lokal. Tab **Preferensi** memuat kontrol ilustrasi, gerakan, konfeti, suara, aksen, dan tekstur.

Koleksi meliputi Tahun Baru, Isra Mikraj, Imlek, Nyepi, Idulfitri, Jumat Agung, Paskah, Hari Buruh, Kenaikan Yesus Kristus, Iduladha, Waisak, Hari Lahir Pancasila, Tahun Baru Islam, Kemerdekaan, Maulid Nabi, Natal; ditambah Ramadan, Kartini, Pendidikan, Kebangkitan Nasional, Lingkungan Hidup, Anak, Pramuka, Olahraga, Kesaktian Pancasila, Batik, Sumpah Pemuda, Pahlawan, Guru, dan Ibu.

- Sumber data: `src/lib/celebrations.json` (30 perayaan), `src/lib/theme.ts` (40 tema & validasi pengaturan), `src/lib/celebrationFx.ts` (koreografi animasi tiap perayaan), `src/components/CelebrationAmbient.tsx` (mesin partikel canvas).
- Aset: `public/assets/celebrations/<id>/{poster,motif,pattern}.svg`, sekitar 162 KB untuk 90 SVG.
- Generator: `node scripts/generate-celebration-assets.mjs`. Hasil SVG dan CSS **sudah dikomit**, sehingga tidak perlu dijalankan saat deploy.
- Gaya: `src/app/celebrations.css` (palet hasil generator) dan `src/app/festivals.css` (galeri, banner, gerakan).
- Endpoint read-only: `GET /api/themes` menyajikan katalog dan jalur aset lokal. Penggantian tema tidak memerlukan endpoint ini atau layanan luar.
- Referensi tanggal: [Kemenko PMK, kalender nasional 2026](https://www.kemenkopmk.go.id/pemerintah-tetapkan-17-hari-libur-nasional-dan-8-hari-cuti-bersama-tahun-2026). Tanggal agama yang berubah tiap tahun hanya berlaku untuk 2026; tidak ditebak untuk tahun berikutnya. Hari peringatan diberi label tersendiri dan tidak diklaim sebagai libur nasional. Cuti bersama mengikuti tema hari rayanya.

**Offline di sini berarti seluruh aset tema disertakan dan disajikan oleh aplikasi sendiri**, bukan CDN/API gambar. Tidak ada service worker untuk menjamin reload seluruh aplikasi tanpa jaringan. Font Next.js tetap disajikan lokal setelah build; font diunduh pada tahap build, bukan saat pengunjung memilih tema.

## Pengujian

Tes unit memakai Node.js dan dependensi TypeScript proyek:

```bash
npx tsc src/lib/theme.ts src/lib/celebrations.ts src/lib/celebrationFx.ts --outDir /tmp/azuralimit-theme-tests --module commonjs --target es2020 --lib dom,es2020 --skipLibCheck --esModuleInterop --resolveJsonModule --moduleResolution node
node --test tests/themes.test.cjs
```

Tes browser terhadap preview atau server lokal yang **sudah berjalan**:

```bash
npx playwright install chromium --with-deps
npx playwright test
# Gunakan PLAYWRIGHT_BASE_URL bila alamat preview bukan http://127.0.0.1:3000
```

Tes mencakup 30 tema, keberadaan aset, kontras palet, migrasi pengaturan, pencarian, filter, favorit, reload, aksesibilitas gerakan, layar ponsel, penyimpanan gambar saat berganti tema, endpoint katalog, pemakaian dengan domain luar diblokir, serta lapisan animasi ambient (muncul per perayaan, mengikuti intensitas Meriah/Lembut/Mati, mati saat dekorasi/gerakan dimatikan atau OS meminta reduced-motion). Tangkapan layar/trace tes disimpan di `/tmp/azuralimit-browser-tests`.

## Lisensi

MIT License © 2026 Azuralimit — lihat berkas [LICENSE](./LICENSE).
