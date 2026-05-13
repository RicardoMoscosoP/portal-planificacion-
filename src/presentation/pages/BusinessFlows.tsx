import { useMemo, useState } from 'react';
import type { AppData, BusinessFlow } from '../../domain/types';
import { BX_MODAL_OVERLAY_STYLE } from '../components/modalStyles';

interface Props {
  data: AppData;
}

function splitContent(content: string): string[] {
  return content
    .split(/\n\s*\n/g)
    .map(block => block.trim())
    .filter(Boolean);
}

function EmbedModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [fullscreen, setFullscreen] = useState(false);
  return (
    <div onClick={onClose} style={{ ...BX_MODAL_OVERLAY_STYLE, alignItems: fullscreen ? 'stretch' : 'flex-start', paddingTop: fullscreen ? 0 : 32, padding: fullscreen ? 0 : undefined }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: fullscreen ? 0 : 18,
          overflow: 'hidden',
          width: fullscreen ? '100vw' : 'min(1100px, 100%)',
          height: fullscreen ? '100vh' : '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: fullscreen ? 'none' : '0 24px 64px rgba(15,23,42,0.22)',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Presentación
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#0032A0', padding: '4px 10px', borderRadius: 7, border: '1px solid #C3D5FF', background: '#EEF2FF', textDecoration: 'none', fontFamily: 'Manrope, sans-serif' }}>
              Abrir en nueva pestaña
            </a>
            <button
              type="button"
              onClick={() => setFullscreen(f => !f)}
              title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              style={{ border: '1px solid #E2E8F0', background: '#F1F5F9', color: '#475569', fontSize: 14, cursor: 'pointer', borderRadius: 7, padding: '4px 9px', lineHeight: 1, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}
            >
              {fullscreen ? '⊡ Normal' : '⛶ Pantalla completa'}
            </button>
            <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        </div>
        <iframe src={url} style={{ flex: 1, border: 'none', width: '100%' }} allowFullScreen title="Presentación" />
      </div>
    </div>
  );
}

function FlowCard({ flow }: { flow: BusinessFlow }) {
  const [open, setOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const blocks = splitContent(flow.contenido);
  const color = flow.color ?? '#1B30CC';

  return (
    <>
      <div style={{ background: '#fff', border: `1px solid ${open ? color + '55' : 'var(--border)'}`, borderRadius: 16, overflow: 'hidden', boxShadow: open ? `0 8px 24px ${color}14` : '0 2px 8px rgba(15,23,42,0.04)', transition: 'all 0.2s' }}>
        {/* Header – siempre visible */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', background: open ? `${color}08` : '#fff', border: 'none', borderLeft: `4px solid ${open ? color : 'transparent'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
        >
          <div style={{ width: 46, height: 46, borderRadius: 14, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {flow.icono ?? '🧭'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color, marginBottom: 3 }}>Flujo</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F1C40', lineHeight: 1.2, marginBottom: open ? 0 : 4 }}>{flow.titulo}</div>
            {!open && (
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 }}>
                {flow.descripcionTarjeta}
              </div>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#94A3B8', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
        </button>

        {/* Cuerpo expandible */}
        {open && (
          <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${color}20` }}>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, margin: '16px 0 14px' }}>{flow.descripcionTarjeta}</p>

            {blocks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {blocks.map((block, i) => (
                  <div key={i} style={{ fontSize: 13, lineHeight: 1.75, color: '#334155', padding: '12px 14px', background: '#F8FAFC', borderRadius: 10, borderLeft: `3px solid ${color}50` }}>
                    {block}
                  </div>
                ))}
              </div>
            )}

            {!blocks.length && !flow.confluenceUrl && !flow.presentacionUrl && (
              <div style={{ padding: '14px 16px', borderRadius: 12, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', fontSize: 13, marginBottom: 14 }}>
                Este flujo no tiene contenido detallado todavía. Puedes agregarlo desde Configuración.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              {flow.confluenceUrl && (
                <a href={flow.confluenceUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: '#EEF2FF', color: '#1D4ED8', fontSize: 12, fontWeight: 800, textDecoration: 'none', fontFamily: 'Manrope, sans-serif', border: '1px solid #C7D7FE' }}>
                  📄 Abrir en Confluence
                </a>
              )}
              {flow.presentacionUrl && (
                <button type="button" onClick={() => setEmbedUrl(flow.presentacionUrl!)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: `${color}12`, color, fontSize: 12, fontWeight: 800, fontFamily: 'Manrope, sans-serif', border: `1px solid ${color}35`, cursor: 'pointer' }}>
                  🎞 Ver presentación
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {embedUrl && <EmbedModal url={embedUrl} onClose={() => setEmbedUrl(null)} />}
    </>
  );
}

export default function BusinessFlows({ data }: Props) {
  const flows = useMemo(
    () => [...(data.businessFlows ?? [])].filter(flow => flow.activo).sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)),
    [data.businessFlows],
  );

  return (
    <div className="page-shell negocio-page negocio-contenedor">
      <div className="page-intro">
        <h1 className="page-title">Flujos de negocio</h1>
        <p className="page-subtitle">Documentación funcional resumida de los flujos clave del portafolio.</p>
      </div>
      <div className="page-body negocio-body">
        {flows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 16, background: '#FAFAFA' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🧭</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Sin flujos configurados</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Agrega flujos de negocio desde Configuración → Flujos de negocio.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {flows.map(flow => <FlowCard key={flow.id} flow={flow} />)}
          </div>
        )}
      </div>
    </div>
  );
}

