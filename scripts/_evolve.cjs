'use strict';
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'nuevo5.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ── 1. ELIMINAR root "entregables" (son redundantes, ya están dentro de iniciativas) ──
delete data.entregables;

// ── 2. NUEVA SECCIÓN: releases ──────────────────────────────────────────────────────
data.releases = [
  {
    id: 'rel_q2_01',
    equipoId: 'eq_planificacion',
    nombre: 'Smart Retiros v1.0.0',
    version: '1.0.0',
    aplicacionId: 'app_smart_retiros',
    q: 'Q2',
    fecha: '2026-04-30',
    estado: 'done',
    descripcion: 'Primera versión productiva del motor de asignación automática de reservas. Incluye API REST con validación de capacidad por courier y zona.',
    entregableIds: ['ent_sr_01'],
    changelog: [
      'Endpoint POST /api/v1/reservas con validación de capacidad disponible',
      'Asignación automática por zona y disponibilidad operativa de courier',
      'Integración con sistema de gestión de OS'
    ],
    activo: true
  },
  {
    id: 'rel_q2_02',
    equipoId: 'eq_planificacion',
    nombre: 'Optimizador de Rutas — Valdivia v1.0.0',
    version: '1.0.0',
    aplicacionId: 'app_optimizador',
    q: 'Q2',
    fecha: '2026-04-28',
    estado: 'done',
    descripcion: 'MVP del motor de optimización de rutas para Base Valdivia. Genera planes óptimos en tiempo real con restricciones operativas reales.',
    entregableIds: ['ent_ou_01'],
    changelog: [
      'Motor de optimización VRP para lotes de hasta 80 OS por base',
      'Restricciones: capacidad de camión, ventana horaria y OS prioritarias',
      'Tiempo de respuesta menor a 2 segundos garantizado'
    ],
    activo: true
  },
  {
    id: 'rel_q2_03',
    equipoId: 'eq_planificacion',
    nombre: 'Geosolver + Diccionario Blue v0.1',
    version: '0.1.0',
    aplicacionId: 'app_geosolver',
    q: 'Q2',
    fecha: '2026-05-15',
    estado: 'done',
    descripcion: 'Primera versión del sistema de georreferenciación con Diccionario Blue cargado (180K registros) y motor de asignación Hub/Zona operativo.',
    entregableIds: ['ent_ga_01', 'ent_ga_02'],
    changelog: [
      'Diccionario Blue v0.1 con 180K direcciones normalizadas y clasificadas',
      'Motor de asignación automática de Hub y Zona por coordenadas',
      'API interna de georreferenciación disponible para sistemas integrados',
      'Clasificación de calidad: alta (>= 95%), media (>= 80%), baja (< 80%)'
    ],
    activo: true
  },
  {
    id: 'rel_q2_04',
    equipoId: 'eq_planificacion',
    nombre: 'Red de Distribución — Nodos v1.0',
    version: '1.0.0',
    aplicacionId: 'app_red_dist',
    q: 'Q2',
    fecha: '2026-04-25',
    estado: 'done',
    descripcion: 'Catálogo formal de nodos operativos nacionales (Bases y Hubs) con atributos completos e integración disponible para Geosolver y el Optimizador.',
    entregableIds: ['ent_rv_01'],
    changelog: [
      'Catálogo de 45 Bases y 12 Hubs activos a nivel nacional',
      'Atributos por nodo: horario, capacidad máxima y rutas de entrada/salida',
      'API REST de consulta de nodos disponible'
    ],
    activo: true
  }
];

// ── 3. ENRIQUECER iniciativas ───────────────────────────────────────────────────────
const INICIATIVA_MOS = {
  sr: ['mos_q2_09', 'mos_q2_10', 'mos_q2_11'],
  ou: ['mos_q2_01', 'mos_q2_02', 'mos_q2_03', 'mos_q2_04'],
  ga: ['mos_q2_05', 'mos_q2_06', 'mos_q2_07', 'mos_q2_08'],
  rv: ['mos_q2_03', 'mos_q2_04']
};

