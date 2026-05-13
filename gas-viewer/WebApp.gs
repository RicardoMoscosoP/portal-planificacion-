// ============================================================
//  WebApp.gs — Proyecto: gas-viewer
//  Endpoint HTTP READ-ONLY para la SPA React principal.
//
//  Acciones:
//    ?action=whoami         → identifica usuario + auto-registro
//    ?action=dashboard      → Home completo
//    ?action=capacidad      → Pantalla 2 (detalle)
//    ?action=proyecto       → Iniciativa + entregables + equipo
//    ?action=roadmap        → Roadmap filtrable
//    ?action=reviews        → Reviews por quarter
//    ?action=config         → Solo config general
//    ?action=ping           → Healthcheck
// ============================================================

function doGet(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var action = (e.parameter.action || '').toLowerCase().trim();
    var data;

    switch (action) {

      case 'whoami':
        data = whoami();
        break;

      case 'dashboard':
        data = obtenerDashboard();
        // Inyectar info de usuario en el dashboard
        data.usuario = whoami();
        break;

      case 'capacidad':
        var key = e.parameter.key || e.parameter.capacidadKey;
        if (!key) throw new Error('Parámetro "key" requerido.');
        data = obtenerCapacidadDetalle(key);
        break;

      case 'proyecto':
        var id = e.parameter.id || e.parameter.idIniciativa;
        if (!id) throw new Error('Parámetro "id" requerido.');
        data = obtenerProyectoCompleto(id);
        if (!data) throw new Error('Iniciativa "' + id + '" no encontrada.');
        break;

      case 'roadmap':
        var capKey = e.parameter.capacidadKey || null;
        var q      = e.parameter.q ? Number(e.parameter.q) : null;
        data = obtenerRoadmapCompleto(capKey, q);
        break;

      case 'reviews':
        var qr = e.parameter.q || null;
        data = obtenerReviews(qr);
        break;

      case 'presentaciones':
        data = obtenerPresentaciones();
        break;

      case 'config':
        data = _obtenerConfig();
        break;

      case 'ping':
        data = { ok: true, ts: new Date().toISOString() };
        break;

      default:
        throw new Error('Acción desconocida: "' + action + '". Válidas: whoami | dashboard | capacidad | proyecto | roadmap | reviews | presentaciones | config | ping');
    }

    output.setContent(JSON.stringify({ ok: true, data: data }));

  } catch (err) {
    output.setContent(JSON.stringify({ ok: false, error: err.message }));
  }

  return output;
}

// ── NOTAS DE DESPLIEGUE ──────────────────────────────────────
//
//  CRÍTICO para que whoami funcione:
//
//  1. Implementar → Nueva implementación → Aplicación web
//  2. Ejecutar como: "USUARIO QUE ACCEDE" (no "Yo")
//  3. Acceso: "Cualquier persona dentro de [dominio Blue Express]"
//
//  Si se despliega como "Ejecutar como: Yo", Session.getActiveUser()
//  devolverá siempre el email del owner y el auto-registro no funcionará.
//
//  ⚠️ Cada cambio = nueva implementación. No actualizar la existente.
// ────────────────────────────────────────────────────────────
