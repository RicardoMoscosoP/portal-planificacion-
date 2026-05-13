import { useEffect, useState } from 'react';
import type { AppData, Bet, MOS } from '../../domain/types';
import Roadmap from '../pages/Roadmap';
import { getBetProducts, getMosByBet, getMosQuarters, getActiveMosByBetAndQuarter } from '../../application/services/betMos';

const AVAILABLE_QS = [1, 2, 3, 4] as const;
export type RoadmapMosView = number;

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
      <div style={{ background: '#fff', border: '1px dashed var(--border)', borderRadius: 16, padding: 20, color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
        No hay MOS del Bet configurados.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5EAF5', background: '#F8FAFF' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#0032A0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>
          MOS del Bet{q ? ` — ${q}` : ''}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{q ? `Indicadores del quarter ${q}. Solo se muestran los MOS activos en este quarter.` : 'Resumen completo de indicadores del bet en todos los quarters.'}</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '38%' }} />
            <col style={{ width: '38%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #0032A0 0%, #1B5FCC 100%)' }}>
              <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Manrope, sans-serif' }}>Bet / LVT</th>
              <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Manrope, sans-serif' }}>MOS del Bet</th>
              <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Manrope, sans-serif' }}>Base</th>
              <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Manrope, sans-serif' }}>Meta</th>
              <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Manrope, sans-serif' }}>Real</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ bet, activeMos }, betIndex) => {
              return activeMos.map((item, mosIndex) => (
                <tr
                  key={item.id}
                  style={{ borderTop: mosIndex === 0 && betIndex > 0 ? '1px solid #E5EAF5' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={event => (event.currentTarget.style.background = '#F8FAFF')}
                  onMouseLeave={event => (event.currentTarget.style.background = 'transparent')}
                >
                  {mosIndex === 0 && (
                    <td rowSpan={activeMos.length} style={{ padding: '10px 14px', verticalAlign: 'top', borderRight: '2px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: bet.color, flexShrink: 0, marginTop: 3 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F1C40', lineHeight: 1.4, marginBottom: 4 }}>{bet.descripcion}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {getBetProducts(bet).map(product => (
                              <span key={product} style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, color: '#fff', background: bet.color, padding: '2px 7px', borderRadius: 4, fontFamily: 'Manrope, sans-serif', letterSpacing: '0.06em' }}>
                                {product}
                              </span>
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
                        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.25, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.descripcion}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {getMosQuarters(item).map(quarter => (
                            <span key={`${item.id}_${quarter}`} style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, color: bet.color, background: `${bet.color}12`, padding: '2px 6px', borderRadius: 999 }}>
                              {quarter}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '2px 10px', verticalAlign: 'middle', textAlign: 'center' }}><span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{item.linea_base || '—'}</span></td>
                  <td style={{ padding: '2px 10px', verticalAlign: 'middle', textAlign: 'center' }}><span style={{ fontSize: 12, fontWeight: 700, color: bet.color }}>{item.meta || '—'}</span></td>
                  <td style={{ padding: '2px 10px', verticalAlign: 'middle', textAlign: 'center' }}><span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>{item.actual || '—'}</span></td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
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