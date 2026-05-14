
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Portafolio, Usuario, Equipo } from '../../domain/types';
import PortafolioForm from '../components/PortafolioForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { createPortafoliosRepository } from '../../infrastructure/repositories/portafolios/PortafoliosRepositoryFactory';

// ─── Sub-component: tarjeta de portafolio con hover y acordeón ───────────────
function PortafolioCard({
  portafolio,
  abierto,
  isCorporate,
  onToggle,
  onSelectEquipo,
  teamsListRefs,
}: {
  portafolio: Portafolio;
  abierto: boolean;
  isCorporate: boolean;
  onToggle: () => void;
  onSelectEquipo: (equipo: Equipo & { config?: boolean }) => void;
  teamsListRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: hovered ? '0 12px 32px rgba(10,22,80,0.12)' : '0 4px 12px rgba(10,22,80,0.08)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        border: '1px solid #DCE7FF',
      }}
    >
      {/* Blue gradient header strip */}
      <div style={{
        background: 'linear-gradient(135deg, #0032A0 0%, #1E56A0 100%)',
        color: '#fff',
        padding: '1.5rem 2rem',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'left',
      }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: 300, height: 300, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>Unidad de Negocio</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z"/></svg>
          </div>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>{portafolio.nombre}</h3>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '1.5rem 2rem', textAlign: 'left' }}>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6, marginBottom: 28, marginTop: 0 }}>
          {portafolio.descripcion ?? 'Sin descripción'}
        </p>

        {/* Teams accordion */}
        <div style={{ borderTop: '1px solid #DCE7FF', paddingTop: 20 }}>
          <button
            type="button"
            onClick={onToggle}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginBottom: abierto ? 16 : 0, color: abierto ? '#0032A0' : '#0A1650', transition: 'color 0.2s' }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
              Equipos ({portafolio.equipos?.length ?? 0})
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.25s', transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)', color: abierto ? '#0032A0' : '#999' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div
            ref={el => { teamsListRefs.current[portafolio.id] = el; }}
            style={{ overflow: 'hidden', maxHeight: abierto ? '800px' : '0', transition: 'max-height 0.3s ease' }}
          >
            {portafolio.equipos?.map((equipo, idx) => (
              <TeamRow
                key={equipo.id}
                equipo={equipo}
                isLast={idx === (portafolio.equipos?.length ?? 0) - 1}
                isCorporate={isCorporate}
                onSelectEquipo={onSelectEquipo}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Sub-component: fila de equipo con hover ─────────────────────────────────
function TeamRow({ equipo, isLast, isCorporate, onSelectEquipo }: {
  equipo: Equipo;
  isLast: boolean;
  isCorporate: boolean;
  onSelectEquipo: (equipo: Equipo & { config?: boolean }) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: hovered ? '16px 12px' : '16px 8px',
        borderBottom: isLast ? 'none' : '1px solid #DCE7FF',
        background: hovered ? '#F5F7FA' : 'transparent',
        borderRadius: hovered ? 8 : 0,
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700, color: '#0A1650' }}>{equipo.nombre}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => onSelectEquipo(equipo)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#0032A0', color: '#fff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#00237a'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0032A0'; }}
        >
          <span>↗</span> Sitio
        </button>
        {isCorporate && (
          <button
            type="button"
            onClick={() => onSelectEquipo({ ...equipo, config: true })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#666', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'; }}
          >
            <span>⚙</span> Config
          </button>
        )}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────



interface Props {
  portafolios: Portafolio[];
  onSelectEquipo: (equipo: Equipo & { config?: boolean }) => void;
  isAdmin?: boolean;
  onPortafolioCreated?: (portafolio: Portafolio) => void;
  usuario?: Usuario;
}

export default function Portafolios({ portafolios, onSelectEquipo, isAdmin = false, onPortafolioCreated, usuario: _usuario }: Props) {
  const repo = useMemo(() => createPortafoliosRepository(), []);
  const [listaPortafolios, setListaPortafolios] = useState<Portafolio[]>(portafolios);
  const [enModo, setEnModo] = useState<'ver' | 'administrar'>('ver');
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ open: boolean; msg: string; error?: boolean } | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [portafolioEditando, setPortafolioEditando] = useState<Portafolio | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ portafolioId: string; desactivar: boolean } | null>(null);
  const teamsListRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Sincronizar cuando el prop cambia (ej: recarga desde Firestore)
  useEffect(() => {
    setListaPortafolios(portafolios);
  }, [portafolios]);

  const persistirPortafolios = (nuevaLista: Portafolio[]) => {
    setListaPortafolios(nuevaLista);
  };

  const toggleExpandido = (portafolioId: string) => {
    setExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(portafolioId)) next.delete(portafolioId);
      else next.add(portafolioId);
      return next;
    });
  };

  const handleGuardarPortafolio = (portafolioGuardado: Portafolio) => {
    if (portafolioEditando) {
      const nuevaLista = listaPortafolios.map(p => p.id === portafolioGuardado.id ? portafolioGuardado : p);
      persistirPortafolios(nuevaLista);
      setPortafolioEditando(null);
    } else {
      const portafolioConOrden = { ...portafolioGuardado, _orden: Date.now() };
      const nuevaLista = [...listaPortafolios, portafolioConOrden];
      persistirPortafolios(nuevaLista);
      onPortafolioCreated?.(portafolioConOrden);
    }
    // Persistir en Firestore vía GAS
    repo.save(portafolioGuardado).catch(() => {
      setModal({ open: true, msg: 'No se pudo guardar en Firestore. Verifica la conexión.', error: true });
    });
    setMostrarFormulario(false);
  };

  const handleToggleActivo = (portafolioId: string) => {
    const portafolio = listaPortafolios.find(p => p.id === portafolioId);
    if (!portafolio) return;
    setConfirmToggle({ portafolioId, desactivar: portafolio.activo !== false });
  };

  const ejecutarToggleActivo = () => {
    if (!confirmToggle) return;
    const { portafolioId } = confirmToggle;
    const portafolio = listaPortafolios.find(p => p.id === portafolioId);
    if (!portafolio) return;
    const portafolioActualizado = { ...portafolio, activo: portafolio.activo === false };
    const nuevaLista = listaPortafolios.map(p =>
      p.id === portafolioId ? portafolioActualizado : p
    );
    persistirPortafolios(nuevaLista);
    // Persistir en Firestore vía GAS
    repo.save(portafolioActualizado).catch(() => {
      setModal({ open: true, msg: 'No se pudo guardar en Firestore. Verifica la conexión.', error: true });
    });
    setConfirmToggle(null);
  };

  const abrirFormularioCrear = () => {
    setPortafolioEditando(null);
    setMostrarFormulario(true);
  };

  const abrirFormularioEditar = (portafolio: Portafolio) => {
    setPortafolioEditando(portafolio);
    setMostrarFormulario(true);
  };

  // Pantalla de Ver Portafolios y Equipos
  const portafoliosActivos = listaPortafolios.filter(p => p.activo !== false);
  const isCorporate = true;

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #F5F7FA 0%, #EAECF0 100%)', color: '#0A1650' }}>
      <main style={{ minHeight: '100vh' }}>
        <header style={{ background: 'linear-gradient(135deg, #0A1650 0%, #0032A0 100%)', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 2px 16px rgba(0,50,160,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2, fontFamily: 'Manrope, sans-serif' }}>Blue Express</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', fontWeight: 600, marginTop: 1 }}>Portafolios</div>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setEnModo(enModo === 'administrar' ? 'ver' : 'administrar')}
              style={{ fontSize: 11, color: '#fff', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '5px 12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}
            >
              {enModo === 'administrar' ? 'Portafolios' : 'Mantenedor'}
            </button>
          )}
        </header>

        <section style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
          {enModo === 'ver' ? (
            <>
              <div style={{ marginBottom: '3rem', textAlign: 'left' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0A1650', margin: 0, letterSpacing: '-0.5px' }}>Portafolios</h1>
                <p style={{ fontSize: '1.05rem', color: '#666', margin: '0.5rem 0 0', lineHeight: 1.5 }}>Gestiona los equipos y accesos de cada unidad operativa.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                {portafoliosActivos.map((portafolio) => {
                  const abierto = expandidos.has(portafolio.id);
                  return (
                    <PortafolioCard
                      key={portafolio.id}
                      portafolio={portafolio}
                      abierto={abierto}
                      isCorporate={isCorporate}
                      onToggle={() => toggleExpandido(portafolio.id)}
                      onSelectEquipo={onSelectEquipo}
                      teamsListRefs={teamsListRefs}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>Mantenedor</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEnModo('ver')} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: '#fff', color: '#64748b' }}>Portafolios</button>
                  <button onClick={() => setEnModo('administrar')} style={{ border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: '#eff6ff', color: '#1d4ed8' }}>Mantenedor</button>
                  <button
                    onClick={abrirFormularioCrear}
                    style={{ background: '#0033A0', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Nuevo
                  </button>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ background: '#f8fafc', color: '#94a3b8', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nombre</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Contexto</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaPortafolios.map((portafolio) => (
                      <tr key={portafolio.id} style={{ borderTop: '1px solid #f1f5f9', opacity: portafolio.activo === false ? 0.6 : 1 }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#334155' }}>{portafolio.nombre}</td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{portafolio.descripcion ?? 'Sin descripción'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={() => abrirFormularioEditar(portafolio)} style={{ border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer', marginRight: 12, fontWeight: 700 }}>Editar</button>
                          <button onClick={() => handleToggleActivo(portafolio.id)} style={{ border: 'none', background: 'transparent', color: portafolio.activo === false ? '#059669' : '#ef4444', cursor: 'pointer', fontWeight: 700 }}>
                            {portafolio.activo === false ? 'Activar' : 'Desactivar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>

      {mostrarFormulario && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setMostrarFormulario(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <PortafolioForm
              portafolio={portafolioEditando || undefined}
              onSave={handleGuardarPortafolio}
              onCancel={() => setMostrarFormulario(false)}
            />
          </div>
        </div>
      )}
      {confirmToggle && (
        <ConfirmDialog
          title={confirmToggle.desactivar ? 'Desactivar portafolio' : 'Activar portafolio'}
          message={confirmToggle.desactivar
            ? 'El portafolio quedará inactivo y no se mostrará, pero sus datos se conservan.'
            : 'El portafolio volverá a estar visible para todos los usuarios.'}
          confirmLabel={confirmToggle.desactivar ? 'Desactivar' : 'Activar'}
          danger={confirmToggle.desactivar}
          onConfirm={ejecutarToggleActivo}
          onCancel={() => setConfirmToggle(null)}
        />
      )}
    {/* Modal feedback */}
    {modal?.open && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 320, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', textAlign: 'center', border: modal.error ? '2px solid #ef4444' : '2px solid #059669' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: modal.error ? '#ef4444' : '#059669', marginBottom: 12 }}>
            {modal.error ? 'Error' : 'Éxito'}
          </div>
          <div style={{ fontSize: 15, color: '#334155', marginBottom: 8 }}>{modal.msg}</div>
          <button onClick={() => setModal(null)} style={{ marginTop: 18, background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
        </div>
      </div>
    )}
  </div>
  );
}
