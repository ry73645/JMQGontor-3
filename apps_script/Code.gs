/**
 * ==========================================================
 * BJPJMQ - Buat Jadwal Petugas Jam'iyyatul Qurra'
 * Google Apps Script Backend (Code.gs)
 * ==========================================================
 */

// ============ CONFIGURATION ============
const CONFIG = {
  // GANTI DENGAN SPREADSHEET ID ANDA
  // Contoh: 'https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit'
  SPREADSHEET_ID: 'MASUKKAN_SPREADSHEET_ID_DI_SINI',
  APP_NAME: 'BJPJMQ',
  APP_SUBTITLE: "Buat Jadwal Petugas Jam'iyyatul Qurra'",
  AUTO_REFRESH_SECONDS: 30
};

const SHEETS = {
  PETUGAS: 'PETUGAS',
  JADWAL: 'JADWAL',
  JENIS_TUGAS: 'JENIS_TUGAS',
  PENGATURAN: 'PENGATURAN',
  LOG_AKTIVITAS: 'LOG_AKTIVITAS',
  ARSIP: 'ARSIP'
};

const HEADERS = {
  PETUGAS: ['ID', 'NAMA', 'STATUS', 'KETERANGAN', 'CREATED_AT', 'UPDATED_AT', 'NO_WA'],
  JADWAL: ['ID', 'HARI', 'WAKTU', 'JENIS_TUGAS', 'PETUGAS_ID', 'PETUGAS_NAMA', 'STATUS', 'HIGHLIGHT', 'KETERANGAN', 'CREATED_AT', 'UPDATED_AT'],
  JENIS_TUGAS: ['ID', 'NAMA_TUGAS', 'URUTAN', 'STATUS', 'CREATED_AT', 'UPDATED_AT'],
  PENGATURAN: ['KEY', 'VALUE'],
  LOG_AKTIVITAS: ['ID', 'TIMESTAMP', 'USER', 'ACTION', 'DESCRIPTION'],
  ARSIP: ['ID', 'PERIODE', 'TIMESTAMP', 'JUMLAH_JADWAL', 'DESKRIPSI', 'DATA_JSON']
};

const HARI_LIST = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
const WAKTU_LIST = ['Subuh', 'Dhuhur', 'Ashar', 'Maghrib', "Isya'"];

