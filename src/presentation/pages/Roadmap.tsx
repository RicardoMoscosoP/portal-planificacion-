// Utilidad para mostrar fechas siempre como DD-MM-YYYY
export function formatFecha(fecha: string) {
  // Si ya es DD-MM-YYYY, retorna igual
  if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) return fecha;
  // Si es YYYY-MM-DD, convertir a DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split('-');
    return `${d}-${m}-${y}`;
  }
  // Si es un string tipo Date largo, intenta extraer yyyy-mm-dd
  const m = fecha.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) {
    const [y, mo, d] = m[1].split('-');
    return `${d}-${mo}-${y}`;
  }
  // Si es un Date, formatea
  try {
    const d = new Date(fecha);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {}
  return fecha;
}
import { useEffect, useState } from 'react';
import type { AppData, Bet, Entregable, Iniciativa } from '../../domain/types';
import { BX_MODAL_OVERLAY_STYLE, BX_MODAL_PANEL_STYLE } from '../components/modalStyles';

const Q_MONTHS_DEF: Record<number, Array<{ short: string; long: string; month: number }>> = {
  1: [{ short: 'Ene', long: 'Enero',      month: 0 }, { short: 'Feb', long: 'Febrero',   month: 1 }, { short: 'Mar', long: 'Marzo',      month: 2 }],
  2: [{ short: 'Abr', long: 'Abril',      month: 3 }, { short: 'May', long: 'Mayo',       month: 4 }, { short: 'Jun', long: 'Junio',      month: 5 }],
  3: [{ short: 'Jul', long: 'Julio',      month: 6 }, { short: 'Ago', long: 'Agosto',     month: 7 }, { short: 'Sep', long: 'Septiembre', month: 8 }],
  4: [{ short: 'Oct', long: 'Octubre',    month: 9 }, { short: 'Nov', long: 'Noviembre',  month:10 }, { short: 'Dic', long: 'Diciembre',  month:11 }],
};

const Q_LABELS: Record<number, string> = {
  1: 'Q1 · Ene–Mar 2026',
  2: 'Q2 · Abr–Jun 2026',
  3: 'Q3 · Jul–Sep 2026',
  4: 'Q4 · Oct–Dic 2026',
};

const AVAILABLE_QS = [1, 2, 3, 4] as const;
type RoadmapView = number;

function qRange(q: number) {
  const year = new Date().getFullYear();
  const M = Q_MONTHS_DEF[q];
  const start   = new Date(year, M[0].month, 1);
  const end     = new Date(year, M[2].month + 1, 0, 23, 59, 59, 999);
  const totalMs = end.getTime() - start.getTime();
  return { start, end, totalMs };
}

function getTodayPct(q: number): number | null {
  const { start, end, totalMs } = qRange(q);
  const now = new Date();
  if (now < start || now > end) return null;
  return (now.getTime() - start.getTime()) / totalMs * 100;
}

function getWeekPcts(q: number): number[] {
  const { start, end, totalMs } = qRange(q);
  const pcts: number[] = [];
  let d = new Date(start.getTime() + 7 * 86400 * 1000);
  while (d < end) {
    pcts.push((d.getTime() - start.getTime()) / totalMs * 100);
    d = new Date(d.getTime() + 7 * 86400 * 1000);
  }
  return pcts;
}

function getEntregablePct(entregable: Entregable, q: number): { left: number; width: number } | null {
  const { start, end, totalMs } = qRange(q);
  const startDate = new Date(entregable.fechaInicio);
  const endDate = new Date(entregable.fechaFin);

  if (endDate < start || startDate > end) return null;

  const clampedStart = Math.max(startDate.getTime(), start.getTime());
  const clampedEnd = Math.min(endDate.getTime(), end.getTime());

  return {
    left: ((clampedStart - start.getTime()) / totalMs) * 100,
    width: Math.max(((clampedEnd - clampedStart) / totalMs) * 100, 3),
  };
}

