// ─────────────────────────────────────────────────────────────────────────────
// MockRepository — Datos de desarrollo local
// Refleja exactamente la estructura del site-base.html
// ─────────────────────────────────────────────────────────────────────────────

import type { IDataRepository } from '../../domain/interfaces/IDataRepository';
import type { AppData, Entregable } from '../../domain/types';
import { getPresentaciones } from '../../application/services/presentacionService';

export const MOCK_DATA: AppData = {
  config: {
    titulo: 'Portafolio Distribución - Planificación del Transporte',
    año: '2026',
    q_activo: 'Q2',
    sprint_actual: '65',
    fecha_actualizacion: '08/04/26',
    version: '3',
    po: 'Javiera León',
    im: 'Ricardo Moscoso',
    tl: 'Carlos Gallardo',
    total_devs: 7,
    mission: 'Diseñar y optimizar el sistema de planificación logística de Blue Express, desarrollando soluciones tecnológicas que mejoren la eficiencia operativa en cada milla del proceso de distribución.',
    vision: 'Ser el equipo referente en planificación logística inteligente, habilitando una red de distribución predictiva, eficiente y escalable que posicione a Blue Express como líder en última milla en Chile.',
  },
  equipo: [
    { id: 'eq_001', nombre: 'Javiera León',    rol: 'Product Owner',         iniciales: 'JL', activo: true },
    { id: 'eq_002', nombre: 'Ricardo Moscoso', rol: 'Iteration Manager',     iniciales: 'RM', activo: true },
    { id: 'eq_003', nombre: 'Carlos Gallardo', rol: 'Full Stack',            iniciales: 'CG', activo: true },
    { id: 'eq_004', nombre: 'Leslye Rojas',    rol: 'Front End',   iniciales: 'LR', activo: true },
    { id: 'eq_005', nombre: 'Hector Matcovich',rol: 'Front End',   iniciales: 'HM', activo: true },
    { id: 'eq_006', nombre: 'Sara Vega',       rol: 'Full Stack',  iniciales: 'SV', activo: true },
    { id: 'eq_007', nombre: 'Elias Sabja',     rol: 'Full Stack',  iniciales: 'ES', activo: true },
    { id: 'eq_008', nombre: 'Fabian Sandoval', rol: 'Backend',     iniciales: 'FS', activo: true },
    { id: 'eq_009', nombre: 'Denis Miranda',   rol: 'Full Stack',  iniciales: 'DM', activo: true },
    { id: 'eq_010', nombre: 'Rodrigo Hurtado', rol: 'Full Stack',            iniciales: 'RH', activo: true },
  ],
  capacidades: [
    {
      key: 'plan', label: 'Planificación', nombre: 'Planificación', color: '#1B30CC', orden: 1,
      contexto: 'Optimizar la planificación y operación de cada tramo de la red logística — desde el retiro hasta la entrega final — asegurando eficiencia, escalabilidad y alineación con la capacidad real de ruteo.',
      alcances: [
        { key: 'primera',   capacidadKey: 'plan', nombre: 'Primera Milla',   icon: '🚚', color: '#7C3AED', descripcion: 'Automatizar y escalar la planificación de retiros: reservas, abastecimiento y asignación de couriers.' },
        { key: 'media',     capacidadKey: 'plan', nombre: 'Media Milla',     icon: '🔄', color: '#1E40AF', descripcion: 'Tramo: Base Principal → Hub Urbano (intrarregional). Control y optimización de la flota.', badge: 'Nueva' },
        { key: 'troncales', capacidadKey: 'plan', nombre: 'Troncales',       icon: '🛣️', color: '#0369A1', descripcion: 'Tramo: SCL ↔ Bases Regionales (interregional, multi-parada).', badge: 'Nueva' },
        { key: 'ultima',    capacidadKey: 'plan', nombre: 'Última Milla',    icon: '📦', color: '#EA580C', descripcion: 'Sistema de optimización de rutas end-to-end para la entrega final.' },
      ],
    },
    {
      key: 'int', label: 'Inteligencia de Direcciones', nombre: 'Inteligencia de Direcciones', color: '#DB2777', orden: 2,
      contexto: 'Garantizar que cada dirección de la red sea confiable, georreferenciada y certificada para operar sin necesidad de consultar proveedores externos, reduciendo errores y tiempos de resolución.',
      alcances: [
        { key: 'georref', capacidadKey: 'int', nombre: 'Georreferenciación',     icon: '📍', color: '#DB2777', descripcion: 'Limpieza y enriquecimiento de direcciones. Alimenta el Diccionario Blue y calcula Hub y zona asignados.' },
        { key: 'calidad', capacidadKey: 'int', nombre: 'Calidad de Direcciones', icon: '✅', color: '#9D174D', descripcion: 'Certificación de direcciones mediante geolocalización real.' },
      ],
    },
    {
      key: 'red', label: 'Red de Distribución', nombre: 'Red de Distribución', color: '#0891B2', orden: 3,
      contexto: 'Administrar y mantener actualizado el modelo territorial y el catálogo de nodos operativos que sustentan el flujo logístico nacional, incluyendo cobertura por clasificación territorial.',
      alcances: [
        { key: 'reddist', capacidadKey: 'red', nombre: 'Red de Distribución', icon: '🗺️', color: '#0891B2', descripcion: 'Catálogo de Bases y Hubs activos y sus rutas válidas. Modelo territorial con indicadores de cobertura.' },
      ],
    },
    {
      key: 'programas', label: 'Programa', nombre: 'Programa', color: '#2563EB', orden: 4,
      contexto: 'Agrupa productos transversales donde el equipo implementa una parte del proceso completo del programa.',
      alcances: [
        { key: 'programa_b2b', capacidadKey: 'programas', nombre: 'Programa B2B', icon: '💼', color: '#2563EB', descripcion: 'Producto transversal orientado a iniciativas, seguimiento y entregables del frente B2B.' },
      ],
    },
  ],
  iniciativas: [
    { id: 'sr',  q: 2, producto: 'Smart Retiros', emoji: '📦', nombre: 'Smart Retiros', descripcion: 'Automatizar la planificación de retiros con reservas validadas por capacidad, zona y disponibilidad operativa.', fechas: '15 Abr → 30 Jun', tag: 'plan', label: 'Dashboard + georreferencia reservas',  bar: { s: 0, e: 2, sp: 48, ep: 100 }, entregables: [
      { id: 'ent_sr_01', iniciativaId: 'sr', q: 2, titulo: 'API de reservas', descripcion: 'Endpoint REST /api/v1/reservas con validación de capacidad disponible por courier y zona.', fechaCreacion: '2026-04-10', fechaInicio: '2026-04-15', fechaFin: '2026-04-30', activo: true },
    ]},
    { id: 'ou',  q: 2, producto: 'Optimización Última Milla', emoji: '⭐', nombre: 'Optimización Última Milla', descripcion: 'Construir el MVP del optimizador para última milla, priorizando factibilidad operativa y eficiencia de rutas.', fechas: '01 Abr → 30 Jun', tag: 'plan', label: 'MVP Optimización Base Valdivia + HU',   bar: { s: 0, e: 2, sp: 0,  ep: 100 }, entregables: [] },
    { id: 'ga',  q: 2, producto: 'Georreferenciación automática', emoji: '📍', nombre: 'Georreferenciación automática', descripcion: 'Levantar un motor de georreferenciación confiable que asigne coordenadas, hub y zona con alta precisión.', fechas: '01 Abr → 31 May', tag: 'plan', label: 'Diccionario Blue + cálculo Hub/zona',  bar: { s: 0, e: 1, sp: 0,  ep: 100 }, entregables: [] },
    { id: 'rv',  q: 2, producto: 'Red de Distribución v1', emoji: '🗺️', nombre: 'Red de Distribución v1', descripcion: 'Formalizar el catálogo de nodos y el modelo territorial que soportan la planificación nacional.', fechas: '01 Abr → 30 Jun', tag: 'plan', label: 'Catálogo nodos + modelo territorial',  bar: { s: 0, e: 2, sp: 0,  ep: 85  }, entregables: [] },
  ],
  bets: [
    // Q2
    { id: 'bet_q2_01', q: 'Q2', capacidadKey: 'plan', aplicacionId: 'app_optimizador',   producto: 'Optimizador de Rutas', color: '#1B30CC', descripcion: 'Construir un sistema de optimización de rutas end-to-end para primera y última milla, generando planes factibles, eficientes y escalables con restricciones operativas reales.', mos_ids: ['mos_q2_01', 'mos_q2_02', 'mos_q2_03', 'mos_q2_04'], mos_inactivos: ['mos_q2_02', 'mos_q2_03', 'mos_q2_04'], orden: 1, activo: true },
    { id: 'bet_q2_02', q: 'Q2', capacidadKey: 'int',  aplicacionId: 'app_geosolver',     producto: 'Geosolver',            color: '#DB2777', descripcion: 'Desarrollar un sistema de direcciones y georreferenciación confiable, estandarizado y autocorrectivo, que habilite la optimización de rutas a escala.', mos_ids: ['mos_q2_05', 'mos_q2_06', 'mos_q2_07', 'mos_q2_08'], mos_inactivos: ['mos_q2_06', 'mos_q2_07', 'mos_q2_08'], orden: 2, activo: true },
    { id: 'bet_q2_03', q: 'Q2', capacidadKey: 'plan', aplicacionId: 'app_smart_retiros', producto: 'Smart Retiros',        color: '#7C3AED', descripcion: 'Automatizar y escalar la planificación de reservas y abastecimiento, asegurando correctitud, anticipación y alineación con la capacidad real de ruteo.', mos_ids: ['mos_q2_09', 'mos_q2_10', 'mos_q2_11'], mos_inactivos: ['mos_q2_10', 'mos_q2_11'], orden: 3, activo: true },
    // Q1
    { id: 'bet_q1_01', q: 'Q1', capacidadKey: 'plan', aplicacionId: 'app_blue_planner', producto: 'Blue Planner',         color: '#0369A1', descripcion: 'Validar la factibilidad operativa del optimizador de rutas en Base Valdivia con un primer piloto funcional.', mos_ids: ['mos_q1_01', 'mos_q1_02'], mos_inactivos: [], orden: 1, activo: true },
  ],
  mos: [
    // Q2 — Optimizador
    { id: 'mos_q2_01', q: 'Q2', descripcion: '(+) Productividad de rutas (OS/ruta, kg/camión)',         linea_base: '42 OS/ruta', meta: '52 OS/ruta', actual: '47 OS/ruta', orden: 1 },
    { id: 'mos_q2_02', q: 'Q2', descripcion: '(–) Km por OS / ruta',                                   linea_base: '—',          meta: '—',          orden: 2 },
    { id: 'mos_q2_03', q: 'Q2', descripcion: '(+) % rutas ejecutadas según planificación',             linea_base: '—',          meta: '—',          orden: 3 },
    { id: 'mos_q2_04', q: 'Q2', descripcion: '(–) Reprocesos o replanificaciones diarias',              linea_base: '—',          meta: '—',          orden: 4 },
    // Q2 — Geosolver
    { id: 'mos_q2_05', q: 'Q2', descripcion: '(–) % fallo por direcciones (BA / DI / MR / MRH)',       linea_base: '18%',        meta: '10%',        actual: '14%', orden: 1 },
    { id: 'mos_q2_06', q: 'Q2', descripcion: '(+) % direcciones con calidad alta',                     linea_base: '—',          meta: '—',          orden: 2 },
    { id: 'mos_q2_07', q: 'Q2', descripcion: '(+) Precisión promedio de georreferenciación',            linea_base: '—',          meta: '—',          orden: 3 },
    { id: 'mos_q2_08', q: 'Q2', descripcion: '(+) % direcciones corregidas automáticamente',            linea_base: '—',          meta: '—',          orden: 4 },
    // Q2 — Smart Retiros
    { id: 'mos_q2_09', q: 'Q2', descripcion: '(+) % reservas asignadas automáticamente',               linea_base: '3%',         meta: '40%',        actual: '12%', orden: 1 },
    { id: 'mos_q2_10', q: 'Q2', descripcion: '(+) % reservas asignadas correctamente',                  linea_base: '—',          meta: '—',          actual: '—', orden: 2 },
    { id: 'mos_q2_11', q: 'Q2', descripcion: '(–) OS no retiradas por error de planificación',          linea_base: '—',          meta: '—',          actual: '—', orden: 3 },
    // Q1
    { id: 'mos_q1_01', q: 'Q1', descripcion: '% de rutas ejecutadas según lo planificado',              linea_base: '0',          meta: '15',         actual: '11', orden: 1 },
    { id: 'mos_q1_02', q: 'Q1', descripcion: '% de reservas asignadas automáticamente',                 linea_base: '3%',         meta: '—',          actual: '9%', orden: 2 },
  ],
  stakeholders: [
    { id: 'stk_002', nombre: 'Alejandra Díaz', area: 'Data', q: 'ALL', capacidadKeys: ['plan', 'red'], activo: true },
    { id: 'stk_003', nombre: 'Natalia Rojas', area: 'Experiencia Cliente', q: 'Q3', capacidadKeys: ['plan', 'int'], activo: true },
  ],
  businessFlows: [
    {
      id: 'bf_001',
      titulo: 'Modelo Geográfico',
      descripcionTarjeta: 'Define cómo se estructura territorialmente la operación para asignar cobertura, hubs, bases y zonas de servicio.',
      contenido: 'El modelo geográfico organiza la operación logística sobre una capa territorial común. Define regiones, comunas, hubs, bases, postas y zonas de cobertura para que la planificación, el ruteo y la operación hablen el mismo idioma.\n\nEste flujo de negocio habilita decisiones como la asignación de hub, la cobertura territorial de una base, la detección de vacíos operativos y la trazabilidad de cambios sobre el mapa logístico.\n\nTambién sirve como base para productos como Red de Distribución, Direcciones y optimización de rutas, porque todos dependen de una representación geográfica consistente.',
      confluenceUrl: '',
      capacidadKey: 'red',
      icono: '🗺️',
      color: '#0891B2',
      activo: true,
      orden: 1,
    },
    {
      id: 'bf_002',
      titulo: 'Modelo Operativo',
      descripcionTarjeta: 'Explica cómo se mueve la operación entre primera, media, troncal y última milla, junto con sus reglas y restricciones.',
      contenido: 'El modelo operativo describe el flujo real de una orden dentro de Blue Express, desde el retiro o ingreso hasta su entrega final. Define etapas, responsables, restricciones, dependencias y eventos clave para que los equipos entiendan cómo se ejecuta el negocio.\n\nEste flujo de negocio permite alinear productos de planificación con la operación real, evitando diseñar soluciones desconectadas del terreno. También ayuda a identificar puntos de control, cuellos de botella y oportunidades de automatización.\n\nSu documentación debe servir tanto para entender el proceso completo como para explicar dónde impacta cada producto del equipo dentro del ciclo operativo.',
      confluenceUrl: '',
      capacidadKey: 'plan',
      icono: '⚙️',
      color: '#1B30CC',
      activo: true,
      orden: 2,
    },
  ],
  entregables: [], // Los entregables van nested dentro de cada iniciativa
  aplicaciones: [
    { id: 'app_blue_planner',    nombre: 'Blue Planner',          descripcion: 'Dashboard de planificación operativa. Visualiza reservas, capacidades, asignaciones de courier y métricas del día.', capacidadKey: 'plan', alcanceKey: 'media',    activo: true, ultimo_release: { version: '0.8.0', fecha: '2026-04-15', estado: 'done', descripcion: 'Dashboard de planificación operativa con indicadores del día en tiempo real.',                                    changelog: ['Vista de reservas asignadas vs pendientes', 'Indicadores de velocidad de courier por zona', 'Integración con Smart Retiros para asignación automática'] } },
    { id: 'app_smart_retiros',   nombre: 'Smart Retiros',         descripcion: 'Motor de asignación automática de reservas según capacidad disponible, zona y disponibilidad operativa de couriers.',         capacidadKey: 'plan', alcanceKey: 'primera',  activo: true, ultimo_release: { version: '1.0.0', fecha: '2026-04-30', estado: 'done', descripcion: 'Primera versión productiva del motor de asignación automática de reservas.',                               changelog: ['Endpoint POST /api/v1/reservas con validación de capacidad disponible', 'Asignación automática por zona y disponibilidad operativa de courier', 'Integración con sistema de gestión de OS'] } },
    { id: 'app_optimizador',     nombre: 'Optimizador de Rutas',  descripcion: 'Generador de rutas óptimas end-to-end para última milla. Opera con restricciones reales de capacidad, ventana horaria y zonificación.',   capacidadKey: 'plan', alcanceKey: 'ultima',   activo: true, ultimo_release: { version: '1.0.0', fecha: '2026-04-28', estado: 'done', descripcion: 'MVP del motor de optimización de rutas para Base Valdivia.',                                              changelog: ['Motor de optimización VRP para lotes de hasta 80 OS por base', 'Restricciones: capacidad de camión, ventana horaria y OS prioritarias', 'Tiempo de respuesta menor a 2 segundos garantizado'] } },
    { id: 'app_geosolver',       nombre: 'Geosolver',             descripcion: 'Sistema de normalización, georreferenciación y certificación de calidad de direcciones. Alimenta el Diccionario Blue.',             capacidadKey: 'int',  alcanceKey: 'georref',  activo: true, ultimo_release: { version: '0.1.0', fecha: '2026-05-15', estado: 'done', descripcion: 'Primera versión con Diccionario Blue (180K registros) y motor Hub/Zona operativo.',                        changelog: ['Diccionario Blue v0.1 con 180K direcciones normalizadas y clasificadas', 'Motor de asignación automática de Hub y Zona por coordenadas', 'API interna de georreferenciación disponible', 'Clasificación de calidad: alta (>= 95%), media (>= 80%), baja (< 80%)'] } },
    { id: 'app_diccionario_blue', nombre: 'Diccionario Blue',     descripcion: 'Repositorio centralizado de direcciones normalizadas con coordenadas, hub asignado, zona y nivel de calidad.',                         capacidadKey: 'int',  alcanceKey: 'calidad',  activo: true, ultimo_release: { version: '0.1.0', fecha: '2026-05-15', estado: 'done', descripcion: 'Diccionario Blue con 180K registros normalizados y niveles de calidad.',                                    changelog: ['180K direcciones normalizadas y georreferenciadas', 'Clasificación por calidad: alta, media, baja', 'Actualización automática desde pipeline de OS'] } },
    { id: 'app_red_dist',        nombre: 'Red de Distribución',  descripcion: 'Catálogo oficial de nodos operativos: Bases, Hubs y Postas. Modelo territorial con cobertura por región y comuna.',               capacidadKey: 'red',  alcanceKey: 'reddist',  activo: true, ultimo_release: { version: '1.0.0', fecha: '2026-04-25', estado: 'done', descripcion: 'Catálogo formal de nodos operativos nacionales con atributos completos.',                               changelog: ['Catálogo de 45 Bases y 12 Hubs activos a nivel nacional', 'Atributos por nodo: horario, capacidad máxima y rutas de entrada/salida', 'API REST de consulta de nodos disponible'] } },
  ],
  salud: [],
  capacitaciones: [
    { id: 'cap_001', equipoId: 'eq_planificacion', titulo: 'Smart Retiros: cómo funciona la asignación automática', descripcion: 'Explica el algoritmo de asignación automática de reservas por capacidad, zona y disponibilidad operativa de couriers.', emoji: '📦', capacidadKey: 'plan', aplicacionIds: ['app_smart_retiros', 'app_blue_planner'], url: '', activo: true, orden: 1 },
    { id: 'cap_002', equipoId: 'eq_planificacion', titulo: 'Cómo usar Geosolver para validar una dirección',       descripcion: 'Guía paso a paso para validar, corregir y georreferenciar direcciones usando el Diccionario Blue.',                            emoji: '🔍', capacidadKey: 'int',  aplicacionIds: ['app_geosolver', 'app_diccionario_blue'],          url: '', activo: true, orden: 2 },
  ],
  reviews: [],
  usuario: {
    _id: 'usr_admin_seed',
    email: 'ricardo.moscoso@bluex.cl',
    nombre: 'Ricardo Moscoso',
    rol: 'admin',
    activo: true,
    canConfigure: true,
  },
};

