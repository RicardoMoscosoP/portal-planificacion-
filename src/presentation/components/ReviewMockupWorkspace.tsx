import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import type { Review, ReviewBloque, ReviewSectionType, ReviewStructuredSection } from '../../domain/types';
import { resolveReviewEmbed } from '../../application/services/reviewEmbed';
import { useConfirm } from '../hooks/useConfirm';

type CapacityKey = 'plan' | 'red' | 'int' | 'ultima' | 'programas';
type CapacityDraftKey = CapacityKey | '';
type ImpactLevel = 'low' | 'mid' | 'high';

type EditorItem = {
  id: string;
  capacidadKey: CapacityDraftKey;
  titulo: string;
  detalle: string;
  descripcion: string;
  url: string;
  entregable?: string;
  compromiso?: string;
  comentarios?: string;
  status?: 'listo' | 'pendiente';
  impactLevel?: ImpactLevel;
};

type EditorSection = {
  id: string;
  type: ReviewSectionType;
  title: string;
  fixed: boolean;
  active: boolean;
  nextStepsMode?: 'roadmap' | 'manual';
  items: EditorItem[];
};

type ReviewDraft = {
  id: string;
  sprint: string;
  fecha: string;
  q: string;
  estado: Review['estado'];
  activo: boolean;
  fuente: NonNullable<Review['fuente']>;
  embedUrl: string;
  jiraPanelUrl: string;
};

const CAPACITY_META: Record<CapacityKey, { label: string; color: string }> = {
  plan: { label: 'Planificación', color: '#1B30CC' },
  red: { label: 'Red de distribución', color: '#0891B2' },
  int: { label: 'Inteligencia de direcciones', color: '#DB2777' },
  ultima: { label: 'Ultima milla', color: '#EA580C' },
  programas: { label: 'Programa', color: '#0F766E' },
};

const FIXED_SECTIONS: Array<{ id: string; type: ReviewSectionType; title: string; nextStepsMode?: 'roadmap' | 'manual' }> = [
  { id: 'indicadores', type: 'indicadores', title: 'Indicadores' },
  { id: 'resultados', type: 'resultados', title: 'Resultados del Sprint' },
  { id: 'demo', type: 'demo', title: 'Demo' },
  { id: 'riesgos', type: 'riesgos', title: 'Riesgos' },
  { id: 'proximos_pasos', type: 'proximos_pasos', title: 'Próximos pasos', nextStepsMode: 'roadmap' },
];

const MAX_TITLE_LENGTH = 60;
const MAX_CONTEXT_LENGTH = 100;

function chip(capacidadKey: CapacityKey) {
  const meta = CAPACITY_META[capacidadKey] ?? CAPACITY_META.plan;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 11px', borderRadius: 10, background: '#fff', color: '#0F1C40', border: '1px solid #DBE4FB', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif', lineHeight: 1.2 }}>
      {meta.label}
    </span>
  );
}

function groupEditorItemsByCapacity(items: EditorItem[]): Array<{ key: CapacityKey; items: Array<{ item: EditorItem; index: number }> }> {
  const groups = new Map<CapacityKey, Array<{ item: EditorItem; index: number }>>();
  const order: CapacityKey[] = [];
  items.forEach((item, index) => {
    const key = (item.capacidadKey || 'plan') as CapacityKey;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push({ item, index });
  });
  return order.map(key => ({ key, items: groups.get(key)! }));
}

function countSupportUrls(url?: string): number {
  if (!url) return 0;
  return url
    .split(/\r?\n|,|;/)
    .map(item => item.trim())
    .filter(Boolean).length;
}

function parseSupportUrls(url?: string): string[] {
  if (!url) return [];
  return url
    .split(/\r?\n|,|;/)
    .map(item => item.trim())
    .filter(Boolean);
}

function parseEditableSupportUrls(url?: string): string[] {
  if (!url) return [];
  const normalized = url.replace(/[;,]/g, '\n');
  const parts = normalized.split(/\r?\n/).map(item => item.trim());
  return parts.length === 1 && parts[0] === '' ? [] : parts;
}

function serializeSupportUrls(urls: string[]): string {
  return urls.map(item => item.trim()).join('\n');
}

function defaultItem(type: ReviewSectionType): EditorItem {
  if (type === 'demo') {
    return { id: `item_${Date.now()}`, capacidadKey: '', titulo: '', detalle: '', descripcion: '', url: '' };
  }
  if (type === 'resultados') {
    return { id: `item_${Date.now()}`, capacidadKey: '', titulo: '', detalle: '', descripcion: '', url: '', entregable: '', compromiso: '', comentarios: '', status: 'pendiente' };
  }
  if (type === 'riesgos') {
    return { id: `item_${Date.now()}`, capacidadKey: '', titulo: '', detalle: '', descripcion: '', url: '', impactLevel: 'mid' };
  }
  return { id: `item_${Date.now()}`, capacidadKey: '', titulo: '', detalle: '', descripcion: '', url: '' };
}

function mapBlockToEditorItem(block: ReviewBloque, sectionType: ReviewSectionType, index: number): EditorItem {
  const isResultado = sectionType === 'resultados';
  return {
    id: block.id ?? `${sectionType}_${index}`,
    capacidadKey: (block.capacidadKey as CapacityKey) ?? '',
    titulo: isResultado ? (block.entregable ?? block.titulo ?? '') : (block.titulo ?? ''),
    detalle: isResultado ? (block.compromiso ?? block.detalle ?? '') : (block.detalle ?? block.contexto ?? ''),
    descripcion: isResultado ? (block.comentarios ?? block.descripcion ?? block.contexto ?? '') : (block.descripcion ?? block.contexto ?? ''),
    url: block.url ?? '',
    entregable: block.entregable ?? block.titulo ?? '',
    compromiso: block.compromiso ?? block.detalle ?? '',
    comentarios: block.comentarios ?? block.descripcion ?? block.contexto ?? '',
    status: block.status ?? 'pendiente',
    impactLevel: block.impactLevel ?? (block.nivel === 'alto' ? 'high' : block.nivel === 'bajo' ? 'low' : 'mid'),
  };
}