// ============ WEB APP ============
function doGet(e) {
  const t = HtmlService.createTemplateFromFile('Index');
  t.appName = CONFIG.APP_NAME;
  t.appSubtitle = CONFIG.APP_SUBTITLE;
  return t.evaluate()
    .setTitle(CONFIG.APP_NAME + " - " + CONFIG.APP_SUBTITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============ DATABASE / SPREADSHEET ACCESS ============
function getSpreadsheet() {
  try {
    if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID === 'MASUKKAN_SPREADSHEET_ID_DI_SINI') {
      const active = SpreadsheetApp.getActiveSpreadsheet();
      if (active) return active;
      throw new Error('Spreadsheet ID belum diisi. Buka Code.gs lalu isi CONFIG.SPREADSHEET_ID.');
    }
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  } catch (err) {
    throw new Error('Gagal membuka Spreadsheet: ' + err.message);
  }
}

function getSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (HEADERS[name]) {
      sheet.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
      sheet.getRange(1, 1, 1, HEADERS[name].length)
        .setFontWeight('bold').setBackground('#063B2A').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function createRequiredSheets() {
  const ss = getSpreadsheet();
  Object.keys(SHEETS).forEach(function (k) {
    const name = SHEETS[k];
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    // Ensure header
    const hdr = HEADERS[name];
    const curWidth = Math.max(sheet.getLastColumn(), 1);
    const firstRow = sheet.getRange(1, 1, 1, Math.max(curWidth, hdr.length)).getValues()[0];
    const needsHeader = firstRow.every(function (v) { return !v; });
    if (needsHeader) {
      sheet.getRange(1, 1, 1, hdr.length).setValues([hdr]);
      sheet.getRange(1, 1, 1, hdr.length)
        .setFontWeight('bold').setBackground('#063B2A').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    } else {
      // Extend header with new columns (backward-compat)
      const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
      const missing = hdr.filter(function (h) { return existing.indexOf(h) < 0; });
      if (missing.length) {
        const startCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
        sheet.getRange(1, startCol, 1, missing.length)
          .setFontWeight('bold').setBackground('#063B2A').setFontColor('#FFFFFF');
      }
    }
  });
}

function initializeSpreadsheet() {
  try {
    createRequiredSheets();
    // Default Jenis Tugas
    const jtSheet = getSheet(SHEETS.JENIS_TUGAS);
    if (jtSheet.getLastRow() < 2) {
      const now = getCurrentTimestamp();
      const defaults = [
        ['JT001', 'Mujawwadah', 1, 'Aktif', now, now],
        ['JT002', 'Murottalah', 2, 'Aktif', now, now],
        ['JT003', 'Adzan', 3, 'Aktif', now, now],
        ['JT004', "Syi'ir", 4, 'Aktif', now, now]
      ];
      jtSheet.getRange(2, 1, defaults.length, defaults[0].length).setValues(defaults);
    }
    // Default Pengaturan
    const psSheet = getSheet(SHEETS.PENGATURAN);
    if (psSheet.getLastRow() < 2) {
      const defaults = [
        ['APP_NAME', 'BJPJMQ'],
        ['APP_SUBTITLE', "Buat Jadwal Petugas Jam'iyyatul Qurra'"],
        ['PERIODE', '2026'],
        ['AUTO_REFRESH', '30'],
        ['THEME', 'GREEN_GOLD']
      ];
      psSheet.getRange(2, 1, defaults.length, defaults[0].length).setValues(defaults);
    }
    writeLog('INIT', 'Spreadsheet berhasil diinisialisasi');
    return respondOk(null, 'Spreadsheet berhasil disiapkan');
  } catch (err) {
    return handleError('initializeSpreadsheet', err);
  }
}

// ============ UTILITIES ============
function getCurrentTimestamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
}

function generateId(prefix, sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return prefix + '001';
  const values = sheet.getRange(2, 1, last - 1, 1).getValues();
  let max = 0;
  values.forEach(function (r) {
    const v = String(r[0] || '');
    const num = parseInt(v.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > max) max = num;
  });
  return prefix + String(max + 1).padStart(3, '0');
}

function sanitizeInput(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/<script.*?>.*?<\/script>/gi, '').trim();
}

function respondOk(data, message) {
  return { success: true, data: data, message: message || 'Berhasil' };
}

function respondFail(message) {
  return { success: false, data: null, message: message || 'Gagal memproses data' };
}

function handleError(fnName, err) {
  console.error('[' + fnName + '] ' + (err && err.message ? err.message : err));
  return respondFail('Terjadi kesalahan pada server: ' + (err && err.message ? err.message : 'unknown'));
}

function sheetToObjects(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const width = sheet.getLastColumn();
  const values = sheet.getRange(1, 1, last, width).getValues();
  const headers = values[0];
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = { _rowIndex: i + 1 };
    let hasAny = false;
    for (let j = 0; j < headers.length; j++) {
      const h = headers[j];
      if (!h) continue;
      obj[h] = row[j];
      if (row[j] !== '' && row[j] !== null) hasAny = true;
    }
    if (hasAny) out.push(obj);
  }
  return out;
}

