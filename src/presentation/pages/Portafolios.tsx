
import { useEffect, useState } from 'react';
import type { Portafolio, Usuario, Equipo } from '../../domain/types';
import PortafolioForm from '../components/PortafolioForm';



interface Props {
  portafolios: Portafolio[];
  onSelectEquipo: (equipo: Equipo & { config?: boolean }) => void;
  isAdmin?: boolean;
  onPortafolioCreated?: (portafolio: Portafolio) => void;
  usuario?: Usuario;
}

export default function Portafolios({ portafolios, onSelectEquipo, isAdmin = false, onPortafolioCreated, usuario: _usuario }: Props) {
  const [listaPortafolios, setListaPortafolios] = useState<Portafolio[]>(portafolios);
  const [enModo, setEnModo] = useState<'ver' | 'administrar'>('ver');
  const [portafolioSeleccionado, setPortafolioSeleccionado] = useState<Portafolio | null>(null);
  const [modal, setModal] = useState<{ open: boolean; msg: string; error?: boolean } | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [portafolioEditando, setPortafolioEditando] = useState<Portafolio | null>(null);

  // Sincronizar cuando el prop cambia (ej: recarga desde Firestore)
  useEffect(() => {
    setListaPortafolios(portafolios);
  }, [portafolios]);

  const persistirPortafolios = (nuevaLista: Portafolio[]) => {
    setListaPortafolios(nuevaLista);
  };

  const handleGuardarPortafolio = (portafolioGuardado: Portafolio) => {
    if (portafolioEditando) {
      const nuevaLista = listaPortafolios.map(p => p.id === portafolioGuardado.id ? portafolioGuardado : p);
      persistirPortafolios(nuevaLista);
      setPortafolioEditando(null);
    } else {
      const nuevaLista = [...listaPortafolios, portafolioGuardado];
      persistirPortafolios(nuevaLista);
      onPortafolioCreated?.(portafolioGuardado);
    }
    setMostrarFormulario(false);
  };

  const handleToggleActivo = (portafolioId: string) => {
    const portafolio = listaPortafolios.find(p => p.id === portafolioId);
    if (!portafolio) return;

    const estado = portafolio.activo !== false ? 'desactivar' : 'activar';
    if (confirm(`¿Deseas ${estado} este portafolio?`)) {
      const nuevaLista = listaPortafolios.map(p =>
        p.id === portafolioId ? { ...p, activo: portafolio.activo === false } : p
      );
      persistirPortafolios(nuevaLista);
    }
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
  // El control de acceso (@blue.cl) se maneja en App.tsx — no se duplica aquí
  const isCorporate = true;

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#f1f5f9', color: '#1f2937' }}>
      <main style={{ minHeight: '100vh' }}>
        <header style={{ background: 'linear-gradient(135deg, #0A1650 0%, #0032A0 100%)', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 2px 16px rgba(0,50,160,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2, fontFamily: 'Manrope, sans-serif' }}>Blue Express</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', fontWeight: 600, marginTop: 1 }}>
                {portafolioSeleccionado ? `Equipos · ${portafolioSeleccionado.nombre}` : 'Portafolios'}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 11, color: isAdmin ? '#fff' : 'rgba(255,255,255,0.65)', background: isAdmin ? '#2563eb' : 'rgba(255,255,255,0.08)', border: `1px solid ${isAdmin ? 'transparent' : 'rgba(255,255,255,0.14)'}`, borderRadius: 8, padding: '5px 12px', fontWeight: 700, textTransform: 'uppercase' as const, fontFamily: 'Manrope, sans-serif', letterSpacing: '0.06em' }}>
            {isAdmin ? 'Admin' : 'Usuario'}
          </span>
        </header>

        <section style={{ padding: 32 }}>
          {enModo === 'ver' ? (
            <>
              {!portafolioSeleccionado ? (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>Portafolios</h1>
                    <p style={{ fontSize: 14, color: '#94a3b8', margin: '6px 0 0' }}>Selecciona un portafolio para ver sus equipos.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
                    {portafoliosActivos.map((portafolio) => (
                      <button
                        key={portafolio.id}
                        type="button"
                        onClick={() => setPortafolioSeleccionado(portafolio)}
                        style={{ background: '#fff', border: '1px solid #D8DEF0', borderRadius: 16, padding: 20, textAlign: 'left', cursor: 'pointer', boxShadow: '0 10px 28px rgba(15,23,42,0.06)', transition: 'transform 0.15s, box-shadow 0.15s', display: 'block', width: '100%' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 18px 38px rgba(0,50,160,0.13)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(15,23,42,0.06)'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                          <div style={{ width: 46, height: 46, borderRadius: 14, background: '#0032A018', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                            ▦
                          </div>
                          <div>
                            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0032A0', marginBottom: 4 }}>Portafolio</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1C40' }}>{portafolio.nombre}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#475569', marginBottom: 14, minHeight: 40 }}>
                          {portafolio.descripcion ?? 'Sin descripción'}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: '#F8FAFC', color: '#0032A0', fontSize: 11, fontWeight: 700, border: '1px solid #E2E8F0' }}>
                          Ver Equipos →
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => setPortafolioSeleccionado(null)} style={{ marginBottom: 18, background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← Volver a Portafolios</button>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1f2937', margin: '0 0 18px' }}>Equipos de {portafolioSeleccionado.nombre}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
                    {portafolioSeleccionado.equipos.map((equipo) => (
                      <div key={equipo.id} style={{ background: '#fff', border: '1px solid #D8DEF0', borderRadius: 16, padding: 20, boxShadow: '0 10px 28px rgba(15,23,42,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                          <div style={{ width: 46, height: 46, borderRadius: 14, background: '#7C3AED18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📦</div>
                          <div>
                            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C3AED', marginBottom: 4 }}>Equipo</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1C40' }}>{equipo.nombre}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#475569', marginBottom: 14, minHeight: 36 }}>{equipo.descripcion ?? 'Sin descripción'}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => onSelectEquipo(equipo)}
                            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 18px', borderRadius: 999, background: '#0032A0', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
                          >
                            Ir al sitio
                          </button>
                          {isCorporate && (
                            <button
                              onClick={() => onSelectEquipo({ ...equipo, config: true })}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 18px', borderRadius: 999, background: '#F8FAFC', color: '#7C3AED', fontSize: 12, fontWeight: 700, border: '1px solid #E2E8F0', cursor: 'pointer' }}
                            >
                              ⚙ Config
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
