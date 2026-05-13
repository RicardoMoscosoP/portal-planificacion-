/**
 * ARCHIVO: Código.gs  — VERSIÓN LIMPIA (sin duplicados)
 * DESCRIPCIÓN: Servidor Maestro para Portal Hub Blue Express
 * ACCIONES: CRUD completo hacia Firestore y servicio de App Web
 * SEED: seedCompleto() recibe todo el mock y lo carga en Firestore de una vez.
 */

// ─── CONFIGURACIÓN GLOBAL ────────────────────────────────────────────────────
const CONFIG = {
  client_email: "firebase-adminsdk-fbsvc@site-equipo.iam.gserviceaccount.com",
  project_id: "site-equipo",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC50mqvTimbxoo3\nnp1NhpfgVl9xq+OKwFu7Sip3tILG7H3gcIsu8JlNkaetHXN3ux36/0K2HBY+qoCR\nPR+MMtkmWhwQ+G8GktG11HDP2AgXeVLybgUe4hS23T8hd8weQRKvJOzTItANbTLm\nXztLjYJCg52oQNdxfNEDhEpL6iIqH003cRBwQ7sxPArEglFktpeYkMbqu3zPxPRt\nAg2hd2PigJxhXGrcmmcAVE/pe8w3NAQMnKj/j9eYAo1nAKrHpDdt2jHrC9vTv055\nHVSf4pntnRnSxEKyaacG/SBBfiJ1v33QFuQf+tBOLI0pYINgSXazS8nTnrNmnw1O\ncnynpLY7AgMBAAECggEAMVe0+ZEFTnaVfDhzp8LuMGVvGbWdidoTYbPLfBbkRSNG\nN6Na6h98bdMYFcmEwE3hI6XFlqr1ozVOR4LWDjnwXJU/76ewf6vb4O8k96PzXhxa\n0MIzPOSmwHoWifIQMxZvei+RbW1IltAg3Hh8O887QCNH6YYyT1HoBImL2wW0hb9v\nM87ZFyArleydwZGfthVEAULzcYUB6C6DyHYgtglTi79TBmS9EYwQnboO6gPRvVEZ\nb/KQAbGbeldnEUJ91wQL/49t1/V6rudC6j2McHPVfIE90HuPdVIJPadZsOmsE+Lv\nEVi/FvIaKSsy4NtJfniolV93E5Qexr8+RiY4cHP4BQKBgQDg94eOYp5vQS2LLpCF\nFnqrqpWnXzoSaU9g9ydWasB4iwijAWvEIYG7QyOeaTDrUFftfx/knF8urb3IEUu5\nZe2cIYcDmWszlRB3XdPpwq/Lh8i3JnRnquMxxH9VdN8+m8qTTp4Zg4BL40mPs8Mm\nD5z1s1opAozi1hjh33fKC6mOnQKBgQDTdIYLVRVjRGlEXaJmti3T3sGWWt+MpMCO\nXQ+iX7RyXHb8CL8x7rEMJ6e08x6U1OaJQ8P7QuYW8XqCfr+R3bmIqIgWuY1+oWf5\nloocmL8Qj419npa/GmvFsbG8wvcYMqz9VMMNF7h4Fgu3KhLd+Dl7QT5Bjtjk+jRK\nYPINz+GUtwKBgG1D7IQcpCUXPB6ovCrX8zbjwJItb1A39AT9pg6UBO3HYaeCbiwx\ntggVIPy0zLzOJhbFMuFfjd9nJZFBzUy8E/9MTX5TCr1f/kJrwRx9odKyHavPMqST\nXIv0i4AfJrsLAgYwHhv4Qd0aBMWWIweed7biqLzYb0NRh35VgqIQrgcFAoGBALWh\nIEZ5pe5nY9hCaW26THDxpO0mT2D6Xx+p1fUOKewVemqQhNI6Cb+8DDTEo98JZKBB\nIgUf+I16jFWs05ZSkrxMruB+L4i20Z20bhuUJIHwHIPrhebOpgXg1R+jhCU32hmc\nBhKn7l7P6O5C6IPbZFx3tScQsUM1m1bMIP42MrjPAoGANheArL3ibUJmwtwLiL5c\ndLqPSde8En12Ucv8TediVAynWHadNIZuxAqeJI0grFPhwIFdD8x8W7f0Mtqe6Yi6\nuJMMYgxYfX3ixGEy9ibaCe56n1BR1dt0M9XRXKh9XBKAjpo3I5Yx2G9zgEEK9bPE\nY3Mvk9hl17GKu8xpeszdg/4=\n-----END PRIVATE KEY-----\n"
};

