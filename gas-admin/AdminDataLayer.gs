// ============================================================
//  AdminDataLayer.gs
//  CRUD completo para todas las entidades + gestión de usuarios
//  Proyecto: gas-admin
// ============================================================

// ────────────────────────────────────────────────────────────
//  GUARD — Verifica que el usuario sea admin antes de operar
// ────────────────────────────────────────────────────────────

function _requireAdmin() {
  var email = Session.getActiveUser().getEmail();
  if (!email) throw new Error('NO_AUTH: No se pudo obtener el email del usuario.');

  var usuarios = fsQuery('usuarios', [
    { field: 'email', op: 'EQUAL', value: email.toLowerCase() }
  ], null, 1);

  if (usuarios.length === 0) throw new Error('NO_USER: Usuario no registrado.');
  if (usuarios[0].rol !== 'admin') throw new Error('NO_ADMIN: No tienes permisos de administrador.');
  if (usuarios[0].activo === false) throw new Error('INACTIVE: Usuario desactivado.');

  return usuarios[0];
}

// ────────────────────────────────────────────────────────────
//  1. GESTIÓN DE USUARIOS
// ────────────────────────────────────────────────────────────

/**
 * Lista todos los usuarios registrados.
 */
function listarUsuarios() {
  _requireAdmin();
  var usuarios = fsListCollection('usuarios');
  return usuarios.sort(function(a, b) {
    // Admins primero, luego por nombre
    if (a.rol === 'admin' && b.rol !== 'admin') return -1;
    if (a.rol !== 'admin' && b.rol === 'admin') return 1;
    return (a.nombre || '').localeCompare(b.nombre || '');
  });
}

/**
 * Cambiar el rol de un usuario (viewer ↔ admin).
 * No permite que un admin se quite el rol a sí mismo.
 */
function cambiarRolUsuario(usuarioId, nuevoRol) {
  var adminActual = _requireAdmin();
  if (nuevoRol !== 'admin' && nuevoRol !== 'viewer') {
    throw new Error('Rol inválido. Usar "admin" o "viewer".');
  }

  // Protección: no puede quitarse admin a sí mismo
  if (adminActual._id === usuarioId && nuevoRol !== 'admin') {
    throw new Error('No puedes quitarte el rol de admin a ti mismo.');
  }

  return fsUpdateFields('usuarios', usuarioId, { rol: nuevoRol });
}

/**
 * Activar/desactivar un usuario.
 */
function toggleUsuarioActivo(usuarioId, activo) {
  var adminActual = _requireAdmin();

  // Protección: no puede desactivarse a sí mismo
  if (adminActual._id === usuarioId && !activo) {
    throw new Error('No puedes desactivarte a ti mismo.');
  }

  return fsUpdateFields('usuarios', usuarioId, { activo: activo });
}

/**
 * Actualizar nombre de un usuario.
 */
function actualizarNombreUsuario(usuarioId, nombre) {
  _requireAdmin();
  return fsUpdateFields('usuarios', usuarioId, { nombre: nombre });
}

// ────────────────────────────────────────────────────────────
//  2. CRUD GENÉRICO
//  Todas las colecciones usan el mismo patrón:
//  crear / actualizar / eliminar / listar
// ────────────────────────────────────────────────────────────

// Colecciones permitidas para CRUD desde el Admin
var COLECCIONES_PERMITIDAS = [
  'config', 'equipo', 'capacidades', 'bets', 'mos',
  'iniciativas', 'entregables', 'alcances', 'aplicaciones',
  'reviews', 'stakeholders', 'businessFlows', 'presentaciones'
];

function _validarColeccion(coleccion) {
  if (COLECCIONES_PERMITIDAS.indexOf(coleccion) === -1) {
    throw new Error('Colección no permitida: ' + coleccion);
  }
}

/**
 * Listar todos los documentos de una colección.
 */
function adminListar(coleccion) {
  _requireAdmin();
  _validarColeccion(coleccion);
  return fsListCollection(coleccion);
}

/**
 * Obtener un documento específico.
 */
function adminObtener(coleccion, docId) {
  _requireAdmin();
  _validarColeccion(coleccion);
  var doc = fsGetDocument(coleccion, docId);
  if (!doc) throw new Error('Documento no encontrado: ' + coleccion + '/' + docId);
  return doc;
}

