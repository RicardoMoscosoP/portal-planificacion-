// ============================================================
//  WebApp.gs — Proyecto: gas-admin
//  Endpoint HTTP para el módulo de configuración (Admin).
//  Todas las operaciones requieren rol "admin".
//
//  GET  → lecturas (listar, obtener, resumen)
//  POST → escrituras (crear, actualizar, eliminar, cambiar rol)
// ============================================================

function doGet(e) {
  return _handle(e);
}

function doPost(e) {
  return _handle(e);
}

function _handle(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    // Para POST, parsear el body JSON
    var params = e.parameter || {};
    var body   = {};
    if (e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (_) {}
    }

    var action = (params.action || body.action || '').toLowerCase().trim();
    var data;

    switch (action) {

      // ── IDENTIFICACIÓN ─────────────────────────────────
      case 'whoami':
        // Reutiliza la misma lógica de auto-registro
        data = _adminWhoami();
        break;

      // ── RESUMEN ADMIN ──────────────────────────────────
      case 'resumen':
        data = adminResumen();
        break;

      // ── USUARIOS ───────────────────────────────────────
      case 'usuarios.listar':
        data = listarUsuarios();
        break;

      case 'usuarios.cambiar_rol':
        data = cambiarRolUsuario(
          body.usuarioId || params.usuarioId,
          body.rol || params.rol
        );
        break;

      case 'usuarios.toggle_activo':
        data = toggleUsuarioActivo(
          body.usuarioId || params.usuarioId,
          body.activo !== undefined ? body.activo : (params.activo === 'true')
        );
        break;

      case 'usuarios.actualizar_nombre':
        data = actualizarNombreUsuario(
          body.usuarioId || params.usuarioId,
          body.nombre || params.nombre
        );
        break;

      // ── CRUD GENÉRICO ─────────────────────────────────
      case 'listar':
        data = adminListar(body.coleccion || params.coleccion);
        break;

      case 'obtener':
        data = adminObtener(
          body.coleccion || params.coleccion,
          body.docId || params.docId
        );
        break;

      case 'crear':
        data = adminCrear(
          body.coleccion || params.coleccion,
          body.data || {}
        );
        break;

      case 'actualizar':
        data = adminActualizar(
          body.coleccion || params.coleccion,
          body.docId || params.docId,
          body.campos || body.data || {}
        );
        break;

      case 'eliminar':
        data = adminEliminar(
          body.coleccion || params.coleccion,
          body.docId || params.docId
        );
        break;

      // ── OPERACIONES ESPECIALIZADAS ─────────────────────
      case 'config.actualizar':
        data = adminActualizarConfig(body.campos || body.data || {});
        break;

      case 'entregables.por_iniciativa':
        data = adminEntregablesPorIniciativa(body.iniciativaId || params.iniciativaId);
        break;

      case 'mos.por_bet':
        data = adminMosPorBet(body.betId || params.betId);
        break;

      // ── PING ──────────────────────────────────────────
      case 'ping':
        data = { ok: true, ts: new Date().toISOString(), proyecto: 'gas-admin' };
        break;

      default:
        throw new Error(
          'Acción desconocida: "' + action + '". Acciones válidas: ' +
          'whoami | resumen | ' +
          'usuarios.listar | usuarios.cambiar_rol | usuarios.toggle_activo | usuarios.actualizar_nombre | ' +
          'listar | obtener | crear | actualizar | eliminar | ' +
          'config.actualizar | entregables.por_iniciativa | mos.por_bet | ping'
        );
    }

    output.setContent(JSON.stringify({ ok: true, data: data }));

  } catch (err) {
    var code = 'ERROR';
    var msg  = err.message || String(err);

    // Mapear errores de auth a códigos específicos
    if (msg.indexOf('NO_AUTH') === 0)   code = 'NO_AUTH';
    if (msg.indexOf('NO_USER') === 0)   code = 'NO_USER';
    if (msg.indexOf('NO_ADMIN') === 0)  code = 'NO_ADMIN';
    if (msg.indexOf('INACTIVE') === 0)  code = 'INACTIVE';

    output.setContent(JSON.stringify({ ok: false, code: code, error: msg }));
  }

  return output;
}

// ────────────────────────────────────────────────────────────
//  WHOAMI para Admin (verifica permisos, no auto-registra)
// ────────────────────────────────────────────────────────────

function _adminWhoami() {
  var email = Session.getActiveUser().getEmail();
  if (!email) return { email: null, isAdmin: false };

  var usuarios = fsQuery('usuarios', [
    { field: 'email', op: 'EQUAL', value: email.toLowerCase() }
  ], null, 1);

  if (usuarios.length === 0) return { email: email, isAdmin: false };

  var u = usuarios[0];
  return {
    _id: u._id,
    email: u.email,
    nombre: u.nombre || '',
    rol: u.rol,
    activo: u.activo,
    isAdmin: u.rol === 'admin' && u.activo !== false
  };
}

// ── NOTAS DE DESPLIEGUE ──────────────────────────────────────
//
//  1. Implementar → Nueva implementación → Aplicación web
//  2. Ejecutar como: "USUARIO QUE ACCEDE" (para capturar email)
//  3. Acceso: "Cualquier persona dentro de [dominio Blue Express]"
//
//  La protección real es el _requireAdmin() en AdminDataLayer.gs,
//  que valida el email contra Firestore en cada operación.
//  Aunque alguien conozca la URL, no puede ejecutar nada sin ser admin.
//
//  ⚠️ Cada cambio = nueva implementación.
// ────────────────────────────────────────────────────────────
