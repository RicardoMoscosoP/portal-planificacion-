// ─────────────────────────────────────────────────────────────────────────────
// dataService — Fachada de acceso a datos (Application layer)
//
// Selecciona automáticamente el repositorio correcto según el entorno:
//
//   Entorno GAS embebido  → GASRepository  (google.script.run)
//   VITE_API_URL definido → APIRepository  (fetch REST)
//   Local dev             → MockRepository (datos hardcodeados)
//
// El resto de la aplicación siempre importa desde aquí.
// Para cambiar la fuente de datos, solo hay que cambiar este archivo.
// ─────────────────────────────────────────────────────────────────────────────

import type { IDataRepository } from '../../domain/interfaces/IDataRepository';
import type { AppData, Capacitacion, Entregable, Review, ReviewBloque, ReviewContenidoItem, ReviewSectionKey, ReviewStructuredSection, Usuario } from '../../domain/types';
import { DEFAULT_REVIEW_INDEX_ITEMS } from '../../domain/types';
import { createRepository } from '../../infrastructure/repositories/repositoryFactory';

// Repositorio singleton para toda la app
const repository: IDataRepository = createRepository();

// ── Unsaved-changes bridge ────────────────────────────────────────────────────
let _onDirty: (() => void) | null = null;
let _onClean: (() => void) | null = null;

export function registerDirtyCallback(cb: (() => void) | null): void {
  _onDirty = cb;
}

export function registerCleanCallback(cb: (() => void) | null): void {
  _onClean = cb;
}

function notifyDirty(): void {
  _onDirty?.();
}

// ── Claves localStorage ───────────────────────────────────────────────────────
const LS_CONFIG       = 'be_plan_config';
const LS_INICIATIVAS   = 'be_plan_iniciativas';
const LS_BETS          = 'be_plan_bets';
const LS_MOS           = 'be_plan_mos';
const LS_EQUIPO        = 'be_plan_equipo';
const LS_CAPACIDADES   = 'be_plan_capacidades';
const LS_APLICACIONES  = 'be_plan_aplicaciones';
const LS_ENTREGABLES   = 'be_plan_entregables';
const LS_STAKEHOLDERS  = 'be_plan_stakeholders';
const LS_BUSINESS_FLOWS = 'be_plan_business_flows';
const LS_REVIEWS       = 'be_reviews';
const LS_USUARIOS      = 'be_plan_usuarios';
const LS_CAPACITACIONES = 'be_plan_capacitaciones';

const ALL_LS_KEYS = [
  LS_CONFIG, LS_INICIATIVAS, LS_BETS, LS_MOS, LS_EQUIPO,
  LS_CAPACIDADES, LS_APLICACIONES, LS_ENTREGABLES,
  LS_STAKEHOLDERS, LS_BUSINESS_FLOWS, LS_REVIEWS,
  LS_USUARIOS, LS_CAPACITACIONES,
];

export function clearAllLocalStorage(): void {
  ALL_LS_KEYS.forEach(key => localStorage.removeItem(key));
}
const LEGACY_TEAM_TITLES = new Set(['Planificación del Transporte', 'Portafolio Distribución']);
const LEGACY_REMOVED_STAKEHOLDERS = new Set(['stk_004']);

function normalizeConfig(config: AppData['config'], baseConfig: AppData['config']): AppData['config'] {
  const normalizedTitle = !config.titulo || LEGACY_TEAM_TITLES.has(config.titulo)
    ? baseConfig.titulo
    : config.titulo;

  return {
    ...baseConfig,
    ...config,
    titulo: normalizedTitle,
  };
}

function sanitizeStakeholder(stakeholder: AppData['stakeholders'][number]) {
  const { id, nombre, area, q, capacidadKeys, activo } = stakeholder;
  return { id, nombre, area, q, capacidadKeys, activo };
}

function readLS<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function writeLS<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function normalizeCapacidades(capacidades: AppData['capacidades']): AppData['capacidades'] {
  const normalizedExisting = capacidades.map(capacidad => {
    if (capacidad.key === 'plan') {
      return {
        ...capacidad,
        label: 'Planificación',
        nombre: 'Planificación',
        alcances: capacidad.alcances.map(alcance => {
          if (alcance.key === 'media' || alcance.key === 'troncales') {
            return { ...alcance, badge: 'Nueva' };
          }
          return alcance;
        }),
      };
    }

    if (capacidad.key === 'red') {
      return {
        ...capacidad,
        alcances: capacidad.alcances.map(alcance => {
          if (alcance.key === 'reddist') {
            const { badge: _badge, ...rest } = alcance;
            return rest;
          }
          return alcance;
        }),
      };
    }

    if (capacidad.key === 'programas') {
      return {
        ...capacidad,
        label: 'Programa',
        nombre: 'Programa',
      };
    }

    return capacidad;
  });

  return normalizedExisting.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
}

function normalizeAplicaciones(aplicaciones: AppData['aplicaciones']): AppData['aplicaciones'] {
  const obsoleteMockAplicaciones = new Set(['app_prog_b2b']);
  const filteredAplicaciones = aplicaciones.filter(aplicacion => !obsoleteMockAplicaciones.has(aplicacion.id));
  return filteredAplicaciones;
}

