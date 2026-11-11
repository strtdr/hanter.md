/**
 * Hanter.md – primește comenzile din configurator.
 * Fiecare comandă: rând nou în foaia „Comenzi” (cu număr de comandă H-XXXXX) și mesaj pe Telegram.
 * Pagina „Starea comenzii” (/test/comanda/) citește starea prin doGet.
 *
 * Setări (Project Settings → Script properties):
 *   SHEET_ID         – ID-ul tabelului Google „Comenzi Hanter”
 *   TELEGRAM_TOKEN   – tokenul botului de la @BotFather (opțional)
 *   TELEGRAM_CHAT_ID – ID-ul chatului tău cu botul (opțional)
 */
const HEADERS = ['Data', 'Tip', 'Telefon', 'Nume', 'Contact preferat', 'Mașina', 'Generația / anul',
  'Motorizare', 'Salon', 'Varianta salon', 'Piele', 'Protecție', 'Portbagaj', 'Varianta portbagaj',
  'Total (lei)', 'Mesaj complet', 'Pagina', 'Status', 'Cod reducere', 'Nr. comandă'];

// Stările comenzii, în ordine. Textul trebuie să fie identic cu cel din TinaCMS (Test · Configurator → Stări comandă).
const STATUSES = ['Așteptare confirmare', 'Confirmată', 'Așteptare tăiere', 'Tăiat', 'Pregătit pentru probă', 'Probă finalizată', 'Finisat', 'Pregătit de instalare / livrare', 'Instalat / livrat', 'Anulată'];

function sheet_() {
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  return ss.getSheetByName('Comenzi') || ss.getSheets()[0];
}

/** Coloanele după antet; adaugă la capăt antetele care lipsesc (tabelul vechi rămâne valabil). */
function cols_(sh) {
  if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold'); }
  const head = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(String);
  HEADERS.forEach(h => { if (head.indexOf(h) < 0) { head.push(h); sh.getRange(1, head.length).setValue(h).setFontWeight('bold'); } });
  const m = {}; head.forEach((h, i) => { if (h) m[h] = i + 1; });
  return { m: m, n: head.length };
}

/** Număr de comandă scurt, ușor de dictat: H-7K2QX (fără 0/O/1/I). */
function newId_() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = '';
  for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
  return 'H-' + s;
}

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  let d = {};
  try { d = JSON.parse(e.postData.contents || '{}'); } catch (err) { return out_({ ok: false, error: 'bad json' }); }
  const clean = v => String(v == null ? '' : v).slice(0, 2000).replace(/^[=+\-@]/, "'$&"); // fără formule injectate
  const when = Utilities.formatDate(new Date(), 'Europe/Chisinau', 'dd.MM.yyyy HH:mm');
  const id = /^H-[A-Z0-9]{5}$/.test(String(d.orderId || '')) ? d.orderId : newId_();
  const vals = {
    'Data': when, 'Tip': clean(d.kind), 'Telefon': d.phone ? "'" + String(d.phone).replace(/^'/, '') : '',
    'Nume': clean(d.name), 'Contact preferat': clean(d.via), 'Mașina': clean(d.car), 'Generația / anul': clean(d.gen),
    'Motorizare': clean(d.fuel), 'Salon': clean(d.salon), 'Varianta salon': clean(d.salonVariant), 'Piele': clean(d.leather),
    'Protecție': clean(d.protection), 'Portbagaj': clean(d.trunk), 'Varianta portbagaj': clean(d.trunkVariant),
    'Total (lei)': clean(d.total), 'Mesaj complet': clean(d.message), 'Pagina': clean(d.page),
    'Status': STATUSES[0], 'Cod reducere': clean(d.promo), 'Nr. comandă': id
  };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_(), c = cols_(sh), row = new Array(c.n).fill('');
    Object.keys(vals).forEach(k => { if (c.m[k]) row[c.m[k] - 1] = vals[k]; });
    sh.appendRow(row);
  } finally { lock.releaseLock(); }

  const text = [
    (d.kind === 'model negăsit' ? '🔎 Model negăsit' : '🛒 Comandă nouă ' + id) + ' – Hanter.md',
    'Telefon: ' + (d.phone || '—') + (d.via ? ' (' + d.via + ')' : '') + (d.name ? ' · ' + d.name : ''),
    d.kind === 'model negăsit'
      ? ['Mașina: ' + (d.car || '—'), d.gen ? 'Anul: ' + d.gen : '', d.fuel ? 'Detalii: ' + d.fuel : '', 'Răspunde clientului cu tiparul și prețul.'].filter(String).join('\n')
      : 'Mașina: ' + [d.car, d.gen, d.fuel].filter(String).join(', '),
    d.salon ? 'Salon: ' + d.salon + (d.salonVariant ? ' · ' + d.salonVariant : '') : '',
    d.leather ? 'Piele: ' + d.leather : '',
    d.protection ? 'Protecție: ' + d.protection : '',
    d.trunk ? 'Portbagaj: ' + d.trunk + (d.trunkVariant ? ' · ' + d.trunkVariant : '') : '',
    d.total !== undefined && d.total !== '' ? 'Total: ' + d.total + (isNaN(d.total) ? '' : ' lei') : '',
    d.promo ? '🎟 Cod: ' + d.promo : ''
  ].filter(String).join('\n');

  const token = props.getProperty('TELEGRAM_TOKEN'), chat = props.getProperty('TELEGRAM_CHAT_ID');
  if (token && chat) {
    try {
      UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'post', contentType: 'application/json', muteHttpExceptions: true,
        payload: JSON.stringify({ chat_id: chat, text: text })
      });
    } catch (err) { console.error('telegram', err); }
  }
  return out_({ ok: true, id: id });
}