interface Bar { s: number; e: number; sp: number; ep: number }

function BarCols({ bar, color, label }: { bar: Bar; color: string; label: string }) {
  const { s, e, ep } = bar;
  return (
    <>
      {[0, 1, 2].map(m => {
        let inner: React.ReactNode = null;
        if (m >= s && m <= e) {
          let left: string, width: string, borderRadius: string;
          if (s === e) {
            left = '0'; width = ep + '%'; borderRadius = '6px';
          } else if (m === s) {
            left = '0'; width = '100%'; borderRadius = '6px 0 0 6px';
          } else if (m === e) {
            left = '0'; width = ep + '%'; borderRadius = '0 6px 6px 0';
          } else {
            left = '0'; width = '100%'; borderRadius = '0';
          }
          inner = (
            <div className="rm-bw" style={{ left, width }}>
              <div className="rm-be" style={{ background: color, width: '100%', borderRadius }}>
                {m === s ? label : ''}
              </div>
            </div>
          );
        }
        return (
          <div key={m} className="rm-init-mcol">
            {inner}
          </div>
        );
      })}
    </>
  );
}

function EntregableBars({ entregable, q, color }: { entregable: Entregable; q: number; color: string }) {
  const range = getEntregablePct(entregable, q);

  return (
    <div className="rm-init-bars" style={{ position: 'relative' }}>
      {[0, 1, 2].map(index => (
        <div key={index} className="rm-init-mcol" />
      ))}
      {range && (
        <div
          style={{
            position: 'absolute',
            left: `${range.left}%`,
            width: `${range.width}%`,
            top: '50%',
            transform: 'translateY(-50%)',
            height: 18,
            borderRadius: 999,
            background: `${color}45`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            overflow: 'hidden',
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 700, color: '#0F1C40', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entregable.titulo}
          </span>
        </div>
      )}
    </div>
  );
}

function EntregableDetailModal({ entregable, color, onClose }: { entregable: Entregable; color: string; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ ...BX_MODAL_OVERLAY_STYLE, zIndex: 200, padding: 18 }}>
      <div
        onClick={(event) => event.stopPropagation()}
        style={{ ...BX_MODAL_PANEL_STYLE, width: 'min(520px, 100%)', padding: '24px 24px 20px', position: 'relative' }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            border: 'none',
            background: 'transparent',
            color: '#94A3B8',
            fontSize: 22,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 999, background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: 14 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1D4ED8', fontFamily: 'Manrope, sans-serif' }}>
            Detalle del entregable
          </span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0F1C40', lineHeight: 1.2, marginBottom: 14 }}>
          {entregable.titulo}
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 6, fontFamily: 'Manrope, sans-serif' }}>
            Descripción
          </div>
          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.65 }}>
            {entregable.descripcion?.trim() || 'Este entregable no tiene detalle cargado en configuraciones.'}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <div style={{ background: '#F8FAFF', borderRadius: 12, border: '1px solid #DBEAFE', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
              Inicio
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1C40' }}>{entregable.fechaInicio}</div>
          </div>
          <div style={{ background: '#F8FAFF', borderRadius: 12, border: '1px solid #DBEAFE', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
              Fin
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1C40' }}>{entregable.fechaFin}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IniciativaDetailModal({ iniciativa, color, onClose }: { iniciativa: Iniciativa; color: string; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ ...BX_MODAL_OVERLAY_STYLE, zIndex: 200, padding: 18 }}>
      <div
        onClick={(event) => event.stopPropagation()}
        style={{ ...BX_MODAL_PANEL_STYLE, width: 'min(560px, 100%)', padding: '24px 24px 20px', position: 'relative' }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            border: 'none',
            background: 'transparent',
            color: '#94A3B8',
            fontSize: 22,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 999, background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: 14 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1D4ED8', fontFamily: 'Manrope, sans-serif' }}>
            Detalle de la iniciativa
          </span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0F1C40', lineHeight: 1.2, marginBottom: 14 }}>
          {iniciativa.emoji} {iniciativa.nombre}
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 6, fontFamily: 'Manrope, sans-serif' }}>
            Descripción
          </div>
          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.65 }}>
            {iniciativa.descripcion?.trim() || 'Esta iniciativa no tiene detalle cargado en configuraciones.'}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <div style={{ background: '#F8FAFF', borderRadius: 12, border: '1px solid #DBEAFE', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
              Ventana
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1C40' }}>{iniciativa.fechas}</div>
          </div>
          <div style={{ background: '#F8FAFF', borderRadius: 12, border: '1px solid #DBEAFE', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
              Resumen roadmap
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1C40' }}>{iniciativa.label || 'Sin label configurado'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ENT_ESTADO_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  backlog:     { bg: '#F1F5F9', color: '#475569', label: 'Backlog' },
  in_progress: { bg: '#DBEAFE', color: '#1D4ED8', label: 'En progreso' },
  done:        { bg: '#DCFCE7', color: '#15803D', label: 'Done' },
};

function IniciativaRow({ iniciativa, entregables, bets, q, defaultOpen = false, onOpenEntregable, onOpenIniciativa }: {
  iniciativa: Iniciativa; entregables: Entregable[]; bets: Bet[]; q: number; defaultOpen?: boolean; onOpenEntregable: (entregable: Entregable, color: string) => void; onOpenIniciativa: (iniciativa: Iniciativa, color: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bet = bets.find(b => (b.productos ?? []).includes(iniciativa.producto) || b.producto === iniciativa.producto);
  const iniColor = bet?.color ?? '#1E56A0';

  useEffect(() => {
    setOpen(defaultOpen);
  }, [q, defaultOpen]);

  const tagLabel = (tag: string) => tag === 'done' ? 'Done' : tag === 'wip' ? 'In Progress' : 'Backlog';
  const iniEntregables = entregables.filter(entregable => entregable.iniciativaId === iniciativa.id && entregable.q === q && entregable.activo !== false);
  // Total de entregables de la iniciativa en todos los Qs
  const totalEntregables = entregables.filter(entregable => entregable.iniciativaId === iniciativa.id && entregable.activo !== false).length;

  return (
    <div className={`rm-cap-row${open ? ' open' : ''}`}>
      <div className="rm-cap-hdr" onClick={() => setOpen(o => !o)} style={{ borderLeft: `4px solid ${iniColor}` }}>
        <div className="rm-cap-info">
          <div className="rm-cap-name">
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: iniColor, display: 'inline-block', flexShrink: 0 }} />
            {iniciativa.emoji} {iniciativa.nombre}
            <span className="rm-chev">&#9654;</span>
          </div>
        </div>
        <div className="rm-cap-bars" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '0 16px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#94A3B8', fontFamily: 'Manrope, sans-serif' }}>
            {iniEntregables.length} en Q{q}
          </span>
          {totalEntregables !== iniEntregables.length && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1', fontFamily: 'Manrope, sans-serif' }}>
              · {totalEntregables} total
            </span>
          )}
        </div>
      </div>
      <div className="rm-inits">
        {iniEntregables.length === 0 ? (
          <div style={{ padding: '10px 14px 10px 22px', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
            Sin entregables para este Q.
          </div>
        ) : (
          <div>
            <div className="rm-init-row">
              <div className="rm-init-info">
                <div className="rm-init-name" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => onOpenIniciativa(iniciativa, iniColor)}
                    className="rm-link"
                    style={{ fontSize: 12, '--rm-link-color': iniColor } as React.CSSProperties}
                  >
                    Iniciativa
                  </button>
                  <span className={`rm-init-tag t-${iniciativa.tag}`}>{tagLabel(iniciativa.tag)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div className="rm-init-meta">{iniciativa.fechas}</div>
                </div>
              </div>
              <div className="rm-init-bars">
                <BarCols bar={iniciativa.bar} color={iniColor} label={iniciativa.label} />
              </div>
            </div>
            {iniEntregables.map(entregable => (
              <div key={entregable.id} className="rm-init-row" style={{ background: '#FAFBFF' }}>
                <div className="rm-init-info" style={{ paddingLeft: 36 }}>
                  <div className="rm-init-name" style={{ fontSize: 11 }}>
                    <button
                      type="button"
                      onClick={() => onOpenEntregable(entregable, iniColor)}
                      className="rm-link"
                      style={{ fontSize: 11, '--rm-link-color': iniColor } as React.CSSProperties}
                    >
                      {entregable.titulo}
                    </button>
                    {(() => { const ec = ENT_ESTADO_COLORS[(entregable as any).estado ?? 'backlog'] ?? ENT_ESTADO_COLORS.backlog; return <span style={{ background: ec.bg, color: ec.color, borderRadius: 5, padding: '1px 7px', fontSize: 9, fontWeight: 800, marginLeft: 4, letterSpacing: '0.05em', textTransform: 'uppercase' as const, fontFamily: 'Manrope, sans-serif', flexShrink: 0 }}>{ec.label}</span>; })()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div className="rm-init-meta">{formatFecha(entregable.fechaInicio)} → {formatFecha(entregable.fechaFin)}</div>
                  </div>
                </div>
                <EntregableBars entregable={entregable} q={q} color={iniColor} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuarterRoadmap({ data, q, expandedCapKeys = [] }: { data: AppData; q: number; expandedCapKeys?: string[] }) {
  const { iniciativas, entregables: rawEntregables, bets } = data;
  const entregables = rawEntregables ?? [];
  const [detailIniciativa, setDetailIniciativa] = useState<Iniciativa | null>(null);
  const [detailEntregable, setDetailEntregable] = useState<Entregable | null>(null);
  const [detailColor, setDetailColor] = useState('#94A3B8');
  const months = Q_MONTHS_DEF[q];
  const qInits = iniciativas.filter(i => i.q === q);
  const tPct = getTodayPct(q);
  const wPcts = getWeekPcts(q);

  const rows = qInits.map(ini => {
    const iniEntregables = entregables.filter(entregable => entregable.iniciativaId === ini.id && entregable.q === q && entregable.activo !== false);
    return { iniciativaId: ini.id, iniciativa: ini, entregables: iniEntregables };
  });

  return (
    <div className="roadmap-table">
      <div className="rm-head">
        <div className="rm-head-lbl" style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Iniciativas</div>
        <div style={{ display: 'flex', flex: 1, position: 'relative', height: 48, overflow: 'visible' }}>
          {months.map((m, idx) => (
            <div key={m.short} style={{
              flex: 1, position: 'relative',
              background: '#DCE7FF',
              borderLeft: idx > 0 ? '1px solid #E2E8F0' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', position: 'relative', zIndex: 2 }}>
                {m.long}
              </span>
            </div>
          ))}
          <span style={{ position: 'absolute', bottom: 5, left: 4, fontSize: 8, fontWeight: 700, color: '#94A3B8', fontFamily: 'Manrope, sans-serif', zIndex: 3 }}>S1</span>
          {wPcts.map((pct, i) => (
            <div key={i} style={{ position: 'absolute', left: `${pct}%`, top: 0, bottom: 0, zIndex: 3, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, borderLeft: '1px dashed #C7D2FE' }} />
              <span style={{ position: 'absolute', bottom: 5, left: 3, fontSize: 8, fontWeight: 700, color: '#94A3B8', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap' }}>S{i + 2}</span>
            </div>
          ))}
          {tPct !== null && (
            <div style={{ position: 'absolute', left: `${tPct}%`, top: 0, bottom: -1, borderLeft: '2.5px solid #94A3B8', zIndex: 6, pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', top: 5, left: 4, fontSize: 9, fontWeight: 800, color: '#475569', background: 'rgba(226,232,240,0.96)', border: '1px solid rgba(148,163,184,0.7)', padding: '2px 5px', borderRadius: 4, fontFamily: 'Manrope, sans-serif', letterSpacing: '0.04em', whiteSpace: 'nowrap', zIndex: 7 }}>HOY</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {tPct !== null && (
          <div style={{ position: 'absolute', left: `calc(220px + (100% - 220px) * ${tPct / 100})`, top: 0, bottom: 0, borderLeft: '2px solid rgba(148,163,184,0.55)', zIndex: 5, pointerEvents: 'none' }} />
        )}
        {rows.map(r => (
          <IniciativaRow
            key={r.iniciativaId}
            iniciativa={r.iniciativa}
            entregables={r.entregables}
            bets={bets}
            q={q}
            defaultOpen={expandedCapKeys.includes(r.iniciativaId)}
            onOpenIniciativa={(iniciativa, color) => {
              setDetailIniciativa(iniciativa);
              setDetailColor(color);
            }}
            onOpenEntregable={(entregable, color) => {
              setDetailEntregable(entregable);
              setDetailColor(color);
            }}
          />
        ))}
      </div>
      <div className="rm-foot">
        <span className="rm-stat">{Q_LABELS[q]}</span>
      </div>
      {detailEntregable && (
        <EntregableDetailModal
          entregable={detailEntregable}
          color={detailColor}
          onClose={() => setDetailEntregable(null)}
        />
      )}
      {detailIniciativa && (
        <IniciativaDetailModal
          iniciativa={detailIniciativa}
          color={detailColor}
          onClose={() => setDetailIniciativa(null)}
        />
      )}
    </div>
  );
}

interface Props {
  data: AppData;
  q: number;
  hideTitle?: boolean;
  showControls?: boolean;
  showCompactHeader?: boolean;
  expandedCapKeys?: string[];
}

export default function Roadmap({ data, q, hideTitle, showControls = true, showCompactHeader = false, expandedCapKeys = [] }: Props) {
  const [view, setView] = useState<RoadmapView>(q);

  useEffect(() => {
    setView(q);
  }, [q]);

  const renderSelectorButton = (label: string, isActive: boolean, onClick: () => void) => (
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

  return (
    <div className="page-shell roadmap-page roadmap-contenedor">
      {/* [roadmap-page] */}
      {!hideTitle && (
        <div className="page-intro" style={{ background: '#DCE7FF', border: '1px solid #C3D5FF', borderRadius: 16, padding: '18px 20px', marginBottom: 18 }}>
          {/* [roadmap-header] */}
          <div className="page-intro-row">
            <div>
              <h1 className="page-title">Roadmap general</h1>
              <p className="page-subtitle">{`Todas las capacidades · ${Q_LABELS[view]}`}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {AVAILABLE_QS.map(quarter => renderSelectorButton(`Q${quarter}`, view === quarter, () => setView(quarter)))}
            </div>
          </div>
        </div>
      )}

      {hideTitle && showControls && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {AVAILABLE_QS.map(quarter => renderSelectorButton(`Q${quarter}`, view === quarter, () => setView(quarter)))}
          </div>
        </div>
      )}

      {hideTitle && !showControls && showCompactHeader && (
        <div style={{ marginBottom: 14, background: '#F8FAFF', border: '1px solid #DBEAFE', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#0032A0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>
            Roadmap general
          </div>
          <div style={{ fontSize: 13, color: '#64748B' }}>{`Todas las capacidades · ${Q_LABELS[view]}`}</div>
        </div>
      )}

      <div className="page-body roadmap-body">
        {/* [roadmap-body] */}
        {/* [roadmap-contenido] */}
        <QuarterRoadmap data={data} q={view} expandedCapKeys={expandedCapKeys} />
      </div>
    </div>
  );
}