function normalizeBusinessFlows(flows: AppData['businessFlows'], baseFlows: AppData['businessFlows']): AppData['businessFlows'] {
  const baseById = new Map(baseFlows.map(flow => [flow.id, flow]));
  const normalized = flows.map(flow => {
    const baseFlow = baseById.get(flow.id);
    return {
      ...baseFlow,
      ...flow,
      descripcionTarjeta: flow.descripcionTarjeta ?? baseFlow?.descripcionTarjeta ?? '',
      contenido: flow.contenido ?? baseFlow?.contenido ?? '',
      confluenceUrl: flow.confluenceUrl ?? baseFlow?.confluenceUrl ?? '',
      icono: flow.icono ?? baseFlow?.icono ?? '🧭',
      color: flow.color ?? baseFlow?.color ?? '#1B30CC',
      activo: flow.activo ?? baseFlow?.activo ?? true,
      orden: flow.orden ?? baseFlow?.orden ?? 99,
    };
  });

  return normalized.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
}

function normalizeIniciativas(iniciativas: AppData['iniciativas'], baseIniciativas: AppData['iniciativas']): AppData['iniciativas'] {
  const baseById = new Map(baseIniciativas.map(iniciativa => [iniciativa.id, iniciativa]));
  const normalized = iniciativas.map(iniciativa => {
    const baseIniciativa = baseById.get(iniciativa.id);
    if (!baseIniciativa) {
      return iniciativa;
    }

    return {
      ...iniciativa,
      descripcion: iniciativa.descripcion ?? baseIniciativa.descripcion ?? '',
      emoji: iniciativa.emoji ?? baseIniciativa.emoji,
      fechas: iniciativa.fechas ?? baseIniciativa.fechas,
      tag: iniciativa.tag ?? baseIniciativa.tag,
      producto: iniciativa.producto ?? baseIniciativa.producto ?? '',
      q: iniciativa.q ?? baseIniciativa.q,
      bar: iniciativa.bar ?? baseIniciativa.bar,
      label: iniciativa.label ?? baseIniciativa.label,
    };
  });

  return normalized;
}

function normalizeBets(bets: AppData['bets'], baseBets: AppData['bets']): AppData['bets'] {
  const LEGACY_BET_DESCRIPTIONS: Record<string, string> = {
    bet_q1_01: 'Implementar MVP de optimización automatizada de rutas en Base Valdivia.',
  };

  const baseById = new Map(baseBets.map(bet => [bet.id, bet]));
  const normalized = bets.map(bet => {
    const baseBet = baseById.get(bet.id);
    if (!baseBet) {
      const normalizedProducts = Array.isArray(bet.productos) && bet.productos.length > 0
        ? bet.productos
        : (bet.producto ? [bet.producto] : []);
      return {
        ...bet,
        producto: normalizedProducts[0] ?? bet.producto ?? '',
        productos: normalizedProducts,
      };
    }

    const shouldRefreshLegacyOptimizadorColor = bet.id === 'bet_q2_01' && bet.color === '#EA580C';
    const shouldRefreshLegacyDescription = LEGACY_BET_DESCRIPTIONS[bet.id] === bet.descripcion;
    const normalizedProducts = Array.isArray(bet.productos) && bet.productos.length > 0
      ? bet.productos
      : (bet.producto ? [bet.producto] : (baseBet.productos?.length ? baseBet.productos : [baseBet.producto]));

    return {
      ...bet,
      producto: normalizedProducts[0] ?? bet.producto ?? baseBet.producto,
      productos: normalizedProducts,
      descripcion: shouldRefreshLegacyDescription ? baseBet.descripcion : (bet.descripcion ?? baseBet.descripcion),
      color: shouldRefreshLegacyOptimizadorColor ? baseBet.color : bet.color,
      mos_ids: bet.mos_ids?.length ? bet.mos_ids : baseBet.mos_ids,
      mos_inactivos: bet.mos_inactivos ?? baseBet.mos_inactivos,
      orden: bet.orden ?? baseBet.orden,
      activo: bet.activo ?? baseBet.activo ?? true,
    };
  });

  return normalized.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
}

function normalizeEquipo(equipo: AppData['equipo'], baseEquipo: AppData['equipo']): AppData['equipo'] {
  const hasLegacyDevPlaceholders = equipo.some(miembro => /^Dev\s+\d+$/i.test(miembro.nombre));
  const baseById = new Map(baseEquipo.map(miembro => [miembro.id, miembro]));
  const extraMembers = equipo.filter(miembro => !baseById.has(miembro.id));

  if (hasLegacyDevPlaceholders) {
    return [...baseEquipo, ...extraMembers];
  }

  return equipo.map(miembro => {
    const baseMember = baseById.get(miembro.id);
    if (!baseMember) {
      return miembro;
    }

    const { foto_url: _fotoUrl, ...memberWithoutPhoto } = miembro;
    return {
      ...memberWithoutPhoto,
      nombre: baseMember.nombre,
      rol: baseMember.rol,
      iniciales: baseMember.iniciales,
    };
  });
}

