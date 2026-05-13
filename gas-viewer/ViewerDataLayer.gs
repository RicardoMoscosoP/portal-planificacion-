// ============================================================
//  ViewerDataLayer.gs
//  Lógica de negocio READ-ONLY + whoami con auto-registro
//  Proyecto: gas-viewer
// ============================================================

// ────────────────────────────────────────────────────────────
//  WHOAMI — Identificación + auto-registro corporativo
// ────────────────────────────────────────────────────────────

/**
 * Identifica al usuario activo.
 * Si es correo corporativo y no existe en Firestore → lo crea como viewer.
 * Retorna el perfil del usuario con su rol.
 *
 * IMPORTANTE: Para que funcione, el deploy debe ser:
 *   "Ejecutar como: Usuario que accede a la aplicación web"
 */
function whoami() {
  var email = Session.getActiveUser().getEmail();

  // Si no hay email (usuario anónimo o deploy incorrecto)
  if (!email) {
    return { email: null, rol: 'anonymous', canConfigure: false };
  }

  // Buscar si ya existe en la colección usuarios
  var existentes = fsQuery('usuarios', [
    { field: 'email', op: 'EQUAL', value: email.toLowerCase() }
  ], null, 1);

  if (existentes.length > 0) {
    var usuario = existentes[0];
    // Si está desactivado, tratarlo como viewer sin acceso admin
    if (usuario.activo === false) {
      return {
        _id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre || '',
        rol: usuario.rol || 'viewer',
        activo: false,
        canConfigure: false
      };
    }
    return {
      _id: usuario._id,
      email: usuario.email,
      nombre: usuario.nombre || '',
      rol: usuario.rol || 'viewer',
      activo: true,
      canConfigure: usuario.rol === 'admin'
    };
  }

  // No existe → verificar si es correo corporativo
  var dominio = (email.split('@')[1] || '').toLowerCase();
  var dominiosCorporativos = ['bluex.cl', 'blue.cl', 'bx.cl'];
  if (dominiosCorporativos.indexOf(dominio) === -1) {
    // Correo externo, no se auto-registra
    return { email: email, rol: 'externo', canConfigure: false };
  }

  // Auto-registro: crear como viewer
  var nuevoId = 'usr_' + Date.now();
  var nuevoUsuario = {
    email: email.toLowerCase(),
    nombre: _extraerNombreDeEmail(email),
    rol: 'viewer',
    activo: true,
    fechaRegistro: new Date().toISOString(),
    autoRegistro: true
  };

  fsSetDocument('usuarios', nuevoId, nuevoUsuario);

  return {
    _id: nuevoId,
    email: nuevoUsuario.email,
    nombre: nuevoUsuario.nombre,
    rol: 'viewer',
    activo: true,
    canConfigure: false
  };
}

/**
 * Extrae un nombre legible del email corporativo.
 * "ricardo.moscoso@bluex.cl" → "Ricardo Moscoso"
 */
