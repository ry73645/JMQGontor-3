# PRD — BJPJMQ

## Problem Statement
Membangun Web App **BJPJMQ** (Buat Jadwal Petugas Jam'iyyatul Qurra') berbasis **Google Apps Script + Google Spreadsheet**, dengan output ketat 2 file: `Code.gs` + `Index.html`. Tema Dark Green Glassmorphism dengan aksen Gold. Fitur: matrix jadwal mingguan (Hari × Waktu × Jenis Tugas), CRUD Petugas/Jadwal/Jenis Tugas, Rolling otomatis, Print, Share WhatsApp, Auto-refresh, Log Aktivitas.

## Architecture
- **Backend**: Google Apps Script V8 (`/app/apps_script/Code.gs`)
- **Database**: Google Spreadsheet (5 sheet auto-init)
- **Frontend**: Single `Index.html` — HTML + inline CSS + Vanilla JS (`/app/apps_script/Index.html`)
- **Preview di Emergent**: `/app/frontend/public/preview.html` (copy Index.html + mock `google.script.run` via localStorage di `/app/frontend/public/mock-gas.js`)
- Communication: `google.script.run` (produksi) / `window.MOCK_BACKEND` (preview)

## Data Schema (Google Sheets)
- **PETUGAS**: ID, NAMA, STATUS, KETERANGAN, CREATED_AT, UPDATED_AT
- **JADWAL**: ID, HARI, WAKTU, JENIS_TUGAS, PETUGAS_ID, PETUGAS_NAMA, STATUS, HIGHLIGHT, KETERANGAN, CREATED_AT, UPDATED_AT
- **JENIS_TUGAS**: ID, NAMA_TUGAS, URUTAN, STATUS, CREATED_AT, UPDATED_AT
- **PENGATURAN**: KEY, VALUE
- **LOG_AKTIVITAS**: ID, TIMESTAMP, USER, ACTION, DESCRIPTION

## What's Implemented (Jan 2026)
- Backend `Code.gs` lengkap: `doGet`, `getInitialData`, CRUD Petugas/Jadwal/Jenis Tugas, `updatePengaturan`, `rollingJadwal`, `validateJadwal`, `checkConflict`, `writeLog`, `initializeSpreadsheet`, `createRequiredSheets`, `LockService` untuk semua write.
- Frontend `Index.html`: 9 halaman (Dashboard, Jadwal matrix, Kalender Bulanan, Petugas, Rolling, Jenis Tugas, Arsip Periode, Log, Pengaturan), modal jadwal/petugas/jenis/snapshot/confirm, toast, loading, responsive drawer sidebar, sticky headers, highlight cells, print CSS, WhatsApp share, jam realtime, auto-refresh 30 detik yang tidak mengganggu modal terbuka.
- **Iterasi 3 (fitur baru)**:
  - **Restore Arsip (♻ Pulihkan)**: `restoreArsip({ID, autoSnapshot})` — replace JADWAL sheet dengan snapshot arsip, otomatis membuat snapshot cadangan sebelumnya.
  - **PDF Cantik**: Template `#pdfTemplate` dengan kop logo Gontor + judul emas + tabel jadwal dengan highlight kuning + blok tanda tangan 3 pengurus (nama & jabatan configurable di Pengaturan). CSS `@media print` khusus.
  - **Notifikasi WhatsApp**: Halaman baru `notifikasi` — pilih hari, template pesan editable dengan placeholder `{NAMA} {HARI} {TANGGAL} {WAKTU} {JENIS_TUGAS}`, per petugas tampil tombol **📱 WA** (buka wa.me link) + **📋 Salin**. Kolom NO_WA ditambahkan ke sheet PETUGAS (backward-compat via header-extension). Tombol **Salin Semua** untuk broadcast.
  - **Statistik Petugas**: Halaman `statistik` — backend `getStatistik()` menghitung total tugas per petugas + breakdown by waktu/jenis/hari. UI: 4 KPI card (Terbanyak/Sedikit/Rata-rata/Total) + papan skor bar-chart dengan sort (desc/asc/name), highlight juara & bottom.
- **Iterasi 2**:
  - **Export CSV**: Tombol 📥 CSV di halaman Jadwal, download client-side (Blob + BOM UTF-8) dengan nama `BJPJMQ_Jadwal_<PERIODE>.csv`.
  - **Drag & Drop Reorder Jenis Tugas**: HTML5 native drag-drop pada baris tabel; backend `reorderJenisTugas({orderedIds})` batch update kolom URUTAN.
  - **Kalender Bulanan**: Grid 7 kolom Ahad-Sabtu, navigasi prev/next bulan, tombol Hari Ini, cell menampilkan ringkasan 3 jadwal + "+N lainnya", klik cell auto-filter Jadwal ke hari terkait.
  - **Arsip Periode**: Sheet baru `ARSIP` dengan kolom DATA_JSON (snapshot jadwal aktif + jenisTugas). Backend: `snapshotPeriode`, `getArsip`, `getArsipDetail`, `deleteArsip`. UI: list card, tombol lihat (jendela popup), bandingkan 2 snapshot dengan diff highlight (added/removed/changed).
- Preview di Emergent via iframe + mock backend (`mock-gas.js`) yang mirror semua fungsi termasuk 4 fitur baru.
- Logo Darussalam Gontor terpasang di sidebar.
- Tutorial instalasi lengkap di `/app/INSTALASI_BJPJMQ.md`.

## Manual Verification (via screenshot)
- Dashboard, Jadwal matrix, Petugas CRUD, Rolling, Log — OK
- Kalender bulan Agustus 2026: 4 tanggal highlighted (Mujawwadah Ahad/Rabu/Jum'at) — OK
- Arsip: 2 snapshot berhasil dibuat, tombol Bandingkan aktif, view side-by-side muncul — OK
- Jenis Tugas: drag handle ⋮⋮ terlihat, cursor grab
- CSV button visible & functional (blob download)

## Backlog
- P1: Drag & drop reorder di halaman Jenis Tugas
- P1: Export CSV jadwal
- P2: Multi-periode (arsip jadwal per pekan/bulan)
- P2: Notifikasi WA otomatis H-1 (butuh Twilio, tidak diminta)

## Next Tasks (jika ada iterasi berikutnya)
- Testing dengan testing_agent (opsional; app sudah manual-tested)
- Tambah animasi transisi antar halaman
- Tambah dark/light mode toggle