function normalizeStakeholders(
  stakeholders: AppData['stakeholders'],
  baseStakeholders: AppData['stakeholders'],
  capacidades: AppData['capacidades'],
): AppData['stakeholders'] {
  const validCapKeys = new Set(capacidades.map(capacidad => capacidad.key));
  const filteredBaseStakeholders = baseStakeholders.filter(stakeholder => !LEGACY_REMOVED_STAKEHOLDERS.has(stakeholder.id) && stakeholder.nombre !== 'Pastor Muñoz');
  const baseById = new Map(filteredBaseStakeholders.map(stakeholder => [stakeholder.id, stakeholder]));

  const normalized = stakeholders
    .filter(stakeholder => !LEGACY_REMOVED_STAKEHOLDERS.has(stakeholder.id) && stakeholder.nombre !== 'Pastor Muñoz')
    .map(stakeholder => {
    const baseStakeholder = baseById.get(stakeholder.id);
    const capacidadKeys = (stakeholder.capacidadKeys?.length ? stakeholder.capacidadKeys : baseStakeholder?.capacidadKeys ?? [])
      .filter(key => validCapKeys.has(key));

    return sanitizeStakeholder({
      ...stakeholder,
      area: stakeholder.area ?? baseStakeholder?.area ?? '',
      q: stakeholder.q ?? baseStakeholder?.q ?? 'ALL',
      capacidadKeys: [...new Set(capacidadKeys)],
      activo: stakeholder.activo ?? baseStakeholder?.activo ?? true,
    });
  });

  return normalized.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function normalizeReviewContentItems(items: unknown): ReviewContenidoItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return DEFAULT_REVIEW_INDEX_ITEMS.map(item => ({ ...item, active: true }));
  }

  if (typeof items[0] === 'string') {
    return (items as string[]).map((item, index) => {
      const defaultItem = DEFAULT_REVIEW_INDEX_ITEMS[index];
      if (defaultItem) {
        return { ...defaultItem, titulo: item || defaultItem.titulo, active: true };
      }
      return { id: `custom_${index}_${String(item).toLowerCase().replace(/\s+/g, '_')}`, titulo: item, active: true };
    });
  }

  return (items as Array<Partial<ReviewContenidoItem>>).map((item, index) => ({
    id: item.id ?? ((item.sectionKey as string) === 'roadmap' ? 'proximos_pasos' : item.sectionKey) ?? `custom_${index}_${(item.titulo ?? 'item').toLowerCase().replace(/\s+/g, '_')}`,
    titulo: item.titulo ?? `Ítem ${index + 1}`,
    sectionKey: (item.sectionKey as string) === 'roadmap' ? 'proximos_pasos' : item.sectionKey,
    active: item.active ?? true,
  }));
}

function normalizeReviewBlocks(blocks: ReviewBloque[] | undefined): ReviewBloque[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((block, index) => ({
    id: block.id ?? `block_${index}_${(block.titulo ?? 'sin_titulo').toLowerCase().replace(/\s+/g, '_')}`,
    capacidadKey: block.capacidadKey ?? 'plan',
    titulo: block.titulo ?? '',
    contexto: block.contexto ?? block.detalle ?? block.descripcion ?? '',
    detalle: block.detalle ?? block.contexto ?? '',
    descripcion: block.descripcion ?? block.contexto ?? '',
    url: block.url ?? '',
    entregable: block.entregable ?? block.titulo ?? '',
    compromiso: block.compromiso ?? block.detalle ?? '',
    comentarios: block.comentarios ?? block.descripcion ?? block.contexto ?? '',
    status: block.status ?? 'pendiente',
    nivel: block.nivel,
    impactLevel: block.impactLevel,
  }));
}

function normalizeReviewSections(review: Review, contenidoItems: ReviewContenidoItem[]): ReviewStructuredSection[] {
  if (Array.isArray(review.secciones) && review.secciones.length > 0) {
    return review.secciones.map((section, index) => ({
      id: section.id ?? `${section.type}_${index}`,
      type: section.type,
      title: section.title ?? `Vista ${index + 1}`,
      active: section.active ?? true,
      fixed: section.fixed ?? section.type !== 'custom',
      nextStepsMode: section.type === 'proximos_pasos' ? (section.nextStepsMode ?? 'roadmap') : undefined,
      items: normalizeReviewBlocks(section.items),
    }));
  }

  const baseMap = new Map<ReviewSectionKey, Omit<ReviewStructuredSection, 'title' | 'active'>>([
    ['indicadores', { id: 'indicadores', type: 'indicadores', fixed: true, items: normalizeReviewBlocks(review.indicadores) }],
    ['resultados', { id: 'resultados', type: 'resultados', fixed: true, items: normalizeReviewBlocks(review.resultados) }],
    ['demo', { id: 'demo', type: 'demo', fixed: true, items: normalizeReviewBlocks(review.demoItems ?? review.demo.map((item, index) => ({ id: `demo_${index}`, titulo: item, contexto: '', descripcion: '', url: '' }))) }],
    ['riesgos', { id: 'riesgos', type: 'riesgos', fixed: true, items: normalizeReviewBlocks(review.riesgos) }],
    ['proximos_pasos', { id: 'proximos_pasos', type: 'proximos_pasos', fixed: true, nextStepsMode: 'roadmap', items: [] }],
  ]);

  const sections: ReviewStructuredSection[] = [];
  const seen = new Set<string>();

  contenidoItems.forEach((item, index) => {
    if (item.sectionKey && baseMap.has(item.sectionKey)) {
      const base = baseMap.get(item.sectionKey)!;
      sections.push({
        ...base,
        id: item.sectionKey,
        title: item.titulo,
        active: item.active ?? true,
      });
      seen.add(item.sectionKey);
      return;
    }

    sections.push({
      id: item.id ?? `custom_${index}`,
      type: 'custom',
      title: item.titulo,
      active: item.active ?? true,
      fixed: false,
      items: [],
    });
  });

  DEFAULT_REVIEW_INDEX_ITEMS.forEach(defaultItem => {
    if (seen.has(defaultItem.sectionKey)) return;
    const base = baseMap.get(defaultItem.sectionKey)!;
    sections.push({
      ...base,
      id: defaultItem.sectionKey,
      title: defaultItem.titulo,
      active: false,
    });
  });

  return sections;
}