function _extraerNombreDeEmail(email) {
  var local = email.split('@')[0] || '';
  return local
    .replace(/[._-]/g, ' ')
    .replace(/\d+/g, '')
    .trim()
    .split(' ')
    .map(function(w) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

// ────────────────────────────────────────────────────────────
//  DASHBOARD (Home)
// ────────────────────────────────────────────────────────────

function obtenerDashboard() {
  var config      = _obtenerConfig();
  var equipo      = fsListCollection('equipo').filter(function(m) { return m.activo !== false && m.activo !== 0; });
  var capacidades = fsListCollection('capacidades').sort(function(a, b) { return (a.orden || 0) - (b.orden || 0); });
  var bets        = fsListCollection('bets').filter(function(b) { return b.activo !== false; }).sort(function(a, b) { return (a.orden || 0) - (b.orden || 0); });
  var mos         = fsListCollection('mos').sort(function(a, b) { return (a.orden || 0) - (b.orden || 0); });
  var iniciativas = fsListCollection('iniciativas');
  var alcances    = fsListCollection('alcances');
  var aplicaciones = fsListCollection('aplicaciones');

  return { config: config, equipo: equipo, capacidades: capacidades, bets: bets, mos: mos, iniciativas: iniciativas, alcances: alcances, aplicaciones: aplicaciones };
}

// ────────────────────────────────────────────────────────────
//  ROADMAP
// ────────────────────────────────────────────────────────────

function obtenerRoadmapCompleto(capacidadKey, q) {
  var filtros = [];
  if (capacidadKey) filtros.push({ field: 'capacidadKey', op: 'EQUAL', value: capacidadKey });
  if (q !== undefined && q !== null) filtros.push({ field: 'q', op: 'EQUAL', value: Number(q) });

  var iniciativas = filtros.length > 0 ? fsQuery('iniciativas', filtros) : fsListCollection('iniciativas');
  if (iniciativas.length === 0) return [];

  return iniciativas.map(function(ini) {
    var fEnt = [{ field: 'iniciativaId', op: 'EQUAL', value: ini._id }];
    if (q !== undefined && q !== null) fEnt.push({ field: 'q', op: 'EQUAL', value: Number(q) });
    var entregables = fsQuery('entregables', fEnt, { field: 'orden', direction: 'ASCENDING' });
    ini.entregables = entregables;
    return ini;
  });
}

// ────────────────────────────────────────────────────────────
//  CAPACIDAD DETALLE (Pantalla 2)
// ────────────────────────────────────────────────────────────

function obtenerCapacidadDetalle(capacidadKey) {
  var caps    = fsQuery('capacidades', [{ field: 'key', op: 'EQUAL', value: capacidadKey }]);
  var roadmap = obtenerRoadmapCompleto(capacidadKey);
  return { capacidad: caps[0] || null, roadmap: roadmap };
}

// ────────────────────────────────────────────────────────────
//  PROYECTO COMPLETO (iniciativa + entregables + equipo)
// ────────────────────────────────────────────────────────────

function obtenerProyectoCompleto(idIniciativa) {
  var iniciativa = fsGetDocument('iniciativas', idIniciativa);
  if (!iniciativa) return null;

  var entregables = fsQuery('entregables', [
    { field: 'iniciativaId', op: 'EQUAL', value: idIniciativa }
  ], { field: 'orden', direction: 'ASCENDING' });

  var miembrosIds = Array.isArray(iniciativa.miembros_asignados) ? iniciativa.miembros_asignados : [];
  var equipo = miembrosIds.length > 0 ? fsBatchGet('equipo', miembrosIds) : [];

  iniciativa.entregables = entregables;
  iniciativa.equipo = equipo;
  return iniciativa;
}

// ────────────────────────────────────────────────────────────
//  REVIEWS
// ────────────────────────────────────────────────────────────

function obtenerReviews(q) {
  if (q) return fsQuery('reviews', [{ field: 'q', op: 'EQUAL', value: q }]);
  return fsListCollection('reviews');
}

// ────────────────────────────────────────────────────────────
//  PRESENTACIONES
// ────────────────────────────────────────────────────────────

/**
 * Lista todas las presentaciones disponibles.
 * Colección Firestore raíz: /presentaciones
 * Modelo: { id, titulo, descripcion, fechaCreacion, capacidad?, url }
 */
function obtenerPresentaciones() {
  return fsListCollection('presentaciones').sort(function(a, b) {
    return (b.fechaCreacion || '').localeCompare(a.fechaCreacion || '');
  });
}

// ────────────────────────────────────────────────────────────
//  CONFIG HELPER
// ────────────────────────────────────────────────────────────

function _obtenerConfig() {
  try {
    var single = fsGetDocument('config', 'general');
    if (single) return single;
  } catch (_) {}

  var docs = fsListCollection('config');
  var config = {};
  docs.forEach(function(d) {
    for (var k in d) {
      if (d.hasOwnProperty(k) && !k.startsWith('_')) config[k] = d[k];
    }
  });
  return config;
}
