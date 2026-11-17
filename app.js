/* Pagina invito NYE 26/27 – prototipo. Tutto quello che si cambia spesso sta in CONFIG. */
(function () {
  'use strict';

  var CONFIG = {
    marchio: 'Elsewhere Events',
    sigla: 'NYE 2027',
    nastro: ['Open bar', 'Reggaeton', 'Hip hop', 'White girl music', 'Disco house', '31.12'],   // striscia che scorre
    dataTesto: '31 dicembre, dalle 22:30 fino a tardi',
    inizio: '2026-12-31T22:30:00+01:00',           // per il countdown
    luogo: 'La Cantina Underground',
    luogoDettaglio: 'Villa Majnoni · Marti (PI)',
    indirizzo: 'Via Mazzana 1, 56020',
    mappe: 'https://www.google.com/maps/search/?api=1&query=43.651761%2C10.740269',   // punto del link Maps della grafica
    motto: 'Make it the night you talk about all of 2027.',
    lineup: ['Guido Testi', 'Francesco Faralli', 'DJ Tasso'],   // in quest'ordine
    generi: ['Reggaeton', 'Hip hop', 'White girl music', 'Disco house'],   // in quest'ordine
    organizzatori: ['Achille Emili', 'Francesco Faralli'],
    linkBiglietto: 'https://elsewhereclub00.github.io/NYE-26-27/',
    // Link del gruppo codificato: in console invito.codificaLink('https://chat.whatsapp.com/...') e incolla qui il risultato.
    gruppoCodificato: '==Adfl2Z9UGZv12PyoWORNkQ0IHUrdUZt12YUVjZ1cHVJ9SbvNmLwBXYzRXYodnL0FGaj9yL6MHc0RHa',  // gruppo "NEW YEAR'S EVE" (17/11, 10:40)
    contatti: [
      { nome: 'Achille', wa: '393493705864' },
      { nome: 'Francesco', wa: '393514660549' }
    ],
    // Indirizzo /exec dei conteggi: si cambia in config.js. Vuoto = nessun invio.
    conteggiUrl: (window.NYE_CONTEGGI && window.NYE_CONTEGGI.url) || ''
  };

  var $ = function (s) { return document.querySelector(s); };
  var eventi = [];

  /* ---------- link del gruppo (non in chiaro nel codice) ---------- */
  function codificaLink(url) {
    return btoa(unescape(encodeURIComponent(url))).split('').reverse().join('');
  }
  function decodifica(codice) {
    if (!codice) return '';
    try {
      var url = decodeURIComponent(escape(atob(codice.split('').reverse().join(''))));
      return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+(\?[A-Za-z0-9_=&.-]*)?$/.test(url) ? url : '';
    } catch (e) { return ''; }
  }

  /* ---------- conteggi anonimi, una volta per dispositivo ---------- */
  var CHIAVE = 'nye_invito_v1';
  var memoria = {};
  function leggi() {
    try { var s = localStorage.getItem(CHIAVE); return s ? JSON.parse(s) : {}; }
    catch (e) { return memoria; }
  }
  function salva(st) {
    memoria = st;
    try { localStorage.setItem(CHIAVE, JSON.stringify(st)); } catch (e) { /* navigazione privata: resta in memoria */ }
  }
  function invia(tipo) {
    eventi.push(tipo);
    if (!CONFIG.conteggiUrl) return;
    var corpo = JSON.stringify({ e: tipo, t: Date.now() });
    // Prima fetch SENZA cookie (come il sito iscrizioni: con più account Google nel browser i cookie
    // possono far deviare la richiesta di Google). keepalive la porta a termine anche se si cambia pagina.
    try {
      fetch(CONFIG.conteggiUrl, { method: 'POST', body: corpo, mode: 'no-cors', keepalive: true,
        credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=UTF-8' } })
        .catch(function () { beacon(corpo); });
      return;
    } catch (e) { /* browser senza fetch: ripiego */ }
    beacon(corpo);
  }
  function beacon(corpo) {
    try { if (navigator.sendBeacon) navigator.sendBeacon(CONFIG.conteggiUrl, new Blob([corpo], { type: 'text/plain;charset=UTF-8' })); }
    catch (e) { /* conteggio perso, l'invitato non se ne accorge */ }
  }
  function contaUnaVolta(flag, tipo) {
    var st = leggi();
    if (st[flag]) return;
    st[flag] = 1; salva(st); invia(tipo);
  }
  function contaRisposta(r) {
    var st = leggi();
    if (st.r === r) return;
    var prima = st.r;
    st.r = r; salva(st);
    invia(prima ? 'cambio_' + prima + '_' + r : r);
  }

  /* ---------- schermate ---------- */
  var attuale = 'ingresso', precedente = 'invito';
  function mostra(id) {
    ['ingresso', 'invito', 'si', 'no', 'fine'].forEach(function (n) {
      $('#s-' + n).hidden = (n !== id);
    });
    if (attuale !== 'fine') precedente = attuale;
    attuale = id;
    btnAudio.hidden = (id === 'fine' || (id === 'ingresso' && audio.paused));
    window.scrollTo(0, 0);
    var h = $('#s-' + id + ' [tabindex="-1"]');
    if (h) setTimeout(function () { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }, 30);
  }

  /* ---------- musica ---------- */
  var audio = $('#musica');
  var btnAudio = $('#btn-audio');
  var utenteMuto = false, eraInRiproduzione = false, timerVolume = null, inAttesaDiTocco = false;

  // Se il browser blocca l'avvio, la musica riparte da sola al tocco successivo, senza pulsanti in più
  function riprovaAlProssimoTocco() {
    if (inAttesaDiTocco) return;
    inAttesaDiTocco = true;
    var tipi = ['touchend', 'click', 'keydown'];
    var f = function (e) {
      if (e.target && e.target.closest && e.target.closest('#btn-audio')) return; // ci pensa il pulsante muto
      tipi.forEach(function (t) { document.removeEventListener(t, f, true); });
      inAttesaDiTocco = false;
      if (audio.paused && !utenteMuto && attuale !== 'fine' && attuale !== 'ingresso') avviaMusica();
    };
    tipi.forEach(function (t) { document.addEventListener(t, f, true); });
  }

  function aggiornaIcona() {
    var acceso = !audio.paused && !audio.muted;
    btnAudio.setAttribute('aria-pressed', acceso ? 'true' : 'false');
    btnAudio.setAttribute('aria-label', acceso ? 'Musica accesa: tocca per spegnere' : 'Musica spenta: tocca per accendere');
  }
  function dissolvenza() {
    clearInterval(timerVolume);
    var v = 0;
    try { audio.volume = 0; } catch (e) {}
    timerVolume = setInterval(function () {
      v = Math.min(1, v + 0.05);
      try { audio.volume = v; } catch (e) {}
      if (v >= 1) clearInterval(timerVolume);
    }, 75);
  }
  function avviaMusica() {
    audio.muted = utenteMuto;
    var p;
    try { p = audio.play(); } catch (e) { p = Promise.reject(e); }
    if (p && typeof p.then === 'function') {
      p.then(function () { dissolvenza(); aggiornaIcona(); })
       .catch(function () { aggiornaIcona(); riprovaAlProssimoTocco(); });
    }
    aggiornaIcona();
  }
  btnAudio.addEventListener('click', function () {
    if (audio.paused) { utenteMuto = false; avviaMusica(); return; }
    audio.muted = !audio.muted;
    utenteMuto = audio.muted;
    aggiornaIcona();
  });
  ['play', 'pause', 'volumechange'].forEach(function (ev) { audio.addEventListener(ev, aggiornaIcona); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (!audio.paused) { eraInRiproduzione = true; audio.pause(); }
    } else if (eraInRiproduzione) {
      eraInRiproduzione = false;
      var p = audio.play();
      if (p && p.catch) p.catch(function () { riprovaAlProssimoTocco(); });
    }
  });

  /* ---------- countdown ---------- */
  function aggiornaCountdown() {
    var el = $('#countdown');
    var ms = new Date(CONFIG.inizio).getTime() - Date.now();
    if (ms <= 0) { el.textContent = 'Ci siamo!'; return; }
    var m = Math.floor(ms / 60000), g = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
    el.textContent = 'mancano ' + (g > 0 ? g + ' g ' : '') + h + ' h ' + mi + ' m';
  }

  /* ---------- chiusura ---------- */
  function chiudi() {
    eraInRiproduzione = false;
    audio.pause();
    try { window.close(); } catch (e) {}
    setTimeout(function () { if (!window.closed) mostra('fine'); }, 300);
  }

  /* ---------- testi dalla configurazione ---------- */
  function riempi() {
    document.querySelectorAll('[data-testo]').forEach(function (el) {
      var k = el.getAttribute('data-testo');
      if (CONFIG[k]) el.textContent = CONFIG[k];
    });
    // ogni voce resta intera sulla stessa riga ("White girl music" non si spezza, il puntino non va a capo da solo)
    function elenco(sel, voci) {
      var el = $(sel);
      el.textContent = '';
      voci.forEach(function (v, i) {
        if (i) el.appendChild(document.createTextNode(' '));
        var s = document.createElement('span');
        s.className = 'voce';
        s.textContent = v + (i < voci.length - 1 ? ' ·' : '');
        el.appendChild(s);
      });
    }
    elenco('#lineup', CONFIG.lineup);
    elenco('#lineup-ingresso', CONFIG.lineup);
    elenco('#generi', CONFIG.generi);
    elenco('#organizzatori', CONFIG.organizzatori);
    // nastro: due copie uguali, così lo scorrimento non ha stacchi
    var nastro = $('#nastro');
    if (nastro) {
      nastro.textContent = '';
      for (var k = 0; k < 2; k++) {
        CONFIG.nastro.forEach(function (v) {
          var s = document.createElement('span'); s.textContent = v; nastro.appendChild(s);
          var p = document.createElement('span'); p.className = 'punto'; p.textContent = '·'; nastro.appendChild(p);
        });
      }
    }
    $('#link-mappe').href = CONFIG.mappe;
    $('#btn-biglietto').href = CONFIG.linkBiglietto;
    ['#contatti-si', '#contatti-no'].forEach(function (sel) {
      var p = $(sel);
      p.textContent = 'Per info su WhatsApp: ';
      CONFIG.contatti.forEach(function (c, i) {
        if (i) p.appendChild(document.createTextNode(' · '));
        var a = document.createElement('a');
        a.href = 'https://wa.me/' + c.wa;
        a.target = '_blank'; a.rel = 'noopener';
        a.textContent = c.nome;
        p.appendChild(a);
      });
    });
  }

  /* ---------- avvio ---------- */
  riempi();
  aggiornaCountdown();
  setInterval(aggiornaCountdown, 20000);
  contaUnaVolta('v', 'visita');

  $('#btn-apri').addEventListener('click', function () {
    contaUnaVolta('a', 'apertura');
    avviaMusica();
    btnAudio.hidden = false;
    mostra('invito');
  });
  $('#btn-si').addEventListener('click', function () { contaRisposta('si'); preparaGruppo(); mostra('si'); });
  $('#btn-no').addEventListener('click', function () { contaRisposta('no'); mostra('no'); });
  $('#btn-cambio').addEventListener('click', function () {
    mostra('invito');
    setTimeout(function () { $('.domanda').scrollIntoView({ block: 'center' }); }, 60);
  });
  $('#btn-chiudi').addEventListener('click', chiudi);
  $('#btn-chiudi-2').addEventListener('click', chiudi);
  $('#btn-torna').addEventListener('click', function () {
    mostra(precedente === 'ingresso' ? 'ingresso' : precedente);
    if (precedente !== 'ingresso' && !utenteMuto) avviaMusica();
  });
  /* ---------- entrare nel gruppo WhatsApp ----------
     Sul telefono si apre direttamente l'app (whatsapp://chat/?code=…, lo stesso indirizzo che usa la pagina
     di invito di WhatsApp), così non si passa dalla pagina chat.whatsapp.com che in alcuni browser resta bianca.
     Sotto compaiono "Riprova" e "Copia il link" se l'app non si apre. Sul computer si apre la pagina di invito. */
  var suTelefono = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function linkGruppo() { return decodifica(CONFIG.gruppoCodificato); }
  function codiceGruppo(link) { var m = /^https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/.exec(link); return m ? m[1] : ''; }
  function preparaGruppo() {
    var a = $('#btn-gruppo'), link = linkGruppo();
    a.href = link || '#';
    if (link && !suTelefono) { a.target = '_blank'; a.rel = 'noopener'; } else { a.removeAttribute('target'); }
  }
  function apriApp(link) {
    var codice = codiceGruppo(link);
    if (!codice) { window.location.href = link; return; }
    window.location.href = 'whatsapp://chat/?code=' + codice;
  }
  function copiaTesto(t) {
    function vecchio() {
      var ta = document.createElement('textarea');
      ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { ta.setSelectionRange(0, t.length); } catch (e) {}
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); return ok;
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return vecchio(); });
    }
    return Promise.resolve(vecchio());
  }
  $('#btn-gruppo').addEventListener('click', function (e) {
    contaUnaVolta('g', 'gruppo');
    var link = linkGruppo();
    if (!link) { e.preventDefault(); $('#msg-gruppo').textContent = 'Il link del gruppo arriva a breve.'; return; }
    this.href = link;
    $('#msg-gruppo').textContent = '';
    if (suTelefono) {
      e.preventDefault();
      $('#aiuto-gruppo').hidden = false;
      apriApp(link);
    }
  });
  $('#btn-riprova').addEventListener('click', function () {
    var link = linkGruppo(); if (link) window.location.href = link;   // seconda strada: pagina di invito di WhatsApp
  });
  $('#btn-copia').addEventListener('click', function () {
    var link = linkGruppo(); if (!link) return;
    copiaTesto(link).then(function (ok) {
      $('#msg-gruppo').textContent = ok
        ? 'Link copiato. Incollalo in una chat WhatsApp (anche con te stesso) e toccalo.'
        : 'Copia questo link e incollalo in WhatsApp: ' + link;
    });
  });
  $('#btn-biglietto').addEventListener('click', function () { contaUnaVolta('b', 'biglietto'); });

  // Per le prove e per preparare il link del gruppo dalla console
  window.invito = {
    CONFIG: CONFIG, eventi: eventi, codificaLink: codificaLink, decodifica: decodifica,
    stato: leggi, azzera: function () { try { localStorage.removeItem(CHIAVE); } catch (e) {} memoria = {}; }
  };
})();
