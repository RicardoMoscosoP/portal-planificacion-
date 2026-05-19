/**
 * firestore-download.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Descarga una colección de Firestore directamente vía REST API
 * usando el service account del proyecto.
 *
 * USO:
 *   node scripts/firestore-download.cjs <coleccion>
 *
 * EJEMPLOS:
 *   node scripts/firestore-download.cjs portafolios
 *   node scripts/firestore-download.cjs equipos
 *   node scripts/firestore-download.cjs usuarios
 *   node scripts/firestore-download.cjs equipos/eq_planificacion/bets
 *   node scripts/firestore-download.cjs equipos/eq_planificacion/presentaciones
 *
 * OUTPUT:
 *   scripts/output/<coleccion-safe>-YYYY-MM-DD.json
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const https  = require('https');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

// ─── CONFIGURACIÓN (mismas credenciales que Código-apps-script.gs) ───────────
const CONFIG = {
  client_email: 'firebase-adminsdk-fbsvc@site-equipo.iam.gserviceaccount.com',
  project_id:   'site-equipo',
  private_key:  `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC50mqvTimbxoo3
np1NhpfgVl9xq+OKwFu7Sip3tILG7H3gcIsu8JlNkaetHXN3ux36/0K2HBY+qoCR
PR+MMtkmWhwQ+G8GktG11HDP2AgXeVLybgUe4hS23T8hd8weQRKvJOzTItANbTLm
XztLjYJCg52oQNdxfNEDhEpL6iIqH003cRBwQ7sxPArEglFktpeYkMbqu3zPxPRt
Ag2hd2PigJxhXGrcmmcAVE/pe8w3NAQMnKj/j9eYAo1nAKrHpDdt2jHrC9vTv055
HVSf4pntnRnSxEKyaacG/SBBfiJ1v33QFuQf+tBOLI0pYINgSXazS8nTnrNmnw1O
cnynpLY7AgMBAAECggEAMVe0+ZEFTnaVfDhzp8LuMGVvGbWdidoTYbPLfBbkRSNG
N6Na6h98bdMYFcmEwE3hI6XFlqr1ozVOR4LWDjnwXJU/76ewf6vb4O8k96PzXhxa
0MIzPOSmwHoWifIQMxZvei+RbW1IltAg3Hh8O887QCNH6YYyT1HoBImL2wW0hb9v
M87ZFyArleydwZGfthVEAULzcYUB6C6DyHYgtglTi79TBmS9EYwQnboO6gPRvVEZ
b/KQAbGbeldnEUJ91wQL/49t1/V6rudC6j2McHPVfIE90HuPdVIJPadZsOmsE+Lv
EVi/FvIaKSsy4NtJfniolV93E5Qexr8+RiY4cHP4BQKBgQDg94eOYp5vQS2LLpCF
FnqrqpWnXzoSaU9g9ydWasB4iwijAWvEIYG7QyOeaTDrUFftfx/knF8urb3IEUu5
Ze2cIYcDmWszlRB3XdPpwq/Lh8i3JnRnquMxxH9VdN8+m8qTTp4Zg4BL40mPs8Mm
D5z1s1opAozi1hjh33fKC6mOnQKBgQDTdIYLVRVjRGlEXaJmti3T3sGWWt+MpMCO
XQ+iX7RyXHb8CL8x7rEMJ6e08x6U1OaJQ8P7QuYW8XqCfr+R3bmIqIgWuY1+oWf5
loocmL8Qj419npa/GmvFsbG8wvcYMqz9VMMNF7h4Fgu3KhLd+Dl7QT5Bjtjk+jRK
YPINz+GUtwKBgG1D7IQcpCUXPB6ovCrX8zbjwJItb1A39AT9pg6UBO3HYaeCbiwx
tggVIPy0zLzOJhbFMuFfjd9nJZFBzUy8E/9MTX5TCr1f/kJrwRx9odKyHavPMqST
XIv0i4AfJrsLAgYwHhv4Qd0aBMWWIweed7biqLzYb0NRh35VgqIQrgcFAoGBALWh
IEZ5pe5nY9hCaW26THDxpO0mT2D6Xx+p1fUOKewVemqQhNI6Cb+8DDTEo98JZKBB
IgUf+I16jFWs05ZSkrxMruB+L4i20Z20bhuUJIHwHIPrhebOpgXg1R+jhCU32hmc
BhKn7l7P6O5C6IPbZFx3tScQsUM1m1bMIP42MrjPAoGANheArL3ibUJmwtwLiL5c
dLqPSde8En12Ucv8TediVAynWHadNIZuxAqeJI0grFPhwIFdD8x8W7f0Mtqe6Yi6
uJMMYgxYfX3ixGEy9ibaCe56n1BR1dt0M9XRXKh9XBKAjpo3I5Yx2G9zgEEK9bPE
Y3Mvk9hl17GKu8xpeszdg/4=
-----END PRIVATE KEY-----`
};

// ─── HELPERS JWT / OAuth2 ────────────────────────────────────────────────────

function b64url(str) {
  return Buffer.from(str).toString('base64url');
}

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const now  = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim  = b64url(JSON.stringify({
      iss:   CONFIG.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud:   'https://oauth2.googleapis.com/token',
      exp:   now + 3600,
      iat:   now,
    }));
    const unsigned = `${header}.${claim}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsigned);
    const signature = sign.sign(CONFIG.private_key, 'base64url');
    const jwt = `${unsigned}.${signature}`;

    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path:     '/token',
      method:   'POST',
      headers:  { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.access_token) resolve(parsed.access_token);
          else reject(new Error('No access_token: ' + raw));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── HELPERS FIRESTORE ───────────────────────────────────────────────────────

function httpsGet(url, token) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Authorization: `Bearer ${token}` } }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('JSON parse error: ' + raw.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

function fromValue(val) {
  if (!val) return null;
  if ('nullValue'    in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue'  in val) return val.doubleValue;
  if ('stringValue'  in val) return val.stringValue;
  if ('arrayValue'   in val) return (val.arrayValue.values || []).map(fromValue);
  if ('mapValue'     in val) return fieldsToObj(val.mapValue.fields || {});
  return null;
}

function fieldsToObj(fields) {
  const obj = {};
  for (const k of Object.keys(fields || {})) obj[k] = fromValue(fields[k]);
  return obj;
}

async function getCollection(collectionPath, token) {
  const base = `https://firestore.googleapis.com/v1/projects/${CONFIG.project_id}/databases/(default)/documents`;
  const data = await httpsGet(`${base}/${collectionPath}`, token);
  if (!data.documents) return [];
  return data.documents.map(doc => {
    const obj = fieldsToObj(doc.fields || {});
    obj.id = doc.name.split('/').pop();
    return obj;
  });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const colArg = process.argv[2];
  if (!colArg) {
    console.log('USO:');
    console.log('  node scripts/firestore-download.cjs <coleccion>');
    console.log('');
    console.log('EJEMPLOS:');
    console.log('  node scripts/firestore-download.cjs portafolios');
    console.log('  node scripts/firestore-download.cjs equipos');
    console.log('  node scripts/firestore-download.cjs usuarios');
    console.log('  node scripts/firestore-download.cjs equipos/eq_planificacion/bets');
    console.log('  node scripts/firestore-download.cjs equipos/eq_planificacion/presentaciones');
    process.exit(1);
  }

  console.log(`\n📦 Descargando colección: ${colArg}`);
  console.log('⏳ Obteniendo token OAuth2...');

  const token = await getAccessToken();
  console.log('✅ Token obtenido');

  console.log(`🔍 Leyendo Firestore: ${colArg}...`);
  const docs = await getCollection(colArg, token);

  if (docs.length === 0) {
    console.log('⚠️  La colección está vacía o no existe.');
  } else {
    console.log(`✅ ${docs.length} documento(s) encontrado(s)`);
  }

  // Guardar archivo
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const safeName  = colArg.replace(/\//g, '__');
  const dateStr   = new Date().toISOString().slice(0, 10);
  const outFile   = path.join(outputDir, `${safeName}-${dateStr}.json`);

  fs.writeFileSync(outFile, JSON.stringify(docs, null, 2), 'utf8');
  console.log(`\n💾 Guardado en: ${outFile}`);
  console.log(`   ${docs.length} documentos, ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB\n`);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
