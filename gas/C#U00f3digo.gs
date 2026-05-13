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

function obtenerPortafolios() {
  var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, "https://www.googleapis.com/auth/datastore");
  var portafoliosList = firestoreGetCollectionT('portafolios', token);
  return portafoliosList.map(function(port) {
    var equipos = firestoreGetCollectionT('portafolios/' + port.id + '/equipos', token);
    return Object.assign({}, port, { equipos: equipos });
  });
}

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

function cargarMasivo(lista) {
  try {
    lista.forEach(item => guardarPortafolio(item));
    return "OK " + lista.length + " elementos cargados correctamente.";
  } catch (e) {
    return "Error: " + e.toString();
  }
}

function healthcheck() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.project_id}/databases/(default)/documents/status/heartbeat`;
    const token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, "https://www.googleapis.com/auth/datastore");
    const opciones = { "method": "get", "headers": { "Authorization": "Bearer " + token }, "muteHttpExceptions": true };
    const respuesta = UrlFetchApp.fetch(url, opciones);
    const datos = JSON.parse(respuesta.getContentText());
    if (datos.fields && datos.fields.alive && datos.fields.alive.booleanValue === true) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, status: "alive" })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: false, status: "no heartbeat doc" })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    if (e.parameter.action === "healthcheck") return healthcheck();
    if (e.parameter.action === "verificarLectura") return verificarLectura();
  }
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Portafolio')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

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

function verificarLectura() {
  try {
    const datos = obtenerPortafolios();
    if (datos.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, empty: true, count: 0, message: "La coleccion 'portafolios' esta vacia." })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, empty: false, count: datos.length, message: "Se encontraron " + datos.length + " portafolios." })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function verificarLecturaGAS() {
  try {
    const datos = obtenerPortafolios();
    if (datos.length === 0) {
      return { ok: true, empty: true, count: 0, message: "La coleccion 'portafolios' esta vacia." };
    } else {
      return { ok: true, empty: false, count: datos.length, message: "Se encontraron " + datos.length + " portafolios." };
    }
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

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

function fieldsToObj(fields) {
  var obj = {};
  for (var k in fields) {
    if (Object.prototype.hasOwnProperty.call(fields, k)) obj[k] = fromFirestoreValue(fields[k]);
  }
  return obj;
}

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

function firestoreGetDocT(docPath, token) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.project_id + '/databases/(default)/documents/' + docPath;
  var resp = UrlFetchApp.fetch(url, { method: 'get', headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  var data = JSON.parse(resp.getContentText());
  if (data.error) return null;
  return fieldsToObj(data.fields || {});
}

function firestoreGet(collectionPath, docId, token) {
  return firestoreGetDocT(collectionPath + '/' + docId, token);
}

function obtenerDatosEquipo(equipoId) {
  try {
    var eId = equipoId || 'eq_planificacion';
    var base = 'equipos/' + eId;
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
    var config    = firestoreGetDocT(base + '/config/main', token) || {};
    var miembros  = firestoreGetCollectionT(base + '/miembros', token);
    var caps      = firestoreGetCollectionT(base + '/capacidades', token);
    var apps      = firestoreGetCollectionT(base + '/aplicaciones', token);
    var bets      = firestoreGetCollectionT(base + '/bets', token);
    var mos       = firestoreGetCollectionT(base + '/mos', token);
    var inic      = firestoreGetCollectionT(base + '/iniciativas', token);
    var entrega   = firestoreGetCollectionT(base + '/entregables', token);
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
      entregables:   entrega,
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

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean')  return { booleanValue: value };
  if (typeof value === 'number')   return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'string')   return { stringValue: value };
  if (Array.isArray(value))        return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object')   return { mapValue: { fields: objectToFields(value) } };
  return { stringValue: String(value) };
}

function objectToFields(obj) {
  var fields = {};
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) fields[key] = toFirestoreValue(obj[key]);
  }
  return fields;
}

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

function seedCompleto(payload) {
  try {
    var data = (typeof payload === 'string') ? JSON.parse(payload) : payload;
    var eId = (data.config && data.config.equipoId) || data.equipoId || 'eq_planificacion';
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
    (data.portafolios || []).forEach(function(port) {
      var equipos = port.equipos || [];
      var portData = {};
      for (var k in port) { if (k !== 'equipos') portData[k] = port[k]; }
      firestoreSet('portafolios', port.id, portData, token);
      equipos.forEach(function(eq) {
        firestoreSet('portafolios/' + port.id + '/equipos', eq.id, eq, token);
      });
    });
    (data.usuarios || []).forEach(function(u) {
      firestoreSet('usuarios', u._id || u.id, u, token);
    });
    if (data.config) {
      firestoreSet('equipos/' + eId + '/config', 'main', Object.assign({}, data.config, { equipoId: eId }), token);
    }
    var idField = {
      miembros:       'id',
      capacidades:    'key',
      aplicaciones:   'id',
      bets:           'id',
      mos:            'id',
      iniciativas:    'id',
      entregables:    'id',
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

function actualizarUsuario(userId, campos) {
  try {
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
    firestoreSet('usuarios', userId, campos, token);
    return JSON.stringify({ ok: true });
  } catch(e) {
    return JSON.stringify({ ok: false, error: e.toString() });
  }
}

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
    var COLECCIONES_EQUIPO = ['config', 'equipo', 'capacidades', 'stakeholders', 'aplicaciones', 'bets', 'iniciativas', 'entregables', 'noticias', 'capacitaciones', 'reviews', 'business_flows'];
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