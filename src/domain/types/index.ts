// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN TYPES — site-equipo-planificacion
// Basado en el diseño de site-base.html
// ─────────────────────────────────────────────────────────────────────────────

// ── Configuración general ─────────────────────────────────────────────────────
// Sheet → hoja "Config"
export interface Config {
  equipoId?: string;           // Fase C: scope por equipo
  titulo?: string;
  año?: string;
  q_activo?: string;       // "Q2"
  sprint_actual?: string;  // "65"
  fecha_actualizacion?: string;
  version?: string;
  po?: string;             // Product Owner
  im?: string;             // Ingeniería / Manager
  tl?: string;             // Tech Lead
  total_devs?: number;
  mission?: string;        // Texto misión del equipo
  vision?: string;         // Texto visión del equipo
}

// ── Miembro del equipo ────────────────────────────────────────────────────────
// Sheet → hoja "Equipo"
export interface TeamMember {
  id: string;
  equipoId?: string;           // Fase C: scope por equipo
  nombre: string;
  rol: string;
  iniciales: string;
  foto_url?: string;       // Google Drive URL en prod; picsum en mock
  activo: boolean;
}

// ── Roles canónicos de equipo ─────────────────────────────────────────────
export const ROLES_EQUIPO = [
  { codigo: 'tech_leader',       descripcion: 'Tech Leader' },
  { codigo: 'product_owner',     descripcion: 'Product Owner' },
  { codigo: 'iteration_manager', descripcion: 'Iteration Manager' },
  { codigo: 'fullstack_frontend',descripcion: 'Full Stack / Front End' },
  { codigo: 'datos_analytics',   descripcion: 'Datos / Analytics' },
] as const;

export type RolEquipoCodigo = typeof ROLES_EQUIPO[number]['codigo'];

// ── Último release embebido en Aplicacion ────────────────────────────────────
export interface UltimoRelease {
  version: string;
  fecha: string;
  estado: 'backlog' | 'in_progress' | 'done';
  descripcion: string;
  changelog: string[];
}

// ── Salud / Riesgo de una capacidad ──────────────────────────────────────────
export interface Salud {
  id: string;
  equipoId: string;
  titulo: string;
  descripcion: string;
  capacidadKey: string;
  nivel: 'alto' | 'medio' | 'bajo';
  estado: 'activo' | 'mitigado' | 'cerrado';
  probabilidad: 'alta' | 'media' | 'baja';
  impacto: 'alto' | 'medio' | 'bajo';
  plan_mitigacion: string;
  responsable: string;
  fechaDeteccion: string;
  fechaRevision: string;
  activo: boolean;
}

// ── Capacitacion ──────────────────────────────────────────────────────────────
export interface Capacitacion {
  id: string;
  equipoId: string;
  titulo: string;
  descripcion: string;
  tipo?: string;
  duracion?: string;
  emoji?: string;
  aplicacionId?: string;
  audiencia?: string;
  url?: string;
  fecha?: string;
  activo: boolean;
  orden: number;
}

// ── Alcance (elemento dentro de una Capacidad) ───────────────────────────────
export interface Alcance {
  key: string;             // identificador único, ej: "primera", "georref"
  nombre: string;
  icon: string;
  color: string;           // hex
  descripcion: string;
  contexto?: string;       // descripción extendida
  badge?: string;          // ej: "Nueva"
  capacidadKey: string;    // referencia a la Capacidad padre
  aplicacionId?: string;   // app asociada a este alcance
  alcances?: Alcance[];    // sub-alcances opcionales para el editor administrativo
}

// ── Aplicación perteneciente a un alcance ─────────────────────────────────────
export interface Aplicacion {
  id: string;
  nombre: string;
  descripcion: string;
  capacidadKey: string;
  alcanceKey?: string;           // alcance al que pertenece
  activo?: boolean;
  ultimo_release?: UltimoRelease; // release más reciente embebido
}

// ── Capacidad ─────────────────────────────────────────────────────────────────
export interface Capacidad {
  key: string;             // "plan" | "red" | "int"
  equipoId?: string;           // Fase C: scope por equipo
  label: string;
  nombre: string;
  color: string;
  contexto?: string;       // descripción del propósito de la capacidad
  orden: number;           // para ordenar en la UI
  alcances: Alcance[];
}

