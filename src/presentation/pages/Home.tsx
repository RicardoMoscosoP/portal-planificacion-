import type { AppData, Capacidad } from '../../domain/types';
import { MosSection, IniciativasSection } from '../components/RoadmapMosBlock';
import React from "react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function SecHdr({ label }: { label: string }) {
  return (
    <div className="sec-hdr">
      <span className="sec-ttl">{label}</span>
      <span className="sec-line" />
    </div>
  );
}



// ── Quick Access Card ───────────────────────────────────────────────────────

function QuickAccessCard({ icon, label, description, onClick, color = '#0032A0', sublabel = 'Acceso' }: { icon: React.ReactNode; label: string; description: string; onClick: () => void; color?: string; sublabel?: string }) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 20,
        cursor: 'pointer',
        textAlign: 'left' as const,
        boxShadow: '0 10px 28px rgba(15,23,42,0.06)',
        display: 'flex',
        flexDirection: 'column' as const,
        flex: '1 1 220px',
        minWidth: 200,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 18px 38px rgba(0,50,160,0.13)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 28px rgba(15,23,42,0.06)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color, fontSize: 22, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: color, marginBottom: 4 }}>
            {sublabel}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1C40' }}>{label}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: '#475569', flex: 1 }}>{description}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: '#F8FAFC', color: color, fontSize: 11, fontWeight: 700, border: '1px solid #E2E8F0', marginTop: 14 }}>
        Ir a {label} →
      </div>
    </button>
  );
}

// ── Capacidad Card ──────────────────────────────────────────────────────────

function CapacidadCard({ cap, q, iniciativas, onClick }: { cap: Capacidad; q: number; iniciativas: AppData['iniciativas']; onClick: () => void }) {
  const total = iniciativas.filter(i => i.q === q && i.producto === cap.key).length;
  const done = iniciativas.filter(i => i.q === q && i.producto === cap.key && i.tag === 'done').length;
  const wip = iniciativas.filter(i => i.q === q && i.producto === cap.key && i.tag === 'wip').length;
  const showLabel = cap.label.trim().toLocaleLowerCase() !== cap.nombre.trim().toLocaleLowerCase();
  
  return (
    <div className="gc" style={{ '--gc-color': cap.color } as React.CSSProperties} onClick={onClick}>
      <span className="gc-arrow">&#8599;</span>
      {showLabel && <div className="gc-lbl">{cap.label}</div>}
      <div className="gc-name">{cap.nombre}</div>
      <div className="gc-caps">
        {cap.alcances.slice(0, 4).map(a => (
          <div key={a.key} className="gc-cap">
            <span className="gc-cap-dot" style={{ background: a.color }} />
            {a.nombre}
            {a.badge && <span style={{ fontSize: 9, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '1px 5px', borderRadius: 3, marginLeft: 2 }}>{a.badge}</span>}
          </div>
        ))}
        {cap.alcances.length > 4 && (
          <div className="gc-cap" style={{ background: '#E0E7FF', color: '#4338CA', border: 'none' }}>
            +{cap.alcances.length - 4} más
          </div>
        )}
      </div>
      <div className="gc-foot">
        <div>
          <div className="gc-count">{total}</div>
          <div className="gc-count-lbl">iniciativas Q{q}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {done > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: 6 }}>
              {done} listas
            </span>
          )}
          {wip > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, background: '#DBEAFE', color: '#1D4ED8', padding: '4px 8px', borderRadius: 6 }}>
              {wip} en curso
            </span>
          )}
        </div>
      </div>
      <span className="gc-detail">Ver roadmap &#8594;</span>
    </div>
  );
}

// ── Stakeholder Item ────────────────────────────────────────────────────────

