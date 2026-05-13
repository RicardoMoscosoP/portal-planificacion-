import { useState } from 'react';
import type { Review, ReviewBloque, ReviewContenidoItem } from '../../domain/types';
import { DEFAULT_REVIEW_INDEX_ITEMS } from '../../domain/types';
import { resolveReviewEmbed } from '../../application/services/reviewEmbed';

type Tab = 'contenido' | 'indicadores' | 'resultados' | 'demo' | 'riesgos' | 'roadmap';

function parseEditableSupportUrls(url?: string): string[] {
  if (!url) return [];
  const normalized = url.replace(/[;,]/g, '\n');
  const parts = normalized.split(/\r?\n/).map(item => item.trim());
  return parts.length === 1 && parts[0] === '' ? [] : parts;
}

function serializeSupportUrls(urls: string[]): string {
  return urls.map(item => item.trim()).join('\n');
}

function BlockFields({ blocks, onChange }: { blocks: ReviewBloque[]; onChange: (b: ReviewBloque[]) => void }) {
  return (
    <div className="f-blocks">
      {blocks.length === 0 && <div className="f-empty">Sin bloques agregados</div>}
      {blocks.map((b, i) => (
        <div key={i} className="f-block">
          <div className="f-block-fields">
            <div>
              <span className="fml">Título</span>
              <input className="fmi" placeholder="Título" value={b.titulo}
                onChange={e => { const nb = [...blocks]; nb[i] = { ...nb[i], titulo: e.target.value }; onChange(nb); }} />
            </div>
            <div>
              <span className="fml">Contexto</span>
              <input className="fmi" placeholder="Descripción breve" value={b.contexto}
                onChange={e => { const nb = [...blocks]; nb[i] = { ...nb[i], contexto: e.target.value }; onChange(nb); }} />
            </div>
            <div className="full">
              <span className="fml">URL imagen <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(opcional)</span></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(parseEditableSupportUrls(b.url).length ? parseEditableSupportUrls(b.url) : ['']).map((url, urlIndex, urls) => (
                  <div key={`legacy_support_${i}_${urlIndex}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input className="fmi" placeholder={`URL ${urlIndex + 1}`} value={url}
                      onChange={e => {
                        const nextUrls = [...urls];
                        nextUrls[urlIndex] = e.target.value;
                        const nb = [...blocks];
                        nb[i] = { ...nb[i], url: serializeSupportUrls(nextUrls) };
                        onChange(nb);
                      }} />
                    {urls.length > 1 && (
                      <button className="f-rm-btn" type="button" onClick={() => {
                        const nextUrls = urls.filter((_, index) => index !== urlIndex);
                        const nb = [...blocks];
                        nb[i] = { ...nb[i], url: serializeSupportUrls(nextUrls) };
                        onChange(nb);
                      }}>Quitar</button>
                    )}
                  </div>
                ))}
                <button className="f-add-btn" type="button" onClick={() => {
                  const nextUrls = [...(parseEditableSupportUrls(b.url).length ? parseEditableSupportUrls(b.url) : ['']), ''];
                  const nb = [...blocks];
                  nb[i] = { ...nb[i], url: serializeSupportUrls(nextUrls) };
                  onChange(nb);
                }}>+ Agregar URL</button>
              </div>
            </div>
          </div>
          <div className="f-thumb-row">
            {b.url && <img className="f-thumb" src={b.url} alt="" />}
            <button className="f-rm-btn" onClick={() => onChange(blocks.filter((_, j) => j !== i))}>&#215; Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function RiskFields({ risks, onChange }: { risks: ReviewBloque[]; onChange: (b: ReviewBloque[]) => void }) {
  return (
    <div className="f-blocks">
      {risks.length === 0 && <div className="f-empty">Sin riesgos agregados</div>}
      {risks.map((r, i) => (
        <div key={i} className="f-block">
          <div className="f-block-fields">
            <div>
              <span className="fml">Título</span>
              <input className="fmi" placeholder="Nombre del riesgo" value={r.titulo}
                onChange={e => { const nb = [...risks]; nb[i] = { ...nb[i], titulo: e.target.value }; onChange(nb); }} />
            </div>
            <div>
              <span className="fml">Nivel</span>
              <div className="nivel-row">
                {(['bajo', 'medio', 'alto'] as const).map(n => (
                  <button key={n} className={`nivel-btn ${n}${r.nivel === n ? ' active' : ''}`}
                    onClick={() => { const nb = [...risks]; nb[i] = { ...nb[i], nivel: n }; onChange(nb); }}>
                    {n.charAt(0).toUpperCase() + n.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="full">
              <span className="fml">Contexto</span>
              <input className="fmi" placeholder="Descripción del riesgo" value={r.contexto}
                onChange={e => { const nb = [...risks]; nb[i] = { ...nb[i], contexto: e.target.value }; onChange(nb); }} />
            </div>
            <div className="full">
              <span className="fml">URL imagen <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(opcional)</span></span>
              <input className="fmi" placeholder="https://drive.google.com/..." value={r.url}
                onChange={e => { const nb = [...risks]; nb[i] = { ...nb[i], url: e.target.value }; onChange(nb); }} />
            </div>
          </div>
          <div className="f-thumb-row">
            {r.url && <img className="f-thumb" src={r.url} alt="" />}
            <button className="f-rm-btn" onClick={() => onChange(risks.filter((_, j) => j !== i))}>&#215; Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultFields({ results, onChange }: { results: ReviewBloque[]; onChange: (b: ReviewBloque[]) => void }) {
  return (
    <div className="f-blocks">
      {results.length === 0 && <div className="f-empty">Sin resultados agregados</div>}
      {results.map((result, i) => (
        <div key={i} className="f-block">
          <div className="f-block-fields">
            <div>
              <span className="fml">Capacidad</span>
              <input className="fmi" placeholder="Capacidad" value={result.capacidadKey ?? ''}
                onChange={e => { const nb = [...results]; nb[i] = { ...nb[i], capacidadKey: e.target.value }; onChange(nb); }} />
            </div>
            <div>
              <span className="fml">Entregable</span>
              <input className="fmi" placeholder="Entregable" value={result.entregable ?? result.titulo ?? ''}
                onChange={e => { const nb = [...results]; nb[i] = { ...nb[i], entregable: e.target.value, titulo: e.target.value }; onChange(nb); }} />
            </div>
            <div>
              <span className="fml">Compromiso</span>
              <input className="fmi" placeholder="Compromiso" value={result.compromiso ?? result.detalle ?? ''}
                onChange={e => { const nb = [...results]; nb[i] = { ...nb[i], compromiso: e.target.value, detalle: e.target.value }; onChange(nb); }} />
            </div>
            <div>
              <span className="fml">Status</span>
              <select className="fmi" value={result.status ?? 'pendiente'}
                onChange={e => { const nb = [...results]; nb[i] = { ...nb[i], status: e.target.value as 'listo' | 'pendiente' }; onChange(nb); }}>
                <option value="listo">Listo</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
            <div className="full">
              <span className="fml">Comentarios</span>
              <input className="fmi" placeholder="Comentarios" value={result.comentarios ?? result.descripcion ?? result.contexto ?? ''}
                onChange={e => { const nb = [...results]; nb[i] = { ...nb[i], comentarios: e.target.value, descripcion: e.target.value, contexto: e.target.value }; onChange(nb); }} />
            </div>
          </div>
          <div className="f-thumb-row">
            <button className="f-rm-btn" onClick={() => onChange(results.filter((_, j) => j !== i))}>&#215; Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function createEmptyReview(defaultQ = 'Q2'): Review {
  return {
    id: `rev_${Date.now()}`,
    titulo: '',
    sprint: '',
    fecha: '',
    q: defaultQ,
    estado: 'borrador',
    activo: true,
    fuente: 'interna',
    embedUrl: '',
    jiraPanelUrl: '',
    contenido: { items: DEFAULT_REVIEW_INDEX_ITEMS.map(item => ({ ...item })) },
    indicadores: [],
    resultados: [],
    demo: [],
    riesgos: [],
  };
}

interface Props {
  initialReview: Review;
  onSave: (review: Review) => void;
  onPresent?: (review: Review) => void;
  onCancel?: () => void;
  saveLabel?: string;
}

export default function ReviewEditor({ initialReview, onSave, onPresent, onCancel, saveLabel = 'Guardar review' }: Props) {
  const [review, setReview] = useState<Review>({
    ...initialReview,
    titulo: initialReview.titulo ?? (initialReview.sprint ? `Review SP${initialReview.sprint}` : ''),
    sprint: initialReview.sprint ?? '',
    fecha: initialReview.fecha ?? '',
    q: initialReview.q ?? 'Q2',
    estado: initialReview.estado ?? 'borrador',
    activo: initialReview.activo ?? true,
    fuente: initialReview.fuente ?? 'interna',
    embedUrl: initialReview.embedUrl ?? '',
    jiraPanelUrl: initialReview.jiraPanelUrl ?? '',
    contenido: initialReview.contenido ?? { items: DEFAULT_REVIEW_INDEX_ITEMS.map(item => ({ ...item })) },
    indicadores: initialReview.indicadores ?? [],
    resultados: initialReview.resultados ?? [],
    demo: initialReview.demo ?? [],
    riesgos: initialReview.riesgos ?? [],
  });
  const [activeTab, setActiveTab] = useState<Tab>('contenido');
  const embedConfig = resolveReviewEmbed(review.embedUrl);
  const baseValidationMessage = !review.sprint?.trim()
      ? 'Completa el sprint antes de guardar la review.'
      : !review.fecha?.trim()
        ? 'Completa la fecha antes de guardar la review.'
        : review.fuente === 'embebida' && !review.embedUrl?.trim()
          ? 'Debes ingresar una URL cuando la fuente es embebida.'
          : null;

  const addBloque = (setter: (value: ReviewBloque[]) => void, prev: ReviewBloque[]) =>
    setter([...prev, { titulo: '', contexto: '', url: '' }]);

  const updateContenidoItems = (items: ReviewContenidoItem[]) => {
    setReview(prev => ({ ...prev, contenido: { items } }));
  };

  const moveIndexItem = (index: number, direction: 'up' | 'down') => {
    setReview(prev => {
      const items = [...prev.contenido.items];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= items.length) return prev;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...prev, contenido: { items } };
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'contenido', label: 'Contenido' },
    { id: 'indicadores', label: 'Indicadores' },
    { id: 'resultados', label: 'Resultados' },
    { id: 'demo', label: 'Demo' },
    { id: 'riesgos', label: 'Riesgos' },
    { id: 'roadmap', label: 'Roadmap' },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 0.85fr 0.8fr 0.9fr', gap: 12, marginBottom: 20 }}>
        <div>
          <div className="flbl">Sprint</div>
          <input className="fmi" type="number" placeholder="65" value={review.sprint}
            onChange={e => setReview(prev => ({ ...prev, sprint: e.target.value, titulo: e.target.value.trim() ? `Review SP${e.target.value.trim()}` : '' }))} style={{ padding: '9px 12px', fontSize: 14, fontWeight: 600 }} />
        </div>
        <div>
          <div className="flbl">Fecha</div>
          <input className="fmi" type="date" value={review.fecha}
            onChange={e => setReview(prev => ({ ...prev, fecha: e.target.value }))} style={{ padding: '9px 12px' }} />
        </div>
        <div>
          <div className="flbl">Quarter heredado</div>
          <input className="fmi" value={review.q} readOnly style={{ padding: '9px 12px', background: '#F8FAFF', color: '#475569', fontWeight: 700 }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
          <input type="checkbox" checked={review.activo ?? true} onChange={e => setReview(prev => ({ ...prev, activo: e.target.checked }))} />
          Visible en el menú lateral de Reviews
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div className="flbl">Tipo de review</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <button
            type="button"
            onClick={() => setReview(prev => ({ ...prev, fuente: 'roadmap' }))}
            style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${review.fuente === 'roadmap' ? '#BFDBFE' : 'var(--border)'}`, background: review.fuente === 'roadmap' ? '#EFF6FF' : '#fff', color: review.fuente === 'roadmap' ? '#1D4ED8' : '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
          >
            Utilizar roadmap general para review
          </button>
          <button
            type="button"
            onClick={() => setReview(prev => ({ ...prev, fuente: 'interna' }))}
            style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${review.fuente === 'interna' ? '#BFDBFE' : 'var(--border)'}`, background: review.fuente === 'interna' ? '#EFF6FF' : '#fff', color: review.fuente === 'interna' ? '#1D4ED8' : '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
          >
            Review interna
          </button>
          <button
            type="button"
            onClick={() => setReview(prev => ({ ...prev, fuente: 'embebida' }))}
            style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${review.fuente === 'embebida' ? '#BFDBFE' : 'var(--border)'}`, background: review.fuente === 'embebida' ? '#EFF6FF' : '#fff', color: review.fuente === 'embebida' ? '#1D4ED8' : '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
          >
            URL review (embebida)
          </button>
        </div>
        {review.fuente === 'embebida' && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="fmi"
              placeholder="https://..."
              value={review.embedUrl ?? ''}
              onChange={e => setReview(prev => ({ ...prev, embedUrl: e.target.value }))}
              style={{ flex: 1, padding: '9px 12px' }}
            />
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
          {review.fuente === 'roadmap'
            ? 'La review abrirá directamente el roadmap general y los Measure of Success del quarter seleccionado.'
            : review.fuente === 'interna'
              ? 'El contenido se ejecutará desde la estructura interna configurada en esta review.'
              : 'La review se ejecutará desde una URL externa embebida.'}
        </p>
        {review.fuente === 'embebida' && (
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            Si eliges contenido embebido, al ejecutar la review se abrirá esta URL en lugar de usar la presentación interna. En Google Slides puede ser enlace de edición, compartir o publicar.
          </p>
        )}
      </div>

      {review.fuente === 'embebida' && Boolean(review.embedUrl?.trim()) && (
        <div style={{ background: embedConfig.likelyEmbeddable ? '#EFF6FF' : '#FFF7ED', border: `1px solid ${embedConfig.likelyEmbeddable ? '#BFDBFE' : '#FED7AA'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 12, lineHeight: 1.6, color: embedConfig.likelyEmbeddable ? '#1D4ED8' : '#C2410C' }}>
          <strong style={{ fontWeight: 800 }}>{embedConfig.providerLabel}.</strong> {embedConfig.guidance}
        </div>
      )}

      {baseValidationMessage && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 12, lineHeight: 1.6, color: '#C2410C' }}>
          <strong style={{ fontWeight: 800 }}>Datos base incompletos.</strong> {baseValidationMessage}
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <div className="flbl">Panel Jira o tablero asociado <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(opcional)</span></div>
        <input
          className="fmi"
          placeholder="https://blueexpress.atlassian.net/..."
          value={review.jiraPanelUrl ?? ''}
          onChange={e => setReview(prev => ({ ...prev, jiraPanelUrl: e.target.value }))}
          style={{ padding: '9px 12px' }}
        />
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
          Este enlace se mostrará como acceso secundario en la lista pública y dentro del modo presentación para complementar la ejecución de la review.
        </p>
      </div>

      {review.fuente === 'interna' ? (
      <div className="form-card">
        <div className="form-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`ftab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="form-body">
          <div className={`fpanel${activeTab === 'contenido' ? ' active' : ''}`}>
            <div className="flbl">Índice de la Review</div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, fontStyle: 'italic' }}>
              La agenda base viene propuesta. Puedes renombrar los bloques fijos, moverlos y agregar ítems adicionales. Los bloques fijos no se eliminan para no romper la presentación.
            </p>
            <div className="idx-list">
              {review.contenido.items.map((item, i) => (
                <div key={item.id} className="idx-item" style={{ paddingRight: 8 }}>
                  <div className="idx-dot" />
                  <input
                    type="text"
                    placeholder="Ej: Próximos pasos"
                    value={item.titulo}
                    onChange={e => {
                      const items = [...review.contenido.items];
                      items[i] = { ...items[i], titulo: e.target.value };
                      updateContenidoItems(items);
                    }}
                    style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', fontFamily: 'Manrope, sans-serif', fontSize: 13, color: 'var(--text)', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button type="button" onClick={() => moveIndexItem(i, 'up')} disabled={i === 0} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', color: i === 0 ? '#94A3B8' : '#334155', cursor: i === 0 ? 'not-allowed' : 'pointer', fontSize: 12 }}>↑</button>
                    <button type="button" onClick={() => moveIndexItem(i, 'down')} disabled={i === review.contenido.items.length - 1} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', color: i === review.contenido.items.length - 1 ? '#94A3B8' : '#334155', cursor: i === review.contenido.items.length - 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>↓</button>
                    <button style={{ color: item.sectionKey ? '#CBD5E1' : 'var(--red)', background: 'none', border: 'none', fontSize: 16, cursor: item.sectionKey ? 'not-allowed' : 'pointer' }} disabled={Boolean(item.sectionKey)}
                      onClick={() => updateContenidoItems(review.contenido.items.filter((_, j) => j !== i))}>&#215;</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="f-add-btn" style={{ width: '100%', marginTop: 4 }}
              onClick={() => updateContenidoItems([...review.contenido.items, { id: `custom_${Date.now()}`, titulo: 'Nuevo ítem' }])}>
              + Agregar ítem al índice
            </button>
          </div>

          <div className={`fpanel${activeTab === 'indicadores' ? ' active' : ''}`}>
            <div className="f-sec-hdr">
              <span className="f-sec-ttl">Páginas de indicadores <span className="f-opt">· imagen opcional</span></span>
              <button className="f-add-btn" onClick={() => addBloque(value => setReview(prev => ({ ...prev, indicadores: value })), review.indicadores)}>+ Agregar</button>
            </div>
            <BlockFields blocks={review.indicadores} onChange={value => setReview(prev => ({ ...prev, indicadores: value }))} />
          </div>

          <div className={`fpanel${activeTab === 'resultados' ? ' active' : ''}`}>
            <div className="f-sec-hdr">
              <span className="f-sec-ttl">Resultados del Sprint</span>
              <button className="f-add-btn" onClick={() => setReview(prev => ({ ...prev, resultados: [...prev.resultados, { titulo: '', contexto: '', url: '', entregable: '', compromiso: '', comentarios: '', status: 'pendiente' }] }))}>+ Agregar</button>
            </div>
            <ResultFields results={review.resultados} onChange={value => setReview(prev => ({ ...prev, resultados: value }))} />
          </div>

          <div className={`fpanel${activeTab === 'demo' ? ' active' : ''}`}>
            <div className="flbl">Demos a presentar</div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, fontStyle: 'italic' }}>
              Agrega un título por cada demo.
            </p>
            <div className="demo-list">
              {review.demo.map((d, i) => (
                <div key={i} className="demo-item">
                  <input type="text" placeholder="Título de la demo" value={d}
                    onChange={e => {
                      const demo = [...review.demo];
                      demo[i] = e.target.value;
                      setReview(prev => ({ ...prev, demo }));
                    }} />
                  <button className="rm-demo" onClick={() => setReview(prev => ({ ...prev, demo: prev.demo.filter((_, j) => j !== i) }))}>&#215;</button>
                </div>
              ))}
            </div>
            <button className="add-demo-btn" onClick={() => setReview(prev => ({ ...prev, demo: [...prev.demo, ''] }))}>
              + Agregar demo
            </button>
          </div>

          <div className={`fpanel${activeTab === 'riesgos' ? ' active' : ''}`}>
            <div className="f-sec-hdr">
              <span className="f-sec-ttl">Riesgos identificados <span className="f-opt">· imagen opcional</span></span>
              <button className="f-add-btn" onClick={() => setReview(prev => ({ ...prev, riesgos: [...prev.riesgos, { titulo: '', contexto: '', url: '', nivel: 'medio' }] }))}>
                + Agregar riesgo
              </button>
            </div>
            <RiskFields risks={review.riesgos} onChange={value => setReview(prev => ({ ...prev, riesgos: value }))} />
          </div>

          <div className={`fpanel${activeTab === 'roadmap' ? ' active' : ''}`}>
            <div style={{ background: 'var(--light)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, fontSize: 13, color: 'var(--blue)', fontWeight: 500 }}>
              El Roadmap se carga automáticamente desde los datos de Iniciativas. Se mostrará el estado actual al momento de la Review.
            </div>
          </div>
        </div>

        <div className="form-footer">
          <span className="form-footer-hint">Los cambios no se guardan automáticamente</span>
          <div style={{ display: 'flex', gap: 10 }}>
            {onPresent && (
              <button type="button" className="btn-admin-alt" onClick={() => onPresent(review)}>Presentar</button>
            )}
            {onCancel && (
              <button type="button" className="btn-admin-alt" onClick={onCancel}>Cancelar</button>
            )}
            <button className="btn-save" onClick={() => onSave(review)}>{saveLabel}</button>
          </div>
        </div>
      </div>
      ) : (
      <div className="form-card">
        <div className="form-body">
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 14, fontSize: 13, color: '#1D4ED8', lineHeight: 1.6 }}>
            {review.fuente === 'roadmap'
              ? 'Esta review ejecutará directamente el roadmap general y los Measure of Success. El contenido interno no aplica para esta modalidad.'
              : 'Esta review ejecutará una URL externa embebida. El contenido interno queda fuera de la reproducción principal.'}
          </div>
        </div>
        <div className="form-footer">
          <span className="form-footer-hint">Los cambios no se guardan automáticamente</span>
          <div style={{ display: 'flex', gap: 10 }}>
            {onPresent && (
              <button type="button" className="btn-admin-alt" onClick={() => { if (!baseValidationMessage) onPresent(review); }}>Presentar</button>
            )}
            {onCancel && (
              <button type="button" className="btn-admin-alt" onClick={onCancel}>Cancelar</button>
            )}
            <button className="btn-save" onClick={() => onSave(review)}>{saveLabel}</button>
          </div>
        </div>
      </div>
      )}
    </>
  );
}