// --- FUNCIONES DE BASE DE DATOS ---

/**
 * LECTURA — Portafolios con sus equipos.
 * Llama a Firestore REST API para leer la colección 'portafolios' y luego
 * para cada portafolio lee la subcolección 'portafolios/{id}/equipos'.
 * Retorna: Array de portafolios con campo 'equipos' incluido.
 * Usado por: verificarLectura(), verificarLecturaGAS().
 */
function obtenerPortafolios() {
  var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, "https://www.googleapis.com/auth/datastore");
  var portafoliosList = firestoreGetCollectionT('portafolios', token);

  return portafoliosList.map(function(port) {
    // Leer subcolección equipos
    var equipos = firestoreGetCollectionT('portafolios/' + port.id + '/equipos', token);
    return Object.assign({}, port, { equipos: equipos });
  });
}

/**
 * ESCRITURA — Crear o actualizar portafolio en Firestore.
 * Si el objeto trae campo 'id' lo usa como docId; si no, genera uno
 * con timestamp+random para evitar colisiones.
 * Separa la subcolección 'equipos' del portafolio antes de escribir
 * para mantener la estructura 'portafolios/{id}/equipos/{eqId}'.
 * Retorna: string con el id del portafolio creado/actualizado.
 * Llamado por: el panel Admin de Portafolios vía google.script.run.
 */