export const MOCK_USUARIOS = [
  { _id: 'usr_001', email: 'ricardo.moscoso@bluex.cl', nombre: 'Ricardo Moscoso', rol: 'admin' as const, activo: true, canConfigure: true, fechaRegistro: '2026-04-24T00:00:00.000Z', autoRegistro: false },
  { _id: 'usr_002', email: 'javiera.leon@bluex.cl', nombre: 'Javiera León', rol: 'admin' as const, activo: true, canConfigure: true, fechaRegistro: '2026-04-24T00:00:00.000Z', autoRegistro: false },
  { _id: 'usr_003', email: 'carlos.gallardo@bluex.cl', nombre: 'Carlos Gallardo', rol: 'viewer' as const, activo: true, canConfigure: false, fechaRegistro: '2026-04-24T01:00:00.000Z', autoRegistro: true },
  { _id: 'usr_004', email: 'leslye.rojas@bluex.cl', nombre: 'Leslye Rojas', rol: 'viewer' as const, activo: true, canConfigure: false, fechaRegistro: '2026-04-24T01:00:00.000Z', autoRegistro: true },
  { _id: 'usr_005', email: 'hector.matcovich@bluex.cl', nombre: 'Héctor Matcovich', rol: 'viewer' as const, activo: true, canConfigure: false, fechaRegistro: '2026-04-24T01:00:00.000Z', autoRegistro: true },
  { _id: 'usr_006', email: 'sara.vega@bluex.cl', nombre: 'Sara Vega', rol: 'viewer' as const, activo: true, canConfigure: false, fechaRegistro: '2026-04-24T01:00:00.000Z', autoRegistro: true },
  { _id: 'usr_007', email: 'elias.sabja@bluex.cl', nombre: 'Elias Sabja', rol: 'viewer' as const, activo: true, canConfigure: false, fechaRegistro: '2026-04-24T01:00:00.000Z', autoRegistro: true },
  { _id: 'usr_008', email: 'fabian.sandoval@bluex.cl', nombre: 'Fabian Sandoval', rol: 'viewer' as const, activo: true, canConfigure: false, fechaRegistro: '2026-04-24T02:00:00.000Z', autoRegistro: true },
  { _id: 'usr_009', email: 'denis.miranda@bluex.cl', nombre: 'Denis Miranda', rol: 'viewer' as const, activo: true, canConfigure: false, fechaRegistro: '2026-04-24T02:00:00.000Z', autoRegistro: true },
  { _id: 'usr_010', email: 'rodrigo.hurtado@bluex.cl', nombre: 'Rodrigo Hurtado', rol: 'viewer' as const, activo: true, canConfigure: false, fechaRegistro: '2026-04-24T02:00:00.000Z', autoRegistro: true },
];

