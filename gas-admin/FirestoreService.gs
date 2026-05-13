// ============================================================
//  FirestoreService.gs  (COMPARTIDO — copiar en ambos proyectos)
//  JWT auth + Firestore REST API v1 — lectura y escritura
//  Sin librerías externas — solo UrlFetchApp + Utilities
// ============================================================

// ── CONFIGURA AQUÍ TUS CREDENCIALES ─────────────────────────
const FS_CLIENT_EMAIL = 'TU_SERVICE_ACCOUNT@tu-proyecto.iam.gserviceaccount.com';
const FS_PROJECT_ID   = 'tu-proyecto-firebase';
const FS_PRIVATE_KEY  = '-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n';
// ── DOMINIO CORPORATIVO (para auto-registro) ────────────────
const DOMINIO_CORPORATIVO = 'bluex.cl';
// ────────────────────────────────────────────────────────────

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FS_PROJECT_ID}/databases/(default)/documents`;
const TOKEN_SCOPE    = 'https://www.googleapis.com/auth/datastore';
const TOKEN_AUD      = 'https://oauth2.googleapis.com/token';

let _cachedToken = null;
let _tokenExpiry = 0;

// ────────────────────────────────────────────────────────────
//  AUTH — JWT RS256
// ────────────────────────────────────────────────────────────

function _getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_cachedToken && now < _tokenExpiry) return _cachedToken;

  const header  = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss: FS_CLIENT_EMAIL, scope: TOKEN_SCOPE, aud: TOKEN_AUD,
    iat: now, exp: now + 3600,
  }));

  const toSign    = `${header}.${payload}`;
  const signature = Utilities.computeRsaSha256Signature(toSign, FS_PRIVATE_KEY);
  const jwt       = `${toSign}.${Utilities.base64EncodeWebSafe(signature)}`;

  const resp = UrlFetchApp.fetch(TOKEN_AUD, {
    method: 'post', contentType: 'application/x-www-form-urlencoded',
    payload: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    muteHttpExceptions: true,
  });

  const data = JSON.parse(resp.getContentText());
  if (!data.access_token) throw new Error(`Auth error: ${resp.getContentText()}`);

  _cachedToken = data.access_token;
  _tokenExpiry = now + 3300;
  return _cachedToken;
}

function _headers() {
  return { Authorization: `Bearer ${_getAccessToken()}`, 'Content-Type': 'application/json' };
}

// ────────────────────────────────────────────────────────────
//  LECTURA
// ────────────────────────────────────────────────────────────

function fsGetDocument(collection, docId) {
  const url  = `${FIRESTORE_BASE}/${collection}/${docId}`;
  const resp = UrlFetchApp.fetch(url, { headers: _headers(), muteHttpExceptions: true });
  if (resp.getResponseCode() === 404) return null;
  const raw = JSON.parse(resp.getContentText());
  if (raw.error) throw new Error(`fsGet: ${JSON.stringify(raw.error)}`);
  return _deserialize(raw);
}

function fsListCollection(collection, pageSize) {
  pageSize = pageSize || 300;
  let docs = [], pageToken = null;
  do {
    let url = `${FIRESTORE_BASE}/${collection}?pageSize=${pageSize}`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const resp = UrlFetchApp.fetch(url, { headers: _headers(), muteHttpExceptions: true });
    const data = JSON.parse(resp.getContentText());
    if (data.error) throw new Error(`fsList: ${JSON.stringify(data.error)}`);
    (data.documents || []).forEach(function(d) { docs.push(_deserialize(d)); });
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return docs;
}

function fsQuery(collection, filters, orderBy, limit) {
  var sq = { from: [{ collectionId: collection }] };

  if (filters && filters.length > 0) {
    var ff = filters.map(function(f) {
      return { fieldFilter: { field: { fieldPath: f.field }, op: f.op || 'EQUAL', value: _toFirestoreValue(f.value) } };
    });
    sq.where = ff.length === 1 ? ff[0] : { compositeFilter: { op: 'AND', filters: ff } };
  }
  if (orderBy) sq.orderBy = [{ field: { fieldPath: orderBy.field }, direction: orderBy.direction || 'ASCENDING' }];
  if (limit)   sq.limit = limit;

  var url  = `https://firestore.googleapis.com/v1/projects/${FS_PROJECT_ID}/databases/(default)/documents:runQuery`;
  var resp = UrlFetchApp.fetch(url, { method: 'post', headers: _headers(), payload: JSON.stringify({ structuredQuery: sq }), muteHttpExceptions: true });
  var results = JSON.parse(resp.getContentText());

  if (!Array.isArray(results)) {
    if (results.error) throw new Error(`fsQuery: ${JSON.stringify(results.error)}`);
    return [];
  }
  return results.filter(function(r) { return r.document; }).map(function(r) { return _deserialize(r.document); });
}

