# Agracantika — Struktur Proyek

Capstone SDG Academy Indonesia 2026. Nilai tambah gambir dari Desa Toman, Kabupaten
Musi Banyuasin, Sumatera Selatan, lewat produk kriya dan sabun.

## Perubahan arsitektur (revisi terbaru — PENTING)
Situs ini sekarang **portal informasi & katalog, bukan platform transaksi**.
Tidak ada lagi keranjang belanja, checkout, QRIS, atau akun pembeli. Setiap
produk di halaman Katalog menautkan langsung ke mitra penjualan:
- 2 produk sabun Ruri Arimbi → Shopee PT Raksasi Ruri Arimbi (`https://id.shp.ee/RKmnheoP`)
- Produk kriya lainnya → `https://www.kriyakiteindonesia.com/`

Akibatnya, **koleksi `orders` di Firestore dan proxy ongkir (`backend/shipping-ongkir-proxy.gs`)
tidak lagi dipakai** — tidak perlu dideploy atau dikonfigurasi. File `.gs` tetap
disimpan sebagai arsip, aman dihapus kapan saja.

## Bug yang diperbaiki di revisi ini
Ditemukan saat revisi: kode sebelumnya login admin marketplace dengan nilai role
`'admin_market'`, tetapi `firestore.rules` yang sudah ter-publish memeriksa
`'admin_marketplace'` — akibatnya dashboard Admin Marketplace versi lama **tidak
akan pernah berhasil menyimpan produk** (ditolak Security Rules, silent-fail
tanpa pesan error yang jelas). Sekarang kode dan rules konsisten memakai
`'admin_marketplace'`. **Jika Anda sudah pernah membuat akun admin marketplace
di Firebase Console dengan role `admin_market`, ubah field `role` dokumen
user tersebut di Firestore menjadi `admin_marketplace`** (Firestore Database >
koleksi `artifacts/{appId}/public/data/users` > dokumen dengan UID akun
tersebut > edit field `role`).

## Struktur
```
agracantika-web/
├── index.html                        # SATU file: landing, edukasi/berita, katalog produk,
│                                      #   dan 2 dashboard admin (SPA client-side routing)
├── firestore.rules                   # Aturan akses Firestore
├── images/                           # Foto produk, berita, dan galeri dokumentasi
└── backend/
    └── shipping-ongkir-proxy.gs      # TIDAK DIPAKAI LAGI — arsip, aman dihapus
```

## Keandalan saat presentasi (penting)
`index.html` menyimpan **data asli (produk, berita) langsung di dalam kode**
sebagai default/fallback (lihat `getDefaultProducts()` dan `getDefaultPosts()`
di dalam `<script type="module">`). Alurnya:
1. Saat dibuka, situs langsung menampilkan data default ini.
2. Jika Firebase berhasil tersambung, situs mencoba memuat data dari Firestore
   (supaya admin bisa mengedit lewat dashboard); jika koleksi masih kosong,
   data default tetap dipakai.
3. Jika Firebase/Firestore gagal tersambung (mis. wifi venue bermasalah), situs
   otomatis kembali memakai data default lokal — **konten asli tetap tampil
   apa pun yang terjadi dengan koneksi**.

Dashboard admin punya tombol "Semai Data Default" untuk menyalin ulang data
default ke Firestore kapan saja (tidak otomatis, supaya tidak menimpa
perubahan yang sudah disimpan admin).

## Yang BELUM bisa diotomatisasi dari sistem ini
- **Foto produk dari folder Drive "Produk untuk Website"** dan **foto petani
  tambahan dari folder "Dokumentasi babat toman"** tidak bisa diambil otomatis
  (folder Drive tersebut tidak bisa diakses lewat koneksi yang tersedia saat
  revisi ini dibuat — folder terlihat ada, tapi isinya tidak bisa dibaca).
  Katalog & galeri saat ini memakai foto yang sudah pernah dilampirkan langsung
  ke percakapan. Untuk menambah foto lain: simpan file ke folder `images/`,
  lalu tambahkan sebagai produk/berita baru lewat dashboard Admin, atau edit
  array `getDefaultProducts()` / `galleryPhotos` di `index.html`.
- Lokasi kecamatan: nama folder Drive kedua ("Dokumentasi babat toman")
  mengindikasikan kecamatan **Babat Toman** — ini dugaan dari nama folder,
  bukan dari instruksi eksplisit, jadi belum dituliskan di situs. Konfirmasi
  dulu sebelum menambahkannya.

## Cara setup Firebase (ringkas)
1. https://console.firebase.google.com → project (sudah ada: `agracantika-5ce27`).
2. Authentication → Sign-in method → Email/Password harus aktif.
3. Firestore Database → Rules → tempel isi `firestore.rules` terbaru → Publish.
4. Buat akun admin manual: Authentication → Add user (isi email/password),
   lalu Firestore → koleksi `artifacts/{appId}/public/data/users` → tambah
   dokumen dengan ID = UID user tadi, isi field `role: "admin_project"` atau
   `role: "admin_marketplace"` (perhatikan ejaan — lihat catatan bug di atas).

## Cara deploy ke GitHub Pages
Upload **seluruh folder ini** (termasuk folder `images/`, bukan cuma
`index.html`) ke repo GitHub yang sudah terhubung ke domain `agracantika.store`.
Commit ke branch yang sudah dipakai GitHub Pages — situs otomatis ter-update.