function mapEditorItemToBlock(item: EditorItem, sectionType: ReviewSectionType): ReviewBloque {
  if (sectionType === 'resultados') {
    return {
      id: item.id,
      capacidadKey: item.capacidadKey || undefined,
      titulo: item.entregable || item.titulo,
      contexto: item.comentarios || item.descripcion || '',
      detalle: item.compromiso || item.detalle,
      descripcion: item.comentarios || item.descripcion,
      url: item.url,
      entregable: item.entregable || item.titulo,
      compromiso: item.compromiso || item.detalle,
      comentarios: item.comentarios || item.descripcion,
      status: item.status ?? 'pendiente',
    };
  }
  const contexto = sectionType === 'demo' || sectionType === 'riesgos' ? item.descripcion : item.detalle;
  return {
    id: item.id,
    capacidadKey: item.capacidadKey || undefined,
    titulo: item.titulo,
    contexto,
    detalle: item.detalle,
    descripcion: item.descripcion,
    url: item.url,
    impactLevel: item.impactLevel,
    nivel: sectionType === 'riesgos'
      ? item.impactLevel === 'high'
        ? 'alto'
        : item.impactLevel === 'low'
          ? 'bajo'
          : 'medio'
      : undefined,
  };
}

function createSectionsFromReview(review: Review): EditorSection[] {
  const normalized = Array.isArray(review.secciones) && review.secciones.length > 0
    ? review.secciones
    : FIXED_SECTIONS.map(section => {
        const items = section.type === 'indicadores'
          ? review.indicadores
          : section.type === 'resultados'
            ? review.resultados
            : section.type === 'demo'
              ? (review.demoItems ?? review.demo.map((demo, index) => ({ id: `demo_${index}`, titulo: demo, contexto: '', descripcion: '', url: '' })))
              : section.type === 'riesgos'
                ? review.riesgos
                : [];
        return {
          id: section.id,
          type: section.type,
          title: section.title,
          active: true,
          fixed: true,
          nextStepsMode: section.nextStepsMode,
          items,
        } satisfies ReviewStructuredSection;
      });

  const sections = normalized.map((section, index) => ({
    id: section.id ?? `${section.type}_${index}`,
    type: section.type,
    title: section.title,
    fixed: section.fixed ?? section.type !== 'custom',
    active: section.active ?? true,
    nextStepsMode: section.type === 'proximos_pasos' ? (section.nextStepsMode ?? 'roadmap') : undefined,
    items: (section.items ?? []).map((item, itemIndex) => mapBlockToEditorItem(item, section.type, itemIndex)),
  }));

  const existingIds = new Set(sections.map(section => section.id));
  const missing = FIXED_SECTIONS.filter(section => !existingIds.has(section.id)).map(section => ({
    id: section.id,
    type: section.type,
    title: section.title,
    fixed: true,
    active: false,
    nextStepsMode: section.nextStepsMode,
    items: [],
  }));

  return [...sections, ...missing];
}

function createDraftFromReview(review: Review): ReviewDraft {
  return {
    id: review.id,
    sprint: review.sprint ?? '',
    fecha: review.fecha ?? '',
    q: review.q ?? 'Q2',
    estado: review.estado ?? 'borrador',
    activo: review.activo ?? true,
    fuente: review.fuente ?? 'interna',
    embedUrl: review.embedUrl ?? '',
    jiraPanelUrl: review.jiraPanelUrl ?? '',
  };
}

function buildReview(draft: ReviewDraft, sections: EditorSection[]): Review {
  const indicators = sections.find(section => section.type === 'indicadores')?.items ?? [];
  const resultados = sections.find(section => section.type === 'resultados')?.items ?? [];
  const demoItems = sections.find(section => section.type === 'demo')?.items ?? [];
  const riesgos = sections.find(section => section.type === 'riesgos')?.items ?? [];

  return {
    id: draft.id,
    titulo: draft.sprint.trim() ? `Review SP${draft.sprint.trim()}` : '',
    sprint: draft.sprint,
    fecha: draft.fecha,
    q: draft.q,
    estado: draft.estado,
    activo: draft.activo,
    fuente: draft.fuente,
    embedUrl: draft.embedUrl.trim(),
    jiraPanelUrl: draft.jiraPanelUrl.trim(),
    contenido: {
      items: sections.map(section => ({
        id: section.id,
        titulo: section.title,
        sectionKey: section.type === 'custom' ? undefined : section.type,
        active: section.active,
      })),
    },
    secciones: sections.map(section => ({
      id: section.id,
      type: section.type,
      title: section.title,
      active: section.active,
      fixed: section.fixed,
      nextStepsMode: section.type === 'proximos_pasos' ? (section.nextStepsMode ?? 'roadmap') : undefined,
      items: section.items.map(item => mapEditorItemToBlock(item, section.type)),
    })),
    indicadores: indicators.map(item => mapEditorItemToBlock(item, 'indicadores')),
    resultados: resultados.map(item => mapEditorItemToBlock(item, 'resultados')),
    demo: demoItems.map(item => item.titulo).filter(Boolean),
    demoItems: demoItems.map(item => mapEditorItemToBlock(item, 'demo')),
    riesgos: riesgos.map(item => mapEditorItemToBlock(item, 'riesgos')),
  };
}

function sectionDescription(section: EditorSection): { subtitle: string; note: string } {
  switch (section.type) {
    case 'indicadores':
      return {
        subtitle: 'Cada bloque debe amarrarse a una capacidad, un título, un detalle y una URL opcional para mostrar evidencia visual.',
        note: 'Pensado para KPI, gráficos y evidencia cuantitativa.',
      };
    case 'resultados':
      return {
        subtitle: 'Cada resultado se carga con capacidad, entregable, compromiso, comentarios y status ejecutivo.',
        note: 'Debe mostrar qué se prometió, cómo va y si ya quedó listo o sigue pendiente.',
      };
    case 'demo':
      return {
        subtitle: 'Las demos usan capacidad, título, descripción y URL opcional para abrir apoyo embebido.',
        note: 'Sirve para demo funcional, video o apoyo visual.',
      };
    case 'riesgos':
      return {
        subtitle: 'Los riesgos se presentan con capacidad, título, descripción y nivel de impacto.',
        note: 'No busca listar todo, solo lo relevante para la conversación ejecutiva.',
      };
    case 'proximos_pasos':
      return {
        subtitle: 'Esta vista puede operar en modo roadmap general o en modo manual con pasos por capacidad.',
        note: 'Sirve como cierre de la historia de avance y proyección.',
      };
    default:
      return {
        subtitle: 'Las vistas nuevas pueden agregarse, reordenarse y ocultarse igual que las vistas mínimas.',
        note: 'Extiende la review sin romper la estructura base.',
      };
  }
}

function getBaseValidationMessage(draft: ReviewDraft): string | null {
  if (!draft.sprint.trim()) return 'Debes completar el sprint de la review.';
  if (!draft.fecha.trim()) return 'Debes completar la fecha de la review.';
  if (draft.fuente === 'embebida' && !draft.embedUrl.trim()) return 'Debes ingresar una URL para la review embebida.';
  return null;
}

export type ReviewWorkspaceHandle = { reset: () => void; save: () => void; preview: () => void };

