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

function QuickAccessCard({ icon, label, description, onClick, color = '#1B30CC', sublabel = 'Acceso' }: { icon: React.ReactNode; label: string; description: string; onClick: () => void; color?: string; sublabel?: string }) {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      type="button"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: `linear-gradient(135deg, #fff 0%, ${color}06 100%)`,
        border: isHovered ? `2px solid ${color}` : '1px solid #E5E7EB',
        borderRadius: 18,
        padding: 24,
        cursor: 'pointer',
        textAlign: 'left' as const,
        boxShadow: isHovered ? `0 20px 40px ${color}20, inset 0 1px 1px rgba(255,255,255,0.5)` : '0 4px 12px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column' as const,
        flex: '1 1 240px',
        minWidth: 220,
        transition: 'all 0.3s cubic-bezier(0.23, 1, 0.320, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: `${color}08`, borderRadius: '50%', transform: 'translate(30%, -30%)', transition: 'transform 0.3s ease' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `linear-gradient(135deg, ${color}20 0%, ${color}08 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color, fontSize: 24, flexShrink: 0,
          boxShadow: `0 8px 16px ${color}15`,
          border: `1px solid ${color}20`,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: color, marginBottom: 2, opacity: 0.8 }}>
            {sublabel}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0A1650', letterSpacing: '-0.02em' }}>{label}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.7, color: '#64748B', flex: 1, position: 'relative', zIndex: 1 }}>{description}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, background: color, color: '#fff', fontSize: 12, fontWeight: 700, marginTop: 16, position: 'relative', zIndex: 1, opacity: isHovered ? 1 : 0.95, transform: isHovered ? 'translateX(4px)' : 'translateX(0)', transition: 'all 0.2s ease' }}>
        Ir a {label} <span style={{ fontSize: 16 }}>→</span>
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
  const completionRate = total > 0 ? (done / total) * 100 : 0;
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <div 
      className="gc" 
      style={{ '--gc-color': cap.color, opacity: isHovered ? 1 : 0.95, transform: isHovered ? 'translateY(-4px)' : 'translateY(0)' } as React.CSSProperties}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: `${cap.color}08`, borderRadius: '50%', transform: 'translate(40%, -40%)', zIndex: 0 }} />
      <span className="gc-arrow" style={{ zIndex: 2 }}>↗</span>
      {showLabel && <div className="gc-lbl" style={{ zIndex: 2 }}>{cap.label}</div>}
      <div className="gc-name" style={{ zIndex: 2 }}>{cap.nombre}</div>
      <div className="gc-caps" style={{ zIndex: 2 }}>
        {cap.alcances.slice(0, 4).map(a => (
          <div key={a.key} className="gc-cap">
            <span className="gc-cap-dot" style={{ background: a.color, boxShadow: `0 0 8px ${a.color}60` }} />
            {a.nombre}
            {a.badge && <span style={{ fontSize: 9, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '2px 6px', borderRadius: 4, marginLeft: 3, fontFamily: 'Manrope, sans-serif' }}>{a.badge}</span>}
          </div>
        ))}
        {cap.alcances.length > 4 && (
          <div className="gc-cap" style={{ background: `linear-gradient(135deg, ${cap.color}20 0%, ${cap.color}08 100%)`, color: cap.color, border: `1px solid ${cap.color}40`, fontWeight: 700 }}>
            +{cap.alcances.length - 4} más
          </div>
        )}
      </div>
      <div className="gc-foot" style={{ zIndex: 2 }}>
        <div>
          <div className="gc-count" style={{ fontSize: 28, fontWeight: 900, color: cap.color }}>{total}</div>
          <div className="gc-count-lbl">iniciativas Q{q}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {total > 0 && (
            <div style={{ width: '100%', height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: `linear-gradient(90deg, #065F46 0%, ${cap.color} 100%)`, width: `${completionRate}%`, transition: 'width 0.3s ease' }} />
            </div>
          )}
          {done > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '5px 10px', borderRadius: 8, fontFamily: 'Manrope, sans-serif' }}>
              ✓ {done} listas
            </span>
          )}
          {wip > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, background: '#DBEAFE', color: '#1D4ED8', padding: '5px 10px', borderRadius: 8, fontFamily: 'Manrope, sans-serif' }}>
              ◐ {wip} en curso
            </span>
          )}
        </div>
      </div>
      <span className="gc-detail" style={{ zIndex: 2 }}>Ver roadmap &#8594;</span>
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
      <div className="page-intro" style={{ background: 'linear-gradient(135deg, #F0F4FF 0%, #E0E7FF 100%)', borderRadius: 20, padding: 32, marginBottom: 32, border: '1px solid #D6E0FF', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, rgba(27,48,204,0.1) 0%, transparent 70%)', borderRadius: '50%', transform: 'translate(50%, -30%)' }} />
        <h1 className="page-title" style={{ fontSize: 32, letterSpacing: '-0.02em', color: '#0A1650', position: 'relative', zIndex: 1 }}>Panel del Equipo</h1>
        <p className="page-subtitle" style={{ fontSize: 15, color: '#475569', marginTop: 8, maxWidth: 600, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
          Estado actual del quarter, métricas clave y accesos rápidos a las secciones principales de tu equipo.
        </p>
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
