/* Pagina statistiche dell'invito NYE 26/27 */
(function () {
  'use strict';

  var CONFIG = {
    // Indirizzo /exec dei conteggi: si cambia in config.js. Vuoto = dati di esempio.
    conteggiUrl: (window.NYE_CONTEGGI && window.NYE_CONTEGGI.url) || '',
    ogniSecondi: 60
  };

  var $ = function (s) { return document.querySelector(s); };
  var CHIAVE_PIN = 'nye_statistiche_pin';
  var timer = null;

  function leggiPin() { try { return sessionStorage.getItem(CHIAVE_PIN) || ''; } catch (e) { return ''; } }
  function salvaPin(p) { try { sessionStorage.setItem(CHIAVE_PIN, p); } catch (e) {} }
  function togliPin() { try { sessionStorage.removeItem(CHIAVE_PIN); } catch (e) {} }
  var pinInMemoria = '';

  var num = function (n) { return Number(n || 0).toLocaleString('it-IT'); };
  var perc = function (a, b) { return b > 0 ? Math.round(a / b * 100) + '%' : '–'; };

  function stato(testo) { $('#stato').textContent = testo; }

  function mostraAccesso(errore) {
    $('#accesso').hidden = false;
    $('#contenuto').hidden = true;
    $('#azioni').hidden = true;
    $('#errore').textContent = errore || '';
    stato('');
    setTimeout(function () { $('#pin').focus(); }, 30);
  }

  function disegna(d) {
    var t = d.totali;
    $('#n-visite').textContent = num(t.visite);
    $('#n-aperture').textContent = num(t.aperture);
    $('#n-si').textContent = num(t.si);
    $('#n-no').textContent = num(t.no);
    $('#n-biglietto').textContent = num(t.biglietto);
    $('#n-gruppo').textContent = num(t.gruppo);
    $('#n-cambi').textContent = num(t.cambiIdea);
    var risposte = Math.max(0, t.si) + Math.max(0, t.no);
    $('#p-si').textContent = risposte ? perc(t.si, risposte) + ' di chi ha risposto' : '';
    $('#p-no').textContent = risposte ? perc(t.no, risposte) + ' di chi ha risposto' : '';

    var passi = [
      ['Link aperti', t.visite],
      ['Inviti aperti', t.aperture],
      ['Hanno risposto', risposte],
      ['Sono interessati', t.si],
      ['Clic biglietto', t.biglietto],
      ['Clic gruppo', t.gruppo]
    ];
    var max = Math.max(1, t.visite, t.aperture);
    var box = $('#percorso');
    box.textContent = '';
    passi.forEach(function (p) {
      var riga = document.createElement('div'); riga.className = 'passo';
      var nome = document.createElement('span'); nome.className = 'nome'; nome.textContent = p[0];
      var fondo = document.createElement('div'); fondo.className = 'barra-fondo';
      var piena = document.createElement('div'); piena.className = 'barra-piena';
      piena.style.width = Math.min(100, Math.max(0, p[1]) / max * 100).toFixed(1) + '%';
      fondo.appendChild(piena);
      var val = document.createElement('span'); val.className = 'valore'; val.textContent = num(p[1]);
      riga.appendChild(nome); riga.appendChild(fondo); riga.appendChild(val);
      box.appendChild(riga);
    });

    var corpo = $('#giorni');
    corpo.textContent = '';
    var giorni = (d.giorni || []).slice().reverse();
    if (!giorni.length) {
      var vuota = document.createElement('tr');
      var c = document.createElement('td'); c.colSpan = 7; c.textContent = 'Ancora nessun dato: i numeri compaiono appena qualcuno apre il link.';
      c.style.textAlign = 'left';
      vuota.appendChild(c); corpo.appendChild(vuota);
    }
    giorni.forEach(function (g) {
      var tr = document.createElement('tr');
      var p = g.giorno.split('-');
      var data = new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' });
      [data, g.visite, g.aperture, g.si, g.no, g.biglietto, g.gruppo].forEach(function (v, i) {
        var td = document.createElement('td'); td.textContent = i ? num(v) : v; tr.appendChild(td);
      });
      corpo.appendChild(tr);
    });

    $('#accesso').hidden = true;
    $('#contenuto').hidden = false;
    $('#azioni').hidden = false;
    var ora = d.aggiornato ? new Date(d.aggiornato) : new Date();
    stato('Aggiornato alle ' + ora.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + ' · si aggiorna da solo ogni minuto');
  }

  function carica(pin) {
    if (!CONFIG.conteggiUrl) { disegna(esempio()); return Promise.resolve(); }
    stato('Aggiorno…');
    return fetch(CONFIG.conteggiUrl, {
      method: 'POST', credentials: 'omit', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ azione: 'totali', pin: pin })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok) { pinInMemoria = pin; salvaPin(pin); disegna(d); return; }
      if (d && d.motivo === 'pin') { togliPin(); pinInMemoria = ''; mostraAccesso('Password sbagliata. Riprova.'); return; }
      stato('Il servizio non ha risposto bene. Riprovo tra un minuto.');
    }).catch(function () {
      stato('Non riesco a collegarmi. Controlla la connessione: riprovo tra un minuto.');
    });
  }

  function aggiornaDaSolo() {
    clearInterval(timer);
    timer = setInterval(function () {
      if (document.hidden) return;
      var pin = pinInMemoria || leggiPin();
      if (pin || !CONFIG.conteggiUrl) carica(pin);
    }, CONFIG.ogniSecondi * 1000);
  }

  function esempio() {
    var oggi = new Date();
    var giorni = [];
    var base = [[40, 34, 22, 6, 9, 15], [85, 70, 46, 11, 18, 33], [120, 101, 66, 17, 27, 49]];
    base.forEach(function (b, i) {
      var d = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() - (base.length - 1 - i));
      var g = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      giorni.push({ giorno: g, visite: b[0], aperture: b[1], si: b[2], no: b[3], biglietto: b[4], gruppo: b[5] });
    });
    var tot = { visite: 0, aperture: 0, si: 0, no: 0, biglietto: 0, gruppo: 0, cambiIdea: 4 };
    giorni.forEach(function (g) { ['visite', 'aperture', 'si', 'no', 'biglietto', 'gruppo'].forEach(function (k) { tot[k] += g[k]; }); });
    return { ok: true, totali: tot, giorni: giorni, aggiornato: new Date().toISOString() };
  }

  $('#accesso').addEventListener('submit', function (e) {
    e.preventDefault();
    var pin = $('#pin').value.trim();
    if (!pin) { $('#errore').textContent = 'Scrivi la password.'; return; }
    $('#errore').textContent = '';
    carica(pin);
  });
  $('#pin').addEventListener('input', function () { $('#errore').textContent = ''; });
  $('#btn-aggiorna').addEventListener('click', function () { carica(pinInMemoria || leggiPin()); });
  $('#btn-esci').addEventListener('click', function () { togliPin(); pinInMemoria = ''; $('#pin').value = ''; mostraAccesso(''); });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !$('#contenuto').hidden) carica(pinInMemoria || leggiPin());
  });

  if (!CONFIG.conteggiUrl) {
    $('#esempio').hidden = false;
    $('#btn-esci').hidden = true;
    disegna(esempio());
  } else if (leggiPin()) {
    carica(leggiPin());
  } else {
    mostraAccesso('');
  }
  aggiornaDaSolo();

  window.statistiche = { CONFIG: CONFIG, carica: carica };
})();