function normalizeReviews(reviews: Review[]): Review[] {
  return reviews.map((review, index) => {
    const contenidoItems = normalizeReviewContentItems(review.contenido?.items);
    const secciones = normalizeReviewSections(review, contenidoItems);
    const sectionMap = new Map(secciones.map(section => [section.type === 'custom' ? section.id : section.type, section]));
    const demoItems = normalizeReviewBlocks(review.demoItems ?? sectionMap.get('demo')?.items ?? review.demo.map((item, itemIndex) => ({ id: `demo_${itemIndex}`, titulo: item, contexto: '', descripcion: '', url: '' })));

    return {
      ...review,
      titulo: review.titulo?.trim() || (review.sprint ? `Review SP${review.sprint}` : `Review ${index + 1}`),
      sprint: review.sprint ?? '',
      fecha: review.fecha ?? '',
      q: review.q ?? 'Q2',
      estado: review.estado ?? 'borrador',
      activo: review.activo ?? true,
      fuente: review.fuente ?? 'interna',
      embedUrl: review.embedUrl?.trim() ?? '',
      jiraPanelUrl: review.jiraPanelUrl?.trim() ?? '',
      contenido: {
        items: secciones.map(section => ({
          id: section.id,
          titulo: section.title,
          sectionKey: section.type === 'custom' ? undefined : section.type,
          active: section.active,
        })),
      },
      secciones,
      indicadores: normalizeReviewBlocks(review.indicadores ?? sectionMap.get('indicadores')?.items),
      resultados: normalizeReviewBlocks(review.resultados ?? sectionMap.get('resultados')?.items),
      demo: demoItems.map(item => item.titulo).filter(Boolean),
      demoItems,
      riesgos: normalizeReviewBlocks(review.riesgos ?? sectionMap.get('riesgos')?.items),
    };
  });
}

function normalizeEntregables(entregables: Entregable[] | undefined, baseEntregables: Entregable[] | undefined): Entregable[] {
  const base = baseEntregables ?? [];
  const list = entregables ?? [];
  const baseById = new Map(base.map(entregable => [entregable.id, entregable]));
  const q2Start = new Date('2026-04-01T00:00:00');
  const q2End = new Date('2026-06-30T23:59:59');
  const obsoleteMockEntregables = new Set(['ent_sr_03', 'ent_ou_02', 'ent_ou_03']);
  const normalized = list.filter(entregable => !obsoleteMockEntregables.has(entregable.id)).map(entregable => {
    const baseEntregable = baseById.get(entregable.id);
    const normalizedBase = {
      ...entregable,
      fechaCreacion: entregable.fechaCreacion ?? baseEntregable?.fechaCreacion ?? entregable.fechaInicio,
      activo: entregable.activo ?? baseEntregable?.activo ?? true,
    };

    if (!baseEntregable || baseEntregable.q !== 2) {
      return normalizedBase;
    }

    const start = new Date(normalizedBase.fechaInicio);
    const end = new Date(normalizedBase.fechaFin);
    const isInsideQ2 = start >= q2Start && start <= q2End && end >= q2Start && end <= q2End && end >= start;

    if (isInsideQ2) {
      return normalizedBase;
    }

    return {
      ...normalizedBase,
      fechaInicio: baseEntregable.fechaInicio,
      fechaFin: baseEntregable.fechaFin,
    };
  });

  const normalizedIds = new Set(normalized.map(entregable => entregable.id));
  const missingBaseEntregables = base
    .filter(entregable => !obsoleteMockEntregables.has(entregable.id) && !normalizedIds.has(entregable.id))
    .map(entregable => ({
      ...entregable,
      fechaCreacion: entregable.fechaCreacion ?? entregable.fechaInicio,
      activo: entregable.activo ?? true,
    }));

  return [...normalized, ...missingBaseEntregables];
}