// ── Entregable de Iniciativa ─────────────────────────────────────────────────
export interface EntregableItem {
  id: string;
  equipoId?: string;
  iniciativaId?: string;
  aplicacionId?: string;  // app que entrega este entregable
  titulo: string;
  descripcion?: string;
  fechaInicio: string;    // YYYY-MM-DD
  fechaFin: string;       // YYYY-MM-DD
  mes_inicio?: string;    // ej: "2026-04"
  mes_fin?: string;       // ej: "2026-06"
  label?: string;         // Label barra Roadmap
  url?: string;           // URL presentación / foto
  q: number;
  activo?: boolean;
  estado?: 'backlog' | 'in_progress' | 'done';
  fechaCreacion?: string;
  orden?: number;
}

// ── Iniciativa (Roadmap) ──────────────────────────────────────────────────────
// Sheet → hoja "Iniciativas" (futuro)
export interface Iniciativa {
  id: string;
  equipoId?: string;           // Fase C: scope por equipo
  nombre: string;
  descripcion?: string;
  emoji: string;
  fechas: string;
  tag: 'plan' | 'wip' | 'done';
  producto: string; // nombre del producto asociado (de Bets/LVT)
  q: number;
  bar: { s: number; e: number; sp: number; ep: number };
  label: string;
  activo?: boolean;
  mes_inicio?: string;      // ej: "2026-04"
  mes_fin?: string;         // ej: "2026-06"
  mos_asociados?: string[]; // ids de MOS que valida esta iniciativa
  entregables?: EntregableItem[];
}

// ── Review ────────────────────────────────────────────────────────────────────
// Guardadas en localStorage (futuro: Sheet)
export interface ReviewBloque {
  id?: string;
  capacidadKey?: string;
  titulo: string;
  contexto: string;
  detalle?: string;
  descripcion?: string;
  url: string;             // imagen_url (Google Drive URL)
  entregable?: string;
  compromiso?: string;
  comentarios?: string;
  status?: 'listo' | 'pendiente';
  nivel?: 'bajo' | 'medio' | 'alto';
  impactLevel?: 'low' | 'mid' | 'high';
}

export type ReviewSectionKey = 'indicadores' | 'resultados' | 'demo' | 'riesgos' | 'proximos_pasos';
export type ReviewSectionType = ReviewSectionKey | 'custom';

export interface ReviewContenidoItem {
  id: string;
  titulo: string;
  sectionKey?: ReviewSectionKey;
  active?: boolean;
}

export interface ReviewStructuredSection {
  id: string;
  type: ReviewSectionType;
  title: string;
  active: boolean;
  fixed?: boolean;
  nextStepsMode?: 'roadmap' | 'manual';
  items?: ReviewBloque[];
}

export const DEFAULT_REVIEW_INDEX_ITEMS = [
  { id: 'indicadores', titulo: 'Indicadores', sectionKey: 'indicadores' },
  { id: 'resultados', titulo: 'Resultados del Sprint', sectionKey: 'resultados' },
  { id: 'demo', titulo: 'Demo', sectionKey: 'demo' },
  { id: 'riesgos', titulo: 'Riesgos', sectionKey: 'riesgos' },
  { id: 'proximos_pasos', titulo: 'Próximos pasos', sectionKey: 'proximos_pasos' },
] as const;

export interface Review {
  id: string;
  equipoId?: string;           // Fase C: scope por equipo
  titulo?: string;
  sprint: string;
  fecha: string;
  q: string;
  estado: 'publicada' | 'borrador';
  activo?: boolean;
  fuente?: 'interna' | 'embebida' | 'roadmap';
  embedUrl?: string;
  jiraPanelUrl?: string;
  contenido: { items: ReviewContenidoItem[] };
  secciones?: ReviewStructuredSection[];
  indicadores: ReviewBloque[];
  resultados: ReviewBloque[];
  demo: string[];
  demoItems?: ReviewBloque[];
  riesgos: ReviewBloque[];
  mos_actuals?: Record<string, string>;
}

