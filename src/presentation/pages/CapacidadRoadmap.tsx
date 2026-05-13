import { useEffect, useRef, useState } from 'react';
import type { AppData, Capacidad, Bet, MOS } from '../../domain/types';
import Roadmap from './Roadmap';
import { betHasActiveMosForQuarter, getActiveMosByBetAndQuarter, getBetProducts } from '../../application/services/betMos';

// -- Panel MOS asociado a la Capacidad ----------------------------------------
function CapMosPanel({ capacidad, q, bets, mos }: { capacidad: Capacidad; q: number; bets: Bet[]; mos: MOS[] }) {
  const qStr = `Q${q}`;
  const capBets = bets
    .filter(b => b.producto === capacidad.key && b.activo !== false && betHasActiveMosForQuarter(b, mos, qStr))
    .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));

  if (capBets.length === 0) return null;

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${capacidad.color}30`, borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: `0 2px 12px ${capacidad.color}10` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: `1px solid ${capacidad.color}20`, background: `${capacidad.color}08` }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: capacidad.color }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: capacidad.color, fontFamily: 'Manrope, sans-serif' }}>
          Measure of Success — {qStr}
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: `${capacidad.color}0D` }}>
              <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Manrope, sans-serif', width: '28%' }}>Bet / LVT</th>
              <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Manrope, sans-serif' }}>Measure of Success</th>
              <th style={{ textAlign: 'center', padding: '8px 14px', fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Manrope, sans-serif', width: 90 }}>Base</th>
              <th style={{ textAlign: 'center', padding: '8px 14px', fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Manrope, sans-serif', width: 90 }}>Meta</th>
              <th style={{ textAlign: 'center', padding: '8px 14px', fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Manrope, sans-serif', width: 90 }}>Real</th>
            </tr>
          </thead>
          <tbody>
            {capBets.map((bet, bi) => {
              const activeMos = getActiveMosByBetAndQuarter(bet, mos, qStr);
              if (activeMos.length === 0) return null;
              return activeMos.map((m, mi) => {
                return (
                  <tr key={m.id} style={{ borderTop: bi === 0 && mi === 0 ? 'none' : '1px solid #F1F5F9' }}>
                    {mi === 0 && (
                      <td rowSpan={activeMos.length} style={{ padding: '10px 16px', verticalAlign: 'top', borderRight: `1px solid ${capacidad.color}15` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: bet.color, flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                              {getBetProducts(bet).map(product => (
                                <span key={product} style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, color: '#fff', background: bet.color, padding: '2px 7px', borderRadius: 4, fontFamily: 'Manrope, sans-serif', letterSpacing: '0.06em' }}>
                                  {product}
                                </span>
                              ))}
                            </div>
                            <div style={{ fontSize: 10, color: '#6B7A9F', lineHeight: 1.4 }}>{bet.descripcion}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td style={{ padding: '8px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: capacidad.color, flexShrink: 0, marginTop: 5 }} />
                        <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{m.descripcion}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{m.linea_base || '—'}</span>
                    </td>
                    <td style={{ padding: '8px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: capacidad.color }}>{m.meta || '—'}</span>
                    </td>
                    <td style={{ padding: '8px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>{m.actual || '—'}</span>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CapApplicationsPanel({ capacidad, aplicaciones }: { capacidad: Capacidad; aplicaciones: AppData['aplicaciones'] }) {
  const apps = aplicaciones
    .filter(aplicacion => aplicacion.capacidadKey === capacidad.key)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${capacidad.color}30`, borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: `0 2px 12px ${capacidad.color}10` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: `1px solid ${capacidad.color}20`, background: `${capacidad.color}08` }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: capacidad.color }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: capacidad.color, fontFamily: 'Manrope, sans-serif' }}>
          Aplicaciones asociadas
        </span>
      </div>

      {apps.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, padding: 16 }}>
          {apps.map(aplicacion => (
            <div key={aplicacion.id} style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 14px 12px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F1C40', lineHeight: 1.3 }}>{aplicacion.nombre}</div>
                {aplicacion.ultimo_release && (
                  <div style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#16A34A' }}>v{aplicacion.ultimo_release.version}</span>
                    <span style={{ fontSize: 9, color: '#6B7280' }}>·</span>
                    <span style={{ fontSize: 10, color: '#4B5563' }}>
                      {new Date(aplicacion.ultimo_release.fecha + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
                {aplicacion.descripcion?.trim() || 'Sin descripción configurada.'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '18px 20px', fontSize: 13, color: '#64748B' }}>
          Esta capacidad todavía no tiene aplicaciones asociadas.
        </div>
      )}
    </div>
  );
}

// -- Componente principal ------------------------------------------------------
interface Props {
  capacidad: Capacidad;
  data: AppData;
  q: number;
  onBack: () => void;
}

function renderSelectorButton(label: string, isActive: boolean, onClick: () => void) {
  return (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: 999,
        border: `1px solid ${isActive ? '#4F7FDF' : '#C3D5FF'}`,
        background: isActive ? '#BFD2FF' : '#E9F1FF',
        color: isActive ? '#0032A0' : '#6B7A9F',
        fontSize: 11,
        fontWeight: 800,
        fontFamily: 'Manrope, sans-serif',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: isActive ? '0 4px 12px rgba(0,50,160,0.10)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

export default function CapacidadRoadmap({ capacidad, data, q, onBack }: Props) {
  const [viewQ, setViewQ] = useState(q);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const mosSectionRef = useRef<HTMLDivElement | null>(null);
  const applicationsSectionRef = useRef<HTMLDivElement | null>(null);
  const roadmapSectionRef = useRef<HTMLDivElement | null>(null);

  const { iniciativas, entregables } = data;
  const qInis = iniciativas.filter(i => i.q === viewQ && i.producto === capacidad.key);
  const allEnts = (entregables ?? []).filter(entregable => entregable.activo !== false);
  const totalEnts = allEnts.filter(e => e.q === viewQ && qInis.some(i => i.id === e.iniciativaId)).length;

  useEffect(() => {
    setViewQ(q);
  }, [q, capacidad.key]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const nextIsFullscreen = document.fullscreenElement === fullscreenRef.current;
      setIsFullscreen(nextIsFullscreen);

      if (nextIsFullscreen) {
        requestAnimationFrame(() => {
          fullscreenRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === fullscreenRef.current) {
        await document.exitFullscreen();
        return;
      }

      await fullscreenRef.current?.requestFullscreen();
    } catch {
      setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
    }
  };

  const scrollToSection = (section: 'mos' | 'applications' | 'roadmap') => {
    const target = section === 'mos'
      ? mosSectionRef.current
      : section === 'applications'
        ? applicationsSectionRef.current
        : roadmapSectionRef.current;

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const roadmapData: AppData = {
    ...data,
    capacidades: [capacidad],
    iniciativas: data.iniciativas.filter(iniciativa => iniciativa.producto === capacidad.key),
    entregables: allEnts.filter(entregable => data.iniciativas.some(iniciativa => iniciativa.producto === capacidad.key && iniciativa.id === entregable.iniciativaId)),
  };

  return (
    <div ref={fullscreenRef} className="page-shell capacidad-page capacidad-contenedor" style={isFullscreen ? { background: '#F8FAFC', padding: '20px 24px', minHeight: '100vh', overflow: 'auto' } : undefined}>
      {/* [capacidad-page] */}
      <div className="page-body capacidad-body" style={isFullscreen ? { width: '100%', maxWidth: 1420, margin: '0 auto' } : undefined}>
        {/* [capacidad-body] */}
      {/* [capacidad-header] */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: capacidad.color, marginBottom: 4 }}>Roadmap</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1C40' }}>{capacidad.nombre}</div>
            {capacidad.contexto && <div style={{ fontSize: 13, color: '#6B7A9F', marginTop: 4, maxWidth: 500 }}>{capacidad.contexto}</div>}
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>
              {qInis.length} iniciativa{qInis.length !== 1 ? 's' : ''} · {totalEnts} entregable{totalEnts !== 1 ? 's' : ''} en Q{viewQ}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                border: '1px solid #94A3B8',
                background: '#fff',
                color: '#334155',
                fontSize: 11,
                fontWeight: 800,
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
            </button>
            <button onClick={onBack} className="btn-back-home">
              ← Volver a Inicio
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {[1, 2, 3, 4].map(quarter => renderSelectorButton(`Q${quarter}`, viewQ === quarter, () => setViewQ(quarter)))}
        </div>
      </div>

      {isFullscreen && (
        <div style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, padding: '10px 12px', borderRadius: 14, background: 'rgba(239,246,255,0.96)', border: '1px solid #BFDBFE', boxShadow: '0 10px 24px rgba(15,28,64,0.10)', backdropFilter: 'blur(10px)' }}>
          <button
            type="button"
            onClick={() => scrollToSection('mos')}
            style={{
              padding: '7px 12px',
              borderRadius: 999,
              border: '1px solid #93C5FD',
              background: '#fff',
              color: '#1D4ED8',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'Manrope, sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Ver MOS
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('applications')}
            style={{
              padding: '7px 12px',
              borderRadius: 999,
              border: '1px solid #93C5FD',
              background: '#fff',
              color: '#1D4ED8',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'Manrope, sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Ver aplicaciones
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('roadmap')}
            style={{
              padding: '7px 12px',
              borderRadius: 999,
              border: '1px solid #93C5FD',
              background: '#fff',
              color: '#1D4ED8',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'Manrope, sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Ver roadmap
          </button>
        </div>
      )}

      {/* [capacidad-mos] */}
      <div ref={mosSectionRef}>
        <CapMosPanel capacidad={capacidad} q={viewQ} bets={data.bets} mos={data.mos} />
      </div>

      <div ref={applicationsSectionRef}>
        <CapApplicationsPanel capacidad={capacidad} aplicaciones={data.aplicaciones} />
      </div>

      {/* [capacidad-contenido] */}
      {/* [capacidad-tabla] */}
      <div ref={roadmapSectionRef}>
        <Roadmap data={roadmapData} q={viewQ} hideTitle showControls={false} expandedCapKeys={[capacidad.key]} />
      </div>
      </div>
    </div>
  );
}