function normalizeMos(mos: AppData['mos'], baseMos: AppData['mos']): AppData['mos'] {
  const baseById = new Map(baseMos.map(item => [item.id, item]));
  const normalized = mos.map(item => {
    const baseItem = baseById.get(item.id);
    const rawQuarters = Array.isArray(item.qs) && item.qs.length > 0
      ? item.qs
      : (item.q ? [item.q] : (baseItem?.qs?.length ? baseItem.qs : (baseItem?.q ? [baseItem.q] : [])));
    const normalizedQuarters = [...new Set(rawQuarters.filter(Boolean))];
    if (!baseItem) {
      return {
        ...item,
        q: normalizedQuarters[0] ?? item.q ?? '',
        qs: normalizedQuarters,
      };
    }

    return {
      ...item,
      q: normalizedQuarters[0] ?? item.q ?? baseItem.q ?? '',
      qs: normalizedQuarters,
      actual: item.actual ?? baseItem.actual ?? '',
      linea_base: item.linea_base ?? baseItem.linea_base ?? '',
      meta: item.meta ?? baseItem.meta ?? '',
    };
  });

  const existingIds = new Set(normalized.map(item => item.id));
  const missingBase = baseMos.filter(item => !existingIds.has(item.id));

  return [...normalized, ...missingBase];
}

// ── API pública ───────────────────────────────────────────────────────────────
export const getAllData = async (equipoId?: string): Promise<AppData> => {
  const base = await repository.getAllData(equipoId);

  // En GAS, Firestore es la fuente de verdad — no usar localStorage
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    // Sincronizar reviews al LS para que getReviews() (síncrono) las encuentre
    if (Array.isArray(base.reviews)) writeLS(LS_REVIEWS, base.reviews);
    return base;
  }

  // Override config con lo guardado en localStorage
  const savedConfig = readLS<Partial<AppData['config']>>(LS_CONFIG);
  base.config = normalizeConfig(savedConfig ? { ...base.config, ...savedConfig } : base.config, base.config);
  writeLS(LS_CONFIG, base.config);

  // Inicializar iniciativas desde mock en la primera carga
  let savedIniciativas = readLS<AppData['iniciativas']>(LS_INICIATIVAS);
  if (!savedIniciativas) {
    savedIniciativas = base.iniciativas;
  }
  savedIniciativas = normalizeIniciativas(savedIniciativas, base.iniciativas);
  writeLS(LS_INICIATIVAS, savedIniciativas);
  base.iniciativas = savedIniciativas;

  // Inicializar bets y mos desde mock en la primera carga
  let savedBets = readLS<AppData['bets']>(LS_BETS);
  if (!savedBets) {
    savedBets = base.bets;
  }
  savedBets = normalizeBets(savedBets, base.bets);
  writeLS(LS_BETS, savedBets);
  base.bets = savedBets;

  let savedMos = readLS<AppData['mos']>(LS_MOS);
  if (!savedMos) {
    savedMos = base.mos;
  }
  savedMos = normalizeMos(savedMos, base.mos);
  writeLS(LS_MOS, savedMos);
  base.mos = savedMos;

  // Inicializar equipo desde mock en la primera carga
  let savedEquipo = readLS<AppData['equipo']>(LS_EQUIPO);
  if (!savedEquipo) {
    savedEquipo = base.equipo;
  }
  savedEquipo = normalizeEquipo(savedEquipo, base.equipo);
  writeLS(LS_EQUIPO, savedEquipo);
  base.equipo = savedEquipo;

  // Inicializar capacidades desde mock en la primera carga
  let savedCapacidades = readLS<AppData['capacidades']>(LS_CAPACIDADES);
  if (!savedCapacidades) {
    savedCapacidades = base.capacidades;
  }
  savedCapacidades = normalizeCapacidades(savedCapacidades);
  writeLS(LS_CAPACIDADES, savedCapacidades);
  base.capacidades = savedCapacidades;

  let savedStakeholders = readLS<AppData['stakeholders']>(LS_STAKEHOLDERS);
  if (!savedStakeholders) {
    savedStakeholders = base.stakeholders ?? [];
  }
  savedStakeholders = normalizeStakeholders(savedStakeholders, base.stakeholders ?? [], base.capacidades);
  writeLS(LS_STAKEHOLDERS, savedStakeholders);
  base.stakeholders = savedStakeholders;

  let savedBusinessFlows = readLS<AppData['businessFlows']>(LS_BUSINESS_FLOWS);
  if (!savedBusinessFlows) {
    savedBusinessFlows = base.businessFlows ?? [];
  }
  savedBusinessFlows = normalizeBusinessFlows(savedBusinessFlows, base.businessFlows ?? []);
  writeLS(LS_BUSINESS_FLOWS, savedBusinessFlows);
  base.businessFlows = savedBusinessFlows;

  // Inicializar entregables
  let savedEntregables = readLS<AppData['entregables']>(LS_ENTREGABLES);
  if (!savedEntregables) {
    savedEntregables = base.entregables;
  }
  savedEntregables = normalizeEntregables(savedEntregables, base.entregables);
  writeLS(LS_ENTREGABLES, savedEntregables);
  base.entregables = savedEntregables;

  // Inicializar aplicaciones desde mock en la primera carga
  let savedAplicaciones = readLS<AppData['aplicaciones']>(LS_APLICACIONES);
  if (!savedAplicaciones) {
    savedAplicaciones = base.aplicaciones;
    writeLS(LS_APLICACIONES, savedAplicaciones);
  }
  savedAplicaciones = normalizeAplicaciones(savedAplicaciones);
  writeLS(LS_APLICACIONES, savedAplicaciones);
  base.aplicaciones = savedAplicaciones;

  return base;
};