function guardarPortafolio(objeto) {
  var idDoc = objeto.id || ("portafolio_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000));
  var equipos = objeto.equipos || [];
  var portData = {};
  for (var k in objeto) {
    if (k !== 'equipos' && Object.prototype.hasOwnProperty.call(objeto, k)) portData[k] = objeto[k];
  }
  portData.activo = objeto.activo !== false;
  var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
  firestoreSet('portafolios', idDoc, portData, token);
  equipos.forEach(function(eq) {
    firestoreSet('portafolios/' + idDoc + '/equipos', eq.id || ('eq_' + new Date().getTime()), eq, token);
  });
  return idDoc;
}

/**
 * ESCRITURA MASIVA — Insertar múltiples portafolios de una vez.
 * Itera sobre el array 'lista' llamando guardarPortafolio() por cada elemento.
 * Útil para cargas iniciales de datos de prueba desde la consola de Apps Script.
 * Retorna: mensaje de éxito o error como string.
 */
function cargarMasivo(lista) {
  try {
    lista.forEach(item => guardarPortafolio(item));
    return "✅ " + lista.length + " elementos cargados correctamente.";
  } catch (e) {
    return "❌ Error: " + e.toString();
  }
}

// --- SERVICIO DE LA APP WEB ---

/**
 * HEALTHCHECK HTTP — Verificar que Firestore responde.
 * Endpoint HTTP: ?action=healthcheck
 * Intenta leer el documento 'status/heartbeat' en Firestore y verifica
 * que el campo 'alive' sea true. Si el documento no existe, retorna
 * ok:false con warning (sin bloquear). Solo accesible vía doGet.
 * Retorna: ContentService.TextOutput con JSON { ok, status }.
 */
function healthcheck() {
  try {
    // Intentar leer un documento dummy o la colección 'status'
    const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.project_id}/databases/(default)/documents/status/heartbeat`;
    const token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, "https://www.googleapis.com/auth/datastore");
    const opciones = {
      "method": "get",
      "headers": { "Authorization": "Bearer " + token },
      "muteHttpExceptions": true
    };
    const respuesta = UrlFetchApp.fetch(url, opciones);
    const datos = JSON.parse(respuesta.getContentText());
    if (datos.fields && datos.fields.alive && datos.fields.alive.booleanValue === true) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, status: "alive" })).setMimeType(ContentService.MimeType.JSON);
    }
    // Si no existe el doc, igual responde OK pero con warning
    return ContentService.createTextOutput(JSON.stringify({ ok: false, status: "no heartbeat doc" })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ENTRY POINT HTTP — Google Apps Script Web App.
 * Recibe todas las peticiones GET al script publicado.
 * - Sin parámetros: sirve la SPA React (index.html compilado con viteSingleFile).
 * - ?action=healthcheck: ejecuta healthcheck() → verifica conexión Firestore.
 * - ?action=verificarLectura: ejecuta verificarLectura() → cuenta portafolios.
 * El HTML se publica con XFrameOptionsMode.ALLOWALL para poder embeberse
 * en Google Sites u otros iframes.
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    if (e.parameter.action === "healthcheck") return healthcheck();
    if (e.parameter.action === "verificarLectura") return verificarLectura();
    // Aquí puedes agregar más endpoints si lo deseas
  }
  // Si no hay action, sirve la web normal:
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Portafolio')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// --- MOTOR DE SEGURIDAD (TOKEN) ---

/**
 * MÓDULO JWT — Autenticación con Google Service Account.
 * Genera un token OAuth2 usando el flujo JWT de Google (RFC 7523).
 * Pasos internos:
 *   1. Codifica header + claim como base64url.
 *   2. Firma con la private_key RSA-SHA256 del service account.
 *   3. Intercambia el JWT firmado por un access_token en oauth2.googleapis.com.
 * El token tiene duración de 1 hora. Se genera una vez por operación.
 * Uso: ServiceAccountApp.getAccessToken(email, key, scope)
 * Scope requerido para Firestore: 'https://www.googleapis.com/auth/datastore'
 */
var ServiceAccountApp = (function() {
  function getAccessToken(email, key, scope) {
    const header = JSON.stringify({ "alg": "RS256", "typ": "JWT" });
    const claim = JSON.stringify({
      "iss": email, "scope": scope, "aud": "https://oauth2.googleapis.com/token",
      "exp": Math.floor(Date.now() / 1000) + 3600, "iat": Math.floor(Date.now() / 1000)
    });
    const signature = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(Utilities.base64EncodeWebSafe(header) + "." + Utilities.base64EncodeWebSafe(claim), key));
    const jwt = Utilities.base64EncodeWebSafe(header) + "." + Utilities.base64EncodeWebSafe(claim) + "." + signature;
    const response = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
      "method": "post",
      "payload": { "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": jwt }
    });
    return JSON.parse(response.getContentText()).access_token;
  }
  return { getAccessToken: getAccessToken };
})();

/**
 * HEALTHCHECK HTTP — Verificar lectura de portafolios.
 * Endpoint HTTP: ?action=verificarLectura
 * Llama a obtenerPortafolios() y retorna cuántos portafolios existen.
 * SOLO para uso vía URL (GET request), NO para google.script.run
 * porque retorna ContentService.TextOutput que no es serializable por GAS.
 * Para google.script.run usar verificarLecturaGAS().
 * Retorna: ContentService.TextOutput con JSON { ok, empty, count, message }.
 */
function verificarLectura() {
  try {
    const datos = obtenerPortafolios();
    if (datos.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, empty: true, count: 0, message: "La colección 'portafolios' está vacía." }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, empty: false, count: datos.length, message: `Se encontraron ${datos.length} portafolios.` }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * VERIFICAR LECTURA (para google.script.run):
 * Igual que verificarLectura pero retorna objeto plano (no ContentService).
 * google.script.run NO puede serializar ContentService.TextOutput.
 */
function verificarLecturaGAS() {
  try {
    const datos = obtenerPortafolios();
    if (datos.length === 0) {
      return { ok: true, empty: true, count: 0, message: "La colección 'portafolios' está vacía." };
    } else {
      return { ok: true, empty: false, count: datos.length, message: "Se encontraron " + datos.length + " portafolios." };
    }
  } catch (e) {
    return { ok: false, error: e.message };
  }
}


// ─── helpers LECTURA: Firestore REST → JS ────────────────────────────────────

/**
 * CONVERSIÓN — Valor Firestore → JavaScript.
 * Firestore REST API retorna valores tipados:
 *   { stringValue: 'hola' }, { integerValue: '5' }, { booleanValue: true },
 *   { arrayValue: { values: [...] } }, { mapValue: { fields: {...} } }, etc.
 * Esta función los convierte a primitivos JS nativos.
 * Llamada recursivamente para arrays y mapas.
 */
function fromFirestoreValue(val) {
  if (!val) return null;
  if ('nullValue'    in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue'  in val) return val.doubleValue;
  if ('stringValue'  in val) return val.stringValue;
  if ('arrayValue'   in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue'     in val) return fieldsToObj(val.mapValue.fields || {});
  return null;
}
/**
 * CONVERSIÓN — Firestore fields → objeto JavaScript plano.
 * Recibe el objeto 'fields' de un documento Firestore y retorna un objeto JS
 * con los valores deserializados usando fromFirestoreValue().
 * Ejemplo: { nombre: { stringValue: 'Ana' } } → { nombre: 'Ana' }
 */
function fieldsToObj(fields) {
  var obj = {};
  for (var k in fields) {
    if (Object.prototype.hasOwnProperty.call(fields, k)) obj[k] = fromFirestoreValue(fields[k]);
  }
  return obj;
}
/**
 * LECTURA — Colección completa de Firestore.
 * Obtiene TODOS los documentos de una colección via REST API (GET).
 * Agrega automáticamente el campo 'id' a cada documento extraído del path.
 * Limitación: Firestore REST retorna max 300 docs por página (no paginado aquí).
 * Retorna: Array de objetos JS; array vacío si la colección no existe.
 */
function firestoreGetCollectionT(collectionPath, token) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.project_id + '/databases/(default)/documents/' + collectionPath;
  var resp = UrlFetchApp.fetch(url, { method: 'get', headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  var data = JSON.parse(resp.getContentText());
  if (!data.documents) return [];
  return data.documents.map(function(doc) {
    var obj = fieldsToObj(doc.fields || {});
    obj.id = doc.name.split('/').pop();
    return obj;
  });
}
/**
 * LECTURA — Documento individual de Firestore.
 * Obtiene un documento por su path completo (colección/docId).
 * Retorna: objeto JS con los campos deserializados, o null si no existe.
 * Ejemplo path: 'equipos/eq_planificacion/config/main'
 */
function firestoreGetDocT(docPath, token) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.project_id + '/databases/(default)/documents/' + docPath;
  var resp = UrlFetchApp.fetch(url, { method: 'get', headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  var data = JSON.parse(resp.getContentText());
  if (data.error) return null;
  return fieldsToObj(data.fields || {});
}

/**
 * LECTURA — Atajo para leer un documento por colección + id.
 * Equivalente a firestoreGetDocT(collectionPath + '/' + docId, token).
 * Usado por exportarDatos() para leer un portafolio específico.
 */
function firestoreGet(collectionPath, docId, token) {
  return firestoreGetDocT(collectionPath + '/' + docId, token);
}

/**
 * LEER DATOS DEL EQUIPO: Lee todas las subcolecciones de un equipo desde Firestore.
 * Retorna JSON string con la estructura AppData.
 * Llamado desde GASRepository.getAllData() via google.script.run.
 */
function obtenerDatosEquipo(equipoId) {
  try {
    var eId = equipoId || 'eq_planificacion';
    var base = 'equipos/' + eId;
    // Generar token una sola vez para todas las llamadas
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');

    var config    = firestoreGetDocT(base + '/config/main', token) || {};
    var miembros  = firestoreGetCollectionT(base + '/miembros', token);
    var caps      = firestoreGetCollectionT(base + '/capacidades', token);
    var apps      = firestoreGetCollectionT(base + '/aplicaciones', token);
    var bets      = firestoreGetCollectionT(base + '/bets', token);
    var mos       = firestoreGetCollectionT(base + '/mos', token);
    var inic      = firestoreGetCollectionT(base + '/iniciativas', token);
    // Los entregables van nested dentro de cada iniciativa (campo 'entregables' del doc).
    // No se usa colección plana separada.
    var stakes    = firestoreGetCollectionT(base + '/stakeholders', token);
    var bflows    = firestoreGetCollectionT(base + '/businessFlows', token);
    var reviews   = firestoreGetCollectionT(base + '/reviews', token);
    var salud     = firestoreGetCollectionT(base + '/salud', token);
    var capac     = firestoreGetCollectionT(base + '/capacitaciones', token);

    return JSON.stringify({
      ok: true,
      config:        config,
      equipo:        miembros,
      capacidades:   caps,
      aplicaciones:  apps,
      bets:          bets,
      mos:           mos,
      iniciativas:   inic,
      stakeholders:  stakes,
      businessFlows: bflows,
      reviews:       reviews,
      salud:         salud,
      capacitaciones: capac
    });
  } catch(e) {
    return JSON.stringify({ ok: false, error: e.toString() });
  }
}

// ─── helpers ESCRITURA: JS → Firestore REST ───────────────────────────────────

/**
 * CONVERSIÓN — Valor JavaScript → Firestore tipado.
 * Convierte primitivos JS a la estructura que exige la API REST de Firestore.
 * Ejemplos:
 *   'hola'  → { stringValue: 'hola' }
 *   42      → { integerValue: '42' }
 *   3.14    → { doubleValue: 3.14 }
 *   true    → { booleanValue: true }
 *   [1,2]   → { arrayValue: { values: [{integerValue:'1'},{integerValue:'2'}] } }
 *   {}      → { mapValue: { fields: {} } }
 */
function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean')  return { booleanValue: value };
  if (typeof value === 'number')   return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'string')   return { stringValue: value };
  if (Array.isArray(value))        return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object')   return { mapValue: { fields: objectToFields(value) } };
  return { stringValue: String(value) };
}
/**
 * CONVERSIÓN — Objeto JavaScript → Firestore fields.
 * Convierte un objeto JS plano al formato 'fields' que usa Firestore REST.
 * Ejemplo: { nombre: 'Ana', activo: true } →
 *   { nombre: { stringValue: 'Ana' }, activo: { booleanValue: true } }
 */
function objectToFields(obj) {
  var fields = {};
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) fields[key] = toFirestoreValue(obj[key]);
  }
  return fields;
}
/**
 * ESCRITURA — Crear o sobreescribir un documento en Firestore (PATCH/upsert).
 * Usa el método HTTP PATCH con updateMask vacío para sobreescribir TODOS
 * los campos del documento. Si el documento no existe lo crea.
 * IMPORTANTE: sobreescribe el documento completo — no es merge parcial.
 * Parámetros:
 *   collectionPath: ruta de la colección (ej: 'equipos/eq_planificacion/bets')
 *   docId: id del documento (ej: 'bet_q2_01')
 *   data: objeto JS con los datos a guardar
 *   token: access_token OAuth2 (opcional; si no se pasa, genera uno nuevo)
 */
function firestoreSet(collectionPath, docId, data, token) {
  var t = token || ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
  var url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.project_id + '/databases/(default)/documents/' + collectionPath + '/' + docId;
  UrlFetchApp.fetch(url, {
    method: 'patch', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + t },
    payload: JSON.stringify({ fields: objectToFields(data) }),
    muteHttpExceptions: true
  });
}

/**
 * SEED COMPLETO — Carga inicial de todos los datos mock a Firestore.
 * Recibe el contenido completo de mockDataLocal.json como payload (string JSON
 * o objeto). Escribe en Firestore de forma secuencial:
 *   1. Portafolios → portafolios/{id} + portafolios/{id}/equipos/{eqId}
 *   2. Usuarios   → usuarios/{id}
 *   3. Config     → equipos/{eqId}/config/main
 *   4. Subcolecciones del equipo:
 *        miembros, capacidades, aplicaciones, bets, mos, iniciativas
 *        (cada iniciativa lleva sus entregables como campo nested),
 *        stakeholders, businessFlows, reviews, salud, capacitaciones
 * OPTIMIZACIÓN: genera el JWT UNA SOLA VEZ al inicio y lo reutiliza en todas
 * las ~100+ llamadas a firestoreSet() para evitar timeout de 6min de GAS.
 * NOTA: Los entregables van nested dentro de cada doc de iniciativa.
 *        No existe colección separada 'entregables'.
 * Retorna: JSON string { ok, equipoId } o { ok: false, error }.
 * Llamado por: FirebaseTestModal.tsx vía google.script.run.seedCompleto(payload).
 */
function seedCompleto(payload) {
  try {
    var data = (typeof payload === 'string') ? JSON.parse(payload) : payload;
    var eId = (data.config && data.config.equipoId) || data.equipoId || 'eq_planificacion';
    // Generar el token UNA SOLA VEZ para todo el seed (evita timeout por ~100 llamadas extras)
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');

    // 1. Portafolios + subcolección equipos
    (data.portafolios || []).forEach(function(port) {
      var equipos = port.equipos || [];
      var portData = {};
      for (var k in port) { if (k !== 'equipos') portData[k] = port[k]; }
      firestoreSet('portafolios', port.id, portData, token);
      equipos.forEach(function(eq) {
        firestoreSet('portafolios/' + port.id + '/equipos', eq.id, eq, token);
      });
    });

    // 2. Usuarios (colección raíz)
    (data.usuarios || []).forEach(function(u) {
      firestoreSet('usuarios', u._id || u.id, u, token);
    });

    // 3. Config del equipo
    if (data.config) {
      firestoreSet('equipos/' + eId + '/config', 'main', Object.assign({}, data.config, { equipoId: eId }), token);
    }

    // 4. Subcolecciones del equipo.
    // Los entregables van nested dentro del doc de cada iniciativa (no como colección separada).
    var idField = {
      miembros:       'id',
      capacidades:    'key',
      aplicaciones:   'id',
      bets:           'id',
      mos:            'id',
      iniciativas:    'id',
      stakeholders:   'id',
      businessFlows:  'id',
      reviews:        'id',
      salud:          'id',
      capacitaciones: 'id'
    };
    Object.keys(idField).forEach(function(col) {
      (data[col] || []).forEach(function(item) {
        var docId = item[idField[col]] || item.id;
        firestoreSet('equipos/' + eId + '/' + col, docId, Object.assign({}, item, { equipoId: eId }), token);
      });
    });

    return JSON.stringify({ ok: true, equipoId: eId });
  } catch(e) {
    return JSON.stringify({ ok: false, error: e.toString() });
  }
}

/**
 * Guarda un documento individual en una subcolección del equipo.
 * Llamado desde GASRepository para persistir cambios en Firestore.
 * @param {string} equipoId  - ID del equipo (ej: 'eq_planificacion')
 * @param {string} coleccion - Nombre de la subcolección (ej: 'miembros', 'bets', 'config')
 * @param {string} docId     - ID del documento (ej: 'eq_001', 'bet_q2_01', 'main')
 * @param {Object} data      - Datos a guardar
 * @returns {string} JSON { ok: boolean, error?: string }
 */
function guardarDocumento(equipoId, coleccion, docId, data) {
  try {
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
    var collPath = 'equipos/' + equipoId + '/' + coleccion;
    firestoreSet(collPath, docId, Object.assign({}, data, { equipoId: equipoId }), token);
    return JSON.stringify({ ok: true });
  } catch(e) {
    return JSON.stringify({ ok: false, error: e.toString() });
  }
}

/**
 * Elimina un documento de una subcolección del equipo.
 * @param {string} equipoId
 * @param {string} coleccion
 * @param {string} docId
 * @returns {string} JSON { ok: boolean, error?: string }
 */
function eliminarDocumento(equipoId, coleccion, docId) {
  try {
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
    var url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.project_id + '/databases/(default)/documents/equipos/' + equipoId + '/' + coleccion + '/' + docId;
    UrlFetchApp.fetch(url, {
      method: 'delete',
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    return JSON.stringify({ ok: true });
  } catch(e) {
    return JSON.stringify({ ok: false, error: e.toString() });
  }
}

// ─── NUEVAS FUNCIONES (sesión mayo 2026) ──────────────────────────────────────

/**
 * LECTURA — Lista todos los usuarios de la colección 'usuarios'.
 * Retorna JSON string { ok, usuarios: [...] }
 * Llamado desde AdminPanel vía google.script.run.
 */
function obtenerUsuarios() {
  try {
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
    var lista = firestoreGetCollectionT('usuarios', token);
    lista = lista.map(function(u) {
      if (!u._id && u.id) u._id = u.id;
      return u;
    });
    return JSON.stringify({ ok: true, usuarios: lista });
  } catch(e) {
    return JSON.stringify({ ok: false, error: e.toString() });
  }
}

/**
 * ESCRITURA — Actualiza campos de un usuario en 'usuarios/{userId}'.
 * @param {string} userId - ID del documento del usuario
 * @param {Object} campos - Campos a actualizar (se sobreescribe el doc completo)
 * Retorna JSON string { ok } o { ok: false, error }
 */
function actualizarUsuario(userId, campos) {
  try {
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
    firestoreSet('usuarios', userId, campos, token);
    return JSON.stringify({ ok: true });
  } catch(e) {
    return JSON.stringify({ ok: false, error: e.toString() });
  }
}

/**
 * EXPORTACIÓN — Descarga completa de datos para el superadmin.
 * Si se pasa portafolioId, exporta solo ese portafolio; si no, exporta todos.
 * Por cada equipo, lee todas las subcolecciones conocidas.
 * Retorna JSON string { ok, exportadoEn, portafolios: [...] }
 */
function exportarDatos(portafolioId) {
  try {
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
    var portafoliosList;
    if (portafolioId) {
      var p = firestoreGet('portafolios', portafolioId, token);
      portafoliosList = p ? [p] : [];
    } else {
      portafoliosList = firestoreGetCollectionT('portafolios', token);
    }
    var COLECCIONES_EQUIPO = ['config', 'equipo', 'capacidades', 'stakeholders', 'aplicaciones', 'bets', 'iniciativas', 'noticias', 'capacitaciones', 'reviews', 'business_flows'];
    var result = portafoliosList.map(function(port) {
      var equipos = firestoreGetCollectionT('portafolios/' + port.id + '/equipos', token);
      var equiposConDatos = equipos.map(function(eq) {
        var datos = {};
        COLECCIONES_EQUIPO.forEach(function(col) {
          try {
            var docs = firestoreGetCollectionT('equipos/' + eq.id + '/' + col, token);
            if (docs && docs.length > 0) datos[col] = docs;
          } catch(e) { /* coleccion vacia, ignorar */ }
        });
        return Object.assign({}, eq, { datos: datos });
      });
      return Object.assign({}, port, { equipos: equiposConDatos });
    });
    return JSON.stringify({ ok: true, exportadoEn: new Date().toISOString(), portafolios: result });
  } catch(e) {
    return JSON.stringify({ ok: false, error: e.toString() });
  }
}