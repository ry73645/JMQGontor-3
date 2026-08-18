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
- Frontend `Index.html`: 7 halaman (Dashboard, Jadwal matrix, Petugas, Rolling, Jenis Tugas, Log, Pengaturan), modal jadwal/petugas/jenis/confirm, toast, loading, responsive drawer sidebar, sticky headers, highlight cells, print CSS, WhatsApp share, jam realtime, auto-refresh 30 detik yang tidak mengganggu modal terbuka.
- Preview di Emergent via iframe + mock backend (`mock-gas.js`) yang mirror perilaku GAS, plus 16 sample petugas + jadwal isi penuh.
- Logo Darussalam Gontor terpasang di sidebar.
- Tutorial instalasi lengkap di `/app/INSTALASI_BJPJMQ.md`.

## Manual Verification (via screenshot)
- Dashboard: stats + activity log OK
- Jadwal matrix: highlight gold OK, sticky column OK
- Modal Edit Jadwal: pre-fill data + toggle highlight OK
- Petugas CRUD table: 16 petugas ter-render OK
- Rolling page: dropdown terpopulate + petugas saat ini update OK
- Log page: entries render OK

## Backlog
- P1: Drag & drop reorder di halaman Jenis Tugas
- P1: Export CSV jadwal
- P2: Multi-periode (arsip jadwal per pekan/bulan)
- P2: Notifikasi WA otomatis H-1 (butuh Twilio, tidak diminta)

## Next Tasks (jika ada iterasi berikutnya)
- Testing dengan testing_agent (opsional; app sudah manual-tested)
- Tambah animasi transisi antar halaman
- Tambah dark/light mode toggle