// ── Helper GAS para eliminaciones ────────────────────────────────────────────
// Llama a eliminarDocumento en el backend GAS con los handlers correctos y
// defer setTimeout(0) para salir del stack sincrónico de React (evita
// el error "is not a function" que ocurre al llamar google.script.run
// directamente dentro de un handler de evento React).
function gasRunDelete(equipoId: string, col: string, docId: string): void {
  setTimeout(() => {
    const run = (window as any)?.google?.script?.run;
    if (!run) return;
    run
      .withSuccessHandler(() => {
        console.log(`[GAS] ✓ Eliminado ${col}/${docId}`);
      })
      .withFailureHandler((err: any) => {
        console.error(`[GAS] ✗ Error eliminando ${col}/${docId}:`, err);
      })
      .eliminarDocumento(equipoId, col, docId);
  }, 0);
}

export const saveConfig = (config: AppData['config'], equipoId = 'eq_planificacion'): void => {
  writeLS(LS_CONFIG, config);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ config, _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};


export const saveIniciativa = (ini: AppData['iniciativas'][number], equipoId = 'eq_planificacion'): void => {
  const saved = readLS<AppData['iniciativas']>(LS_INICIATIVAS);
  const list = saved ?? [];
  const idx = list.findIndex(i => i.id === ini.id);
  if (idx >= 0) list[idx] = ini; else list.push(ini);
  writeLS(LS_INICIATIVAS, list);

  // Mantener lista plana en LS para modo local (Roadmap)
  const iniEnts: Entregable[] = (ini.entregables ?? []).map(item => ({
    ...item,
    iniciativaId: ini.id,
    activo: item.activo ?? true,
  }));
  const flatList = readLS<Entregable[]>(LS_ENTREGABLES) ?? [];
  const otherEnts = flatList.filter(e => e.iniciativaId !== ini.id);
  writeLS(LS_ENTREGABLES, [...otherEnts, ...iniEnts]);

  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    // En GAS, los entregables se guardan nested dentro del doc de la iniciativa.
    // syncToSheet escribe toda la iniciativa (con ini.entregables incluido).
    repository.syncToSheet({ iniciativas: [ini], _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};


export const deleteIniciativa = (id: string, equipoId = 'eq_planificacion'): void => {
  const saved = readLS<AppData['iniciativas']>(LS_INICIATIVAS);
  if (saved) writeLS(LS_INICIATIVAS, saved.filter(i => i.id !== id));
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    gasRunDelete(equipoId, 'iniciativas', id);
  } else {
    notifyDirty();
  }
};


export const saveBet = (bet: AppData['bets'][number], equipoId = 'eq_planificacion'): void => {
  const list = readLS<AppData['bets']>(LS_BETS) ?? [];
  const idx = list.findIndex(b => b.id === bet.id);
  if (idx >= 0) list[idx] = bet; else list.push(bet);
  writeLS(LS_BETS, list);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ bets: [bet], _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};


export const deleteBet = (id: string, equipoId = 'eq_planificacion'): void => {
  const saved = readLS<AppData['bets']>(LS_BETS);
  if (saved) writeLS(LS_BETS, saved.filter(b => b.id !== id));
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    gasRunDelete(equipoId, 'bets', id);
  } else {
    notifyDirty();
  }
};


export const saveMOS = (mos: AppData['mos'][number], equipoId = 'eq_planificacion'): void => {
  const list = readLS<AppData['mos']>(LS_MOS) ?? [];
  const idx = list.findIndex(m => m.id === mos.id);
  if (idx >= 0) list[idx] = mos; else list.push(mos);
  writeLS(LS_MOS, list);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ mos: [mos], _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};


export const deleteMOS = (id: string, equipoId = 'eq_planificacion'): void => {
  const saved = readLS<AppData['mos']>(LS_MOS);
  if (saved) writeLS(LS_MOS, saved.filter(m => m.id !== id));
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    gasRunDelete(equipoId, 'mos', id);
  } else {
    notifyDirty();
  }
};


export const saveTeamMember = (member: AppData['equipo'][number], equipoId = 'eq_planificacion'): void => {
  const list = readLS<AppData['equipo']>(LS_EQUIPO) ?? [];
  const idx = list.findIndex(m => m.id === member.id);
  if (idx >= 0) list[idx] = member; else list.push(member);
  writeLS(LS_EQUIPO, list);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ equipo: [member], _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};


export const deleteTeamMember = (id: string, equipoId = 'eq_planificacion'): void => {
  const saved = readLS<AppData['equipo']>(LS_EQUIPO);
  if (saved) writeLS(LS_EQUIPO, saved.filter(m => m.id !== id));
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    gasRunDelete(equipoId, 'miembros', id);
  } else {
    notifyDirty();
  }
};


