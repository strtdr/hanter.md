/**
 * Hanter.md – primește comenzile din configurator.
 * Fiecare comandă: rând nou în foaia „Comenzi”, email către proprietarul scriptului
 * și (opțional) mesaj pe Telegram.
 *
 * Setări (Project Settings → Script properties):
 *   SHEET_ID         – ID-ul tabelului Google „Comenzi Hanter”
 *   TELEGRAM_TOKEN   – tokenul botului de la @BotFather (opțional)
 *   TELEGRAM_CHAT_ID – ID-ul chatului tău cu botul (opțional)
 *   NOTIFY_EMAIL     – altă adresă pentru email (opțional; implicit contul care a publicat scriptul)
 */
const HEADERS = ['Data', 'Tip', 'Telefon', 'Nume', 'Contact preferat', 'Mașina', 'Generația / anul',
  'Motorizare', 'Salon', 'Varianta salon', 'Piele', 'Protecție', 'Portbagaj', 'Varianta portbagaj',
  'Total (lei)', 'Mesaj complet', 'Pagina', 'Status', 'Cod reducere'];

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  let d = {};
  try { d = JSON.parse(e.postData.contents || '{}'); } catch (err) { return out_({ ok: false, error: 'bad json' }); }
  const clean = v => String(v == null ? '' : v).slice(0, 2000).replace(/^[=+\-@]/, "'$&"); // fără formule injectate
  const when = Utilities.formatDate(new Date(), 'Europe/Chisinau', 'dd.MM.yyyy HH:mm');
  const row = [when, d.kind, d.phone ? "'" + String(d.phone).replace(/^'/, '') : '', d.name, d.via, d.car, d.gen, d.fuel, d.salon, d.salonVariant,
    d.leather, d.protection, d.trunk, d.trunkVariant, d.total, d.message, d.page, 'Nouă', d.promo].map((v, i) => (i === 0 || i === 2) ? v : clean(v));

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
    const sh = ss.getSheetByName('Comenzi') || ss.getSheets()[0];
    if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold'); }
    sh.appendRow(row);
  } finally { lock.releaseLock(); }

  const text = [
    (d.kind === 'model negăsit' ? '🔎 Model negăsit' : '🛒 Comandă nouă') + ' – Hanter.md',
    'Telefon: ' + (d.phone || '—') + (d.via ? ' (' + d.via + ')' : '') + (d.name ? ' · ' + d.name : ''),
    'Mașina: ' + [d.car, d.gen, d.fuel].filter(String).join(', '),
    d.salon ? 'Salon: ' + d.salon + (d.salonVariant ? ' · ' + d.salonVariant : '') : '',
    d.leather ? 'Piele: ' + d.leather : '',
    d.protection ? 'Protecție: ' + d.protection : '',
    d.trunk ? 'Portbagaj: ' + d.trunk + (d.trunkVariant ? ' · ' + d.trunkVariant : '') : '',
    d.total !== undefined && d.total !== '' ? 'Total: ' + d.total + (isNaN(d.total) ? '' : ' lei') : '',
    d.promo ? '🎟 Cod: ' + d.promo : ''
  ].filter(String).join('\n');

  try {
    const to = props.getProperty('NOTIFY_EMAIL') || Session.getEffectiveUser().getEmail();
    MailApp.sendEmail(to, (d.kind === 'model negăsit' ? 'Model negăsit' : 'Comandă nouă') + ' Hanter.md – ' + (d.car || '') + ' – ' + (d.phone || ''), text + '\n\n' + (d.message || ''));
  } catch (err) { console.error('email', err); }

  const token = props.getProperty('TELEGRAM_TOKEN'), chat = props.getProperty('TELEGRAM_CHAT_ID');
  if (token && chat) {
    try {
      UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'post', contentType: 'application/json', muteHttpExceptions: true,
        payload: JSON.stringify({ chat_id: chat, text: text })
      });
    } catch (err) { console.error('telegram', err); }
  }
  return out_({ ok: true });
}

function doGet() { return out_({ ok: true, service: 'Hanter.md comenzi' }); }

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Rulează o dată din editor ca să afli TELEGRAM_CHAT_ID după ce i-ai scris botului „/start”. */
function aflaTelegramChatId() {
  const token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  const r = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates').getContentText());
  (r.result || []).forEach(u => { const m = u.message || u.channel_post; if (m) console.log('chat_id =', m.chat.id, m.chat.first_name || m.chat.title || ''); });
}

/** Test: trimite o comandă de probă în tabel, pe email și pe Telegram. */
function testComanda() {
  doPost({ postData: { contents: JSON.stringify({ kind: 'test', phone: '069000000', name: 'Test', via: 'Viber', car: 'Toyota RAV4', gen: '2012–2018 · IV (XA40)', salon: 'Cu acoperire praguri', leather: 'Piele mat: negru cu ață bej', protection: 'Plastic cu fire, negru', total: 5400, message: 'Comandă de test' }) } });
}
