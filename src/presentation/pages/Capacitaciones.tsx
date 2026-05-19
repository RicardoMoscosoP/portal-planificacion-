import { useState } from 'react';
import type { AppData } from '../../domain/types';
import { BX_MODAL_OVERLAY_STYLE } from '../components/modalStyles';

interface Props {
  data: AppData;
}

function isGoogleSlides(url: string): boolean {
  return url.includes('docs.google.com/presentation') || url.includes('slides.google.com');
}

function toEmbedUrl(url: string): string {
  // Convierte link de edición/compartir a embed
  const base = url.split('?')[0].replace(/\/(edit|pub|preview)$/, '');
  return `${base}/embed?start=false&loop=false&delayms=3000`;
}

function EmbedModal({ url, onClose }: { url: string; onClose: () => void }) {
  const src = isGoogleSlides(url) ? toEmbedUrl(url) : url;
  const [fullscreen, setFullscreen] = useState(false);
  return (
    <div onClick={onClose} style={{ ...BX_MODAL_OVERLAY_STYLE, alignItems: fullscreen ? 'stretch' : 'flex-start', paddingTop: fullscreen ? 0 : 32, padding: fullscreen ? 0 : undefined }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: fullscreen ? 0 : 18, overflow: 'hidden', width: fullscreen ? '100vw' : 'min(1100px, 100%)', height: fullscreen ? '100vh' : '85vh', display: 'flex', flexDirection: 'column', boxShadow: fullscreen ? 'none' : '0 24px 64px rgba(15,23,42,0.22)', transition: 'all 0.2s' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Presentación</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#0032A0', padding: '4px 10px', borderRadius: 7, border: '1px solid #C3D5FF', background: '#EEF2FF', textDecoration: 'none', fontFamily: 'Manrope, sans-serif' }}>
              Abrir en nueva pestaña
            </a>
            <button type="button" onClick={() => setFullscreen(f => !f)} title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} style={{ border: '1px solid #E2E8F0', background: '#F1F5F9', color: '#475569', fontSize: 14, cursor: 'pointer', borderRadius: 7, padding: '4px 9px', lineHeight: 1, fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>
              {fullscreen ? '⊡ Normal' : '⛶ Pantalla completa'}
            </button>
            <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        </div>
        <iframe src={src} style={{ flex: 1, border: 'none', width: '100%' }} allowFullScreen title="Presentación" />
      </div>
    </div>
  );
}

export default function Capacitaciones({ data }: Props) {
  const caps = [...(data.capacitaciones ?? [])].filter(c => c.activo).sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
  const [openId, setOpenId] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  // Mapa de apps por id para lookup rápido
  const appsMap = Object.fromEntries((data.aplicaciones ?? []).map(a => [a.id, a]));
  // Mapa de capacidades por key
  const capsMap = Object.fromEntries((data.capacidades ?? []).map(c => [c.key, c]));

  // Resuelve los ids de aplicaciones de una capacitación (soporta legacy aplicacionId)
  function getApps(cap: { aplicacionId?: string; aplicacionIds?: string[] }) {
    const ids = [
      ...(cap.aplicacionIds ?? []),
      ...(cap.aplicacionId && !(cap.aplicacionIds ?? []).includes(cap.aplicacionId) ? [cap.aplicacionId] : []),
    ];
    return ids.map(id => appsMap[id]).filter(Boolean);
  }

  const handleUrl = (url: string) => {
    if (isGoogleSlides(url)) {
      setEmbedUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="page-shell capacitaciones-page capacitaciones-contenedor">
      <div className="page-intro">
        <h1 className="page-title">Capacitaciones</h1>
        <p className="page-subtitle">Recursos de aprendizaje sobre los productos del equipo</p>
      </div>
      <div className="page-body capacitaciones-body">
        {caps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 16, background: '#FAFAFA' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>Sin capacitaciones configuradas</div>
            <div style={{ fontSize: 13 }}>Agrega capacitaciones desde Configuración.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {caps.map(cap => {
              const isOpen = openId === cap.id;
              const capApps = getApps(cap as any);
              const capObj = cap.capacidadKey ? capsMap[cap.capacidadKey] : null;
              return (
                <div key={cap.id} style={{ background: '#fff', border: `1px solid ${isOpen ? '#0032A055' : 'var(--border)'}`, borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s', boxShadow: isOpen ? '0 4px 16px rgba(0,50,160,0.08)' : 'none' }}>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : cap.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: isOpen ? '#F8FAFF' : '#fff', border: 'none', borderLeft: `4px solid ${isOpen ? '#0032A0' : 'transparent'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  >
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{cap.emoji || '📘'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cap.titulo}</div>
                      {/* Chip de capacidad en el header */}
                      {capObj && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: capObj.color, background: capObj.color + '18', borderRadius: 5, padding: '2px 7px', border: `1px solid ${capObj.color}35` }}>
                            {capObj.label}
                          </span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: '#94A3B8', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 18px 16px', borderTop: '1px solid #EEF2F8' }}>
                      {cap.descripcion && (
                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, margin: '14px 0 12px' }}>{cap.descripcion}</p>
                      )}

                      {/* Capacidad y Aplicaciones — etiquetadas */}
                      {(capObj || capApps.length > 0) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0 14px', padding: '10px 14px', background: '#F8FAFF', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                          {capObj && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 90 }}>Capacidad</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: capObj.color, background: capObj.color + '18', borderRadius: 5, padding: '2px 9px', border: `1px solid ${capObj.color}35` }}>
                                {capObj.nombre}
                              </span>
                            </div>
                          )}
                          {capApps.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 90, paddingTop: 2 }}>Aplicaciones</span>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {capApps.map(app => (
                                  <span key={app.id} style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#EEF2FF', borderRadius: 5, padding: '2px 9px', border: '1px solid #C7D7FE' }}>
                                    {app.nombre}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* URLs / recursos */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                        {cap.confluenceUrl ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <a href={cap.confluenceUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: '#EEF2FF', color: '#1D4ED8', fontSize: 12, fontWeight: 800, textDecoration: 'none', fontFamily: 'Manrope, sans-serif', border: '1px solid #C7D7FE' }}>
                              📄 Abrir en Confluence ↗
                            </a>
                            <span style={{ fontSize: 10, color: '#94A3B8', paddingLeft: 4, wordBreak: 'break-all' }}>{cap.confluenceUrl}</span>
                          </div>
                        ) : null}
                        {cap.url ? (
                          isGoogleSlides(cap.url) ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <button type="button" onClick={() => handleUrl(cap.url!)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: '#EEF2FF', color: '#1D4ED8', fontSize: 12, fontWeight: 800, border: '1px solid #C7D7FE', cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>
                                🎞 Ver presentación
                              </button>
                              <span style={{ fontSize: 10, color: '#94A3B8', paddingLeft: 4, wordBreak: 'break-all' }}>{cap.url}</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <a href={cap.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: '#EEF2FF', color: '#1D4ED8', fontSize: 12, fontWeight: 800, border: '1px solid #C7D7FE', textDecoration: 'none', fontFamily: 'Manrope, sans-serif' }}>
                                🔗 Abrir recurso ↗
                              </a>
                              <span style={{ fontSize: 10, color: '#94A3B8', paddingLeft: 4, wordBreak: 'break-all' }}>{cap.url}</span>
                            </div>
                          )
                        ) : null}
                        {!cap.confluenceUrl && !cap.url && (
                          <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>Sin recursos configurados aún.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {embedUrl && <EmbedModal url={embedUrl} onClose={() => setEmbedUrl(null)} />}
    </div>
  );
}

