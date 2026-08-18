/* ================================================================
   BJPJMQ - Mock Backend (localStorage)
   Meniru perilaku Code.gs untuk preview di browser.
================================================================ */
(function(){
  const STORAGE_KEY = 'BJPJMQ_DATA_V1';
  const HARI_LIST = ['Ahad','Senin','Selasa','Rabu','Kamis',"Jum'at",'Sabtu'];
  const WAKTU_LIST = ['Subuh','Dhuhur','Ashar','Maghrib',"Isya'"];

  function now(){
    const d = new Date(), p = n => String(n).padStart(2,'0');
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
  }
  function load(){
    try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); }catch(e){}
    return seed();
  }
  function save(d){ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
  function nextId(prefix, arr){
    let max=0; arr.forEach(r=>{ const n=parseInt(String(r.ID||'').replace(/\D/g,''),10); if(!isNaN(n)&&n>max) max=n; });
    return prefix+String(max+1).padStart(3,'0');
  }
  function seed(){
    const t = now();
    const petugas = [
      ['Bayu Abiliansyah','6281234567801'],['Fadgham Qoil Haq','6281234567802'],['Muhammad Roja','6281234567803'],['Faizuddin Akbar','6281234567804'],
      ['Ust Zidane Az. Y',''],['Ust Alannawa',''],['Ust Abdul Ghofur',''],['Ust Ismail Afdzalurrahman',''],
      ['Azzam Saefullah',''],['Nufal Dhiyauulhaq',''],['Ahmad Hazami Fachry',''],['Brilliant',''],
      ['Ilham Jabbar',''],['Fath Mahardika',''],['Areyga',''],['Hazwan Ghaisan','']
    ].map((r,i)=>({ID:'PJ'+String(i+1).padStart(3,'0'),NAMA:r[0],STATUS:'Aktif',KETERANGAN:'',NO_WA:r[1],CREATED_AT:t,UPDATED_AT:t}));

    const jenisTugas = [
      {ID:'JT001',NAMA_TUGAS:'Mujawwadah',URUTAN:1,STATUS:'Aktif',CREATED_AT:t,UPDATED_AT:t},
      {ID:'JT002',NAMA_TUGAS:'Murottalah',URUTAN:2,STATUS:'Aktif',CREATED_AT:t,UPDATED_AT:t},
      {ID:'JT003',NAMA_TUGAS:'Adzan',URUTAN:3,STATUS:'Aktif',CREATED_AT:t,UPDATED_AT:t},
      {ID:'JT004',NAMA_TUGAS:"Syi'ir",URUTAN:4,STATUS:'Aktif',CREATED_AT:t,UPDATED_AT:t}
    ];

    // Sample jadwal
    const jadwal = [];
    let ji = 0;
    const highlights = new Set(['Ahad|Subuh|Mujawwadah','Ahad|Maghrib|Mujawwadah','Rabu|Subuh|Mujawwadah',"Jum'at|Subuh|Mujawwadah","Jum'at|Maghrib|Mujawwadah"]);
    const jenisByWaktu = {
      'Subuh':['Mujawwadah','Murottalah','Adzan',"Syi'ir"],
      'Dhuhur':['Murottalah','Adzan',"Syi'ir"],
      'Ashar':['Murottalah','Adzan',"Syi'ir"],
      'Maghrib':['Mujawwadah','Murottalah','Adzan',"Syi'ir"],
      "Isya'":['Murottalah','Adzan',"Syi'ir"]
    };
    HARI_LIST.forEach(h=>{
      WAKTU_LIST.forEach(w=>{
        (jenisByWaktu[w]||[]).forEach(jn=>{
          const p = petugas[ji % petugas.length]; ji++;
          const key = h+'|'+w+'|'+jn;
          jadwal.push({
            ID:'J'+String(jadwal.length+1).padStart(3,'0'),HARI:h,WAKTU:w,JENIS_TUGAS:jn,
            PETUGAS_ID:p.ID,PETUGAS_NAMA:p.NAMA,STATUS:'Aktif',
            HIGHLIGHT: highlights.has(key)?'TRUE':'FALSE', KETERANGAN:'',CREATED_AT:t,UPDATED_AT:t
          });
        });
      });
    });

    const pengaturan = [
      {KEY:'APP_NAME',VALUE:'BJPJMQ'},
      {KEY:'APP_SUBTITLE',VALUE:"Buat Jadwal Petugas Jam'iyyatul Qurra'"},
      {KEY:'PERIODE',VALUE:'2026'},
      {KEY:'AUTO_REFRESH',VALUE:'30'},
      {KEY:'THEME',VALUE:'GREEN_GOLD'}
    ];

    const log = [{ID:'L001',TIMESTAMP:t,USER:'preview@local',ACTION:'INIT',DESCRIPTION:'Preview data awal dimuat'}];
    const arsip = [];
    const d = { petugas, jadwal, jenisTugas, pengaturan, log, arsip };
    save(d);
    return d;
  }

  function writeLog(d, action, desc){
    d.log = d.log || [];
    d.log.push({ID:nextId('L',d.log),TIMESTAMP:now(),USER:'preview@local',ACTION:action,DESCRIPTION:desc});
    if(d.log.length>500) d.log = d.log.slice(-500);
  }

  function ok(data,msg){ return {success:true,data:data,message:msg||'Berhasil'}; }
  function fail(msg){ return {success:false,data:null,message:msg||'Gagal'}; }

  function todayHari(){ return HARI_LIST[new Date().getDay()]; }

  const MOCK = {
    getInitialData: function(){
      const d = load();
      const t = todayHari();
      const activeP = d.petugas.filter(p=>p.STATUS==='Aktif');
      const todayJ = d.jadwal.filter(j=>j.HARI===t && j.STATUS==='Aktif');
      return ok({
        petugas:d.petugas, jadwal:d.jadwal,
        jenisTugas:d.jenisTugas.filter(j=>j.STATUS==='Aktif').sort((a,b)=>(a.URUTAN||0)-(b.URUTAN||0)),
        pengaturan:d.pengaturan, log:d.log.slice(-100).reverse(),
        statistik:{ totalPetugas:d.petugas.length, petugasAktif:activeP.length, totalJadwal:d.jadwal.length, jadwalHariIni:todayJ.length, hariIni:t },
        hariList:HARI_LIST, waktuList:WAKTU_LIST, timestamp:now()
      },'Data awal dimuat');
    },
    getDashboardData: function(){ return MOCK.getInitialData(); },

    addPetugas: function(p){
      const d = load(); const nama=(p.NAMA||'').trim(); if(!nama) return fail('Nama wajib diisi');
      const id = nextId('PJ',d.petugas); const t=now();
      d.petugas.push({ID:id,NAMA:nama,STATUS:p.STATUS||'Aktif',KETERANGAN:p.KETERANGAN||'',NO_WA:p.NO_WA||'',CREATED_AT:t,UPDATED_AT:t});
      writeLog(d,'ADD_PETUGAS','Menambah petugas: '+nama); save(d);
      return ok({ID:id},'Petugas berhasil ditambahkan');
    },
    updatePetugas: function(p){
      const d = load(); const idx = d.petugas.findIndex(x=>String(x.ID)===String(p.ID));
      if(idx<0) return fail('Petugas tidak ditemukan');
      d.petugas[idx].NAMA=p.NAMA; d.petugas[idx].STATUS=p.STATUS||'Aktif'; d.petugas[idx].KETERANGAN=p.KETERANGAN||''; d.petugas[idx].NO_WA=p.NO_WA||''; d.petugas[idx].UPDATED_AT=now();
      d.jadwal.forEach(j=>{ if(String(j.PETUGAS_ID)===String(p.ID)){ j.PETUGAS_NAMA=p.NAMA; } });
      writeLog(d,'EDIT_PETUGAS','Mengedit petugas: '+p.NAMA); save(d);
      return ok(null,'Petugas berhasil diperbarui');
    },
    deletePetugas: function(p){
      const d = load(); const idx = d.petugas.findIndex(x=>String(x.ID)===String(p.ID));
      if(idx<0) return fail('Petugas tidak ditemukan');
      if(!p.force){
        const used = d.jadwal.some(j=>String(j.PETUGAS_ID)===String(p.ID));
        if(used) return {success:false,code:'IN_USE',message:'Petugas ini masih digunakan dalam jadwal.'};
      }
      const nm = d.petugas[idx].NAMA;
      d.petugas.splice(idx,1);
      writeLog(d,'DELETE_PETUGAS','Menghapus petugas: '+nm); save(d);
      return ok(null,'Petugas dihapus');
    },

    addJadwal: function(p){
      const d = load();
      if(!p.HARI||!p.WAKTU||!p.JENIS_TUGAS||!p.PETUGAS_ID) return fail('Data tidak lengkap');
      if(!p.forceConflict){
        const c = d.jadwal.find(j=>j.HARI===p.HARI && j.WAKTU===p.WAKTU && String(j.PETUGAS_ID)===String(p.PETUGAS_ID) && j.STATUS==='Aktif');
        if(c) return {success:false,code:'CONFLICT',message:'Petugas ini sudah memiliki tugas pada waktu yang sama ('+c.JENIS_TUGAS+').'};
      }
      const pt = d.petugas.find(x=>String(x.ID)===String(p.PETUGAS_ID));
      if(!pt) return fail('Petugas tidak ditemukan');
      const id = nextId('J',d.jadwal); const t=now();
      d.jadwal.push({ID:id,HARI:p.HARI,WAKTU:p.WAKTU,JENIS_TUGAS:p.JENIS_TUGAS,PETUGAS_ID:p.PETUGAS_ID,PETUGAS_NAMA:pt.NAMA,STATUS:p.STATUS||'Aktif',HIGHLIGHT:p.HIGHLIGHT?'TRUE':'FALSE',KETERANGAN:p.KETERANGAN||'',CREATED_AT:t,UPDATED_AT:t});
      writeLog(d,'ADD_JADWAL',p.HARI+' '+p.WAKTU+' - '+p.JENIS_TUGAS+': '+pt.NAMA); save(d);
      return ok({ID:id},'Jadwal berhasil disimpan');
    },
    updateJadwal: function(p){
      const d = load(); const idx = d.jadwal.findIndex(x=>String(x.ID)===String(p.ID));
      if(idx<0) return fail('Jadwal tidak ditemukan');
      if(!p.forceConflict){
        const c = d.jadwal.find(j=>String(j.ID)!==String(p.ID) && j.HARI===p.HARI && j.WAKTU===p.WAKTU && String(j.PETUGAS_ID)===String(p.PETUGAS_ID) && j.STATUS==='Aktif');
        if(c) return {success:false,code:'CONFLICT',message:'Petugas ini sudah memiliki tugas pada waktu yang sama ('+c.JENIS_TUGAS+').'};
      }
      const pt = d.petugas.find(x=>String(x.ID)===String(p.PETUGAS_ID)); if(!pt) return fail('Petugas tidak ditemukan');
      Object.assign(d.jadwal[idx],{HARI:p.HARI,WAKTU:p.WAKTU,JENIS_TUGAS:p.JENIS_TUGAS,PETUGAS_ID:p.PETUGAS_ID,PETUGAS_NAMA:pt.NAMA,STATUS:p.STATUS||'Aktif',HIGHLIGHT:p.HIGHLIGHT?'TRUE':'FALSE',KETERANGAN:p.KETERANGAN||'',UPDATED_AT:now()});
      writeLog(d,'EDIT_JADWAL',p.HARI+' '+p.WAKTU+' - '+p.JENIS_TUGAS+': '+pt.NAMA); save(d);
      return ok(null,'Jadwal diperbarui');
    },
    deleteJadwal: function(p){
      const d = load(); const idx = d.jadwal.findIndex(x=>String(x.ID)===String(p.ID));
      if(idx<0) return fail('Jadwal tidak ditemukan');
      const info = d.jadwal[idx];
      d.jadwal.splice(idx,1);
      writeLog(d,'DELETE_JADWAL',info.HARI+' '+info.WAKTU+' - '+info.JENIS_TUGAS+': '+info.PETUGAS_NAMA); save(d);
      return ok(null,'Jadwal dihapus');
    },

    addJenisTugas: function(p){
      const d = load(); const nm=(p.NAMA_TUGAS||'').trim(); if(!nm) return fail('Nama tugas wajib');
      const id = nextId('JT',d.jenisTugas); const t=now();
      d.jenisTugas.push({ID:id,NAMA_TUGAS:nm,URUTAN:p.URUTAN||d.jenisTugas.length+1,STATUS:p.STATUS||'Aktif',CREATED_AT:t,UPDATED_AT:t});
      writeLog(d,'ADD_JENIS_TUGAS','Menambah jenis tugas: '+nm); save(d);
      return ok({ID:id},'Jenis tugas ditambahkan');
    },
    updateJenisTugas: function(p){
      const d = load(); const idx = d.jenisTugas.findIndex(x=>String(x.ID)===String(p.ID));
      if(idx<0) return fail('Tidak ditemukan');
      Object.assign(d.jenisTugas[idx],{NAMA_TUGAS:p.NAMA_TUGAS,URUTAN:p.URUTAN||0,STATUS:p.STATUS||'Aktif',UPDATED_AT:now()});
      writeLog(d,'EDIT_JENIS_TUGAS','Mengedit jenis tugas: '+p.NAMA_TUGAS); save(d);
      return ok(null,'Jenis tugas diperbarui');
    },
    deleteJenisTugas: function(p){
      const d = load(); const idx = d.jenisTugas.findIndex(x=>String(x.ID)===String(p.ID));
      if(idx<0) return fail('Tidak ditemukan');
      const nm = d.jenisTugas[idx].NAMA_TUGAS;
      d.jenisTugas.splice(idx,1);
      writeLog(d,'DELETE_JENIS_TUGAS','Menghapus jenis tugas: '+nm); save(d);
      return ok(null,'Jenis tugas dihapus');
    },

    updatePengaturan: function(p){
      const d = load();
      Object.keys(p).forEach(k=>{
        const idx = d.pengaturan.findIndex(x=>x.KEY===k);
        if(idx>=0) d.pengaturan[idx].VALUE = p[k];
        else d.pengaturan.push({KEY:k,VALUE:p[k]});
      });
      writeLog(d,'EDIT_PENGATURAN','Memperbarui pengaturan: '+Object.keys(p).join(', ')); save(d);
      return ok(null,'Pengaturan disimpan');
    },

    rollingJadwal: function(p){
      const d = load();
      const target = d.jadwal.find(j=>j.HARI===p.HARI && j.WAKTU===p.WAKTU && j.JENIS_TUGAS===p.JENIS_TUGAS && j.STATUS==='Aktif');
      if(!target) return fail('Jadwal tidak ditemukan');
      const active = d.petugas.filter(x=>x.STATUS==='Aktif');
      if(active.length<2) return fail('Perlu minimal 2 petugas aktif');
      const cur = active.findIndex(x=>String(x.ID)===String(target.PETUGAS_ID));
      const next = active[(cur+1)%active.length];
      const from = target.PETUGAS_NAMA;
      target.PETUGAS_ID = next.ID; target.PETUGAS_NAMA = next.NAMA; target.UPDATED_AT = now();
      writeLog(d,'ROLLING',p.HARI+' '+p.WAKTU+' '+p.JENIS_TUGAS+': '+from+' -> '+next.NAMA); save(d);
      return ok({from:from,to:next.NAMA},'Rolling berhasil: '+from+' -> '+next.NAMA);
    },

    getLogAktivitas: function(){
      const d = load(); return ok(d.log.slice(-500).reverse());
    },

    reorderJenisTugas: function(p){
      const d = load();
      (p.orderedIds||[]).forEach(function(id, idx){
        const jt = d.jenisTugas.find(x=>String(x.ID)===String(id));
        if(jt){ jt.URUTAN = idx+1; jt.UPDATED_AT = now(); }
      });
      writeLog(d,'REORDER_JENIS','Urutan jenis tugas diperbarui'); save(d);
      return ok(null,'Urutan diperbarui');
    },

    getArsip: function(){
      const d = load(); d.arsip = d.arsip || [];
      const light = d.arsip.slice().reverse().map(function(a){
        return { ID:a.ID, PERIODE:a.PERIODE, TIMESTAMP:a.TIMESTAMP, JUMLAH_JADWAL:a.JUMLAH_JADWAL, DESKRIPSI:a.DESKRIPSI };
      });
      return ok(light);
    },
    snapshotPeriode: function(p){
      const d = load(); d.arsip = d.arsip || [];
      const periode = (p && p.PERIODE||'').trim(); if(!periode) return fail('Periode wajib diisi');
      const jadwal = d.jadwal.filter(j=>j.STATUS==='Aktif');
      const id = nextId('AR', d.arsip);
      d.arsip.push({ID:id, PERIODE:periode, TIMESTAMP:now(), JUMLAH_JADWAL:jadwal.length, DESKRIPSI:(p.DESKRIPSI||''), DATA:{jadwal:jadwal, jenisTugas:d.jenisTugas}});
      writeLog(d,'SNAPSHOT_ARSIP','Arsip periode: '+periode+' ('+jadwal.length+' jadwal)'); save(d);
      return ok({ID:id},'Snapshot periode disimpan');
    },
    getArsipDetail: function(p){
      const d = load(); d.arsip = d.arsip || [];
      const a = d.arsip.find(x=>String(x.ID)===String(p.ID));
      if(!a) return fail('Arsip tidak ditemukan');
      return ok({ID:a.ID, PERIODE:a.PERIODE, TIMESTAMP:a.TIMESTAMP, JUMLAH_JADWAL:a.JUMLAH_JADWAL, DESKRIPSI:a.DESKRIPSI, jadwal:(a.DATA&&a.DATA.jadwal)||[], jenisTugas:(a.DATA&&a.DATA.jenisTugas)||[]});
    },
    deleteArsip: function(p){
      const d = load(); d.arsip = d.arsip || [];
      const idx = d.arsip.findIndex(x=>String(x.ID)===String(p.ID));
      if(idx<0) return fail('Arsip tidak ditemukan');
      const periode = d.arsip[idx].PERIODE;
      d.arsip.splice(idx,1);
      writeLog(d,'DELETE_ARSIP','Menghapus arsip: '+periode); save(d);
      return ok(null,'Arsip dihapus');
    },
    restoreArsip: function(p){
      const d = load(); d.arsip = d.arsip || [];
      const a = d.arsip.find(x=>String(x.ID)===String(p.ID));
      if(!a) return fail('Arsip tidak ditemukan');
      const snap = (a.DATA && a.DATA.jadwal) || [];
      if(!snap.length) return fail('Snapshot kosong');
      if(p.autoSnapshot){
        const jadwalAktif = d.jadwal.filter(j=>j.STATUS==='Aktif');
        const id2 = nextId('AR', d.arsip);
        d.arsip.push({ID:id2, PERIODE:'Auto sebelum restore', TIMESTAMP:now(), JUMLAH_JADWAL:jadwalAktif.length, DESKRIPSI:'Otomatis dibuat sebelum restore dari '+a.PERIODE, DATA:{jadwal:jadwalAktif, jenisTugas:d.jenisTugas}});
      }
      const t = now();
      d.jadwal = snap.map(function(j,i){
        return {ID:'J'+String(i+1).padStart(3,'0'),HARI:j.HARI,WAKTU:j.WAKTU,JENIS_TUGAS:j.JENIS_TUGAS,PETUGAS_ID:j.PETUGAS_ID,PETUGAS_NAMA:j.PETUGAS_NAMA,STATUS:j.STATUS||'Aktif',HIGHLIGHT:String(j.HIGHLIGHT).toUpperCase()==='TRUE'?'TRUE':'FALSE',KETERANGAN:j.KETERANGAN||'',CREATED_AT:j.CREATED_AT||t,UPDATED_AT:t};
      });
      writeLog(d,'RESTORE_ARSIP','Restore dari: '+a.PERIODE+' ('+d.jadwal.length+' jadwal)'); save(d);
      return ok({jumlah:d.jadwal.length}, 'Berhasil memulihkan '+d.jadwal.length+' jadwal dari "'+a.PERIODE+'"');
    },
    getStatistik: function(){
      const d = load();
      const jadwal = d.jadwal.filter(j=>j.STATUS==='Aktif');
      const counts = {};
      jadwal.forEach(j=>{
        const id = String(j.PETUGAS_ID);
        if(!counts[id]) counts[id] = {total:0, byWaktu:{}, byJenis:{}, byHari:{}};
        counts[id].total++;
        counts[id].byWaktu[j.WAKTU] = (counts[id].byWaktu[j.WAKTU]||0)+1;
        counts[id].byJenis[j.JENIS_TUGAS] = (counts[id].byJenis[j.JENIS_TUGAS]||0)+1;
        counts[id].byHari[j.HARI] = (counts[id].byHari[j.HARI]||0)+1;
      });
      const rows = d.petugas.map(p=>{
        const c = counts[String(p.ID)] || {total:0,byWaktu:{},byJenis:{},byHari:{}};
        return {ID:p.ID,NAMA:p.NAMA,STATUS:p.STATUS,total:c.total,byWaktu:c.byWaktu,byJenis:c.byJenis,byHari:c.byHari};
      }).sort((a,b)=>b.total-a.total);
      const active = rows.filter(r=>r.STATUS==='Aktif');
      const max = active.length?active[0].total:0;
      const min = active.length?active[active.length-1].total:0;
      const avg = active.length?active.reduce((s,r)=>s+r.total,0)/active.length:0;
      return ok({rows:rows,totalJadwal:jadwal.length,max:max,min:min,avg:Math.round(avg*10)/10,topName:active.length?active[0].NAMA:'-',bottomName:active.length?active[active.length-1].NAMA:'-'});
    }
  };

  window.MOCK_BACKEND = MOCK;
  // Preview banner
  window.addEventListener('DOMContentLoaded', function(){
    const banner = document.createElement('div');
    banner.style.cssText='position:fixed;bottom:14px;left:14px;z-index:99;background:rgba(244,197,66,.95);color:#0a2416;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:700;box-shadow:0 6px 16px rgba(0,0,0,.3);font-family:Inter,sans-serif';
    banner.textContent = '🧪 MODE PREVIEW · Data disimpan di localStorage';
    banner.title = 'Klik untuk reset data preview';
    banner.style.cursor='pointer';
    banner.onclick = function(){ if(confirm('Reset data preview?')){ localStorage.removeItem('BJPJMQ_DATA_V1'); location.reload(); } };
    document.body.appendChild(banner);
  });
})();
