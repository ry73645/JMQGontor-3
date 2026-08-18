# 📖 BJPJMQ — Panduan Instalasi & Deploy

**BJPJMQ** — *Buat Jadwal Petugas Jam'iyyatul Qurra'*
Aplikasi Web berbasis Google Apps Script + Google Spreadsheet.

## 📦 File Deliverable

Anda hanya butuh **2 file**, tersedia di folder `/app/apps_script/`:

1. **`Code.gs`** — Backend (Google Apps Script)
2. **`Index.html`** — Frontend (HTML + CSS + Vanilla JS)

---

## 🚀 Cara Instalasi (Step-by-Step)

### STEP 1 — Buat Google Spreadsheet
1. Buka https://sheets.google.com
2. Klik **+ Blank** untuk membuat spreadsheet baru
3. Beri nama, misalnya: **BJPJMQ Database**

### STEP 2 — Salin Spreadsheet ID
Perhatikan URL spreadsheet:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```
Salin bagian **`[SPREADSHEET_ID]`** — Anda akan memerlukannya.

### STEP 3 — Buka Apps Script
Di spreadsheet, klik menu **Extensions → Apps Script**. Editor Apps Script akan terbuka di tab baru.

### STEP 4 — Tempel Code.gs
1. Di panel kiri Apps Script, hapus isi file `Code.gs` bawaan.
2. Buka file `/app/apps_script/Code.gs` di sini, salin **SELURUH isinya**.
3. Tempel ke editor Apps Script pada file `Code.gs`.
4. **Ganti baris `SPREADSHEET_ID: 'MASUKKAN_SPREADSHEET_ID_DI_SINI'`** dengan Spreadsheet ID Anda dari STEP 2.

### STEP 5 — Buat File Index.html
1. Di panel kiri Apps Script, klik ikon **➕** di samping tulisan "Files"
2. Pilih **HTML**
3. Beri nama file: `Index` (tanpa `.html`, Apps Script menambahkannya otomatis)
4. Hapus isi bawaan.
5. Buka file `/app/apps_script/Index.html` di sini, salin **SELURUH isinya**.
6. Tempel ke file `Index.html` di Apps Script.

### STEP 6 — Simpan
Tekan **Ctrl+S** (atau **Cmd+S** di Mac) untuk menyimpan seluruh proyek. Beri nama proyek: **BJPJMQ**.

### STEP 7 — Inisialisasi Spreadsheet
1. Di dropdown atas editor Apps Script, pilih fungsi **`initializeSpreadsheet`**
2. Klik tombol **▶ Run**
3. Google akan meminta izin (Authorization) — klik **Review Permissions** → pilih akun Anda → **Advanced** → **Go to BJPJMQ (unsafe)** → **Allow**
4. Fungsi akan berjalan dan **otomatis membuat 5 sheet** (PETUGAS, JADWAL, JENIS_TUGAS, PENGATURAN, LOG_AKTIVITAS) beserta data default jenis tugas.
5. Buka Spreadsheet Anda untuk memverifikasi.

### STEP 8 — Deploy sebagai Web App
1. Klik **Deploy → New deployment** (kanan atas)
2. Ikon roda gigi ⚙ → pilih **Web app**
3. Isi:
   - **Description**: `BJPJMQ v1`
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: pilih sesuai kebutuhan:
     - `Only myself` — hanya Anda
     - `Anyone with Google account` — semua pengguna Google
     - `Anyone` — publik (tanpa login)
4. Klik **Deploy**
5. Salin **URL Web app** yang muncul → **inilah URL aplikasi BJPJMQ Anda**.

### STEP 9 — Buka & Gunakan
Buka URL Web App di browser. Aplikasi akan otomatis:
- Menampilkan Dashboard
- Memuat data dari Spreadsheet
- Auto-refresh setiap 30 detik

---

## 🎯 Cara Menggunakan BJPJMQ

### Menambah Petugas
1. Klik menu **👤 Petugas** di sidebar
2. Klik **+ Tambah Petugas**
3. Isi nama, status, **No. WhatsApp** (format 628…), keterangan → **Simpan**

### Notifikasi WhatsApp Petugas (📱)
1. Menu **📱 Notifikasi WA**
2. Pilih hari (default: besok)
3. Edit template pesan bila perlu (gunakan `{NAMA}`, `{HARI}`, `{TANGGAL}`, `{WAKTU}`, `{JENIS_TUGAS}`)
4. Klik **📱 WA** per petugas untuk buka WhatsApp dengan pesan siap-kirim, atau **📋 Salin** untuk copy manual.
5. Tanpa API berbayar — memakai `wa.me` deep link.

### Statistik Petugas (📈)
Menu **📈 Statistik**: papan skor bar-chart, siapa terbanyak/paling sedikit bertugas, rata-rata, filter urutan.

### Arsip Periode & Restore
- **📸 Simpan Snapshot** — bekukan jadwal saat ini
- **♻ Pulihkan** — kembalikan jadwal aktif ke snapshot tersebut (otomatis membuat cadangan snapshot dulu)
- **⚖ Bandingkan 2 Snapshot** — lihat perubahan side-by-side (hijau=tambah, merah=hapus, kuning=ubah)

### Cetak PDF Cantik
Menu **📅 Jadwal** → tombol **📄 Cetak PDF** menghasilkan lembar cetak dengan kop logo Gontor + tabel jadwal + blok tanda tangan 3 pengurus (bisa diisi di **⚙️ Pengaturan**).

### Menambah Jadwal
1. Klik menu **📅 Jadwal**
2. Klik cell **—** (kosong) di posisi Hari × Waktu × Jenis Tugas
3. Pilih petugas, aktifkan **Highlight** bila perlu → **Simpan**

### Edit / Hapus Jadwal
Klik cell yang sudah berisi nama petugas → modal edit terbuka.

### Rolling (Rotasi Petugas)
1. Klik menu **🔄 Rolling**
2. Pilih Hari, Waktu, Jenis Tugas
3. Klik **🔄 Rolling** — petugas berpindah ke urutan berikutnya.

### Kalender Bulanan (🗓)
Grid Ahad–Sabtu satu bulan penuh, klik tanggal untuk auto-filter Jadwal ke hari itu.

### Drag Reorder Jenis Tugas
Menu **📋 Jenis Tugas** → tarik ikon `⋮⋮` di kolom Urutan untuk mengubah posisi.

### Export CSV
Menu **📅 Jadwal** → tombol **📥 CSV**, file `BJPJMQ_Jadwal_<PERIODE>.csv` langsung ter-download.

### Cetak Jadwal Standar
Menu **📅 Jadwal** → **🖨 Cetak Biasa** untuk print sederhana tanpa kop.

### Share via WhatsApp
Menu **📅 Jadwal** → **📱 Share WA** generate teks jadwal & buka WhatsApp share.

---

## ✅ Checklist Pengujian

- [ ] Web App bisa dibuka
- [ ] 5 Sheet otomatis dibuat: PETUGAS, JADWAL, JENIS_TUGAS, PENGATURAN, LOG_AKTIVITAS
- [ ] Default jenis tugas (Mujawwadah, Murottalah, Adzan, Syi'ir) muncul
- [ ] Tambah/Edit/Hapus Petugas
- [ ] Tambah/Edit/Hapus Jadwal
- [ ] Conflict detection muncul saat petugas sama di waktu sama
- [ ] Highlight jadwal (background gold) tampil
- [ ] Rolling memindah ke petugas berikutnya
- [ ] Search realtime menyorot cell
- [ ] Filter Hari/Waktu/Jenis bekerja
- [ ] Auto refresh setiap 30 detik
- [ ] Print rapi tanpa sidebar
- [ ] WhatsApp share membuka wa.me
- [ ] Responsive di mobile (sidebar drawer)
- [ ] Log aktivitas tercatat setiap perubahan
- [ ] Data benar-benar tersimpan di Spreadsheet

---

## 🔧 Debugging Umum

**Error: "Spreadsheet ID belum diisi"**
→ Buka Code.gs, isi `CONFIG.SPREADSHEET_ID` dengan ID spreadsheet Anda.

**Error: "You do not have permission"**
→ Jalankan ulang `initializeSpreadsheet()` dan authorize.

**Web App menampilkan halaman kosong**
→ Pastikan file HTML bernama persis **`Index`** (case-sensitive), sesuai `HtmlService.createTemplateFromFile('Index')`.

**Perubahan tidak muncul di Web App**
→ Setelah edit Code.gs/Index.html, harus **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy** untuk menerbitkan versi baru.

---

## 🧪 Preview di Emergent (Tanpa Deploy GAS)

Aplikasi ini punya mode preview di lingkungan Emergent (browser biasa) tanpa perlu Google Apps Script. Data disimpan di **localStorage**. Cukup buka URL preview yang telah disediakan — banner kuning **🧪 MODE PREVIEW** akan muncul. Klik banner untuk reset data.

Untuk deployment sungguhan, tetap gunakan Google Apps Script sesuai langkah di atas.