/**
 * Pagina „Starea comenzii” întreabă: ?nr=H-7K2QX&tel=1234 (ultimele 4 cifre ale telefonului).
 * Răspunde doar cu starea și mașina, fără nume sau telefon.
 */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!p.nr) return out_({ ok: true, service: 'Hanter.md comenzi' });
  const nr = String(p.nr).trim().toUpperCase().replace(/^H?-?/, 'H-');
  const tel = String(p.tel || '').replace(/\D/g, '');
  if (!/^H-[A-Z0-9]{5}$/.test(nr) || tel.length !== 4) return out_({ ok: false, error: 'date incomplete' });
  const sh = sheet_(), c = cols_(sh), last = sh.getLastRow();
  if (last < 2 || !c.m['Nr. comandă']) return out_({ ok: false, error: 'negăsit' });
  const rows = sh.getRange(2, 1, last - 1, c.n).getDisplayValues();
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i], g = k => c.m[k] ? r[c.m[k] - 1] : '';
    if (g('Nr. comandă').toUpperCase() !== nr) continue;
    if (g('Telefon').replace(/\D/g, '').slice(-4) !== tel) break;
    return out_({ ok: true, nr: nr, status: g('Status'), date: g('Data'), car: [g('Mașina'), g('Generația / anul')].filter(String).join(' · '),
      salon: g('Salon'), trunk: g('Portbagaj'), total: g('Total (lei)') });
  }
  return out_({ ok: false, error: 'negăsit' });
}

/** Rulează o dată: pune lista derulantă cu stările în coloana „Status”. */
function seteazaListaStatus() {
  const sh = sheet_(), c = cols_(sh);
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES.concat(['Nouă']), true).setAllowInvalid(true).build();
  sh.getRange(2, c.m['Status'], sh.getMaxRows() - 1, 1).setDataValidation(rule);
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Rulează o dată din editor ca să afli TELEGRAM_CHAT_ID după ce i-ai scris botului „/start”. */
function aflaTelegramChatId() {
  const token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  const r = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates').getContentText());
  (r.result || []).forEach(u => { const m = u.message || u.channel_post; if (m) console.log('chat_id =', m.chat.id, m.chat.first_name || m.chat.title || ''); });
}

/** Test: trimite o comandă de probă în tabel și pe Telegram. */
function testComanda() {
  doPost({ postData: { contents: JSON.stringify({ kind: 'test', phone: '069000000', name: 'Test', via: 'Viber', car: 'Toyota RAV4', gen: '2012–2018 · IV (XA40)', salon: 'Cu acoperire praguri', leather: 'Piele mat: negru cu ață bej', protection: 'Plastic cu fire, negru', total: 5400, message: 'Comandă de test' }) } });
}
