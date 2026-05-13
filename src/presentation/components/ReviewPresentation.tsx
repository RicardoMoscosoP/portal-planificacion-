import { useEffect, useMemo, useState } from 'react';
import type { AppData, Entregable, Iniciativa, Review, ReviewBloque, ReviewStructuredSection } from '../../domain/types';
import RoadmapInitiativasBlock from './RoadmapInitiativasBlock';
import { resolveReviewEmbed } from '../../application/services/reviewEmbed';
import { getReviewDisplayName } from '../../application/services/reviewUtils';
import '../styles/review-presentation.css';

type CapacityKey = 'plan' | 'red' | 'int' | 'ultima' | 'programas';

const CAPACITY_META: Record<CapacityKey, { label: string; color: string }> = {
  plan: { label: 'Planificación', color: '#1B30CC' },
  red: { label: 'Red de distribución', color: '#0891B2' },
  int: { label: 'Inteligencia de direcciones', color: '#DB2777' },
  ultima: { label: 'Ultima milla', color: '#EA580C' },
  programas: { label: 'Programa', color: '#0F766E' },
};

function quarterToNumber(value: string): number | null {
  const match = value.match(/[1-4]/);
  return match ? Number(match[0]) : null;
}

function getPresentationIdentity(configTitle?: string): { portfolioName: string; teamName: string } {
  const normalized = configTitle?.trim() || 'Portafolio';
  const parts = normalized.split(' - ').map(part => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      portfolioName: parts[0],
      teamName: parts.slice(1).join(' - '),
    };
  }

  return {
    portfolioName: normalized,
    teamName: 'Equipo',
  };
}

function getPresentationModeLabel(review: Review): string {
  if (review.fuente === 'roadmap') return 'Roadmap general';
  if (review.fuente === 'embebida') return 'Review embebida';
  return 'Review interna';
}

function buildRoadmap(data: AppData, review: Review): Array<{ iniciativa: Iniciativa; entregables: Entregable[] }> {
  const reviewQuarter = quarterToNumber(review.q);
  const iniciativas = data.iniciativas
    .filter(item => reviewQuarter ? item.q === reviewQuarter : true)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  return iniciativas.map(iniciativa => ({
    iniciativa,
    entregables: (data.entregables ?? [])
      .filter(entregable => entregable.iniciativaId === iniciativa.id && (entregable.activo ?? true))
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio)),
  }));
}

function createFallbackSections(review: Review): ReviewStructuredSection[] {
  return [
    { id: 'indicadores', type: 'indicadores', title: 'Indicadores', active: true, fixed: true, items: review.indicadores },
    { id: 'resultados', type: 'resultados', title: 'Resultados del Sprint', active: true, fixed: true, items: review.resultados },
    { id: 'demo', type: 'demo', title: 'Demo', active: true, fixed: true, items: (review.demoItems ?? review.demo.map((item, index) => ({ id: `demo_${index}`, titulo: item, contexto: '', descripcion: '', url: '' }))) },
    { id: 'riesgos', type: 'riesgos', title: 'Riesgos', active: true, fixed: true, items: review.riesgos },
    { id: 'proximos_pasos', type: 'proximos_pasos', title: 'Próximos pasos', active: true, fixed: true, nextStepsMode: 'roadmap', items: [] },
  ];
}

function chip(capacidadKey?: string) {
  const meta = CAPACITY_META[(capacidadKey as CapacityKey) ?? 'plan'] ?? CAPACITY_META.plan;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 11px', borderRadius: 10, background: 'transparent', color: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif', lineHeight: 1.2 }}>
      {meta.label}
    </span>
  );
}

function isImageUrl(url?: string): boolean {
  if (!url) return false;
  return /(?:png|jpg|jpeg|gif|webp)(?:\?|$)/i.test(url) || url.includes('images.unsplash.com');
}

