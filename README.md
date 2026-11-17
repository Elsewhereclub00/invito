# invito

Pagina invito NYE 31.12 – Elsewhere Events.

- Invito: https://elsewhereclub00.github.io/invito/
- Statistiche (con password): https://elsewhereclub00.github.io/invito/statistiche.html

## Cosa si cambia e dove

| Cosa | File |
|---|---|
| Indirizzo del servizio conteggi (Apps Script `/exec`) | `config.js`, tra gli apici di `url` |
| Testi, line-up, generi, organizzatori, link biglietto | in cima ad `app.js` (blocco `CONFIG`) |
| Link del gruppo WhatsApp | `app.js` → `gruppoCodificato`. Per codificarlo: apri l'invito, console del browser, `invito.codificaLink('https://chat.whatsapp.com/...')` e incolla il risultato |
| Musica | `assets/musica.mp3` (stesso nome) |
| Anteprima WhatsApp | `assets/og.jpg` (1200×630). Dopo un cambio, nei messaggi nuovi usa il link con `?v=2` |

Conteggi anonimi: nessun dato personale, solo tipo di evento e ora.