export const MOCK_REVIEWS = [
  {
    id: 'rev_q2_02',
    titulo: 'Review Sprint 64',
    sprint: '64',
    fecha: '2026-04-03',
    q: 'Q2',
    estado: 'publicada',
    activo: true,
    embedUrl: 'https://docs.google.com/presentation/d/1RWMBwMxEKEctaT6YFhVmVTPFtkxTiNI3/edit?slide=id.g3b989720807_0_37#slide=id.g3b989720807_0_37',
    contenido: { items: [] },
    indicadores: [
      { titulo: 'Velocidad del equipo', contexto: '52 SP completados — mejor sprint del Q hasta la fecha', url: 'https://placehold.co/1280x720/png/0A1650/86EFAC?text=Velocidad+Sprint+64%0A52+SP+completados' },
      { titulo: 'Reservas automatizadas', contexto: '12% de asignación automática — partió en 3% a inicio de Q2', url: '' },
    ],
    resultados: [
      { titulo: 'Optimizador Valdivia — MVP completado', contexto: 'Genera rutas óptimas en < 2s para hasta 80 OS simultáneas con restricciones reales.', url: '' },
      { titulo: 'Motor Hub/Zona operativo', contexto: 'Calcula hub y zona asignados a partir de coordenadas con 94% de precisión.', url: '' },
    ],
    demo: ['Demo Optimizador Valdivia', 'Demo Motor Hub/Zona', 'Demo Dashboard retiros SP64'],
    riesgos: [
      { titulo: 'Cobertura hubs rurales', contexto: 'Datos faltantes para zonas extremas (Aysén, Magallanes). Impacta precisión del motor.', url: '', nivel: 'medio' },
      { titulo: 'Escalabilidad del optimizador', contexto: 'Performance no validada con > 200 OS por base. Requiere test de carga antes del despliegue.', url: '', nivel: 'medio' },
    ],
  },
];