export const saveStakeholder = (stakeholder: AppData['stakeholders'][number], equipoId = 'eq_planificacion'): void => {
  const list = readLS<AppData['stakeholders']>(LS_STAKEHOLDERS) ?? [];
  const idx = list.findIndex(item => item.id === stakeholder.id);
  const sanitizedStakeholder = sanitizeStakeholder(stakeholder);
  if (idx >= 0) list[idx] = sanitizedStakeholder; else list.push(sanitizedStakeholder);
  writeLS(LS_STAKEHOLDERS, list);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ stakeholders: [sanitizedStakeholder], _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};


export const deleteStakeholder = (id: string, equipoId = 'eq_planificacion'): void => {
  const saved = readLS<AppData['stakeholders']>(LS_STAKEHOLDERS);
  if (saved) writeLS(LS_STAKEHOLDERS, saved.filter(item => item.id !== id));
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    gasRunDelete(equipoId, 'stakeholders', id);
  } else {
    notifyDirty();
  }
};


export const saveBusinessFlow = (flow: AppData['businessFlows'][number], equipoId = 'eq_planificacion'): void => {
  const list = readLS<AppData['businessFlows']>(LS_BUSINESS_FLOWS) ?? [];
  const idx = list.findIndex(item => item.id === flow.id);
  if (idx >= 0) list[idx] = flow; else list.push(flow);
  writeLS(LS_BUSINESS_FLOWS, list);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ businessFlows: [flow], _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};


export const deleteBusinessFlow = (id: string, equipoId = 'eq_planificacion'): void => {
  const saved = readLS<AppData['businessFlows']>(LS_BUSINESS_FLOWS);
  if (saved) writeLS(LS_BUSINESS_FLOWS, saved.filter(item => item.id !== id));
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    gasRunDelete(equipoId, 'businessFlows', id);
  } else {
    notifyDirty();
  }
};

export const saveCapacitacion = (cap: Capacitacion, equipoId = 'eq_planificacion'): void => {
  const list = readLS<AppData['capacitaciones']>(LS_CAPACITACIONES) ?? [];
  const idx = list.findIndex(item => item.id === cap.id);
  if (idx >= 0) list[idx] = cap; else list.push(cap);
  writeLS(LS_CAPACITACIONES, list);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ capacitaciones: [cap], _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};

export const deleteCapacitacion = (id: string, equipoId = 'eq_planificacion'): void => {
  const saved = readLS<AppData['capacitaciones']>(LS_CAPACITACIONES);
  if (saved) writeLS(LS_CAPACITACIONES, saved.filter(item => item.id !== id));
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    gasRunDelete(equipoId, 'capacitaciones', id);
  } else {
    notifyDirty();
  }
};

export const getReviews = (): Review[] => {
  const reviews = readLS<Review[]>(LS_REVIEWS) ?? [];
  const normalized = normalizeReviews(reviews);
  writeLS(LS_REVIEWS, normalized);
  return normalized;
};


export const saveReview = (review: Review, equipoId = 'eq_planificacion'): void => {
  const list = getReviews();
  const idx = list.findIndex(item => item.id === review.id);
  const normalizedReview = normalizeReviews([review])[0];
  if (idx >= 0) list[idx] = normalizedReview; else list.push(normalizedReview);
  writeLS(LS_REVIEWS, list);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ reviews: [normalizedReview], _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};


export const deleteReview = (id: string, equipoId = 'eq_planificacion'): void => {
  const saved = readLS<Review[]>(LS_REVIEWS);
  if (saved) writeLS(LS_REVIEWS, saved.filter(item => item.id !== id));
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    gasRunDelete(equipoId, 'reviews', id);
  } else {
    notifyDirty();
  }
};


export const saveCapacidades = (capacidades: AppData['capacidades'], equipoId = 'eq_planificacion'): void => {
  writeLS(LS_CAPACIDADES, capacidades);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ capacidades, _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};


export const saveEntregable = (e: Entregable, equipoId = 'eq_planificacion'): void => {
  const list = readLS<Entregable[]>(LS_ENTREGABLES) ?? [];
  const idx = list.findIndex(x => x.id === e.id);
  if (idx >= 0) list[idx] = e; else list.push(e);
  writeLS(LS_ENTREGABLES, list);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ entregables: [e], _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};


export const deleteEntregable = (id: string, equipoId = 'eq_planificacion'): void => {
  const saved = readLS<Entregable[]>(LS_ENTREGABLES);
  if (saved) writeLS(LS_ENTREGABLES, saved.filter(x => x.id !== id));
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    gasRunDelete(equipoId, 'entregables', id);
  } else {
    notifyDirty();
  }
};


export const saveAplicacion = (app: AppData['aplicaciones'][number], equipoId = 'eq_planificacion'): void => {
  const list = readLS<AppData['aplicaciones']>(LS_APLICACIONES) ?? [];
  const idx = list.findIndex(a => a.id === app.id);
  if (idx >= 0) list[idx] = app; else list.push(app);
  writeLS(LS_APLICACIONES, list);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ aplicaciones: [app], _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};


export const deleteAplicacion = (id: string, equipoId = 'eq_planificacion'): void => {
  const saved = readLS<AppData['aplicaciones']>(LS_APLICACIONES);
  if (saved) writeLS(LS_APLICACIONES, saved.filter(a => a.id !== id));
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    gasRunDelete(equipoId, 'aplicaciones', id);
  } else {
    notifyDirty();
  }
};

