import { useEffect, useState } from 'react';
import type { AppData, Bet, Iniciativa, MOS } from '../../domain/types';
import Roadmap from '../pages/Roadmap';
import { getBetProducts, getMosByBet, getMosQuarters, getActiveMosByBetAndQuarter } from '../../application/services/betMos';

const AVAILABLE_QS = [1, 2, 3, 4] as const;
export type RoadmapMosView = number;

export function IniciativasSection({ iniciativas, mos, bets, q }: { iniciativas: Iniciativa[]; mos: MOS[]; bets: Bet[]; q: number }) {
  const qStr = `Q${q}`;
  const qInits = iniciativas.filter(i => i.q === q && i.activo !== false);
  if (qInits.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px dashed #DCE7FF', borderRadius: 12, padding: 20, color: '#999', fontSize: 13, fontStyle: 'italic' }}>
        No hay iniciativas activas en Q{q}.
      </div>
    );
  }
  return (
    <div style={{ background: '#fff', border: '1px solid #DCE7FF', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(10,22,80,0.05)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0032A0 0%, #1E56A0 100%)', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Iniciativas en Curso</div>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600 }}>
          {qInits.length} Iniciativas
        </div>
      </div>
      {/* Rows */}
      <div>
        {qInits.map((ini, idx) => {
          const ents = ini.entregables ?? [];
          const done = ents.filter(e => e.activo !== false && e.estado === 'done').length;
          const inProgress = ents.filter(e => e.activo !== false && e.estado === 'in_progress').length;
          // MOS: primero mos_asociados filtrados por Q, si vacío → MOS del Bet del producto
          let mosList: MOS[] = (ini.mos_asociados ?? []).map(id => mos.find(m => m.id === id)).filter(Boolean).filter(m => getMosQuarters(m as MOS).includes(qStr)) as MOS[];
          if (mosList.length === 0) {
            const bet = bets.find(b => b.activo !== false && ((b.productos ?? []).includes(ini.producto) || b.producto === ini.producto));
            if (bet) mosList = getActiveMosByBetAndQuarter(bet, mos, qStr);
          }
          return (
            <div
              key={ini.id}
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: idx < qInits.length - 1 ? '1px solid #DCE7FF' : 'none', transition: 'background 0.15s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FA')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1650', marginBottom: 2 }}>{ini.emoji} {ini.nombre}</div>
                <div style={{ fontSize: 11.5, color: '#666', fontWeight: 500 }}>Producto: {ini.producto}</div>
                {mosList.length > 0 && (
                  <div style={{ borderTop: '1px solid #DCE7FF', paddingTop: 6, marginTop: 6 }}>
                    {mosList.map(m => {
                      const ind = m.descripcion.trim().startsWith('(+)') ? '(+)' : (m.descripcion.trim().startsWith('(-)') || m.descripcion.trim().startsWith('(–)')) ? '(–)' : '';
                          const desc = m.descripcion.replace(/^\([+\-–]\)\s*/, '');
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, minWidth: 28, color: '#0A1650', flexShrink: 0 }}>{ind}</span>
                          <span style={{ fontSize: 11, color: '#555', lineHeight: 1.4 }}>{desc}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: '#999', marginBottom: 5 }}>Entregables</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#F5F7FA', borderRadius: 7, borderLeft: '3px solid #48BB78' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#999', whiteSpace: 'nowrap' }}>Terminadas</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#48BB78', minWidth: 22, textAlign: 'center' }}>{done}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#F5F7FA', borderRadius: 7, borderLeft: '3px solid #ECC94B' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#999', whiteSpace: 'nowrap' }}>En Progreso</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#ECC94B', minWidth: 22, textAlign: 'center' }}>{inProgress}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MosSection({ bets, mos, q }: { bets: Bet[]; mos: MOS[]; q?: string }) {
  const activeBets = bets
    .filter(bet => bet.activo !== false && (q ? bet.q === q : true))
    .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));

  const rows = activeBets
    .map(bet => {
      const activeMos = q
        ? getActiveMosByBetAndQuarter(bet, mos, q)
        : (() => {
            const inactiveIds = new Set(bet.mos_inactivos ?? []);
            return getMosByBet(bet, mos).filter(item => !inactiveIds.has(item.id));
          })();
      return { bet, activeMos };
    })
    .filter(item => item.activeMos.length > 0);

  if (rows.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px dashed #E8DFE8', borderRadius: 12, padding: 20, color: '#999', fontSize: 13, fontStyle: 'italic' }}>
        No hay MOS del Bet configurados.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {rows.map(({ bet, activeMos }) => {
        // Calcular promedios para visualización
        const baseAvg = activeMos.reduce((sum, m) => sum + (parseFloat(m.linea_base?.toString() ?? '0') || 0), 0) / activeMos.length;
        const metaAvg = activeMos.reduce((sum, m) => sum + (parseFloat(m.meta?.toString() ?? '0') || 0), 0) / activeMos.length;
        const realAvg = activeMos.reduce((sum, m) => sum + (parseFloat(m.actual?.toString() ?? '0') || 0), 0) / activeMos.length;
        const progressPercent = metaAvg > 0 ? Math.min((realAvg / metaAvg) * 100, 100) : 0;
        const isMetReached = realAvg >= metaAvg;

        return (
          <div
            key={bet.id}
            style={{
              background: '#fff',
              border: `1.5px solid ${bet.color}30`,
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 2px 8px rgba(10,22,80,0.04)',
              transition: 'all 0.3s cubic-bezier(0.23, 1, 0.320, 1)',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = bet.color;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 24px ${bet.color}20, inset 0 1px 1px rgba(255,255,255,0.5)`;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = `${bet.color}30`;
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(10,22,80,0.04)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            {/* Elemento decorativo de fondo */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: `${bet.color}08`, borderRadius: '50%', transform: 'translate(30%, -30%)', zIndex: 0 }} />

            {/* Contenido */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Header: Nombre BET + Color indicator */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: bet.color,
                    flexShrink: 0,
                    marginTop: 4,
                    boxShadow: `0 0 12px ${bet.color}60`
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: bet.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, fontFamily: 'Manrope, sans-serif' }}>
                    {getBetProducts(bet).join(' • ')}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0A1650', lineHeight: 1.3, margin: 0 }}>{bet.descripcion}</h3>
                </div>
              </div>

              {/* MOS List - Compacta */}
              <div style={{ background: `${bet.color}05`, borderRadius: 10, padding: 12, marginBottom: 16, border: `1px solid ${bet.color}15` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'Manrope, sans-serif' }}>
                  Objetivos ({activeMos.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeMos.map((item, idx) => {
                    const indicator = item.descripcion.trim().startsWith('(+)') ? '(+)' : item.descripcion.trim().startsWith('(-)') || item.descripcion.trim().startsWith('(–)') ? '(–)' : '';
                    const descText = item.descripcion.replace(/^\([+\-–]\)\s*/, '');
                    return (
                      <div key={item.id} style={{ fontSize: 12, color: '#475569', display: 'flex', gap: 6, lineHeight: 1.3 }}>
                        {indicator && <span style={{ fontWeight: 700, color: bet.color, minWidth: 20 }}>{indicator}</span>}
                        <span>{descText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Números: Base | Meta | Real */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div style={{ background: '#FFF4D4', borderRadius: 10, padding: 12, textAlign: 'center', border: '1px solid #FFE5B4' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#F57F17', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
                    Base
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#F57F17' }}>
                    {Math.round(baseAvg)}
                  </div>
                </div>
                <div style={{ background: '#E6D9F0', borderRadius: 10, padding: 12, textAlign: 'center', border: '1px solid #D6C9E0' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#1B30CC', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
                    Meta
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#1B30CC' }}>
                    {Math.round(metaAvg)}
                  </div>
                </div>
                <div style={{ background: '#FFD4E5', borderRadius: 10, padding: 12, textAlign: 'center', border: '1px solid #FFC4DB' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#C2185B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
                    Real
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#C2185B' }}>
                    {Math.round(realAvg)}
                  </div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#666', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif' }}>
                    Progreso
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: isMetReached ? '#048A4A' : '#F57F17' }}>
                    {Math.round(progressPercent)}%
                  </div>
                </div>
                <div style={{ width: '100%', height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, #1B30CC 0%, ${isMetReached ? '#048A4A' : bet.color} 100%)`,
                      width: `${progressPercent}%`,
                      transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                </div>
              </div>

              {/* Badge de estado */}
              <div style={{ display: 'flex', gap: 8 }}>
                {isMetReached ? (
                  <div style={{ flex: 1, padding: '8px 12px', background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 8, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#065F46', fontFamily: 'Manrope, sans-serif' }}>
                    ✓ Meta alcanzada
                  </div>
                ) : (
                  <div style={{ flex: 1, padding: '8px 12px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#92400E', fontFamily: 'Manrope, sans-serif' }}>
                    ◐ En progreso
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuarterBlock({ data, quarter, showQuarterIntro = true, stacked = false }: { data: AppData; quarter: number; showQuarterIntro?: boolean; stacked?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: stacked ? 6 : 8, background: stacked ? 'transparent' : '#F8FAFF', border: stacked ? 'none' : '1px solid #DBEAFE', borderRadius: stacked ? 0 : 16, padding: stacked ? 0 : 10 }}>
      {showQuarterIntro && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: stacked ? '8px 12px' : '10px 12px', background: '#DCE7FF', border: '1px solid #C3D5FF', borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#0032A0', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif', marginBottom: 3 }}>{`Q${quarter}`}</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Roadmap general del trimestre</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, background: '#0032A0', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif' }}>
            {`Q${quarter}`}
          </span>
        </div>
      )}
      <Roadmap data={data} q={quarter} hideTitle showControls={false} showCompactHeader={!showQuarterIntro} />
    </div>
  );
}

export default function RoadmapMosBlock({ data, initialQ, title = 'Roadmap general', subtitle, showHeader = true, showQuarterIntroForSingleView = true, showSelector = true, selectedView: selectedViewProp, onSelectedViewChange }: { data: AppData; initialQ: number; title?: string; subtitle?: string; showHeader?: boolean; showQuarterIntroForSingleView?: boolean; showSelector?: boolean; selectedView?: RoadmapMosView; onSelectedViewChange?: (view: RoadmapMosView) => void }) {
  const [internalSelectedView, setInternalSelectedView] = useState<RoadmapMosView>(initialQ);

  const selectedView = selectedViewProp ?? internalSelectedView;
  const setSelectedView = (view: RoadmapMosView) => {
    if (selectedViewProp === undefined) {
      setInternalSelectedView(view);
    }
    onSelectedViewChange?.(view);
  };

  useEffect(() => {
    if (selectedViewProp === undefined) {
      setInternalSelectedView(initialQ);
    }
  }, [initialQ, selectedViewProp]);

  const renderSelectorButton = (view: RoadmapMosView, label: string) => {
    const isActive = selectedView === view;
    return (
      <button
        key={label}
        type="button"
        onClick={() => setSelectedView(view)}
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {showHeader ? (
        <div style={{ background: '#DCE7FF', border: '1px solid #C3D5FF', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F1C40', letterSpacing: '-0.02em', marginBottom: 4 }}>{title}</h2>
              <p style={{ fontSize: 13, color: '#6B7A9F', lineHeight: 1.5 }}>{subtitle ?? 'El selector de quarter filtra el roadmap general. El cuadro de MOS del Bet muestra siempre el set completo de indicadores.'}</p>
            </div>
            {showSelector && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {AVAILABLE_QS.map(quarter => renderSelectorButton(quarter, `Q${quarter}`))}
              </div>
            )}
          </div>
        </div>
      ) : showSelector ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {AVAILABLE_QS.map(quarter => renderSelectorButton(quarter, `Q${quarter}`))}
          </div>
        </div>
      ) : null}

      <MosSection bets={data.bets} mos={data.mos} q={`Q${selectedView}`} />

      <QuarterBlock data={data} quarter={selectedView} showQuarterIntro={showQuarterIntroForSingleView} />
    </div>
  );
}