function parseSupportUrls(url?: string): string[] {
  if (!url) return [];
  return url
    .split(/\r?\n|,|;/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeBlocks(blocks?: ReviewBloque[]): ReviewBloque[] {
  return (blocks ?? []).map((block, index) => ({
    id: block.id ?? `block_${index}`,
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

function groupBlocksByCapacity(blocks: ReviewBloque[]): Array<{ key: string; items: ReviewBloque[] }> {
  const groups = new Map<string, ReviewBloque[]>();
  const order: string[] = [];
  blocks.forEach(block => {
    const key = block.capacidadKey ?? 'plan';
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(block);
  });
  return order.map(key => ({ key, items: groups.get(key)! }));
}

function renderSectionBlocks(
  blocks: ReviewBloque[],
  type: ReviewStructuredSection['type'],
  onSupport: (url: string, title: string, caption: string) => void,
  onExpandIndicator: (block: ReviewBloque) => void,
) {
  if (!blocks.length) {
    return <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.32)', fontStyle: 'italic' }}>Sin contenido registrado.</p>;
  }

  if (type === 'indicadores') {
    const indicatorGroups = groupBlocksByCapacity(blocks);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginTop: 20 }}>
        {indicatorGroups.map((group) => (
          <div key={group.key} style={{ borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '6px solid #1E56A0', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 50, 160, 0.12)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}>
            <div style={{ marginBottom: 14, display: 'inline-block', background: '#E8D9C3', color: '#0A1650', padding: '0.35rem 0.8rem', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{chip(group.key)?.props.children}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.items.map((block, index) => {
                const caption = block.detalle ?? block.contexto ?? '';
                return (
                  <button key={block.id ?? `${group.key}_${index}`} type="button" onClick={() => onExpandIndicator(block)} style={{ padding: index > 0 ? '12px 0 0 0' : 0, borderTop: index > 0 ? '1px solid #F0F4F8' : 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: '#0A1650', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0A1650', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{block.titulo || 'Sin título'}</div>
                    {caption && <p style={{ fontSize: 11, color: '#666', lineHeight: 1.5, margin: '4px 0 0 0', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{caption}</p>}
                    <div style={{ marginTop: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0032A0', fontFamily: 'Manrope, sans-serif' }}>Ver detalle</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'resultados') {
    return (
      <div style={{ width: 'min(100%, 920px)', margin: '0 auto', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 760 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '132px minmax(150px, 1fr) minmax(150px, 1fr) minmax(220px, 1.45fr) 84px', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.56)', fontFamily: 'Manrope, sans-serif' }}>Capacidad</div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.56)', fontFamily: 'Manrope, sans-serif' }}>Entregable</div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.56)', fontFamily: 'Manrope, sans-serif' }}>Compromiso</div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.56)', fontFamily: 'Manrope, sans-serif' }}>Comentarios</div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.56)', fontFamily: 'Manrope, sans-serif' }}>Status</div>
            </div>
            <div>
              {blocks.map((block, index) => (
                <div key={block.id ?? `resultado_${index}`} style={{ display: 'grid', gridTemplateColumns: '132px minmax(150px, 1fr) minmax(150px, 1fr) minmax(220px, 1.45fr) 84px', gap: 12, padding: '14px 16px', borderTop: index > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none', alignItems: 'start' }}>
                  <div>{chip(block.capacidadKey)}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{block.entregable || block.titulo || 'Sin entregable'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.76)', lineHeight: 1.55, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{block.compromiso || block.detalle || 'Sin compromiso configurado.'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', lineHeight: 1.55, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{block.comentarios || block.descripcion || block.contexto || 'Sin comentarios configurados.'}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: block.status === 'listo' ? '#86EFAC' : '#FCD34D' }}>{block.status === 'listo' ? 'Listo' : 'Pendiente'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'riesgos') {
    return (
      <div style={{ width: 'min(100%, 940px)', margin: '0 auto', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 700 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '132px minmax(156px, 1fr) minmax(220px, 1.5fr) 74px', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.56)', fontFamily: 'Manrope, sans-serif' }}>Capacidad</div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.56)', fontFamily: 'Manrope, sans-serif' }}>Título</div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.56)', fontFamily: 'Manrope, sans-serif' }}>Detalle</div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.56)', fontFamily: 'Manrope, sans-serif' }}>Impacto</div>
            </div>
            <div>
              {blocks.map((block, index) => {
                const badge = block.impactLevel ?? (block.nivel === 'alto' ? 'high' : block.nivel === 'bajo' ? 'low' : 'mid');
                const caption = block.descripcion ?? block.contexto ?? '';
                return (
                  <div key={block.id ?? `riesgo_${index}`} style={{ display: 'grid', gridTemplateColumns: '132px minmax(156px, 1fr) minmax(220px, 1.5fr) 74px', gap: 12, padding: '14px 16px', borderTop: index > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none', alignItems: 'start' }}>
                    <div>{chip(block.capacidadKey)}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{block.titulo || 'Sin título'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', lineHeight: 1.55, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{caption || 'Sin detalle configurado.'}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: badge === 'high' ? '#FDA4AF' : badge === 'mid' ? '#FDBA74' : '#86EFAC' }}>{badge === 'high' ? 'ALTO' : badge === 'mid' ? 'MEDIO' : 'BAJO'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginTop: 20 }}>
      {blocks.map((block, index) => {
        const caption = (block.detalle ?? block.contexto);
        return (
          <div key={block.id ?? `${block.titulo}_${index}`} style={{ borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s ease', textAlign: 'center' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 50, 160, 0.15)'; e.currentTarget.style.borderColor = '#0032A0'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
            {block.url && isImageUrl(block.url) && <img src={block.url} alt={block.titulo} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />}
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0A1650', wordBreak: 'break-word', overflowWrap: 'anywhere', margin: 0 }}>{block.titulo || 'Sin título'}</h3>
              <p style={{ fontSize: 12, color: '#666', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'anywhere', margin: 0 }}>{caption || 'Sin detalle configurado.'}</p>
              {block.url && !isImageUrl(block.url) && (
                <button type="button" onClick={() => onSupport(block.url, block.titulo, caption ?? '')} style={{ display: 'block', padding: 0, border: 'none', background: 'transparent', color: '#0032A0', fontSize: 10, fontWeight: 700, textDecoration: 'underline', fontFamily: 'Manrope, sans-serif', cursor: 'pointer', textAlign: 'center', marginTop: 4 }}>Ver imagen</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ReviewPresentation({ review, data, onClose, isPreviewMode = false }: { review: Review; data: AppData; onClose: () => void; isPreviewMode?: boolean }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [supportViewer, setSupportViewer] = useState<{ url: string; titulo: string; caption: string } | null>(null);
  const [expandedIndicator, setExpandedIndicator] = useState<ReviewBloque | null>(null);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [showEmbedFallback, setShowEmbedFallback] = useState(false);
  const sections = useMemo(() => (review.secciones?.length ? review.secciones : createFallbackSections(review)).filter(section => section.active !== false), [review]);
  const roadmap = useMemo(() => buildRoadmap(data, review), [data, review]);
  const isEmbedded = review.fuente === 'embebida' && Boolean(review.embedUrl?.trim());
  const isRoadmapReview = review.fuente === 'roadmap';
  const embedConfig = useMemo(() => resolveReviewEmbed(review.embedUrl), [review.embedUrl]);
  const isGoogleSlidesEmbed = embedConfig.provider === 'google-slides';
  const progress = ((currentSlide + 1) / Math.max(sections.length + 1, 1)) * 100;
  const reviewDisplayName = getReviewDisplayName(review);
  const { portfolioName, teamName } = getPresentationIdentity(data.config.titulo);
  const modeLabel = getPresentationModeLabel(review);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setCurrentSlide(value => Math.min(sections.length, value + 1));
      if (event.key === 'ArrowLeft') setCurrentSlide(value => Math.max(0, value - 1));
      if (event.key === 'Escape') {
        if (expandedIndicator) setExpandedIndicator(null);
        else if (supportViewer) setSupportViewer(null);
        else onClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expandedIndicator, onClose, sections.length, supportViewer]);

  useEffect(() => {
    if (!isEmbedded) return;
    setEmbedLoaded(false);
    setShowEmbedFallback(!embedConfig.likelyEmbeddable);
  }, [embedConfig.iframeUrl, embedConfig.likelyEmbeddable, isEmbedded]);

  useEffect(() => {
    if (!isEmbedded || embedLoaded || showEmbedFallback || !embedConfig.likelyEmbeddable) return;
    const timer = window.setTimeout(() => setShowEmbedFallback(true), 8000);
    return () => window.clearTimeout(timer);
  }, [embedConfig.likelyEmbeddable, embedLoaded, isEmbedded, showEmbedFallback]);

  if (isRoadmapReview) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0A1650', zIndex: 340, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(191,219,254,0.82)', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
              {modeLabel}
            </div>
            <div style={{ fontSize: 28, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              <span style={{ fontWeight: 900 }}>{portfolioName}</span>
              {teamName && <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.82)' }}>{` - ${teamName}`}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              <span>Sprint {review.sprint || 'Sin dato'}</span>
              <span style={{ opacity: 0.35 }}>•</span>
              <span>{review.fecha || 'Sin fecha'}</span>
              <span style={{ opacity: 0.35 }}>•</span>
              <span>{review.q || 'Sin quarter'}</span>
              {isPreviewMode && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FCA5A5' }}>Previsualización</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {review.jiraPanelUrl && <a href={review.jiraPanelUrl} target="_blank" rel="noreferrer" style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: 'Manrope, sans-serif' }}>Panel Jira</a>}
            <button onClick={onClose} style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Salir</button>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '28px 32px', background: '#F1F5FF' }}>
          <div style={{ maxWidth: 1500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#FFF7ED', borderRadius: 18, padding: '16px 18px', border: '1px dashed #FDBA74' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A3412', fontFamily: 'Manrope, sans-serif', marginBottom: 6 }}>
                Recordar implementación de vista por capacidad
              </div>
              <div style={{ fontSize: 13, color: '#9A3412', lineHeight: 1.6 }}>
                Pendiente: agregar tarjetas clickeables por capacidad exclusivas de esta review, con título, descripción y URL opcional, mostradas entre MOS y roadmap.
              </div>
            </div>
            <div style={{ background: '#F8FAFF', borderRadius: 24, padding: 22, border: '1px solid rgba(191,219,254,0.5)' }}>
            <RoadmapInitiativasBlock roadmapData={roadmap} title="Roadmap" subtitle="Iniciativas y entregables del quarter" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEmbedded) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0A1650', zIndex: 340, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(191,219,254,0.82)', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
              {modeLabel}
            </div>
            <div style={{ fontSize: 28, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              <span style={{ fontWeight: 900 }}>{portfolioName}</span>
              {teamName && <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.82)' }}>{` - ${teamName}`}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              <span>Sprint {review.sprint || 'Sin dato'}</span>
              <span style={{ opacity: 0.35 }}>•</span>
              <span>{review.fecha || 'Sin fecha'}</span>
              <span style={{ opacity: 0.35 }}>•</span>
              <span>{review.q || 'Sin quarter'}</span>
              {isPreviewMode && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FCA5A5' }}>Previsualización</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {review.jiraPanelUrl && <a href={review.jiraPanelUrl} target="_blank" rel="noreferrer" style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: 'Manrope, sans-serif' }}>Panel Jira</a>}
            <a href={embedConfig.openUrl || review.embedUrl} target="_blank" rel="noreferrer" style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: 'Manrope, sans-serif' }}>Abrir en pestaña</a>
            <button onClick={onClose} style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Salir</button>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isGoogleSlidesEmbed ? 16 : 0, background: isGoogleSlidesEmbed ? '#08123D' : 'transparent' }}>
          <div style={isGoogleSlidesEmbed ? { position: 'relative', width: 'min(100%, calc((100dvh - 140px) * 16 / 9))', aspectRatio: '16 / 9', maxWidth: '100%', maxHeight: '100%', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 18px 48px rgba(0,0,0,0.22)' } : { position: 'absolute', inset: 0 }}>
            <iframe title={reviewDisplayName} src={embedConfig.iframeUrl || review.embedUrl} style={isGoogleSlidesEmbed ? { position: 'absolute', inset: 0, left: -1, width: 'calc(100% + 2px)', height: '100%', border: 'none', display: 'block', background: '#fff' } : { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: 'block', background: '#fff' }} referrerPolicy="strict-origin-when-cross-origin" onLoad={() => { setEmbedLoaded(true); setShowEmbedFallback(false); }} onError={() => setShowEmbedFallback(true)} />
          </div>
          {showEmbedFallback && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,80,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div style={{ maxWidth: 520, width: '100%', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 18, padding: 24, boxShadow: '0 16px 40px rgba(15,23,42,0.12)' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#9A3412', marginBottom: 8 }}>No se pudo mostrar esta URL dentro de la review</div>
                <div style={{ fontSize: 13, color: '#9A3412', lineHeight: 1.6, marginBottom: 18 }}>{embedConfig.guidance}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a href={embedConfig.openUrl || review.embedUrl} target="_blank" rel="noreferrer" style={{ padding: '10px 14px', borderRadius: 10, background: '#0A1650', border: '1px solid #0A1650', color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Abrir contenido</a>
                  {review.jiraPanelUrl && <a href={review.jiraPanelUrl} target="_blank" rel="noreferrer" style={{ padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1px solid #99F6E4', color: '#0F766E', fontSize: 12, fontWeight: 800, textDecoration: 'none', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Abrir panel Jira</a>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeSection = currentSlide === 0 ? null : sections[currentSlide - 1];

  const handleSlideClick = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('button, a, input, select, textarea')) return;
    setCurrentSlide(value => Math.min(sections.length, value + 1));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A1650', zIndex: 340, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, gap: 18 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(191,219,254,0.82)', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
            {modeLabel}
          </div>
          <div style={{ fontSize: 28, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            <span style={{ fontWeight: 900 }}>{portfolioName}</span>
            {teamName && <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.82)' }}>{` - ${teamName}`}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            <span>Sprint {review.sprint || 'Sin dato'}</span>
            <span style={{ opacity: 0.35 }}>•</span>
            <span>{review.fecha || 'Sin fecha'}</span>
            <span style={{ opacity: 0.35 }}>•</span>
            <span>{review.q || 'Sin quarter'}</span>
            {isPreviewMode && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FCA5A5' }}>Previsualización</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'Manrope, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSlide === 0 ? 'Tabla de contenidos' : activeSection?.title || 'Review'}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Manrope, sans-serif' }}>{currentSlide + 1} / {sections.length + 1}</span>
          {review.jiraPanelUrl && <a href={review.jiraPanelUrl} target="_blank" rel="noreferrer" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 14px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>Panel Jira</a>}
          <button onClick={() => setCurrentSlide(value => Math.max(0, value - 1))} disabled={currentSlide === 0} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 16, cursor: currentSlide === 0 ? 'not-allowed' : 'pointer', opacity: currentSlide === 0 ? 0.2 : 1 }}>‹</button>
          <button onClick={() => setCurrentSlide(value => Math.min(sections.length, value + 1))} disabled={currentSlide === sections.length} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 16, cursor: currentSlide === sections.length ? 'not-allowed' : 'pointer', opacity: currentSlide === sections.length ? 0.2 : 1 }}>›</button>
          <button onClick={onClose} style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 16px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 8, color: '#fff', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>Salir</button>
        </div>
      </div>

      <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#2BB8D4', transition: 'width 0.3s ease' }} />
      </div>

      <div onClick={handleSlideClick} style={{ flex: 1, overflowY: 'auto', padding: '48px 64px', cursor: 'default', background: '#FFFFFF' }}>
        {currentSlide === 0 ? (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1E56A0', marginBottom: 10, fontFamily: 'Manrope, sans-serif' }}>00 · Contenido</div>
            <div style={{ fontSize: 30, color: '#0A1650', letterSpacing: '-0.02em', marginBottom: 28, fontWeight: 800 }}>Tabla de contenidos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 620 }}>
              {sections.map((item, index) => (
                <button key={item.id} onClick={() => setCurrentSlide(index + 1)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 50, 160, 0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}>
                  <span style={{ fontSize: 12, color: '#0032A0', minWidth: 32, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>{String(index + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14, color: '#0A1650', fontWeight: 600 }}>{item.title}</span>
                </button>
              ))}
            </div>
          </>
        ) : activeSection ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1E56A0', marginBottom: 8, fontFamily: 'Manrope, sans-serif' }}>{String(currentSlide).padStart(2, '0')} · {activeSection.title}</div>
            <div style={{ fontSize: 32, color: '#0A1650', letterSpacing: '-0.02em', marginBottom: 12, fontWeight: 800 }}>{activeSection.title}</div>
            <p style={{ fontSize: 14, color: '#666', maxWidth: 900, lineHeight: 1.65, marginBottom: 28 }}>{activeSection.type === 'proximos_pasos' ? 'Cierre ejecutivo del sprint con próximos hitos y seguimiento.' : activeSection.type === 'demo' ? 'Vista de demos y apoyos visuales del sprint.' : activeSection.type === 'riesgos' ? 'Riesgos principales que condicionan el siguiente tramo del trabajo.' : 'Resumen ejecutivo del avance reportado por capacidad.'}</p>

            {activeSection.type === 'proximos_pasos' && activeSection.nextStepsMode === 'roadmap' ? (
              roadmap.length === 0 ? <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Sin iniciativas para este quarter.</p> : (
                <div style={{ background: '#F8FAFF', borderRadius: 20, padding: 22, border: '1px solid rgba(191,219,254,0.5)' }}>
                  <RoadmapInitiativasBlock roadmapData={roadmap} title="Roadmap" subtitle="Iniciativas y entregables del quarter" />
                </div>
              )
            ) : (
              renderSectionBlocks(normalizeBlocks(activeSection.items), activeSection.type, (url, title, caption) => setSupportViewer({ url, titulo: title, caption }), block => setExpandedIndicator(block))
            )}
          </>
        ) : null}
      </div>

      {expandedIndicator && (
        <div onClick={() => setExpandedIndicator(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(4,10,34,0.82)', backdropFilter: 'blur(6px)', zIndex: 345, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={event => event.stopPropagation()} style={{ width: 'min(820px, 92vw)', maxHeight: '88vh', overflowY: 'auto', borderRadius: 22, border: '1px solid rgba(255,255,255,0.12)', background: 'linear-gradient(180deg, rgba(14,23,67,0.98) 0%, rgba(10,22,80,0.98) 100%)', boxShadow: '0 28px 90px rgba(0,0,0,0.42)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>{chip(expandedIndicator.capacidadKey)}</div>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>{expandedIndicator.titulo || 'Sin título'}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 1.65, maxWidth: 680 }}>{expandedIndicator.detalle || expandedIndicator.contexto || 'Sin detalle configurado.'}</div>
              </div>
              <button type="button" onClick={() => setExpandedIndicator(null)} style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif', cursor: 'pointer', flexShrink: 0 }}>Cerrar</button>
            </div>
            {expandedIndicator.url ? (
              <div style={{ display: 'grid', gap: 14, maxHeight: '56vh', overflowY: 'auto', paddingRight: 4 }}>
                {parseSupportUrls(expandedIndicator.url).map((url, index) => (
                  isImageUrl(url) ? (
                    <img key={`${url}_${index}`} src={url} alt={`${expandedIndicator.titulo || 'Indicador'} ${index + 1}`} style={{ width: '100%', maxHeight: '52vh', objectFit: 'contain', display: 'block', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  ) : (
                    <div key={`${url}_${index}`} style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#fff', minHeight: 320 }}>
                      <iframe title={`${expandedIndicator.titulo || 'Indicador'} ${index + 1}`} src={url} style={{ width: '100%', height: '52vh', border: 'none', display: 'block' }} />
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div style={{ borderRadius: 18, border: '1px dashed rgba(255,255,255,0.16)', padding: '18px 20px', color: 'rgba(255,255,255,0.48)', fontSize: 13, fontStyle: 'italic' }}>Este indicador no tiene imagen o apoyo visual asociado.</div>
            )}
          </div>
        </div>
      )}

      {supportViewer && (
        <div onClick={() => setSupportViewer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, padding: 24 }}>
          <button onClick={() => setSupportViewer(null)} style={{ position: 'fixed', top: 18, right: 22, color: 'rgba(255,255,255,0.4)', fontSize: 30, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1 }}>×</button>
          <div onClick={event => event.stopPropagation()} style={{ width: '88vw', maxHeight: '76vh', overflowY: 'auto', display: 'grid', gap: 14 }}>
            {parseSupportUrls(supportViewer.url).map((url, index) => (
              isImageUrl(url) ? (
                <img key={`${url}_${index}`} src={url} alt={`${supportViewer.titulo} ${index + 1}`} style={{ maxWidth: '88vw', maxHeight: '76vh', borderRadius: 10, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', justifySelf: 'center' }} />
              ) : (
                <iframe key={`${url}_${index}`} title={`${supportViewer.titulo} ${index + 1}`} src={url} style={{ width: '88vw', height: '76vh', border: 'none', borderRadius: 12, background: '#fff' }} />
              )
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: 3 }}>{supportViewer.titulo}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>{supportViewer.caption}</span>
          </div>
        </div>
      )}
    </div>
  );
}