// ── Estado genérico de ítems ─────────────────────────────────────────────────
export type StatusItem =
  | 'PLANIFICADO'
  | 'EN_CURSO'
  | 'COMPLETADO'
  | 'ATRASADO'
  | 'BLOQUEADO';

// ── BET (Business Expected Outcome) ──────────────────────────────────────────
export interface Bet {
  id: string;
  equipoId?: string;           // Fase C: scope por equipo
  q: string;             // "Q1" | "Q2" | "Q3" | "Q4"
  descripcion: string;
  producto: string;      // producto principal para retrocompatibilidad
  productos?: string[];  // productos asociados al Bet / LVT
  color: string;
  capacidadKey?: string;  // referencia a la Capacidad padre (opcional para retrocompat)
  aplicacionId?: string;  // app principal asociada a este bet
  mos_ids: string[];
  mos_inactivos?: string[];
  orden: number;
  activo?: boolean;
}

// ── MOS (Measure of Success) ──────────────────────────────────────────────────
export interface MOS {
  id: string;
  equipoId?: string;           // Fase C: scope por equipo
  q: string;             // quarter principal para retrocompatibilidad
  qs?: string[];         // quarters donde aplica el MOS del Bet
  descripcion: string;
  linea_base?: string;
  meta?: string;
  actual?: string;
  orden: number;
}

// ── Stakeholder ──────────────────────────────────────────────────────────────
export interface Stakeholder {
  id: string;
  nombre: string;
  area?: string;
  q: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL';
  capacidadKeys: string[];
  activo: boolean;
}

// ── Flujos de negocio ────────────────────────────────────────────────────────
export interface BusinessFlow {
  id: string;
  titulo: string;
  descripcionTarjeta: string;
  contenido: string;
  confluenceUrl?: string;
  presentacionUrl?: string;
  icono?: string;
  color?: string;
  activo: boolean;
  orden: number;
}

// ── Entregable (tarea dentro de una Iniciativa) ───────────────────────────────
export interface Entregable {
  id: string;
  equipoId?: string;           // Fase C: scope por equipo
  iniciativaId: string;  // referencia a la Iniciativa padre
  q: number;
  titulo: string;
  descripcion?: string;
  fechaCreacion?: string;
  fechaInicio: string;   // YYYY-MM-DD
  fechaFin: string;      // YYYY-MM-DD
  activo?: boolean;
  url?: string;
  orden?: number;
  estado?: 'backlog' | 'in_progress' | 'done';
  label?: string;
}

// ── Usuario (control de acceso) ──────────────────────────────────────────────
export interface Usuario {
  _id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'super_admin' | 'superadmin' | 'viewer';
  activo: boolean;
  canConfigure: boolean;
  fechaRegistro?: string;
  autoRegistro?: boolean;
}

// ── AppData — estructura raíz que retorna el repositorio ─────────────────────
export interface AppData {
  config: Config;
  equipo: TeamMember[];
  capacidades: Capacidad[];
  iniciativas: Iniciativa[];
  entregables?: Entregable[];   // legacy — los entregables ahora viven nested en Iniciativa.entregables
  bets: Bet[];
  mos: MOS[];
  stakeholders: Stakeholder[];
  businessFlows: BusinessFlow[];
  aplicaciones: Aplicacion[];
  reviews: Review[];
  salud?: Salud[];
  capacitaciones?: Capacitacion[];
  usuario?: Usuario;
}

// ── Equipo (dentro de un Portafolio) ──────────────────────────────────────────
export interface Equipo {
  id: string;
  nombre: string;
  descripcion?: string;
  portafolioId: string;
  activo?: boolean;
}

// ── Portafolio ───────────────────────────────────────────────────────────────
export interface Portafolio {
  id: string;
  nombre: string;
  descripcion?: string;
  equipos: Equipo[];
  activo?: boolean;
}

// ── Estructura raíz para multi-portafolio ─────────────────────────────────────
export interface PortfolioData {
  portafolios: Portafolio[];
}

// ── Presentacion ─────────────────────────────────────────────────────────────
export interface Presentacion {
  id: string;
  titulo: string;
  descripcion: string;
  fechaCreacion: string; // ISO
  capacidad?: string;
  url: string;
}