const INICIATIVA_FECHAS = {
  sr: { mes_inicio: 'Abril', mes_fin: 'Junio' },
  ou: { mes_inicio: 'Abril', mes_fin: 'Junio' },
  ga: { mes_inicio: 'Abril', mes_fin: 'Mayo'  },
  rv: { mes_inicio: 'Abril', mes_fin: 'Junio' }
};

// Mapeo entregable → aplicacionId
const ENT_APP = {
  ent_sr_01: 'app_smart_retiros',
  ent_sr_02: 'app_blue_planner',
  ent_sr_03: 'app_smart_retiros',
  ent_ou_01: 'app_optimizador',
  ent_ou_02: 'app_optimizador',
  ent_ou_03: 'app_blue_planner',
  ent_ga_01: 'app_diccionario_blue',
  ent_ga_02: 'app_geosolver',
  ent_ga_03: 'app_geosolver',
  ent_rv_01: 'app_red_dist',
  ent_rv_02: 'app_red_dist',
  ent_rv_03: 'app_blue_planner'
};

const ENT_FECHA_CREACION = {
  ent_sr_01: '2026-04-10', ent_sr_02: '2026-04-12', ent_sr_03: '2026-05-03',
  ent_ou_01: '2026-03-28', ent_ou_02: '2026-04-25', ent_ou_03: '2026-05-03',
  ent_ga_01: '2026-03-30', ent_ga_02: '2026-04-18', ent_ga_03: '2026-05-10',
  ent_rv_01: '2026-03-25', ent_rv_02: '2026-04-20', ent_rv_03: '2026-05-18'
};

data.iniciativas = data.iniciativas.map(ini => ({
  ...ini,
  mes_inicio:    INICIATIVA_FECHAS[ini.id].mes_inicio,
  mes_fin:       INICIATIVA_FECHAS[ini.id].mes_fin,
  mos_asociados: INICIATIVA_MOS[ini.id] || [],
  entregables:   ini.entregables.map((ent, idx) => ({
    id:            ent.id,
    equipoId:      'eq_planificacion',
    iniciativaId:  ini.id,
    aplicacionId:  ENT_APP[ent.id] || 'app_blue_planner',
    q:             ent.q,
    titulo:        ent.titulo,
    descripcion:   ent.descripcion,
    label:         ent.label,
    fechaCreacion: ENT_FECHA_CREACION[ent.id] || '2026-04-01',
    fechaInicio:   ent.fechaInicio,
    fechaFin:      ent.fechaFin,
    estado:        ent.estado,
    activo:        ent.activo,
    orden:         idx + 1
  }))
}));

// ── 4. ACTUALIZAR capacitaciones: agregar releaseId donde aplique ────────────────────
const CAP_RELEASE = {
  cap_002: 'rel_q2_01',   // Smart Retiros
  cap_004: 'rel_q2_03',   // Diccionario Blue
  cap_005: 'rel_q2_02',   // Optimizador
  cap_006: 'rel_q2_04'    // Red de Distribución
};

data.capacitaciones = data.capacitaciones.map(cap => {
  if (CAP_RELEASE[cap.id]) {
    // Insertar releaseId después de "url"
    const { id, equipoId, titulo, descripcion, tipo, duracion, emoji, aplicacionId, audiencia, url, activo, orden } = cap;
    return { id, equipoId, titulo, descripcion, tipo, duracion, emoji, aplicacionId, audiencia, url, releaseId: CAP_RELEASE[cap.id], activo, orden };
  }
  return cap;
});

// ── 5. CORREGIR reviews: campos vacíos, contenido interno, embedUrl ───────────────
function placehold(colorHex, text) {
  const safe = text.substring(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '+');
  return `https://placehold.co/1280x720/0A1650/${colorHex}?text=${safe}`;
}

