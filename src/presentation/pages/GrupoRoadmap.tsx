import { useState } from 'react';
import type { AppData, Capacidad, Iniciativa } from '../../domain/types';

const Q_MONTHS: Record<number, string[]> = {
  1: ['Ene', 'Feb', 'Mar'],
  2: ['Abr', 'May', 'Jun'],
  3: ['Jul', 'Ago', 'Sep'],
  4: ['Oct', 'Nov', 'Dic'],
};

const TAG_LABEL: Record<string, string> = { plan: 'Planificado', wip: 'En curso', done: 'Completado' };
const TAG_STYLE: Record<string, { background: string; color: string }> = {
  plan: { background: '#F1F5F9', color: '#64748B' },
  wip:  { background: '#E0F2FE', color: '#0369A1' },
  done: { background: '#D1FAE5', color: '#065F46' },
};

interface GrupoRoadmapGroup {
  nombre: string;
  color: string;
  caps: Capacidad[];
}

interface Props {
  grupo: GrupoRoadmapGroup;
  data: AppData;
  onBack: () => void;
}

// ── Barra de Roadmap ────────────────────────────────────────────────────────────────
function RoadmapBar({ ini, q }: { ini: Iniciativa; q: number }) {
  const months = Q_MONTHS[q] ?? ['M1', 'M2', 'M3'];
  const bar = ini.bar;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginTop: 6 }}>
      {months.map((m, idx) => {
        const active = idx >= bar.s && idx <= bar.e;
        const left = 0;
        const right = idx === bar.e ? 100 - bar.ep : 0;
        const clr = ini.tag === 'done' ? '#059669' : ini.tag === 'wip' ? '#0369A1' : '#0032A0';

        return (
          <div key={m} style={{ position: 'relative', height: 20, background: '#F1F5F9', borderRadius: 4 }}>
            {active && (
              <div style={{
                position: 'absolute',
                left: `${left}%`, right: `${right}%`,
                top: 0, bottom: 0,
                background: clr,
                borderRadius: 4,
                opacity: 0.85,
              }} />
            )}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: active ? '#fff' : '#94A3B8', zIndex: 1, lineHeight: 1 }}>
              {active && bar.s === bar.e ? ini.label.slice(0, 12) : m}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tarjeta de iniciativa ─────────────────────────────────────────────────────
function IniciativaCard({ ini, q }: { ini: Iniciativa; q: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{ini.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1C40' }}>{ini.nombre}</span>
            <span style={{ ...TAG_STYLE[ini.tag], fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 5, fontFamily: 'Manrope, sans-serif' }}>
              {TAG_LABEL[ini.tag]}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#6B7A9F', marginBottom: 6 }}>{ini.fechas}</div>
          <RoadmapBar ini={ini} q={q} />
          {ini.label && (
            <div style={{ fontSize: 11, color: '#6B7A9F', marginTop: 6, fontStyle: 'italic' }}>{ini.label}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sección de una capacidad ──────────────────────────────────────────────────
function CapSection({ cap, iniciativas, q }: { cap: Capacidad; iniciativas: Iniciativa[]; q: number }) {
  const [open, setOpen] = useState(true);
  const filtered = iniciativas.filter(i => i.q === q && i.producto === cap.key);

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: cap.color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1C40', flex: 1 }}>{cap.nombre}</span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: cap.color, marginRight: 8 }}>
          {filtered.length} iniciativa{filtered.length !== 1 ? 's' : ''}
        </span>
        <span style={{ color: '#94A3B8', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ paddingLeft: 14, paddingTop: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9CA3AF', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, textAlign: 'center' }}>
              Sin iniciativas para Q{q} en esta capacidad.
            </div>
          ) : (
            filtered.map(ini => <IniciativaCard key={ini.id} ini={ini} q={q} />)
          )}
        </div>
      )}
    </div>
  );
}

// ── Página principal GrupoRoadmap ─────────────────────────────────────────────
export default function GrupoRoadmap({ grupo, data, onBack }: Props) {
  const [q, setQ] = useState<number>(parseInt(data.config.q_activo?.replace('Q', '') ?? '2'));
  const { iniciativas } = data;

  const totalQ = iniciativas.filter(i =>
    i.q === q && grupo.caps.some(c => i.producto === c.key)
  ).length;

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: grupo.color, marginBottom: 4 }}>
            Roadmap
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0F1C40' }}>{grupo.nombre}</div>
          <div style={{ fontSize: 13, color: '#6B7A9F', marginTop: 4 }}>
            {grupo.caps.length} capacidades · {totalQ} iniciativas en Q{q}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <button
            onClick={onBack}
            className="btn-back-home"
          >
            ← Volver a Inicio
          </button>

          {/* Q selector */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => setQ(n)}
                style={{
                  padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: q === n ? grupo.color : '#fff',
                  color: q === n ? '#fff' : '#6B7A9F',
                  border: `1.5px solid ${q === n ? grupo.color : '#E5E7EB'}`,
                  transition: 'all 0.15s',
                }}>
                Q{n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Encabezado de meses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 1fr)', gap: 8, padding: '0 8px', marginBottom: 6 }}>
        <div />
        {(Q_MONTHS[q] ?? []).map(m => (
          <div key={m} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', fontFamily: 'Manrope, sans-serif' }}>{m}</div>
        ))}
      </div>

      {/* Capacidades y sus iniciativas */}
      {grupo.caps.map(cap => (
        <CapSection key={cap.key} cap={cap} iniciativas={iniciativas} q={q} />
      ))}

      {totalQ === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 14, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
          No hay iniciativas para Q{q} en {grupo.nombre}.
        </div>
      )}
    </div>
  );
}