function findRowById(sheet, id) {
  const last = sheet.getLastRow();
  if (last < 2) return -1;
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

// ============ INITIAL DATA ============
function getInitialData() {
  try {
    createRequiredSheets();
    const petugas = sheetToObjects(getSheet(SHEETS.PETUGAS));
    const jadwal = sheetToObjects(getSheet(SHEETS.JADWAL));
    const jenisTugas = sheetToObjects(getSheet(SHEETS.JENIS_TUGAS));
    const pengaturan = sheetToObjects(getSheet(SHEETS.PENGATURAN));
    const log = sheetToObjects(getSheet(SHEETS.LOG_AKTIVITAS)).slice(-100).reverse();

    const activePetugas = petugas.filter(function (p) { return p.STATUS === 'Aktif'; });
    const todayHari = getTodayHari();
    const jadwalToday = jadwal.filter(function (j) { return j.HARI === todayHari && j.STATUS === 'Aktif'; });

    return respondOk({
      petugas: petugas,
      jadwal: jadwal,
      jenisTugas: jenisTugas.filter(function (j) { return j.STATUS === 'Aktif'; })
        .sort(function (a, b) { return (a.URUTAN || 0) - (b.URUTAN || 0); }),
      pengaturan: pengaturan,
      log: log,
      statistik: {
        totalPetugas: petugas.length,
        petugasAktif: activePetugas.length,
        totalJadwal: jadwal.length,
        jadwalHariIni: jadwalToday.length,
        hariIni: todayHari
      },
      hariList: HARI_LIST,
      waktuList: WAKTU_LIST,
      timestamp: getCurrentTimestamp()
    }, 'Data awal berhasil dimuat');
  } catch (err) {
    return handleError('getInitialData', err);
  }
}

function getTodayHari() {
  const dayIdx = new Date().getDay(); // 0=Sunday(Ahad)
  return HARI_LIST[dayIdx];
}

function getDashboardData() {
  return getInitialData();
}

// ============ PETUGAS ============
function getPetugas() {
  try {
    const data = sheetToObjects(getSheet(SHEETS.PETUGAS));
    return respondOk(data);
  } catch (err) { return handleError('getPetugas', err); }
}

function addPetugas(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    createRequiredSheets();
    const sheet = getSheet(SHEETS.PETUGAS);
    const nama = sanitizeInput(payload.NAMA);
    if (!nama) return respondFail('Nama petugas wajib diisi');
    const id = generateId('PJ', sheet);
    const now = getCurrentTimestamp();
    const noWa = sanitizeInput(payload.NO_WA || '');
    sheet.appendRow([id, nama, payload.STATUS || 'Aktif', sanitizeInput(payload.KETERANGAN || ''), now, now, noWa]);
    writeLog('ADD_PETUGAS', 'Menambah petugas: ' + nama);
    return respondOk({ ID: id }, 'Petugas berhasil ditambahkan');
  } catch (err) { return handleError('addPetugas', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

function updatePetugas(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    createRequiredSheets();
    const sheet = getSheet(SHEETS.PETUGAS);
    const row = findRowById(sheet, payload.ID);
    if (row < 0) return respondFail('Petugas tidak ditemukan');
    const now = getCurrentTimestamp();
    const nama = sanitizeInput(payload.NAMA);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    const setCol = function (colName, value) {
      const idx = headers.indexOf(colName);
      if (idx >= 0) sheet.getRange(row, idx + 1).setValue(value);
    };
    setCol('NAMA', nama);
    setCol('STATUS', payload.STATUS || 'Aktif');
    setCol('KETERANGAN', sanitizeInput(payload.KETERANGAN || ''));
    setCol('NO_WA', sanitizeInput(payload.NO_WA || ''));
    setCol('UPDATED_AT', now);

    // Sync PETUGAS_NAMA in JADWAL
    const jSheet = getSheet(SHEETS.JADWAL);
    const jLast = jSheet.getLastRow();
    if (jLast > 1) {
      const range = jSheet.getRange(2, 5, jLast - 1, 2);
      const vals = range.getValues();
      let changed = false;
      for (let i = 0; i < vals.length; i++) {
        if (String(vals[i][0]) === String(payload.ID)) { vals[i][1] = nama; changed = true; }
      }
      if (changed) range.setValues(vals);
    }
    writeLog('EDIT_PETUGAS', 'Mengedit petugas: ' + nama);
    return respondOk(null, 'Petugas berhasil diperbarui');
  } catch (err) { return handleError('updatePetugas', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

function deletePetugas(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheet(SHEETS.PETUGAS);
    const row = findRowById(sheet, payload.ID);
    if (row < 0) return respondFail('Petugas tidak ditemukan');

    // Check if used
    if (!payload.force) {
      const jSheet = getSheet(SHEETS.JADWAL);
      const jLast = jSheet.getLastRow();
      if (jLast > 1) {
        const ids = jSheet.getRange(2, 5, jLast - 1, 1).getValues();
        const used = ids.some(function (r) { return String(r[0]) === String(payload.ID); });
        if (used) {
          return { success: false, code: 'IN_USE', message: 'Petugas ini masih digunakan dalam jadwal. Anda bisa menonaktifkannya.' };
        }
      }
    }
    const nama = sheet.getRange(row, 2).getValue();
    sheet.deleteRow(row);
    writeLog('DELETE_PETUGAS', 'Menghapus petugas: ' + nama);
    return respondOk(null, 'Petugas berhasil dihapus');
  } catch (err) { return handleError('deletePetugas', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

// ============ JADWAL ============
function getJadwal() {
  try {
    const data = sheetToObjects(getSheet(SHEETS.JADWAL));
    return respondOk(data);
  } catch (err) { return handleError('getJadwal', err); }
}

function validateJadwal(payload) {
  if (!payload.HARI || HARI_LIST.indexOf(payload.HARI) < 0) return 'Hari tidak valid';
  if (!payload.WAKTU || WAKTU_LIST.indexOf(payload.WAKTU) < 0) return 'Waktu tidak valid';
  if (!payload.JENIS_TUGAS) return 'Jenis tugas wajib diisi';
  if (!payload.PETUGAS_ID) return 'Petugas wajib dipilih';
  return null;
}

function checkConflict(payload) {
  const sheet = getSheet(SHEETS.JADWAL);
  const data = sheetToObjects(sheet);
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (payload.ID && String(r.ID) === String(payload.ID)) continue;
    if (r.HARI === payload.HARI && r.WAKTU === payload.WAKTU
      && String(r.PETUGAS_ID) === String(payload.PETUGAS_ID)
      && r.STATUS === 'Aktif') {
      return { conflict: true, jenis: r.JENIS_TUGAS };
    }
  }
  return { conflict: false };
}

function addJadwal(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const err = validateJadwal(payload);
    if (err) return respondFail(err);

    if (!payload.forceConflict) {
      const c = checkConflict(payload);
      if (c.conflict) {
        return { success: false, code: 'CONFLICT', message: 'Petugas ini sudah memiliki tugas pada waktu yang sama (' + c.jenis + ').' };
      }
    }

    const petugasSheet = getSheet(SHEETS.PETUGAS);
    const pRow = findRowById(petugasSheet, payload.PETUGAS_ID);
    if (pRow < 0) return respondFail('Petugas tidak ditemukan');
    const petugasNama = petugasSheet.getRange(pRow, 2).getValue();

    const sheet = getSheet(SHEETS.JADWAL);
    const id = generateId('J', sheet);
    const now = getCurrentTimestamp();
    sheet.appendRow([
      id, payload.HARI, payload.WAKTU, payload.JENIS_TUGAS,
      payload.PETUGAS_ID, petugasNama,
      payload.STATUS || 'Aktif',
      payload.HIGHLIGHT ? 'TRUE' : 'FALSE',
      sanitizeInput(payload.KETERANGAN || ''),
      now, now
    ]);
    writeLog('ADD_JADWAL', payload.HARI + ' ' + payload.WAKTU + ' - ' + payload.JENIS_TUGAS + ': ' + petugasNama);
    return respondOk({ ID: id }, 'Jadwal berhasil disimpan');
  } catch (err) { return handleError('addJadwal', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

function updateJadwal(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const err = validateJadwal(payload);
    if (err) return respondFail(err);

    if (!payload.forceConflict) {
      const c = checkConflict(payload);
      if (c.conflict) {
        return { success: false, code: 'CONFLICT', message: 'Petugas ini sudah memiliki tugas pada waktu yang sama (' + c.jenis + ').' };
      }
    }

    const sheet = getSheet(SHEETS.JADWAL);
    const row = findRowById(sheet, payload.ID);
    if (row < 0) return respondFail('Jadwal tidak ditemukan');

    const petugasSheet = getSheet(SHEETS.PETUGAS);
    const pRow = findRowById(petugasSheet, payload.PETUGAS_ID);
    if (pRow < 0) return respondFail('Petugas tidak ditemukan');
    const petugasNama = petugasSheet.getRange(pRow, 2).getValue();

    const now = getCurrentTimestamp();
    sheet.getRange(row, 2, 1, 10).setValues([[
      payload.HARI, payload.WAKTU, payload.JENIS_TUGAS,
      payload.PETUGAS_ID, petugasNama,
      payload.STATUS || 'Aktif',
      payload.HIGHLIGHT ? 'TRUE' : 'FALSE',
      sanitizeInput(payload.KETERANGAN || ''),
      sheet.getRange(row, 10).getValue() || now,
      now
    ]]);
    writeLog('EDIT_JADWAL', payload.HARI + ' ' + payload.WAKTU + ' - ' + payload.JENIS_TUGAS + ': ' + petugasNama);
    return respondOk(null, 'Jadwal berhasil diperbarui');
  } catch (err) { return handleError('updateJadwal', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

function deleteJadwal(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheet(SHEETS.JADWAL);
    const row = findRowById(sheet, payload.ID);
    if (row < 0) return respondFail('Jadwal tidak ditemukan');
    const info = sheet.getRange(row, 2, 1, 5).getValues()[0];
    sheet.deleteRow(row);
    writeLog('DELETE_JADWAL', info[0] + ' ' + info[1] + ' - ' + info[2] + ': ' + info[4]);
    return respondOk(null, 'Jadwal berhasil dihapus');
  } catch (err) { return handleError('deleteJadwal', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

// ============ JENIS TUGAS ============
function getJenisTugas() {
  try {
    const data = sheetToObjects(getSheet(SHEETS.JENIS_TUGAS));
    return respondOk(data);
  } catch (err) { return handleError('getJenisTugas', err); }
}

function addJenisTugas(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const nama = sanitizeInput(payload.NAMA_TUGAS);
    if (!nama) return respondFail('Nama tugas wajib diisi');
    const sheet = getSheet(SHEETS.JENIS_TUGAS);
    const id = generateId('JT', sheet);
    const now = getCurrentTimestamp();
    const urutan = payload.URUTAN || (sheet.getLastRow());
    sheet.appendRow([id, nama, urutan, payload.STATUS || 'Aktif', now, now]);
    writeLog('ADD_JENIS_TUGAS', 'Menambah jenis tugas: ' + nama);
    return respondOk({ ID: id }, 'Jenis tugas ditambahkan');
  } catch (err) { return handleError('addJenisTugas', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

function updateJenisTugas(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheet(SHEETS.JENIS_TUGAS);
    const row = findRowById(sheet, payload.ID);
    if (row < 0) return respondFail('Jenis tugas tidak ditemukan');
    const now = getCurrentTimestamp();
    sheet.getRange(row, 2, 1, 5).setValues([[
      sanitizeInput(payload.NAMA_TUGAS),
      payload.URUTAN || 0,
      payload.STATUS || 'Aktif',
      sheet.getRange(row, 5).getValue() || now,
      now
    ]]);
    writeLog('EDIT_JENIS_TUGAS', 'Mengedit jenis tugas: ' + payload.NAMA_TUGAS);
    return respondOk(null, 'Jenis tugas diperbarui');
  } catch (err) { return handleError('updateJenisTugas', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

function deleteJenisTugas(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheet(SHEETS.JENIS_TUGAS);
    const row = findRowById(sheet, payload.ID);
    if (row < 0) return respondFail('Jenis tugas tidak ditemukan');
    const nama = sheet.getRange(row, 2).getValue();
    sheet.deleteRow(row);
    writeLog('DELETE_JENIS_TUGAS', 'Menghapus jenis tugas: ' + nama);
    return respondOk(null, 'Jenis tugas dihapus');
  } catch (err) { return handleError('deleteJenisTugas', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

// ============ PENGATURAN ============
function getPengaturan() {
  try {
    const data = sheetToObjects(getSheet(SHEETS.PENGATURAN));
    return respondOk(data);
  } catch (err) { return handleError('getPengaturan', err); }
}

function updatePengaturan(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheet(SHEETS.PENGATURAN);
    const last = sheet.getLastRow();
    const keys = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
    Object.keys(payload).forEach(function (k) {
      const idx = keys.indexOf(k);
      if (idx >= 0) {
        sheet.getRange(idx + 2, 2).setValue(payload[k]);
      } else {
        sheet.appendRow([k, payload[k]]);
      }
    });
    writeLog('EDIT_PENGATURAN', 'Memperbarui pengaturan: ' + Object.keys(payload).join(', '));
    return respondOk(null, 'Pengaturan disimpan');
  } catch (err) { return handleError('updatePengaturan', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

// ============ ROLLING ============
function rollingJadwal(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    // payload: { HARI, WAKTU, JENIS_TUGAS } -> rotate to next active petugas
    const jSheet = getSheet(SHEETS.JADWAL);
    const jadwal = sheetToObjects(jSheet);
    const target = jadwal.find(function (j) {
      return j.HARI === payload.HARI && j.WAKTU === payload.WAKTU
        && j.JENIS_TUGAS === payload.JENIS_TUGAS && j.STATUS === 'Aktif';
    });
    if (!target) return respondFail('Jadwal tidak ditemukan');

    const petugasList = sheetToObjects(getSheet(SHEETS.PETUGAS))
      .filter(function (p) { return p.STATUS === 'Aktif'; });
    if (petugasList.length < 2) return respondFail('Perlu minimal 2 petugas aktif untuk rolling');

    const curIdx = petugasList.findIndex(function (p) { return String(p.ID) === String(target.PETUGAS_ID); });
    const nextIdx = (curIdx + 1) % petugasList.length;
    const nextP = petugasList[curIdx === nextIdx ? (nextIdx + 1) % petugasList.length : nextIdx];

    const row = findRowById(jSheet, target.ID);
    const now = getCurrentTimestamp();
    jSheet.getRange(row, 5).setValue(nextP.ID);
    jSheet.getRange(row, 6).setValue(nextP.NAMA);
    jSheet.getRange(row, 11).setValue(now);

    writeLog('ROLLING', payload.HARI + ' ' + payload.WAKTU + ' ' + payload.JENIS_TUGAS + ': ' + target.PETUGAS_NAMA + ' -> ' + nextP.NAMA);
    return respondOk({ from: target.PETUGAS_NAMA, to: nextP.NAMA }, 'Rolling berhasil: ' + target.PETUGAS_NAMA + ' -> ' + nextP.NAMA);
  } catch (err) { return handleError('rollingJadwal', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

// ============ LOG ============
function writeLog(action, description) {
  try {
    const sheet = getSheet(SHEETS.LOG_AKTIVITAS);
    const id = generateId('L', sheet);
    let user = 'Unknown';
    try { user = Session.getActiveUser().getEmail() || 'Anonymous'; } catch (e) { user = 'Anonymous'; }
    sheet.appendRow([id, getCurrentTimestamp(), user, action, description]);
  } catch (e) {
    console.error('writeLog failed: ' + e.message);
  }
}

function getLogAktivitas() {
  try {
    const data = sheetToObjects(getSheet(SHEETS.LOG_AKTIVITAS)).slice(-500).reverse();
    return respondOk(data);
  } catch (err) { return handleError('getLogAktivitas', err); }
}

// ============ REORDER JENIS TUGAS ============
function reorderJenisTugas(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    // payload: { orderedIds: ['JT001','JT003',...] }
    const sheet = getSheet(SHEETS.JENIS_TUGAS);
    const last = sheet.getLastRow();
    if (last < 2) return respondOk(null, 'Tidak ada data');
    const now = getCurrentTimestamp();
    const ids = payload.orderedIds || [];
    ids.forEach(function (id, idx) {
      const row = findRowById(sheet, id);
      if (row > 0) {
        sheet.getRange(row, 3).setValue(idx + 1);
        sheet.getRange(row, 6).setValue(now);
      }
    });
    writeLog('REORDER_JENIS', 'Urutan jenis tugas diperbarui');
    return respondOk(null, 'Urutan berhasil diperbarui');
  } catch (err) { return handleError('reorderJenisTugas', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

// ============ ARSIP PERIODE ============
function getArsip() {
  try {
    const data = sheetToObjects(getSheet(SHEETS.ARSIP)).reverse();
    // Return without heavy DATA_JSON
    const light = data.map(function (r) {
      return { ID: r.ID, PERIODE: r.PERIODE, TIMESTAMP: r.TIMESTAMP,
        JUMLAH_JADWAL: r.JUMLAH_JADWAL, DESKRIPSI: r.DESKRIPSI };
    });
    return respondOk(light);
  } catch (err) { return handleError('getArsip', err); }
}

function snapshotPeriode(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const periode = sanitizeInput((payload && payload.PERIODE) || '');
    if (!periode) return respondFail('Periode wajib diisi');
    const deskripsi = sanitizeInput((payload && payload.DESKRIPSI) || '');
    const jadwal = sheetToObjects(getSheet(SHEETS.JADWAL))
      .filter(function (j) { return j.STATUS === 'Aktif'; });
    const jenisTugas = sheetToObjects(getSheet(SHEETS.JENIS_TUGAS));
    const snap = { jadwal: jadwal, jenisTugas: jenisTugas };
    const sheet = getSheet(SHEETS.ARSIP);
    const id = generateId('AR', sheet);
    const now = getCurrentTimestamp();
    sheet.appendRow([id, periode, now, jadwal.length, deskripsi, JSON.stringify(snap)]);
    writeLog('SNAPSHOT_ARSIP', 'Arsip periode: ' + periode + ' (' + jadwal.length + ' jadwal)');
    return respondOk({ ID: id }, 'Snapshot periode berhasil disimpan');
  } catch (err) { return handleError('snapshotPeriode', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

function getArsipDetail(payload) {
  try {
    const sheet = getSheet(SHEETS.ARSIP);
    const row = findRowById(sheet, payload.ID);
    if (row < 0) return respondFail('Arsip tidak ditemukan');
    const vals = sheet.getRange(row, 1, 1, 6).getValues()[0];
    let data = null;
    try { data = JSON.parse(vals[5] || '{}'); } catch (e) { data = { jadwal: [], jenisTugas: [] }; }
    return respondOk({
      ID: vals[0], PERIODE: vals[1], TIMESTAMP: vals[2],
      JUMLAH_JADWAL: vals[3], DESKRIPSI: vals[4],
      jadwal: data.jadwal || [], jenisTugas: data.jenisTugas || []
    });
  } catch (err) { return handleError('getArsipDetail', err); }
}

function deleteArsip(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheet(SHEETS.ARSIP);
    const row = findRowById(sheet, payload.ID);
    if (row < 0) return respondFail('Arsip tidak ditemukan');
    const periode = sheet.getRange(row, 2).getValue();
    sheet.deleteRow(row);
    writeLog('DELETE_ARSIP', 'Menghapus arsip: ' + periode);
    return respondOk(null, 'Arsip dihapus');
  } catch (err) { return handleError('deleteArsip', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

function restoreArsip(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const arSheet = getSheet(SHEETS.ARSIP);
    const row = findRowById(arSheet, payload.ID);
    if (row < 0) return respondFail('Arsip tidak ditemukan');
    const vals = arSheet.getRange(row, 1, 1, 6).getValues()[0];
    let data = null;
    try { data = JSON.parse(vals[5] || '{}'); } catch (e) { return respondFail('Data arsip rusak'); }
    const snap = data.jadwal || [];
    if (!snap.length) return respondFail('Snapshot kosong');

    // Optionally auto-snapshot current before restore
    if (payload.autoSnapshot) {
      snapshotPeriode({ PERIODE: 'Auto sebelum restore', DESKRIPSI: 'Otomatis dibuat sebelum restore dari ' + vals[1] });
    }

    const jSheet = getSheet(SHEETS.JADWAL);
    const jLast = jSheet.getLastRow();
    if (jLast > 1) jSheet.getRange(2, 1, jLast - 1, jSheet.getLastColumn()).clearContent();

    const now = getCurrentTimestamp();
    const rows = snap.map(function (j, i) {
      return [
        'J' + String(i + 1).padStart(3, '0'),
        j.HARI, j.WAKTU, j.JENIS_TUGAS,
        j.PETUGAS_ID, j.PETUGAS_NAMA,
        j.STATUS || 'Aktif',
        String(j.HIGHLIGHT).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE',
        j.KETERANGAN || '',
        j.CREATED_AT || now, now
      ];
    });
    if (rows.length) jSheet.getRange(2, 1, rows.length, 11).setValues(rows);
    writeLog('RESTORE_ARSIP', 'Restore jadwal dari arsip: ' + vals[1] + ' (' + rows.length + ' jadwal)');
    return respondOk({ jumlah: rows.length }, 'Berhasil memulihkan ' + rows.length + ' jadwal dari "' + vals[1] + '"');
  } catch (err) { return handleError('restoreArsip', err); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

// ============ STATISTIK PETUGAS ============
function getStatistik(payload) {
  try {
    const petugas = sheetToObjects(getSheet(SHEETS.PETUGAS));
    const jadwal = sheetToObjects(getSheet(SHEETS.JADWAL))
      .filter(function (j) { return j.STATUS === 'Aktif'; });
    // count per petugas
    const counts = {};
    jadwal.forEach(function (j) {
      const id = String(j.PETUGAS_ID);
      if (!counts[id]) counts[id] = { total: 0, byWaktu: {}, byJenis: {}, byHari: {} };
      counts[id].total++;
      counts[id].byWaktu[j.WAKTU] = (counts[id].byWaktu[j.WAKTU] || 0) + 1;
      counts[id].byJenis[j.JENIS_TUGAS] = (counts[id].byJenis[j.JENIS_TUGAS] || 0) + 1;
      counts[id].byHari[j.HARI] = (counts[id].byHari[j.HARI] || 0) + 1;
    });
    const rows = petugas.map(function (p) {
      const c = counts[String(p.ID)] || { total: 0, byWaktu: {}, byJenis: {}, byHari: {} };
      return {
        ID: p.ID, NAMA: p.NAMA, STATUS: p.STATUS,
        total: c.total, byWaktu: c.byWaktu, byJenis: c.byJenis, byHari: c.byHari
      };
    }).sort(function (a, b) { return b.total - a.total; });

    const active = rows.filter(function (r) { return r.STATUS === 'Aktif'; });
    const max = active.length ? active[0].total : 0;
    const min = active.length ? active[active.length - 1].total : 0;
    const avg = active.length ? active.reduce(function (s, r) { return s + r.total; }, 0) / active.length : 0;

    return respondOk({
      rows: rows, totalJadwal: jadwal.length,
      max: max, min: min, avg: Math.round(avg * 10) / 10,
      topName: active.length ? active[0].NAMA : '-',
      bottomName: active.length ? active[active.length - 1].NAMA : '-'
    });
  } catch (err) { return handleError('getStatistik', err); }
}