function fsBatchGet(collection, docIds) {
  if (!docIds || docIds.length === 0) return [];
  var documents = docIds.map(function(id) { return `${FIRESTORE_BASE}/${collection}/${id}`; });
  var url = `https://firestore.googleapis.com/v1/projects/${FS_PROJECT_ID}/databases/(default)/documents:batchGet`;
  var resp = UrlFetchApp.fetch(url, { method: 'post', headers: _headers(), payload: JSON.stringify({ documents: documents }), muteHttpExceptions: true });
  var results = JSON.parse(resp.getContentText());
  if (!Array.isArray(results)) return [];
  return results.filter(function(r) { return r.found; }).map(function(r) { return _deserialize(r.found); });
}

// ────────────────────────────────────────────────────────────
//  ESCRITURA
// ────────────────────────────────────────────────────────────

/**
 * Crea o sobreescribe un documento.
 * @param {string} collection
 * @param {string} docId         ID del documento (si null, Firestore genera uno).
 * @param {Object} data          Objeto JS plano con los campos.
 * @returns {Object}             Documento creado/actualizado.
 */
function fsSetDocument(collection, docId, data) {
  var fields = {};
  for (var k in data) {
    if (data.hasOwnProperty(k) && !k.startsWith('_')) {
      fields[k] = _toFirestoreValue(data[k]);
    }
  }

  var url, method;
  if (docId) {
    // PATCH con updateMask para no borrar campos que no envío
    url = `${FIRESTORE_BASE}/${collection}/${docId}`;
    method = 'patch';
  } else {
    // POST — Firestore genera el ID
    url = `${FIRESTORE_BASE}/${collection}`;
    method = 'post';
  }

  var resp = UrlFetchApp.fetch(url, {
    method: method, headers: _headers(),
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true,
  });

  var raw = JSON.parse(resp.getContentText());
  if (raw.error) throw new Error(`fsSet: ${JSON.stringify(raw.error)}`);
  return _deserialize(raw);
}

/**
 * Actualiza solo los campos especificados (merge parcial).
 * @param {string} collection
 * @param {string} docId
 * @param {Object} data          Solo los campos a actualizar.
 * @returns {Object}
 */
function fsUpdateFields(collection, docId, data) {
  var fields = {};
  var masks  = [];
  for (var k in data) {
    if (data.hasOwnProperty(k) && !k.startsWith('_')) {
      fields[k] = _toFirestoreValue(data[k]);
      masks.push(k);
    }
  }

  var url = `${FIRESTORE_BASE}/${collection}/${docId}?` +
            masks.map(function(m) { return 'updateMask.fieldPaths=' + encodeURIComponent(m); }).join('&');

  var resp = UrlFetchApp.fetch(url, {
    method: 'patch', headers: _headers(),
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true,
  });

  var raw = JSON.parse(resp.getContentText());
  if (raw.error) throw new Error(`fsUpdate: ${JSON.stringify(raw.error)}`);
  return _deserialize(raw);
}

/**
 * Elimina un documento.
 * @param {string} collection
 * @param {string} docId
 * @returns {boolean} true si se eliminó correctamente.
 */
function fsDeleteDocument(collection, docId) {
  var url  = `${FIRESTORE_BASE}/${collection}/${docId}`;
  var resp = UrlFetchApp.fetch(url, { method: 'delete', headers: _headers(), muteHttpExceptions: true });
  return resp.getResponseCode() === 200;
}

// ────────────────────────────────────────────────────────────
//  SERIALIZACIÓN / DESERIALIZACIÓN
// ────────────────────────────────────────────────────────────

function _deserialize(doc) {
  if (!doc) return null;
  var obj = {};
  var parts = (doc.name || '').split('/');
  obj._id   = parts[parts.length - 1];
  obj._path = doc.name || '';

  var fields = doc.fields || {};
  for (var key in fields) {
    if (fields.hasOwnProperty(key)) {
      obj[key] = _fromFirestoreValue(fields[key]);
    }
  }
  return obj;
}

function _fromFirestoreValue(val) {
  if (val.stringValue    !== undefined) return val.stringValue;
  if (val.integerValue   !== undefined) return Number(val.integerValue);
  if (val.doubleValue    !== undefined) return val.doubleValue;
  if (val.booleanValue   !== undefined) return val.booleanValue;
  if (val.nullValue      !== undefined) return null;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.referenceValue !== undefined) return val.referenceValue;
  if (val.arrayValue     !== undefined) return (val.arrayValue.values || []).map(_fromFirestoreValue);
  if (val.mapValue       !== undefined) {
    var map = {};
    var f = val.mapValue.fields || {};
    for (var k in f) { if (f.hasOwnProperty(k)) map[k] = _fromFirestoreValue(f[k]); }
    return map;
  }
  return null;
}

function _toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number')  return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'string')  return { stringValue: value };
  if (Array.isArray(value))       return { arrayValue: { values: value.map(_toFirestoreValue) } };
  if (value instanceof Date)      return { timestampValue: value.toISOString() };
  if (typeof value === 'object') {
    var fields = {};
    for (var k in value) { if (value.hasOwnProperty(k)) fields[k] = _toFirestoreValue(value[k]); }
    return { mapValue: { fields: fields } };
  }
  return { stringValue: String(value) };
}