const REVIEW_CONTENTS = {
  rev_q2_02: [
    {
      tipo: 'resumen',
      titulo: 'Resumen Sprint 64',
      texto: '52 SP completados — mejor sprint del Q2. Se entregó el MVP del Optimizador de Rutas para Base Valdivia (rutas óptimas en < 2s) y se dejó operativo el Motor de Cálculo Hub/Zona con 94% de precisión.'
    },
    {
      tipo: 'highlight',
      titulo: 'Hito: Optimizador Valdivia en producción',
      texto: 'El Optimizador genera secuencias de entrega óptimas para hasta 80 OS simultáneas. Primer despliegue productivo del Q2. Siguientes pasos: piloto en Hub Urbano de Santiago.'
    },
    {
      tipo: 'metricas',
      titulo: 'Avance de MOS',
      texto: 'OS/ruta: 49 (LB: 42 | Meta: 52). Fallo por direcciones: 13% (LB: 18% | Meta: 10%). Reservas automáticas: 16% (LB: 3% | Meta: 40%).'
    }
  ],
  rev_q2_03: [
    {
      tipo: 'resumen',
      titulo: 'Resumen Sprint 65',
      texto: '50 SP completados. Sprint de consolidación enfocado en la integración de Geosolver con el pipeline de OS (70% completo) y la primera versión del modelo territorial nacional.'
    },
    {
      tipo: 'highlight',
      titulo: 'Georreferenciación al 88% de precisión',
      texto: 'El motor de georreferenciación alcanzó 88% de precisión promedio, superando la línea base (78%) en 10 puntos. La meta del Q2 es 94%. La integración con OS se completará en los próximos 5 días hábiles.'
    },
    {
      tipo: 'metricas',
      titulo: 'Avance de MOS',
      texto: 'OS/ruta: 51 (LB: 42 | Meta: 52). Fallo por direcciones: 12% (LB: 18% | Meta: 10%). Reservas automáticas: 19% (LB: 3% | Meta: 40%). Calidad alta: 55% (LB: 42% | Meta: 70%).'
    }
  ]
};

data.reviews = data.reviews.map(review => {
  const r = { ...review };

  // Rellenar urls vacíos en indicadores
  r.indicadores = (r.indicadores || []).map(ind => ({
    ...ind,
    url: ind.url || placehold('B3D9FF', ind.titulo)
  }));

  // Rellenar urls vacíos en resultados
  r.resultados = (r.resultados || []).map(res => ({
    ...res,
    url: res.url || placehold('A5F3FC', res.titulo)
  }));

  // Rellenar urls vacíos en riesgos
  r.riesgos = (r.riesgos || []).map(rsk => ({
    ...rsk,
    url: rsk.url || placehold('FCA5A5', 'Riesgo ' + rsk.nivel)
  }));

  // Para reviews internas: eliminar embedUrl, rellenar contenido.items
  if (r.fuente === 'interna') {
    delete r.embedUrl;
    if (!r.contenido.items || r.contenido.items.length === 0) {
      r.contenido = { items: REVIEW_CONTENTS[r.id] || [] };
    }
  }

  return r;
});

// ── 6. REORDENAR claves del documento maestro ────────────────────────────────────────
const result = {
  portafolios:    data.portafolios,
  usuarios:       data.usuarios,
  equipoId:       data.equipoId,
  config:         data.config,
  miembros:       data.miembros,
  capacidades:    data.capacidades,
  aplicaciones:   data.aplicaciones,
  bets:           data.bets,
  mos:            data.mos,
  releases:       data.releases,
  iniciativas:    data.iniciativas,
  stakeholders:   data.stakeholders,
  businessFlows:  data.businessFlows,
  salud:          data.salud,
  capacitaciones: data.capacitaciones,
  reviews:        data.reviews
};

fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf8');

const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
console.log(`nuevo5.json evolucionado correctamente.`);
console.log(`Lineas: ${lines} | Secciones: ${Object.keys(result).join(', ')}`);