export const initIniciativasIfNeeded = async (): Promise<void> => {
  if (readLS(LS_INICIATIVAS)) return;
  const base = await repository.getAllData();
  writeLS(LS_INICIATIVAS, base.iniciativas);
};

export const flushToSheet = async (entities?: (keyof AppData)[]): Promise<{ ok: boolean; entities: string[] }> => {
  const all: Partial<AppData> = {};

  if (!entities || entities.includes('config')) {
    const config = readLS<AppData['config']>(LS_CONFIG);
    if (config) all.config = config;
  }
  if (!entities || entities.includes('equipo')) {
    const equipo = readLS<AppData['equipo']>(LS_EQUIPO);
    if (equipo) all.equipo = equipo;
  }
  if (!entities || entities.includes('bets')) {
    const bets = readLS<AppData['bets']>(LS_BETS);
    if (bets) all.bets = bets;
  }
  if (!entities || entities.includes('mos')) {
    const mos = readLS<AppData['mos']>(LS_MOS);
    if (mos) all.mos = mos;
  }
  if (!entities || entities.includes('capacidades')) {
    const capacidades = readLS<AppData['capacidades']>(LS_CAPACIDADES);
    if (capacidades) all.capacidades = capacidades;
  }
  if (!entities || entities.includes('iniciativas')) {
    const iniciativas = readLS<AppData['iniciativas']>(LS_INICIATIVAS);
    if (iniciativas) all.iniciativas = iniciativas;
  }
  if (!entities || entities.includes('entregables')) {
    const entregables = readLS<AppData['entregables']>(LS_ENTREGABLES);
    if (entregables) all.entregables = entregables;
  }
  if (!entities || entities.includes('stakeholders')) {
    const stakeholders = readLS<AppData['stakeholders']>(LS_STAKEHOLDERS);
    if (stakeholders) all.stakeholders = stakeholders;
  }
  if (!entities || entities.includes('businessFlows')) {
    const businessFlows = readLS<AppData['businessFlows']>(LS_BUSINESS_FLOWS);
    if (businessFlows) all.businessFlows = businessFlows;
  }
  if (!entities || entities.includes('aplicaciones')) {
    const aplicaciones = readLS<AppData['aplicaciones']>(LS_APLICACIONES);
    if (aplicaciones) all.aplicaciones = aplicaciones;
  }
  if (!entities || entities.includes('reviews')) {
    const reviews = readLS<AppData['reviews']>(LS_REVIEWS);
    if (reviews) all.reviews = reviews;
  }

  const result = await repository.syncToSheet(all);
  if (result.ok) {
    _onClean?.();
  }
  return result;
};

// ── Usuarios ──────────────────────────────────────────────────────────────────

export const getUsuarios = (): Usuario[] => {
  return readLS<Usuario[]>(LS_USUARIOS) ?? [];
};

export const saveUsuario = (usuario: Usuario): void => {
  const list = getUsuarios();
  const idx = list.findIndex(u => u._id === usuario._id);
  if (idx >= 0) list[idx] = usuario; else list.push(usuario);
  writeLS(LS_USUARIOS, list);
  notifyDirty();
};

export const deleteUsuario = (id: string): void => {
  const saved = readLS<Usuario[]>(LS_USUARIOS);
  if (!saved) return;
  writeLS(LS_USUARIOS, saved.filter(u => u._id !== id));
  notifyDirty();
};

export const cambiarRolUsuario = (id: string, nuevoRol: 'admin' | 'super_admin' | 'viewer'): void => {
  const list = getUsuarios();
  const idx = list.findIndex(u => u._id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], rol: nuevoRol, canConfigure: nuevoRol !== 'viewer' };
  writeLS(LS_USUARIOS, list);
  notifyDirty();
};

export const toggleUsuarioActivo = (id: string, activo: boolean): void => {
  const list = getUsuarios();
  const idx = list.findIndex(u => u._id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], activo };
  writeLS(LS_USUARIOS, list);
  notifyDirty();
};

// ── Filtrado por equipo (Fase C — Admin híbrido) ──────────────────────────────
//
// Las entidades operativas (equipo, capacidades, iniciativas, bets, mos,
// entregables, reviews) llevan equipoId?: string.
// Entidades sin equipoId se consideran "globales" y se incluyen siempre.
// Entidades globales reales (stakeholders, businessFlows, aplicaciones)
// no se tocan.

export function filterAppDataByEquipo(data: AppData, equipoId: string): AppData {
  const match = (id?: string) => !id || id === equipoId;
  return {
    ...data,
    config:      match(data.config.equipoId) ? data.config : { ...data.config, equipoId },
    equipo:      data.equipo.filter(m => match(m.equipoId)),
    capacidades: data.capacidades.filter(c => match(c.equipoId)),
    iniciativas: data.iniciativas.filter(i => match(i.equipoId)),
    bets:        data.bets.filter(b => match(b.equipoId)),
    mos:         data.mos.filter(m => match(m.equipoId)),
    entregables: (data.entregables ?? []).filter(e => match(e.equipoId)),
    reviews:     data.reviews.filter(r => match(r.equipoId)),
    // globales sin cambio: stakeholders, businessFlows, aplicaciones, usuario
  };
}
