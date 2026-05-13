import { useMemo, useRef, useState } from 'react';
import type { AppData, Review } from '../../domain/types';
import { deleteReview, getReviews, saveMOS, saveReview } from '../../application/services/dataService';
import { getActiveMosByBetAndQuarter, getBetProducts, getMosQuarters } from '../../application/services/betMos';
import { getReviewDisplayName, getReviewSourceLabel, sortReviews } from '../../application/services/reviewUtils';
import { resolveReviewEmbed } from '../../application/services/reviewEmbed';
import ReviewPresentation from '../components/ReviewPresentation';
import ReviewMockupWorkspace, { type ReviewWorkspaceHandle } from '../components/ReviewMockupWorkspace';
import { createEmptyReview } from '../components/ReviewEditor';
import { useConfirm } from '../hooks/useConfirm';

export default function StudioReviews({ data }: { data: AppData }) {
  const [reviews, setReviews] = useState<Review[]>(() => sortReviews(getReviews()));
  const [mosList, setMosList] = useState<AppData['mos']>(() => [...data.mos].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)));
  const [selectedQuarter, setSelectedQuarter] = useState<string>(data.config.q_activo ?? 'Q2');
  const [page, setPage] = useState(1);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [editorReview, setEditorReview] = useState<Review | null>(null);
  const [presentation, setPresentation] = useState<{ review: Review; isPreview: boolean } | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [duplicatingReview, setDuplicatingReview] = useState<Review | null>(null);
  const [savingMosId, setSavingMosId] = useState<string | null>(null);
  const editorIsDirty = useRef(false);
  const workspaceRef = useRef<ReviewWorkspaceHandle>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const publishedCount = reviews.filter(review => review.estado === 'publicada' && review.activo !== false).length;
  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedReviews = reviews.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedReview = reviews.find(review => review.id === selectedReviewId) ?? null;
  const mosRows = useMemo(() => {
    return data.bets
      .filter(bet => bet.activo !== false)
      .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
      .map(bet => ({
        bet,
        activeMos: getActiveMosByBetAndQuarter(bet, mosList, selectedQuarter),
      }))
      .filter(item => item.activeMos.length > 0);
  }, [data.bets, mosList, selectedQuarter]);

  const openCreate = () => {
    const newReview = createEmptyReview(data.config.q_activo ?? 'Q2');
    setEditorReview(newReview);
    setSelectedQuarter(newReview.q ?? data.config.q_activo ?? 'Q2');
  };

  const openEdit = (review: Review) => {
    setEditorReview({
      ...review,
      contenido: { items: [...review.contenido.items] },
      secciones: review.secciones?.map(section => ({ ...section, items: section.items?.map(item => ({ ...item })) })),
      indicadores: review.indicadores.map(item => ({ ...item })),
      resultados: review.resultados.map(item => ({ ...item })),
      demo: [...review.demo],
      demoItems: review.demoItems?.map(item => ({ ...item })),
      riesgos: review.riesgos.map(item => ({ ...item })),
    });
    setSelectedQuarter(review.q ?? data.config.q_activo ?? 'Q2');
  };

  const saveFromStudio = (review: Review) => {
    const nextReview: Review = {
      ...review,
      estado: review.estado || 'borrador',
      activo: review.activo !== false,
      fecha: review.fecha || new Date().toISOString().slice(0, 10),
    };
    saveReview(nextReview);
    setReviews(prev => sortReviews(prev.some(item => item.id === nextReview.id) ? prev.map(item => item.id === nextReview.id ? nextReview : item) : [...prev, nextReview]));
    setEditorReview(null);
  };

  const publishReview = (review: Review) => {
    if (review.estado === 'publicada') return;
    const nextReview: Review = { ...review, estado: 'publicada', activo: true, fecha: review.fecha || new Date().toISOString().slice(0, 10) };
    saveReview(nextReview);
    setReviews(prev => sortReviews(prev.map(item => item.id === nextReview.id ? nextReview : item)));
    setSelectedReviewId(nextReview.id);
  };

  const removeReview = (review: Review) => {
    setDeletingReview(review);
  };

  const confirmDelete = () => {
    if (!deletingReview) return;
    const review = deletingReview;
    deleteReview(review.id);
    setReviews(prev => prev.filter(item => item.id !== review.id));
    setDeletingReview(null);
  };

  const duplicateReview = (review: Review) => {
    const duplicatedReview: Review = {
      ...review,
      id: `rev_${Date.now()}`,
      titulo: `${getReviewDisplayName(review)} (copia)`,
      estado: 'borrador',
      activo: true,
      contenido: { items: [...review.contenido.items] },
      secciones: review.secciones?.map(section => ({ ...section, items: section.items?.map(item => ({ ...item })) })),
      indicadores: review.indicadores.map(item => ({ ...item })),
      resultados: review.resultados.map(item => ({ ...item })),
      demo: [...review.demo],
      demoItems: review.demoItems?.map(item => ({ ...item })),
      riesgos: review.riesgos.map(item => ({ ...item })),
    };
    saveReview(duplicatedReview);
    setReviews(prev => sortReviews([duplicatedReview, ...prev]));
    setSelectedReviewId(duplicatedReview.id);
  };

  const confirmDuplicate = () => {
    if (!duplicatingReview) return;
    duplicateReview(duplicatingReview);
    setDuplicatingReview(null);
  };

  const toggleActivo = (review: Review) => {
    const nextReview: Review = { ...review, activo: !(review.activo !== false) };
    saveReview(nextReview);
    setReviews(prev => sortReviews(prev.map(item => item.id === nextReview.id ? nextReview : item)));
  };

  const updateMosActual = (mosId: string, value: string) => {
    setMosList(prev => prev.map(item => item.id === mosId ? { ...item, actual: value } : item));
  };

  const persistMos = (mosId: string) => {
    const mos = mosList.find(item => item.id === mosId);
    if (!mos) return;
    setSavingMosId(mosId);
    saveMOS(mos);
    setTimeout(() => {
      setSavingMosId(current => current === mosId ? null : current);
    }, 700);
  };

  const closeEditor = async () => {
    if (editorIsDirty.current) {
      const ok = await confirm('Hay cambios sin guardar. ¿Deseas cerrar sin guardar?', { title: 'Cerrar editor', confirmLabel: 'Sí, cerrar', danger: true });
      if (!ok) return;
    }
    editorIsDirty.current = false;
    setEditorReview(null);
  };

  return (
    <div className="page-shell reviews-page reviews-contenedor" style={{ minHeight: 'auto' }}>
      {editorReview ? (
        <>
          <div className="page-intro page-intro-row">
            <div>
              <h1 className="page-title">{editorReview.sprint?.trim() ? `Configuración de Review SP${editorReview.sprint.trim()}` : 'Configuración de la nueva review'}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-admin-alt" onClick={() => workspaceRef.current?.reset()}>Limpiar todo</button>
              <button className="btn-admin-alt" onClick={() => workspaceRef.current?.save()}>Guardar review</button>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0032A0', padding: '5px 12px', borderRadius: 999, background: '#DCE7FF', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.06em' }}>{selectedQuarter}</span>
              <button onClick={closeEditor} style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif', cursor: 'pointer' }}>Cerrar editor</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', border: '1px solid #DCE7FF', borderRadius: 16, boxShadow: '0 8px 18px rgba(15,23,42,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5EAF5', background: '#F8FAFF' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#0032A0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>MOS del Bet</div>
                <strong style={{ fontSize: 14, color: '#0F1C40' }}>Valores actuales — {selectedQuarter}</strong>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Actualiza el valor Real si cambió desde la última review. Los valores de esta tabla son los que aparecerán en la presentación. El quarter se rige por lo configurado en la review.</p>
              </div>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '32%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: '#EFF6FF' }}>
                      <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Manrope, sans-serif' }}>Bet / LVT</th>
                      <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Manrope, sans-serif' }}>MOS del Bet</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Manrope, sans-serif' }}>Base</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Manrope, sans-serif' }}>Meta</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Manrope, sans-serif' }}>Real</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Manrope, sans-serif' }}>Guardar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mosRows.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '16px 14px', textAlign: 'center', color: '#64748B', fontSize: 13, fontStyle: 'italic' }}>No hay MOS habilitadas para {selectedQuarter}.</td></tr>
                    ) : mosRows.map(({ bet, activeMos }, betIndex) => (
                      activeMos.map((mos, mosIndex) => (
                        <tr key={mos.id} style={{ borderTop: mosIndex === 0 && betIndex > 0 ? '1px solid #E5EAF5' : 'none', transition: 'background 0.12s' }} onMouseEnter={event => (event.currentTarget.style.background = '#F8FAFF')} onMouseLeave={event => (event.currentTarget.style.background = 'transparent')}>
                          {mosIndex === 0 && (
                            <td rowSpan={activeMos.length} style={{ padding: '10px 14px', verticalAlign: 'top', borderRight: '2px solid #F1F5F9' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: bet.color, flexShrink: 0, marginTop: 3 }} />
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0F1C40', lineHeight: 1.4, marginBottom: 4 }}>{bet.descripcion}</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {getBetProducts(bet).map(product => (
                                      <span key={`${bet.id}_${product}`} style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, color: '#fff', background: bet.color, padding: '2px 7px', borderRadius: 4, fontFamily: 'Manrope, sans-serif', letterSpacing: '0.06em' }}>{product}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}
                          <td style={{ padding: '2px 14px', verticalAlign: 'middle', maxWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, overflow: 'hidden', minHeight: 22 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: bet.color, flexShrink: 0, marginTop: 5 }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.25, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mos.descripcion}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                  {getMosQuarters(mos).map(quarter => (
                                    <span key={`${mos.id}_${quarter}`} style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, color: bet.color, background: `${bet.color}12`, padding: '2px 6px', borderRadius: 999 }}>{quarter}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '2px 10px', verticalAlign: 'middle', textAlign: 'center' }}><span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{mos.linea_base || '—'}</span></td>
                          <td style={{ padding: '2px 10px', verticalAlign: 'middle', textAlign: 'center' }}><span style={{ fontSize: 12, fontWeight: 700, color: bet.color }}>{mos.meta || '—'}</span></td>
                          <td style={{ padding: '2px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <input value={mos.actual ?? ''} onChange={event => updateMosActual(mos.id, event.target.value)} style={{ width: '100%', border: '1px solid #D8DEF0', borderRadius: 8, padding: '6px 8px', fontSize: 12, maxWidth: 110 }} placeholder="Ej: 64%" />
                          </td>
                          <td style={{ padding: '2px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <button onClick={() => persistMos(mos.id)} style={{ padding: '6px 9px', borderRadius: 8, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif', minWidth: 84 }}>{savingMosId === mos.id ? 'Guardado' : 'Guardar'}</button>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <ReviewMockupWorkspace
              ref={workspaceRef}
              initialReview={editorReview}
              onSave={saveFromStudio}
              onCancel={closeEditor}
              onPresent={(review) => setPresentation({ review, isPreview: true })}
              onDirtyChange={(dirty) => { editorIsDirty.current = dirty; }}
              saveLabel="Guardar review"
            />
          </div>
        </>
      ) : (
        <>
          <div className="page-intro page-intro-row">
        <div>
          <h1 className="page-title">Preparar Review</h1>
          <p className="page-subtitle">Espacio de preparación de reviews con edición de pantalla completa.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#6B7A9F' }}>{publishedCount} publicadas</span>
          <button className="f-add-btn" onClick={openCreate}>+ Preparar Review</button>
        </div>
      </div>

      <div className="page-body reviews-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--border)', background: '#FBFDFF', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            {selectedReview ? `Seleccionada: ${getReviewDisplayName(selectedReview)}` : 'Selecciona una review para gestionar acciones'}
          </span>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button className="btn-admin-alt" style={{ padding: '6px 9px', fontSize: 12, opacity: selectedReview ? 1 : 0.5, cursor: selectedReview ? 'pointer' : 'not-allowed' }} onClick={() => selectedReview && openEdit(selectedReview)} disabled={!selectedReview}>Editar</button>
            <button style={{ padding: '6px 9px', borderRadius: 8, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 700, cursor: selectedReview ? 'pointer' : 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: selectedReview ? 1 : 0.5 }} onClick={() => selectedReview && setPresentation({ review: selectedReview, isPreview: false })} disabled={!selectedReview}>Previsualizar</button>
            <button style={{ padding: '6px 9px', borderRadius: 8, border: '1px solid #BBF7D0', background: selectedReview?.estado === 'publicada' ? '#F1F5F9' : '#ECFDF5', color: selectedReview?.estado === 'publicada' ? '#64748B' : '#047857', fontSize: 12, fontWeight: 700, cursor: selectedReview && selectedReview.estado !== 'publicada' ? 'pointer' : 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: selectedReview ? 1 : 0.5 }} onClick={() => selectedReview && publishReview(selectedReview)} disabled={!selectedReview || selectedReview.estado === 'publicada'}>{selectedReview?.estado === 'publicada' ? 'Publicada' : 'Publicar'}</button>
            <button style={{ padding: '6px 9px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 700, cursor: selectedReview ? 'pointer' : 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: selectedReview ? 1 : 0.5 }} onClick={() => selectedReview && setDuplicatingReview(selectedReview)} disabled={!selectedReview}>Duplicar</button>
            <button style={{ padding: '6px 9px', borderRadius: 8, border: '1px solid #CBD5E1', background: selectedReview && selectedReview.activo !== false ? '#FFF7ED' : '#ECFDF5', color: selectedReview && selectedReview.activo !== false ? '#C2410C' : '#047857', fontSize: 12, fontWeight: 700, cursor: selectedReview ? 'pointer' : 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: selectedReview ? 1 : 0.5 }} onClick={() => selectedReview && toggleActivo(selectedReview)} disabled={!selectedReview}>{selectedReview && selectedReview.activo !== false ? 'Desactivar' : 'Activar'}</button>
            <button style={{ padding: '6px 9px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: selectedReview ? 'pointer' : 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: selectedReview ? 1 : 0.5 }} onClick={() => selectedReview && removeReview(selectedReview)} disabled={!selectedReview}>Eliminar</button>
            {(() => { const url = selectedReview?.embedUrl?.trim(); const isGoogle = url ? resolveReviewEmbed(url).provider === 'google-slides' : false; return url && !isGoogle ? <a href={url} target="_blank" rel="noreferrer" style={{ padding: '6px 9px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: 12, fontWeight: 700, fontFamily: 'Manrope, sans-serif', textDecoration: 'none' }}>↗ Ver</a> : null; })()}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ background: 'var(--light)' }}>
                <th style={{ textAlign: 'center', padding: '10px 10px', width: 52, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Sel.</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Título</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Visible</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Q</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Sprint</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Fuente</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>URL</th>
              </tr>
            </thead>
            <tbody>
              {pagedReviews.map(review => {
                const active = review.activo !== false;
                const selected = selectedReviewId === review.id;
                return (
                  <tr key={review.id} onClick={() => setSelectedReviewId(review.id)} style={{ background: selected ? '#EEF4FF' : 'transparent', cursor: 'pointer' }}>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                      <input
                        type="radio"
                        name="selected-studio-review"
                        checked={selected}
                        onChange={() => setSelectedReviewId(review.id)}
                        onClick={event => event.stopPropagation()}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: '#0F1C40' }}>{getReviewDisplayName(review)}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 999, background: review.estado === 'publicada' ? '#D1FAE5' : '#FEF3C7', color: review.estado === 'publicada' ? '#065F46' : '#92400E' }}>
                        {review.estado === 'publicada' ? 'Publicada' : 'Borrador'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: '#334155' }}>{active ? 'Sí' : 'No'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: '#334155' }}>{review.q}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: '#334155' }}>{review.sprint || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: '#334155' }}>{review.fecha || 'Sin fecha'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: '#334155' }}>{getReviewSourceLabel(review)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                      {(() => { const url = review.embedUrl?.trim(); const isGoogle = url ? resolveReviewEmbed(url).provider === 'google-slides' : false; return url && !isGoogle ? <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600, textDecoration: 'none' }}>↗ Ver</a> : <span style={{ color: '#CBD5E1' }}>—</span>; })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '16px 14px 12px', borderTop: '1px solid var(--border)', background: '#FBFDFF', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            Página {safePage} de {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn-pag"
              onClick={() => setPage(value => Math.max(1, value - 1))}
              disabled={safePage === 1}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn-pag"
              onClick={() => setPage(value => Math.min(totalPages, value + 1))}
              disabled={safePage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
          </div>
        </>
      )}

      {presentation && <ReviewPresentation review={presentation.review} data={data} isPreviewMode={presentation.isPreview} onClose={() => setPresentation(null)} />}

      {confirmDialog}

      {deletingReview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 360, background: 'rgba(8,15,35,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: 'min(520px, 100%)', background: '#fff', borderRadius: 16, border: '1px solid #DCE7FF', boxShadow: '0 20px 50px rgba(15,23,42,0.2)', padding: 18 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F1C40', marginBottom: 8 }}>Eliminar review</h3>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
              ¿Seguro que deseas eliminar la review "{getReviewDisplayName(deletingReview)}"?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-admin-alt" onClick={() => setDeletingReview(null)}>Cancelar</button>
              <button onClick={confirmDelete} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {duplicatingReview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 360, background: 'rgba(8,15,35,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: 'min(560px, 100%)', background: '#fff', borderRadius: 16, border: '1px solid #DCE7FF', boxShadow: '0 20px 50px rgba(15,23,42,0.2)', padding: 18 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F1C40', marginBottom: 8 }}>Duplicar review</h3>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
              Se duplicará la review con todos los datos iguales. ¿Deseas continuar?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-admin-alt" onClick={() => setDuplicatingReview(null)}>Cancelar</button>
              <button onClick={confirmDuplicate} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Aceptar y duplicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}