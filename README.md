# Agracantika — Struktur Proyek

Capstone SDG Academy Indonesia 2026. Nilai tambah gambir lewat produk kriya dan sabun.

## Perubahan arsitektur (penting)
Versi ini **menggantikan** rencana Google Apps Script + Spreadsheet sebagai database.
Front-end yang dibuat di Gemini sudah dikabel ke Firebase (Auth + Firestore), dan itu
pilihan yang lebih baik untuk kasus ini — jadi kita lanjutkan dengan Firebase, bukan
dipaksa balik ke GAS+Sheets. GAS hanya dipertahankan untuk satu tugas sempit: proxy
API ongkir (lihat alasan di `backend/shipping-ongkir-proxy.gs`). Blogger tidak
dipakai lagi — artikel edukasi dikelola langsung lewat dashboard Admin Project
(koleksi `posts` di Firestore), supaya tidak ada dua sistem konten yang harus
disinkronkan.

## Struktur
```
agracantika-web/
├── index.html                        # SATU file: landing, edukasi, marketplace,
│                                      #   cart, checkout, dan 3 dashboard (SPA client-side routing)
├── firestore.rules                   # Aturan akses Firestore (siapa boleh baca/tulis apa)
└── backend/
    └── shipping-ongkir-proxy.gs      # GAS Web App kecil, proxy API ongkir Komerce/RajaOngkir
```

`marketplace.html` dan pendekatan GAS+Sheets dari draf sebelumnya sudah dihapus — semuanya sekarang ada di `index.html` sebagai satu single-page app.

## Yang sudah diperbaiki/disambungkan dari file Gemini
- **Konfigurasi Firebase**: sebelumnya bergantung pada variabel global yang hanya ada di Canvas Google AI Studio (`__firebase_config`, dst) — di luar itu, semua data cuma jalan di memori browser (hilang saat refresh, tidak ada login sungguhan, tidak ada yang tersimpan). Sekarang ada slot config eksplisit di dekat awal `<script type="module">` yang tinggal diisi dari Firebase Console (lihat langkah di bawah). Sebelum diisi, situs otomatis jalan dalam **mode demo** (data contoh, tidak tersimpan) — cukup aman untuk dites tampilannya sekarang juga.
- **Bug path Firestore untuk data user**: path sebelumnya (`public/users/{uid}`, 5 segmen) tidak valid untuk `doc()` di Firestore — akan error begitu Firebase asli dipasang. Sudah diperbaiki jadi `public/data/users/{uid}` (konsisten dengan pola produk/artikel/order).
- **Order tidak sinkron**: sebelumnya order ditulis dua kali (koleksi privat pembeli + koleksi publik admin), tapi saat admin ubah status, salinan pembeli tidak ikut ter-update — dashboard pembeli akan menampilkan status basi selamanya. Sekarang cuma satu koleksi (`public/data/orders`), difilter per pembeli lewat query `where('userId', '==', ...)`.
- **Tombol yang sebelumnya hanya tampilan** (tidak ngapa-ngapain saat diklik): Tambah/Edit/Hapus Produk di dashboard Admin Marketplace, dan Tulis/Edit/Hapus Artikel di dashboard Admin Project — semuanya sekarang membuka modal form sungguhan dan menulis ke Firestore (dengan fallback ke data lokal saat masih mode demo).
- **`firestore.rules`**: sebelumnya tidak ada aturan sama sekali (di luar Canvas, tulisan ke Firestore akan selalu gagal atau, lebih buruk, terbuka untuk siapa saja). Sekarang: produk & artikel hanya bisa ditulis oleh role admin yang sesuai, order hanya bisa dibaca pemiliknya atau admin_marketplace, dan tidak ada pengguna yang bisa menaikkan role-nya sendiri.

## Masih placeholder / belum selesai
- **Ongkir**: form checkout masih pakai ongkos kirim tetap (Rp 25.000). Integrasi nyata ke `shipping-ongkir-proxy.gs` butuh field tujuan terstruktur (kota/kecamatan, bukan textarea alamat bebas) yang belum ditambahkan — ini pekerjaan berikutnya.
- **QRIS**: gambar QR di modal pembayaran masih placeholder, bukan QRIS asli. Ganti dengan foto QRIS statis rekening/merchant Agracantika (unggah ke Firebase Storage, tempel URL-nya — lokasinya ditandai jelas di kode dengan komentar `GANTI`).
- **Foto/video di dashboard Admin Project & Marketplace**: form yang sudah tersambung masih menerima **URL** foto/video (bukan unggah file langsung). Untuk unggah file asli, aktifkan Firebase Storage dan tambahkan input `<input type="file">` + `uploadBytes()` — belum dikerjakan di putaran ini.

## Cara setup Firebase (ringkas)
1. Buka https://console.firebase.google.com → buat project baru (paket Spark/gratis cukup).
2. Project settings → General → Your apps → tambah **Web app** → salin objek `firebaseConfig` yang muncul, tempel menggantikan placeholder `"GANTI..."` di `index.html`.
3. Authentication → Sign-in method → aktifkan **Email/Password**.
4. Firestore Database → Create database (mode production).
5. Firestore → Rules → tempel isi `firestore.rules` → Publish.
6. (Opsional, untuk unggah foto/video asli) Storage → Get started.
7. Buat akun admin secara manual: Authentication → Add user (isi email/password), lalu Firestore → koleksi `artifacts/{appId}/public/data/users` → tambah dokumen dengan ID = UID user tadi, isi field `role: "admin_project"` atau `role: "admin_marketplace"`.

## Cara deploy ke GitHub Pages
Push folder ini ke repo GitHub → Settings → Pages → set source ke branch/folder ini. `index.html` langsung jalan sebagai SPA di `namakamu.github.io/repo`.

## Cara deploy proxy ongkir
1. https://script.google.com/home → New project → tempel isi `backend/shipping-ongkir-proxy.gs`.
2. Project Settings → Script Properties → tambah `KOMERCE_KEY` = API key RajaOngkir/Komerce kamu.
3. Deploy → New deployment → Web app (Execute as: Me, Access: Anyone) → salin URL `.../exec`.
4. Panggil dari `index.html` lewat `fetch()` setelah field tujuan pengiriman ditambahkan ke form checkout.
