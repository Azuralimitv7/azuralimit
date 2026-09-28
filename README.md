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
- **Rak 10 Tema & Suara Mekanis**:
  - 10 pilihan tema dari palet warna resmi (`#002147`, `#D2B48C`, `#F9F6EE`, `#781C2E`, `#00594E`, `#FFF6E4`, `#124D95`, `#E9F5FF`, `#352323`, `#C47623`), 8 aksen kustom, dan 5 tekstur meja kerja.
  - Efek suara mekanis berbasis Web Audio API (tanpa file audio eksternal) dan selebrasi partikel konfeti.
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

## Lisensi

MIT License © 2026 Azuralimit — lihat berkas [LICENSE](./LICENSE).