/**
 * Crear un documento nuevo.
 * Si data.id viene incluido, se usa como docId.
 * Si no, se genera uno con prefijo según la colección.
 */
function adminCrear(coleccion, data) {
  _requireAdmin();
  _validarColeccion(coleccion);

  var prefijos = {
    equipo: 'eq_', capacidades: 'cap_', bets: 'bet_', mos: 'mos_new_',
    iniciativas: 'ini_', entregables: 'ent_', alcances: 'alc_',
    aplicaciones: 'app_', reviews: 'rev_', stakeholders: 'stk_',
    businessFlows: 'bf_', presentaciones: 'pres_'
  };

  var docId = data.id || data._id || (prefijos[coleccion] || 'doc_') + Date.now();

  // Limpiar campos internos antes de guardar
  var cleanData = {};
  for (var k in data) {
    if (data.hasOwnProperty(k) && k !== '_id' && k !== '_path') {
      cleanData[k] = data[k];
    }
  }
  // Asegurar que el id quede como campo dentro del documento
  cleanData.id = docId;

  return fsSetDocument(coleccion, docId, cleanData);
}

/**
 * Actualizar campos específicos de un documento.
 */
function adminActualizar(coleccion, docId, campos) {
  _requireAdmin();
  _validarColeccion(coleccion);

  // Limpiar campos internos
  var cleanCampos = {};
  for (var k in campos) {
    if (campos.hasOwnProperty(k) && k !== '_id' && k !== '_path') {
      cleanCampos[k] = campos[k];
    }
  }

  return fsUpdateFields(coleccion, docId, cleanCampos);
}

/**
 * Eliminar un documento.
 */
function adminEliminar(coleccion, docId) {
  _requireAdmin();
  _validarColeccion(coleccion);
  var ok = fsDeleteDocument(coleccion, docId);
  if (!ok) throw new Error('No se pudo eliminar: ' + coleccion + '/' + docId);
  return { deleted: true, coleccion: coleccion, docId: docId };
}

// ────────────────────────────────────────────────────────────
//  3. OPERACIONES ESPECIALIZADAS
// ────────────────────────────────────────────────────────────

/**
 * Actualizar config general (merge parcial).
 */
function adminActualizarConfig(campos) {
  _requireAdmin();
  return fsUpdateFields('config', 'general', campos);
}

/**
 * Obtener entregables de una iniciativa específica.
 */
function adminEntregablesPorIniciativa(iniciativaId) {
  _requireAdmin();
  return fsQuery('entregables', [
    { field: 'iniciativaId', op: 'EQUAL', value: iniciativaId }
  ], { field: 'orden', direction: 'ASCENDING' });
}

/**
 * Obtener MOS vinculados a una Bet (por mos_ids).
 */
function adminMosPorBet(betId) {
  _requireAdmin();
  var bet = fsGetDocument('bets', betId);
  if (!bet) throw new Error('Bet no encontrada: ' + betId);

  // mos_ids viene como string separado por comas o como array
  var mosIds = [];
  if (Array.isArray(bet.mos_ids)) {
    mosIds = bet.mos_ids;
  } else if (typeof bet.mos_ids === 'string') {
    mosIds = bet.mos_ids.split(',').map(function(s) { return s.trim(); });
  }

  if (mosIds.length === 0) return [];
  return fsBatchGet('mos', mosIds);
}

/**
 * Dashboard de resumen para el Admin panel.
 */
function adminResumen() {
  _requireAdmin();
  var usuarios     = fsListCollection('usuarios');
  var iniciativas  = fsListCollection('iniciativas');
  var entregables  = fsListCollection('entregables');
  var bets         = fsListCollection('bets');
  var capacidades  = fsListCollection('capacidades');

  return {
    totalUsuarios: usuarios.length,
    admins: usuarios.filter(function(u) { return u.rol === 'admin'; }).length,
    viewers: usuarios.filter(function(u) { return u.rol === 'viewer'; }).length,
    totalIniciativas: iniciativas.length,
    totalEntregables: entregables.length,
    totalBets: bets.filter(function(b) { return b.activo !== false; }).length,
    totalCapacidades: capacidades.length
  };
}