const ReviewMockupWorkspace = forwardRef<ReviewWorkspaceHandle, {
  initialReview: Review;
  onSave: (review: Review) => void;
  onPresent?: (review: Review) => void;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveLabel?: string;
}>(function ReviewMockupWorkspace({
  initialReview,
  onSave,
  onPresent,
  onCancel: _onCancel,
  onDirtyChange,
  saveLabel: _saveLabel = 'Guardar review',
}, ref) {
  const [draft, setDraft] = useState<ReviewDraft>(() => createDraftFromReview(initialReview));
  const [sections, setSections] = useState<EditorSection[]>(() => createSectionsFromReview(initialReview));
  const [activeSectionId, setActiveSectionId] = useState<string>(() => createSectionsFromReview(initialReview)[0]?.id ?? 'indicadores');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);
  const [itemDraft, setItemDraft] = useState<EditorItem>(() => defaultItem('indicadores'));
  const [embeddedViewer, setEmbeddedViewer] = useState<{ url: string; title: string; caption: string; capacidadKey?: CapacityKey } | null>(null);
  const [baseValidationMessage, setBaseValidationMessage] = useState<string | null>(null);
  const initialSnapshotRef = useRef('');
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;
  const { confirm, dialog: confirmDialog } = useConfirm();

  useEffect(() => {
    const nextDraft = createDraftFromReview(initialReview);
    const nextSections = createSectionsFromReview(initialReview);
    initialSnapshotRef.current = JSON.stringify({ d: nextDraft, s: nextSections });
    setDraft(nextDraft);
    setSections(nextSections);
    setActiveSectionId(nextSections[0]?.id ?? 'indicadores');
    setSelectedItemIndex(-1);
    setItemDraft(defaultItem(nextSections[0]?.type ?? 'indicadores'));
    onDirtyChangeRef.current?.(false);
  }, [initialReview]);

  useEffect(() => {
    if (!initialSnapshotRef.current) return;
    const current = JSON.stringify({ d: draft, s: sections });
    onDirtyChangeRef.current?.(current !== initialSnapshotRef.current);
  }, [draft, sections]);

  useEffect(() => {
    if (!baseValidationMessage) return;
    setBaseValidationMessage(getBaseValidationMessage(draft));
  }, [baseValidationMessage, draft]);

  const activeSection = sections.find(section => section.id === activeSectionId) ?? sections[0];
  const description = useMemo(() => sectionDescription(activeSection), [activeSection]);
  const selectedItem = selectedItemIndex >= 0 ? activeSection?.items?.[selectedItemIndex] : undefined;
  const previewItem = selectedItem ?? activeSection?.items?.[0];
  const embedConfig = useMemo(() => resolveReviewEmbed(draft.embedUrl), [draft.embedUrl]);

  const updateSection = (sectionId: string, updater: (section: EditorSection) => EditorSection) => {
    setSections(prev => prev.map(section => section.id === sectionId ? updater(section) : section));
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    setSections(prev => {
      const index = prev.findIndex(section => section.id === sectionId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const toggleSection = (sectionId: string) => {
    updateSection(sectionId, section => ({ ...section, active: !section.active }));
  };

  const addCustomSection = () => {
    const nextId = `custom_${Date.now()}`;
    setSections(prev => [...prev, { id: nextId, type: 'custom', title: 'Nueva vista', fixed: false, active: true, items: [defaultItem('custom')] }]);
    setActiveSectionId(nextId);
  };

  const selectItem = (index: number) => {
    const item = activeSection.items[index];
    if (!item) return;
    setSelectedItemIndex(index);
    setItemDraft({ ...item });
  };

  const persistItemDraft = () => {
    updateSection(activeSection.id, section => {
      const items = [...section.items];
      if (selectedItemIndex >= 0 && items[selectedItemIndex]) {
        items[selectedItemIndex] = { ...itemDraft };
      } else {
        items.push({ ...itemDraft, id: `item_${Date.now()}` });
      }
      return { ...section, items };
    });
    setSelectedItemIndex(-1);
    setItemDraft({ ...defaultItem(activeSection.type), id: `item_${Date.now() + 1}` });
  };

  const removeItem = (index: number) => {
    updateSection(activeSection.id, section => ({ ...section, items: section.items.filter((_, itemIndex) => itemIndex !== index) }));
    if (index === selectedItemIndex) {
      setSelectedItemIndex(-1);
      setItemDraft(defaultItem(activeSection.type));
    } else if (index < selectedItemIndex) {
      setSelectedItemIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    const item = selectedItemIndex >= 0 ? activeSection?.items?.[selectedItemIndex] : undefined;
    if (item) {
      setItemDraft({ ...item });
      return;
    }
    setItemDraft(defaultItem(activeSection?.type ?? 'indicadores'));
  }, [activeSectionId, selectedItemIndex, activeSection]);

  const openSupport = (url?: string, itemTitle?: string, caption?: string, capacidadKey?: CapacityKey) => {
    if (!url) return;
    setEmbeddedViewer({ url, title: itemTitle ?? 'Contenido embebido', caption: caption ?? '', capacidadKey });
  };

  const resetDraftForCapacity = (capacidadKey: CapacityDraftKey) => {
    const nextItem = defaultItem(activeSection.type);
    setSelectedItemIndex(-1);
    setItemDraft({ ...nextItem, capacidadKey });
  };

  const currentReview = useMemo(() => buildReview(draft, sections), [draft, sections]);

  const validateBaseData = () => {
    const message = getBaseValidationMessage(draft);
    setBaseValidationMessage(message);
    return !message;
  };

  const handleSave = (review: Review) => {
    if (!validateBaseData()) return;
    initialSnapshotRef.current = JSON.stringify({ d: draft, s: sections });
    onDirtyChangeRef.current?.(false);
    onSave(review);
  };

  const handleReset = async () => {
    const ok = await confirm('¿Limpiar todo y volver al estado inicial? Se perderán los cambios no guardados.', { title: 'Limpiar todo', confirmLabel: 'Sí, limpiar', danger: true });
    if (!ok) return;
    const nextDraft = createDraftFromReview(initialReview);
    const nextSections = createSectionsFromReview(initialReview);
    initialSnapshotRef.current = JSON.stringify({ d: nextDraft, s: nextSections });
    setDraft(nextDraft);
    setSections(nextSections);
    setActiveSectionId(nextSections[0]?.id ?? 'indicadores');
    setSelectedItemIndex(-1);
    setItemDraft(defaultItem(nextSections[0]?.type ?? 'indicadores'));
    onDirtyChangeRef.current?.(false);
  };

  useImperativeHandle(ref, () => ({
    reset: handleReset,
    save: () => handleSave(currentReview),
    preview: () => {
      if (!validateBaseData()) return;
      onPresent?.(currentReview);
    },
  }), [currentReview, onPresent]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {confirmDialog}
      <div style={{ border: '1px solid #DCE7FF', borderRadius: 16, background: '#fff', padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5B6C9E', marginBottom: 10, fontFamily: 'Manrope, sans-serif' }}>Datos base de la Review</div>
        <div className="review-base-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input value={draft.sprint} onChange={event => setDraft(prev => ({ ...prev, sprint: event.target.value }))} placeholder="Sprint *" style={{ border: '1px solid #D8DEF0', borderRadius: 8, padding: '8px 10px', background: '#fff', fontSize: 12 }} />
          <input type="date" value={draft.fecha} onChange={event => setDraft(prev => ({ ...prev, fecha: event.target.value }))} title="Fecha *" style={{ border: '1px solid #D8DEF0', borderRadius: 8, padding: '8px 10px', background: '#fff', fontSize: 12 }} />
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5B6C9E', fontFamily: 'Manrope, sans-serif', marginBottom: 6 }}>Tipo de review</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setDraft(prev => ({ ...prev, fuente: 'interna' }))} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${draft.fuente === 'interna' ? '#BFDBFE' : '#D8DEF0'}`, background: draft.fuente === 'interna' ? '#EFF6FF' : '#fff', color: draft.fuente === 'interna' ? '#1D4ED8' : '#475569', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Review interna</button>
            <button type="button" onClick={() => setDraft(prev => ({ ...prev, fuente: 'embebida' }))} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${draft.fuente === 'embebida' ? '#BFDBFE' : '#D8DEF0'}`, background: draft.fuente === 'embebida' ? '#EFF6FF' : '#fff', color: draft.fuente === 'embebida' ? '#1D4ED8' : '#475569', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>URL review (embebida)</button>
            {draft.fuente === 'embebida' && (
              <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <input value={draft.embedUrl} onChange={event => setDraft(prev => ({ ...prev, embedUrl: event.target.value }))} placeholder="URL de Google Slides o PPT pública" style={{ border: '1px solid #BFDBFE', borderRadius: 8, padding: '7px 10px', background: '#fff', fontSize: 12, fontWeight: 600, width: '100%', boxSizing: 'border-box' as const }} />
                <span style={{ fontSize: 10, color: '#64748B' }}>Ingresa aquí la URL de la presentación (Google Slides, PPT pública, etc.)</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45, marginTop: 6 }}>
            {draft.fuente === 'interna'
              ? 'El contenido se arma desde este editor con vistas y bloques configurados.'
              : draft.fuente === 'embebida'
                ? 'Pega tu enlace de Google Slides. Puede ser de edición, compartir o publicar; la app intentará convertirlo a una vista previa embebible.'
                : 'Selecciona el tipo de contenido de la review.'}
          </div>
        </div>

        {onPresent && draft.fuente === 'embebida' && Boolean(draft.embedUrl.trim()) && (
          <div style={{ marginTop: 10, background: embedConfig.likelyEmbeddable ? '#EFF6FF' : '#FFF7ED', border: `1px solid ${embedConfig.likelyEmbeddable ? '#BFDBFE' : '#FED7AA'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, lineHeight: 1.6, color: embedConfig.likelyEmbeddable ? '#1D4ED8' : '#C2410C' }}>
            <strong>{embedConfig.providerLabel}.</strong> {embedConfig.guidance}
          </div>
        )}
        {baseValidationMessage && (
          <div style={{ marginTop: 10, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '10px 12px', fontSize: 12, lineHeight: 1.6, color: '#C2410C' }}>
            <strong>Datos base incompletos.</strong> {baseValidationMessage}
          </div>
        )}
      </div>

      {draft.fuente === 'interna' && (<>
      <div className="review-editor-main-grid" style={{ display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        <aside style={{ background: '#fff', border: '1px solid #D8DEF0', borderRadius: 18, boxShadow: '0 16px 38px rgba(15,28,64,0.07)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 20 }}>
          <div style={{ border: '1px solid #E8EDFA', borderRadius: 14, padding: 12, background: '#F8FAFF' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5B6C9E', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>Tabla de contenidos</div>
            <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45, marginBottom: 8 }}>Define las vistas y el orden de presentación. Activa o desactiva secciones según lo que necesites mostrar.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sections.map((section, index) => (
                <div key={section.id} onClick={() => { setActiveSectionId(section.id); setSelectedItemIndex(-1); }} className="rm-toc-item" style={{ display: 'grid', gridTemplateColumns: '22px minmax(0, 1fr) auto', gap: 6, alignItems: 'center', padding: '7px 9px', background: section.id === activeSectionId ? '#EEF4FF' : '#fff', border: `1px solid ${section.id === activeSectionId ? '#8FB1FF' : '#DBE4FB'}`, borderRadius: 10, cursor: 'pointer' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: section.id === activeSectionId ? '#1D4ED8' : '#DCE7FF', color: section.id === activeSectionId ? '#fff' : '#0032A0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{index + 1}</div>
                  <input value={section.title} onChange={event => { event.stopPropagation(); updateSection(section.id, current => ({ ...current, title: event.target.value })); }} onClick={event => event.stopPropagation()} title={section.title} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 12, fontWeight: 700, color: section.id === activeSectionId ? '#1D4ED8' : '#0F1C40', padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} />
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                    <button type="button" onClick={event => { event.stopPropagation(); moveSection(section.id, -1); }} style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #D8DEF0', background: '#fff', color: '#4B5B79', fontSize: 11, lineHeight: 1, padding: 0 }}>↑</button>
                    <button type="button" onClick={event => { event.stopPropagation(); moveSection(section.id, 1); }} style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #D8DEF0', background: '#fff', color: '#4B5B79', fontSize: 11, lineHeight: 1, padding: 0 }}>↓</button>
                    <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #D8DEF0' }}>
                      <button type="button" onClick={event => { event.stopPropagation(); if (!section.active) toggleSection(section.id); }} style={{ padding: '4px 7px', border: 'none', borderRight: '1px solid #D8DEF0', background: section.active ? '#ECFDF5' : '#F8FAFF', color: section.active ? '#047857' : '#94A3B8', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Activo</button>
                      <button type="button" onClick={event => { event.stopPropagation(); if (section.active) toggleSection(section.id); }} style={{ padding: '4px 7px', border: 'none', background: !section.active ? '#FFF1F2' : '#F8FAFF', color: !section.active ? '#BE123C' : '#94A3B8', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Desactivado</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addCustomSection} style={{ width: '100%', marginTop: 12, padding: '10px 12px', borderRadius: 12, border: '1px dashed #BFDBFE', background: '#F8FBFF', color: '#1D4ED8', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif' }}>+ Agregar vista nueva</button>
          </div>
        </aside>

        <div className="review-editor-content-grid" style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 12 }}>
          <aside style={{ border: '1px solid #DBE4FB', borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5ECFB', background: '#F8FAFF' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1C40' }}>Ingresar Datos de la Vista</div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginTop: 3 }}>{description.subtitle}</div>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {previewItem && (
                <div style={{ border: '1px solid #DBE4FB', borderRadius: 14, background: '#FBFDFF', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {previewItem.capacidadKey ? <div>{chip(previewItem.capacidadKey as CapacityKey)}</div> : null}
                  {activeSection.type === 'resultados' ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F1C40' }}>{previewItem.entregable || 'Sin entregable'}</div>
                      <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.55 }}><strong>Compromiso:</strong> {previewItem.compromiso || 'Sin compromiso configurado.'}</div>
                      <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55 }}><strong>Comentarios:</strong> {previewItem.comentarios || 'Sin comentarios configurados.'}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', padding: '6px 10px', borderRadius: 10, border: `1px solid ${previewItem.status === 'listo' ? '#BBF7D0' : '#FDE68A'}`, background: previewItem.status === 'listo' ? '#ECFDF5' : '#FFFBEB', color: previewItem.status === 'listo' ? '#047857' : '#B45309', fontSize: 10, fontWeight: 800, fontFamily: 'Manrope, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{previewItem.status === 'listo' ? 'Listo' : 'Pendiente'}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F1C40' }}>{previewItem.titulo || 'Sin título'}</div>
                      <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>{previewItem.detalle || previewItem.descripcion || 'Sin detalle configurado.'}</div>
                    </>
                  )}
                  {activeSection.type !== 'resultados' && previewItem.url && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', gap: 6, padding: '4px 8px', borderRadius: 999, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', fontSize: 10, fontWeight: 800, fontFamily: 'Manrope, sans-serif', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                      <span style={{ fontSize: 11 }}>✓</span>
                      {countSupportUrls(previewItem.url)} URL{countSupportUrls(previewItem.url) > 1 ? 's' : ''} cargada{countSupportUrls(previewItem.url) > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              {!(activeSection.type === 'proximos_pasos' && activeSection.nextStepsMode === 'roadmap') && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#50607E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {selectedItemIndex >= 0 ? 'Editar item seleccionado' : 'Nuevo item'}
                  </div>
                  <select value={itemDraft.capacidadKey} onChange={event => resetDraftForCapacity(event.target.value as CapacityDraftKey)} style={{ width: '100%', border: '1px solid #D8DEF0', borderRadius: 8, padding: '8px 10px', background: '#fff', fontSize: 12, color: itemDraft.capacidadKey ? '#0F172A' : '#64748B' }}>
                    <option value="">Seleccionar capacidad</option>
                    {Object.entries(CAPACITY_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                  </select>
                  {activeSection.type === 'resultados' ? (
                    <>
                      <input maxLength={MAX_TITLE_LENGTH} value={itemDraft.entregable ?? ''} onChange={event => setItemDraft(prev => ({ ...prev, entregable: event.target.value, titulo: event.target.value }))} placeholder="Entregable *" style={{ width: '100%', border: '1px solid #D8DEF0', borderRadius: 8, padding: '8px 10px', background: '#fff', fontSize: 12 }} />
                      <div style={{ marginTop: -4, fontSize: 10, color: '#64748B', textAlign: 'right' }}>{(itemDraft.entregable ?? '').length}/{MAX_TITLE_LENGTH}</div>
                      <input maxLength={MAX_TITLE_LENGTH} value={itemDraft.compromiso ?? ''} onChange={event => setItemDraft(prev => ({ ...prev, compromiso: event.target.value, detalle: event.target.value }))} placeholder="Compromiso *" style={{ width: '100%', border: '1px solid #D8DEF0', borderRadius: 8, padding: '8px 10px', background: '#fff', fontSize: 12 }} />
                      <div style={{ marginTop: -4, fontSize: 10, color: '#64748B', textAlign: 'right' }}>{(itemDraft.compromiso ?? '').length}/{MAX_TITLE_LENGTH}</div>
                      <textarea maxLength={MAX_CONTEXT_LENGTH} value={itemDraft.comentarios ?? ''} onChange={event => setItemDraft(prev => ({ ...prev, comentarios: event.target.value, descripcion: event.target.value }))} placeholder="Comentarios *" style={{ width: '100%', minHeight: 70, border: '1px solid #D8DEF0', borderRadius: 8, padding: '8px 10px', background: '#fff', resize: 'vertical', fontSize: 12 }} />
                      <div style={{ marginTop: -4, fontSize: 10, color: '#64748B', textAlign: 'right' }}>{(itemDraft.comentarios ?? '').length}/{MAX_CONTEXT_LENGTH}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['listo', 'pendiente'] as const).map(status => (
                          <button key={status} type="button" onClick={() => setItemDraft(prev => ({ ...prev, status }))} style={{ flex: 1, padding: '7px 8px', borderRadius: 8, border: '1px solid #D8DEF0', background: itemDraft.status === status ? (status === 'listo' ? '#ECFDF5' : '#FFFBEB') : '#fff', color: itemDraft.status === status ? (status === 'listo' ? '#166534' : '#B45309') : '#52617D', fontSize: 11, fontWeight: 700 }}>{status === 'listo' ? 'Listo' : 'Pendiente'}</button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <input maxLength={MAX_TITLE_LENGTH} value={itemDraft.titulo} onChange={event => setItemDraft(prev => ({ ...prev, titulo: event.target.value }))} placeholder="Título *" style={{ width: '100%', border: '1px solid #D8DEF0', borderRadius: 8, padding: '8px 10px', background: '#fff', fontSize: 12 }} />
                      <div style={{ marginTop: -4, fontSize: 10, color: '#64748B', textAlign: 'right' }}>{itemDraft.titulo.length}/{MAX_TITLE_LENGTH}</div>
                      <textarea maxLength={MAX_CONTEXT_LENGTH} value={activeSection.type === 'demo' || activeSection.type === 'riesgos' ? itemDraft.descripcion : itemDraft.detalle} onChange={event => setItemDraft(prev => ({ ...prev, [activeSection.type === 'demo' || activeSection.type === 'riesgos' ? 'descripcion' : 'detalle']: event.target.value }))} placeholder={activeSection.type === 'demo' || activeSection.type === 'riesgos' ? 'Descripción *' : 'Detalle *'} style={{ width: '100%', minHeight: 70, border: '1px solid #D8DEF0', borderRadius: 8, padding: '8px 10px', background: '#fff', resize: 'vertical', fontSize: 12 }} />
                      <div style={{ marginTop: -4, fontSize: 10, color: '#64748B', textAlign: 'right' }}>{(activeSection.type === 'demo' || activeSection.type === 'riesgos' ? itemDraft.descripcion : itemDraft.detalle).length}/{MAX_CONTEXT_LENGTH}</div>
                    </>
                  )}
                  {activeSection.type !== 'riesgos' && activeSection.type !== 'resultados' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(() => {
                        const urls = parseEditableSupportUrls(itemDraft.url);
                        const draftUrls = urls.length > 0 ? urls : [''];
                        return draftUrls.map((url, index) => (
                          <div key={`support_url_${index}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input value={url} onChange={event => {
                              const nextUrls = [...draftUrls];
                              nextUrls[index] = event.target.value;
                              setItemDraft(prev => ({ ...prev, url: serializeSupportUrls(nextUrls) }));
                            }} placeholder={`URL de apoyo ${index + 1}`} style={{ flex: 1, border: '1px solid #D8DEF0', borderRadius: 8, padding: '8px 10px', background: '#fff', fontSize: 12 }} />
                            {draftUrls.length > 1 && (
                              <button type="button" onClick={() => {
                                const nextUrls = draftUrls.filter((_, itemIndex) => itemIndex !== index);
                                setItemDraft(prev => ({ ...prev, url: serializeSupportUrls(nextUrls) }));
                              }} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 700 }}>Quitar</button>
                            )}
                          </div>
                        ));
                      })()}
                      <button type="button" onClick={() => {
                        const existing = parseEditableSupportUrls(itemDraft.url);
                        const nextUrls = [...(existing.length > 0 ? existing : ['']), ''];
                        setItemDraft(prev => ({ ...prev, url: serializeSupportUrls(nextUrls) }));
                      }} style={{ alignSelf: 'flex-start', padding: '6px 10px', borderRadius: 8, border: '1px solid #BFDBFE', background: '#F8FBFF', color: '#1D4ED8', fontSize: 11, fontWeight: 700 }}>+ Agregar URL</button>
                    </div>
                  )}
                  {activeSection.type !== 'riesgos' && activeSection.type !== 'resultados' && itemDraft.url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 9px', borderRadius: 10, border: '1px solid #BFDBFE', background: '#F8FBFF', color: '#1D4ED8', fontSize: 11, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 800 }}>✓</span>
                      <span style={{ fontWeight: 700 }}>{countSupportUrls(itemDraft.url)} URL{countSupportUrls(itemDraft.url) > 1 ? 's' : ''} cargada{countSupportUrls(itemDraft.url) > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {activeSection.type === 'riesgos' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['low', 'mid', 'high'] as const).map(level => (
                        <button key={level} type="button" onClick={() => setItemDraft(prev => ({ ...prev, impactLevel: level }))} style={{ flex: 1, padding: '7px 8px', borderRadius: 8, border: '1px solid #D8DEF0', background: itemDraft.impactLevel === level ? (level === 'high' ? '#FFF1F2' : level === 'mid' ? '#FFF7ED' : '#EFFCF4') : '#fff', color: itemDraft.impactLevel === level ? (level === 'high' ? '#BE123C' : level === 'mid' ? '#9A3412' : '#166534') : '#52617D', fontSize: 11, fontWeight: 700 }}>{level === 'high' ? 'Alto' : level === 'mid' ? 'Medio' : 'Bajo'}</button>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={persistItemDraft} style={{ width: '100%', padding: '7px 10px', borderRadius: 10, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Manrope, sans-serif' }}>{selectedItemIndex >= 0 ? 'Actualizar en vista' : 'Agregar a vista'}</button>
                  {activeSection.type !== 'resultados' && itemDraft.url && (
                    <button type="button" onClick={() => openSupport(itemDraft.url, itemDraft.titulo, itemDraft.detalle || itemDraft.descripcion, itemDraft.capacidadKey || undefined)} style={{ width: '100%', padding: '5px 10px', borderRadius: 10, border: '1px solid #BFDBFE', background: '#F8FBFF', color: '#1D4ED8', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif' }}>Ver URL embebida</button>
                  )}
                </>
              )}
            </div>
          </aside>

          <section style={{ border: '1px solid #DBE4FB', borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5ECFB', background: '#F8FAFF' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1C40' }}>{activeSection.title}</div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginTop: 3 }}>{description.note}</div>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeSection.type === 'proximos_pasos' && (
                <div style={{ padding: 10, borderRadius: 12, border: '1px solid #DBE4FB', background: '#F8FAFF', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#50607E' }}>Modo de la vista</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => updateSection(activeSection.id, section => ({ ...section, nextStepsMode: 'roadmap' }))} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${activeSection.nextStepsMode === 'roadmap' ? '#BFDBFE' : '#D8DEF0'}`, background: activeSection.nextStepsMode === 'roadmap' ? '#EFF6FF' : '#fff', color: activeSection.nextStepsMode === 'roadmap' ? '#1D4ED8' : '#475569', fontSize: 11, fontWeight: 700 }}>Usar roadmap general</button>
                    <button type="button" onClick={() => updateSection(activeSection.id, section => ({ ...section, nextStepsMode: 'manual' }))} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${activeSection.nextStepsMode === 'manual' ? '#BFDBFE' : '#D8DEF0'}`, background: activeSection.nextStepsMode === 'manual' ? '#EFF6FF' : '#fff', color: activeSection.nextStepsMode === 'manual' ? '#1D4ED8' : '#475569', fontSize: 11, fontWeight: 700 }}>Cargar pasos manuales</button>
                  </div>
                </div>
              )}

              {activeSection.type === 'proximos_pasos' && activeSection.nextStepsMode === 'roadmap' ? (
                <div style={{ border: '1px solid #DBE4FB', borderRadius: 12, padding: 10, background: '#FBFDFF', fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
                  Al ejecutar la review, esta vista reutilizara el roadmap general del sistema con la misma dinamica visible en la experiencia publica.
                </div>
              ) : (
                <>
                  <strong style={{ fontSize: 13, color: '#0F1C40' }}>Items configurados</strong>
                  {activeSection.items.length === 0 ? (
                    <div style={{ padding: 10, border: '1px dashed #BFDBFE', borderRadius: 10, color: '#64748B', fontSize: 12 }}>No hay ítems aún. Completa el formulario de la derecha y presiona Agregar.</div>
                  ) : activeSection.type === 'riesgos' ? (
                    <div style={{ width: 'min(100%, 860px)', border: '1px solid #DBE4FB', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <div style={{ minWidth: 620 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '126px minmax(132px, 1fr) minmax(170px, 1.45fr) 72px auto', gap: 8, padding: '10px 12px', background: '#F8FAFF', borderBottom: '1px solid #E5ECFB' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Capacidad</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Título</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Detalle</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Impacto</div>
                        <div />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {activeSection.items.map((item, index) => (
                              <div key={item.id} onClick={() => selectItem(index)} style={{ display: 'grid', gridTemplateColumns: '126px minmax(132px, 1fr) minmax(170px, 1.45fr) 72px auto', gap: 8, padding: '10px 12px', borderTop: index > 0 ? '1px solid #E5ECFB' : 'none', alignItems: 'start', cursor: 'pointer', background: selectedItemIndex === index ? '#EFF6FF' : '#fff' }}>
                                <div>{item.capacidadKey && chip(item.capacidadKey)}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: selectedItemIndex === index ? '#1D4ED8' : '#0F1C40' }}>{item.titulo || 'Sin título'}</div>
                                <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45 }}>{item.descripcion || item.detalle || 'Sin detalle.'}</div>
                                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: item.impactLevel === 'high' ? '#BE123C' : item.impactLevel === 'low' ? '#15803D' : '#92400E' }}>{item.impactLevel === 'high' ? 'ALTO' : item.impactLevel === 'low' ? 'BAJO' : 'MEDIO'}</div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <button type="button" onClick={event => { event.stopPropagation(); removeItem(index); }} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 700 }}>Eliminar</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeSection.type === 'indicadores' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                      {groupEditorItemsByCapacity(activeSection.items).map(group => (
                        <div key={group.key} style={{ border: '1px solid #DBE4FB', borderRadius: 12, background: '#fff', padding: 10 }}>
                          <div style={{ marginBottom: 8 }}>{chip(group.key)}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {group.items.map(({ item, index }) => (
                              <div key={item.id} onClick={() => selectItem(index)} style={{ borderTop: index !== group.items[0].index ? '1px solid #E5ECFB' : 'none', paddingTop: index !== group.items[0].index ? 6 : 0, cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: selectedItemIndex === index ? '#1D4ED8' : '#0F1C40' }}>{item.titulo || 'Sin título'}</div>
                                    {(item.detalle || item.descripcion) && <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45, marginTop: 2 }}>{item.detalle || item.descripcion}</div>}
                                  </div>
                                  <button type="button" onClick={event => { event.stopPropagation(); removeItem(index); }} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 700 }}>Eliminar</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeSection.type === 'resultados' ? (
                    <div style={{ width: 'min(100%, 840px)', border: '1px solid #DBE4FB', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <div style={{ minWidth: 760 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '126px minmax(140px, 1fr) minmax(140px, 1fr) minmax(180px, 1.45fr) 78px auto', gap: 8, padding: '10px 12px', background: '#F8FAFF', borderBottom: '1px solid #E5ECFB' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Capacidad</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Entregable</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Compromiso</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Comentarios</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Status</div>
                        <div />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {activeSection.items.map((item, index) => (
                              <div key={item.id} onClick={() => selectItem(index)} style={{ display: 'grid', gridTemplateColumns: '126px minmax(140px, 1fr) minmax(140px, 1fr) minmax(180px, 1.45fr) 78px auto', gap: 8, padding: '10px 12px', borderTop: index > 0 ? '1px solid #E5ECFB' : 'none', alignItems: 'start', cursor: 'pointer', background: selectedItemIndex === index ? '#EFF6FF' : '#fff' }}>
                                <div>{item.capacidadKey && chip(item.capacidadKey)}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: selectedItemIndex === index ? '#1D4ED8' : '#0F1C40' }}>{item.entregable || 'Sin entregable'}</div>
                                <div style={{ fontSize: 11, color: '#334155', lineHeight: 1.45 }}>{item.compromiso || 'Sin compromiso.'}</div>
                                <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45 }}>{item.comentarios || 'Sin comentarios.'}</div>
                                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: item.status === 'listo' ? '#047857' : '#B45309' }}>{item.status === 'listo' ? 'Listo' : 'Pendiente'}</div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <button type="button" onClick={event => { event.stopPropagation(); removeItem(index); }} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 700 }}>Eliminar</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    activeSection.items.map((item, index) => (
                      <div key={item.id} onClick={() => selectItem(index)} style={{ border: `1px solid ${selectedItemIndex === index ? '#93C5FD' : '#DBE4FB'}`, borderRadius: 12, padding: 10, background: selectedItemIndex === index ? '#EFF6FF' : '#FBFDFF', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                          <strong style={{ fontSize: 13, color: '#0F1C40' }}>{item.titulo || `${activeSection.type === 'riesgos' ? 'Riesgo' : 'Bloque'} ${index + 1}`}</strong>
                          <button type="button" onClick={event => { event.stopPropagation(); removeItem(index); }} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 700 }}>Eliminar</button>
                        </div>
                        {item.capacidadKey && <div>{chip(item.capacidadKey)}</div>}
                        <div style={{ marginTop: 6, fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{item.detalle || item.descripcion || 'Sin detalle.'}</div>
                          {item.url && <div style={{ marginTop: 6, fontSize: 10, fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.03em' }}>✓ {countSupportUrls(item.url)} URL{countSupportUrls(item.url) > 1 ? 's' : ''} cargada{countSupportUrls(item.url) > 1 ? 's' : ''}</div>}
                        {item.url && (
                          <button type="button" onClick={event => { event.stopPropagation(); openSupport(item.url, item.titulo, item.detalle || item.descripcion, item.capacidadKey || undefined); }} style={{ marginTop: 4, marginLeft: 'auto', padding: 0, border: 'none', background: 'transparent', color: '#1D4ED8', fontSize: 10, fontWeight: 700, fontFamily: 'Manrope, sans-serif', textDecoration: 'underline', cursor: 'pointer' }}>Ver imagen</button>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      <section style={{ border: '1px solid #DBE4FB', borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5ECFB', background: '#F8FAFF' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1C40' }}>Vista de presentación en construcción</div>
          <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginTop: 3 }}>Aquí ves cómo va quedando la review completa mientras configuras cada vista.</div>
        </div>
        <div style={{ padding: 12, display: 'grid', gap: 10 }}>
          {sections.filter(section => section.active).map((section, index) => (
            <div key={section.id} style={{ border: '1px solid #DBE4FB', borderRadius: 12, padding: 10, background: '#FBFDFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#DCE7FF', color: '#0032A0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{index + 1}</div>
                <strong style={{ fontSize: 13, color: '#0F1C40' }}>{section.title}</strong>
              </div>
              {section.type === 'proximos_pasos' && section.nextStepsMode === 'roadmap' ? (
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>Se mostrará el roadmap general en modo presentación.</div>
              ) : section.items.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94A3B8' }}>Sin contenido agregado.</div>
              ) : section.type === 'riesgos' ? (
                <div style={{ width: 'min(100%, 860px)', border: '1px solid #E2E8F0', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: 620 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '126px minmax(132px, 1fr) minmax(180px, 1.45fr) 70px', gap: 8, padding: '8px 10px', background: '#F8FAFF', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capacidad</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Título</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Detalle</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Impacto</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {section.items.map((item, idx) => (
                          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '126px minmax(132px, 1fr) minmax(180px, 1.45fr) 70px', gap: 8, padding: '8px 10px', borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none', alignItems: 'start' }}>
                            <div>{item.capacidadKey && chip(item.capacidadKey)}</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F1C40' }}>{item.titulo || 'Sin título'}</div>
                            <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45 }}>{item.descripcion || item.detalle || 'Sin detalle'}</div>
                            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: item.impactLevel === 'high' ? '#BE123C' : item.impactLevel === 'low' ? '#15803D' : '#92400E' }}>{item.impactLevel === 'high' ? 'ALTO' : item.impactLevel === 'low' ? 'BAJO' : 'MEDIO'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : section.type === 'resultados' ? (
                <div style={{ width: 'min(100%, 840px)', border: '1px solid #E2E8F0', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: 760 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '126px minmax(140px, 1fr) minmax(140px, 1fr) minmax(180px, 1.45fr) 78px', gap: 8, padding: '8px 10px', background: '#F8FAFF', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capacidad</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Entregable</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Compromiso</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Comentarios</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {section.items.map((item, idx) => {
                          return (
                            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '126px minmax(140px, 1fr) minmax(140px, 1fr) minmax(180px, 1.45fr) 78px', gap: 8, padding: '8px 10px', borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none', alignItems: 'start' }}>
                              <div>{item.capacidadKey && chip(item.capacidadKey)}</div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F1C40' }}>{item.entregable || 'Sin entregable'}</div>
                              <div style={{ fontSize: 11, color: '#334155', lineHeight: 1.45 }}>{item.compromiso || 'Sin compromiso'}</div>
                              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45 }}>{item.comentarios || 'Sin comentarios'}</div>
                              <div style={{ fontSize: 10, fontWeight: 800, color: item.status === 'listo' ? '#047857' : '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.status === 'listo' ? 'Listo' : 'Pendiente'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : section.type === 'indicadores' ? (
                (() => {
                  const groups = groupEditorItemsByCapacity(section.items);
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                      {groups.map(group => (
                        <div key={group.key} style={{ border: '1px solid #E2E8F0', borderRadius: 10, background: '#fff', padding: 10 }}>
                          <div style={{ marginBottom: 8 }}>{chip(group.key)}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {group.items.map(({ item }, idx) => (
                              <div key={item.id} style={{ borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none', paddingTop: idx > 0 ? 5 : 0 }}>
                                {section.type === 'resultados' ? (
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#BBF7D0', border: '1px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                      <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 800 }}>✓</span>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0F1C40' }}>{item.titulo || 'Sin título'}</div>
                                      {(item.detalle || item.descripcion) && <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45, marginTop: 2 }}>{item.detalle || item.descripcion}</div>}
                                      {item.url && <div style={{ marginTop: 4, fontSize: 10, fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.03em' }}>✓ {countSupportUrls(item.url)} URL{countSupportUrls(item.url) > 1 ? 's' : ''} cargada{countSupportUrls(item.url) > 1 ? 's' : ''}</div>}
                                    </div>
                                  </div>
                                ) : section.type === 'riesgos' ? (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0F1C40', flex: 1 }}>{item.titulo || 'Sin título'}</span>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: item.impactLevel === 'high' ? '#FEF2F2' : item.impactLevel === 'low' ? '#F0FDF4' : '#FFF7ED', color: item.impactLevel === 'high' ? '#BE123C' : item.impactLevel === 'low' ? '#15803D' : '#92400E' }}>{item.impactLevel === 'high' ? 'Alto' : item.impactLevel === 'low' ? 'Bajo' : 'Medio'}</span>
                                  </div>
                                ) : (
                                  <>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F1C40' }}>{item.titulo || 'Sin título'}</div>
                                    {(item.detalle || item.descripcion) && <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45, marginTop: 2 }}>{item.detalle || item.descripcion}</div>}
                                  </>
                                )}
                                {section.type === 'riesgos' && (item.descripcion || item.detalle) && <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45, marginTop: 2 }}>{item.descripcion || item.detalle}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {section.items.map(item => (
                    <div key={item.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, background: '#fff', padding: 10 }}>
                      {item.capacidadKey && <div>{chip(item.capacidadKey)}</div>}
                      <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: '#0F1C40' }}>{item.titulo || 'Sin titulo'}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{item.detalle || item.descripcion || 'Sin detalle'}</div>
                      {item.url && <div style={{ marginTop: 6, fontSize: 10, fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.03em' }}>✓ {countSupportUrls(item.url)} URL{countSupportUrls(item.url) > 1 ? 's' : ''} cargada{countSupportUrls(item.url) > 1 ? 's' : ''}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      </>)}

      {embeddedViewer && (
        <div onClick={() => setEmbeddedViewer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,80,0.76)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
          <div onClick={event => event.stopPropagation()} style={{ width: 'min(90vw, 1400px)', height: 'min(90vh, 900px)', background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.34)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5ECFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#F8FAFF' }}>
              <div>
                {embeddedViewer && embeddedViewer.capacidadKey && <div style={{ marginBottom: 6 }}>{chip(embeddedViewer.capacidadKey as CapacityKey)}</div>}
                <strong style={{ fontSize: 15, color: '#0F1C40' }}>{embeddedViewer && embeddedViewer.title}</strong>
                {embeddedViewer && embeddedViewer.caption && <p style={{ fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 0 }}>{embeddedViewer.caption}</p>}
              </div>
              <button type="button" onClick={() => setEmbeddedViewer(null)} style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif' }}>Cerrar</button>
            </div>
            <div style={{ flex: 1, background: '#0F172A', padding: 18, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gap: 14 }}>
                {embeddedViewer && parseSupportUrls(embeddedViewer.url).map((url, index) => (
                  /(?:png|jpg|jpeg|gif|webp)(?:\?|$)/i.test(url) || url.includes('images.unsplash.com') ? (
                    <img key={`${url}_${index}`} src={url} alt={`${embeddedViewer.title} ${index + 1}`} style={{ width: '100%', maxHeight: '70vh', borderRadius: 16, background: '#fff', objectFit: 'contain' }} />
                  ) : (
                    <iframe key={`${url}_${index}`} title={`${embeddedViewer.title} ${index + 1}`} src={url} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 16, background: '#fff' }} />
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});

export default ReviewMockupWorkspace;