function syncMockUsuarios() {
  const stored = localStorage.getItem('be_plan_usuarios');
  if (!stored) {
    localStorage.setItem('be_plan_usuarios', JSON.stringify(MOCK_USUARIOS));
  }
}

function syncMockReviews() {
  const fallback = JSON.stringify(MOCK_REVIEWS);
  const stored = localStorage.getItem('be_reviews');

  if (!stored) {
    localStorage.setItem('be_reviews', fallback);
    return;
  }

  try {
    const parsed = JSON.parse(stored) as Array<Record<string, unknown>>;
    const reviewsById = new Map(parsed.map(review => [String(review.id), review]));

    for (const mockReview of MOCK_REVIEWS) {
      reviewsById.set(mockReview.id, mockReview as unknown as Record<string, unknown>);
    }

    localStorage.setItem('be_reviews', JSON.stringify(Array.from(reviewsById.values())));
  } catch {
    localStorage.setItem('be_reviews', fallback);
  }
}

export class MockRepository implements IDataRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAllData(_equipoId?: string): Promise<AppData> {
    syncMockReviews();
    syncMockUsuarios();
    await new Promise(r => setTimeout(r, 300));
    const data = structuredClone(MOCK_DATA);
    // Fase C: asignar equipoId por defecto (primer equipo del primer portafolio)
    const defaultEquipoId = 'eq_planificacion';
    data.config.equipoId = defaultEquipoId;
    data.equipo            = data.equipo.map(m  => ({ ...m,  equipoId: defaultEquipoId }));
    data.capacidades       = data.capacidades.map(c  => ({ ...c,  equipoId: defaultEquipoId }));
    data.iniciativas       = data.iniciativas.map(i  => ({
      ...i,
      equipoId: defaultEquipoId,
      entregables: (i.entregables ?? []).map(e => ({ ...e, equipoId: defaultEquipoId })),
    }));
    // Lista plana de entregables derivada de las iniciativas (para compatibilidad con Roadmap local)
    data.entregables = data.iniciativas.flatMap(i => i.entregables ?? []) as Entregable[];
    data.bets              = data.bets.map(b  => ({ ...b,  equipoId: defaultEquipoId }));
    data.mos               = data.mos.map(m  => ({ ...m,  equipoId: defaultEquipoId }));
    if (data.capacitaciones) {
      data.capacitaciones  = data.capacitaciones.map(c => ({ ...c, equipoId: defaultEquipoId }));
    }
    data.presentaciones = getPresentaciones();
    return data;
  }

  async syncToSheet(data: Partial<AppData>): Promise<{ ok: boolean; entities: string[] }> {
    const entities = Object.keys(data);
    console.log('[MockRepository] syncToSheet (no-op en desarrollo local):', entities);
    return { ok: true, entities };
  }
}
