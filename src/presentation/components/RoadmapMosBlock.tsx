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
      <div style={{ background: '#fff', border: '1px dashed #DCE7FF', borderRadius: 12, padding: 20, color: '#999', fontSize: 13, fontStyle: 'italic' }}>
        No hay MOS del Bet configurados.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Tabla Bets / MOS con Paleta Pastel ── */}
      <div style={{ background: '#fff', border: '1px solid #E8DFE8', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(10,22,80,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: 'linear-gradient(135deg, #E6D9F0 0%, #F0E8F5 100%)', color: '#1B30CC', borderBottom: '2px solid #D6C9E0' }}>
            <tr>
              <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, fontSize: 12.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bet / LVT</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, fontSize: 12.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>MOS del Bet</th>
              <th style={{ padding: '16px 16px', textAlign: 'center', fontWeight: 700, fontSize: 12.8, textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: 80 }}>Base</th>
              <th style={{ padding: '16px 16px', textAlign: 'center', fontWeight: 700, fontSize: 12.8, textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: 80 }}>Meta</th>
              <th style={{ padding: '16px 16px', textAlign: 'center', fontWeight: 700, fontSize: 12.8, textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: 80 }}>Real</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ bet, activeMos }, betIndex) => {
              const isEvenRow = betIndex % 2 === 0;
              return (
                <tr
                  key={bet.id}
                  style={{ 
                    borderBottom: betIndex < rows.length - 1 ? '1px solid #E8DFE8' : 'none',
                    background: isEvenRow ? '#FFFBF5' : '#F5F0FA'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9F3FC')}
                  onMouseLeave={e => (e.currentTarget.style.background = isEvenRow ? '#FFFBF5' : '#F5F0FA')}
                >
                  {/* Bet / LVT */}
                  <td style={{ padding: '20px', verticalAlign: 'top', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginTop: 2, background: `${bet.color}33`, color: bet.color }}>●</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8, lineHeight: 1.4, color: '#0A1650', fontSize: 14 }}>{bet.descripcion}</div>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.2px', marginRight: 5 }}>Producto:</span>
                          {getBetProducts(bet).map(product => (
                            <span key={product} style={{ display: 'inline-block', padding: '4px 9px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2px', background: `${bet.color}14`, color: bet.color, border: `1px solid ${bet.color}26`, marginRight: 4 }}>
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* MOS del Bet */}
                  <td style={{ padding: '20px', verticalAlign: 'top', maxWidth: 260, textAlign: 'left' }}>
                    {activeMos.map((item, idx) => {
                      const indicator = item.descripcion.trim().startsWith('(+)') ? '(+)' : (item.descripcion.trim().startsWith('(-)') || item.descripcion.trim().startsWith('(–)')) ? '(–)' : '';
                      const descText = item.descripcion.replace(/^\([+\-–]\)\s*/, '');
                      return (
                        <div key={item.id} style={{ marginBottom: idx < activeMos.length - 1 ? 12 : 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            {indicator && <span style={{ fontWeight: 700, minWidth: 32, color: '#0A1650', flexShrink: 0 }}>{indicator}</span>}
                            <span style={{ color: '#0A1650', lineHeight: 1.4 }}>{descText}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#999', paddingLeft: indicator ? 40 : 0 }}>
                            {q ? q : getMosQuarters(item).join(', ')}
                          </div>
                        </div>
                      );
                    })}
                  </td>
                  {/* Base - Amarillo Pastel */}
                  <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, padding: '20px 16px', verticalAlign: 'middle', color: '#F57F17', background: 'linear-gradient(135deg, #FFF4D4 0%, #FFF9E8 100%)' }}>
                    {activeMos.map((item, idx) => (
                      <div key={item.id} style={{ marginBottom: idx < activeMos.length - 1 ? 14 : 0, padding: '6px 10px', borderRadius: 8, background: 'rgba(255, 212, 63, 0.15)', border: '1px solid rgba(245, 127, 23, 0.2)' }}>{item.linea_base || '—'}</div>
                    ))}
                  </td>
                  {/* Meta - Lavanda Pastel */}
                  <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, padding: '20px 16px', verticalAlign: 'middle', color: '#1B30CC', background: 'linear-gradient(135deg, #E6D9F0 0%, #F0E8F5 100%)' }}>
                    {activeMos.map((item, idx) => (
                      <div key={item.id} style={{ marginBottom: idx < activeMos.length - 1 ? 14 : 0, padding: '6px 10px', borderRadius: 8, background: 'rgba(27, 48, 204, 0.1)', border: '1px solid rgba(27, 48, 204, 0.25)' }}>{item.meta || '—'}</div>
                    ))}
                  </td>
                  {/* Real - Rosa Pastel */}
                  <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, padding: '20px 16px', verticalAlign: 'middle', color: '#C2185B', background: 'linear-gradient(135deg, #FFD4E5 0%, #FFE5F0 100%)' }}>
                    {activeMos.map((item, idx) => (
                      <div key={item.id} style={{ marginBottom: idx < activeMos.length - 1 ? 14 : 0, padding: '6px 10px', borderRadius: 8, background: 'rgba(194, 24, 91, 0.1)', border: '1px solid rgba(194, 24, 91, 0.2)' }}>{item.actual || '—'}</div>
                    ))}
                  </td>
                </tr>
              );
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