function getInitials(nombre: string): string {
  return nombre.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Team Member Badge ───────────────────────────────────────────────────────

const ROL_CLR: Record<string, string> = {
  PO: '#0032A0', IM: '#7C3AED', TL: '#2563EB',
  'Desarrollador Backend': '#059669', 'Desarrollador Full': '#0891B2',
  'Datos / Analytics': '#DB2777', Dev: '#374151',
};

// ── Icons ───────────────────────────────────────────────────────────────────

const Icons = {
  roadmap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 19h18"/><path d="M7 16V8"/><path d="M12 16V5"/><path d="M17 16v-4"/>
      <circle cx="7" cy="8" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="17" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  reviews: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  flujos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  capacitaciones: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
};

// ── Main Component ──────────────────────────────────────────────────────────

interface Props {
  data: AppData;
  q: number;
  onNavCapacidad: (capacidadKey: string) => void;
  onNav?: (page: import('../layouts/MainLayout').PageKey) => void;
}

export default function Home({ data, q, onNavCapacidad, onNav }: Props) {
  const { capacidades, iniciativas, equipo, stakeholders, bets, mos } = data;
  const sortedCaps = [...capacidades].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));

  const visibleStakeholders = [...stakeholders]
    .filter(stakeholder => stakeholder.activo && (stakeholder.q === 'ALL' || stakeholder.q === `Q${q}`))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const activeTeamMembers = equipo.filter(m => m.activo);

  return (
    <div className="page-shell inicio-page inicio-contenedor">
      <div className="page-intro">
        <h1 className="page-title">Panel del Equipo</h1>
        <p className="page-subtitle">Estado actual del quarter, métricas clave y accesos rápidos a las secciones principales.</p>
      </div>

      <div className="page-body inicio-body" style={{ marginTop: 40 }}>
        {/* MOS / BETs — filtrado por Q activo */}
        <SecHdr label={`Métricas de Éxito (MOS) — Q${q}`} />
        <div style={{ marginBottom: 48 }}>
          <MosSection bets={bets} mos={mos} q={`Q${q}`} />
        </div>

        {/* Iniciativas del Quarter */}
        <SecHdr label="Iniciativas del Quarter" />
        <div style={{ marginBottom: 48 }}>
          <IniciativasSection iniciativas={iniciativas} mos={mos} bets={bets} q={q} />
        </div>

        {/* Capacidades */}
        <SecHdr label="Capacidades del equipo" />
        <div className="group-cards" style={{ marginBottom: 28 }}>
          {sortedCaps.map(c => (
            <CapacidadCard key={c.key} cap={c} q={q} iniciativas={iniciativas} onClick={() => onNavCapacidad(c.key)} />
          ))}
        </div>

        {/* Quick Access */}
        <SecHdr label="Accesos Rápidos" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <QuickAccessCard
            icon={Icons.roadmap}
            label="Roadmap"
            description="Ver el plan de trabajo y estado de las iniciativas"
            onClick={() => onNav?.('roadmap')}
            color="#0032A0"
            sublabel="Planificación"
          />
          <QuickAccessCard
            icon={Icons.reviews}
            label="Reviews"
            description="Revisar las presentaciones de avance del equipo"
            onClick={() => onNav?.('reviews')}
            color="#7C3AED"
            sublabel="Seguimiento"
          />
          <QuickAccessCard
            icon={Icons.flujos}
            label="Flujos de Negocio"
            description="Procesos y flujos operativos del equipo"
            onClick={() => onNav?.('business-flows')}
            color="#1B30CC"
            sublabel="Recursos"
          />
          <QuickAccessCard
            icon={Icons.capacitaciones}
            label="Capacitaciones"
            description="Recursos de aprendizaje y documentación"
            onClick={() => onNav?.('capacitaciones')}
            color="#059669"
            sublabel="Recursos"
          />
        </div>

        {/* Equipo */}
        <SecHdr label="Equipo" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
          {activeTeamMembers.map(m => {
            const rolColor = ROL_CLR[m.rol] ?? '#374151';
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 170 }}>
                {m.foto_url
                  ? <img src={m.foto_url} alt={m.nombre} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 38, height: 38, borderRadius: '50%', background: rolColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{m.iniciales}</div>
                }
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nombre}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: rolColor, marginTop: 1 }}>{m.rol}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stakeholders */}
        <SecHdr label="Stakeholders clave" />
        {visibleStakeholders.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            {visibleStakeholders.map(stakeholder => {
              const caps = sortedCaps.filter(c => stakeholder.capacidadKeys.includes(c.key));
              return (
                <div key={stakeholder.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 180 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0032A0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {getInitials(stakeholder.nombre)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stakeholder.nombre}</div>
                    {caps.length > 0 && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: caps[0].color, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{caps.map(c => c.label).join(', ')}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 18px', color: '#64748B', fontSize: 13, background: 'linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 100%)', border: '1px solid #DBEAFE', borderRadius: 18, marginBottom: 28 }}>
            No hay stakeholders activos para este quarter.
          </div>
        )}
      </div>
    </div>
  );
}
