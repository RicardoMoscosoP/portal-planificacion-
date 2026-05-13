import { useEffect, useState } from 'react';
import type { Equipo, Portafolio } from '../../domain/types';
import EquipoForm from '../components/EquipoForm';

interface Props {
  portafolio: Portafolio;
  isAdmin?: boolean;
  onSelectEquipo: (equipoId: string) => void;
  onConfigEquipo?: (equipoId: string) => void;
  onBack: () => void;
}

export default function Equipos({ portafolio, isAdmin = false, onSelectEquipo, onConfigEquipo, onBack }: Props) {
  const [listaEquipos, setListaEquipos] = useState<Equipo[]>(portafolio.equipos ?? []);
  const [enModo, setEnModo] = useState<'ver' | 'administrar'>('ver');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState<Equipo | null>(null);

  useEffect(() => {
    setListaEquipos(portafolio.equipos ?? []);
    setEnModo('ver');
  }, [portafolio]);

  const equiposActivos = listaEquipos.filter((e) => e.activo !== false);

  const persistirEquipos = (nuevosEquipos: Equipo[]) => {
    setListaEquipos(nuevosEquipos);

    try {
      const stored = localStorage.getItem('be_portafolios_custom');
      if (!stored) {
        localStorage.setItem('be_portafolios_custom', JSON.stringify([{ ...portafolio, equipos: nuevosEquipos }]));
        return;
      }

      const lista = JSON.parse(stored) as Portafolio[];
      const nuevaLista = lista.map((p) =>
        p.id === portafolio.id ? { ...p, equipos: nuevosEquipos } : p
      );
      localStorage.setItem('be_portafolios_custom', JSON.stringify(nuevaLista));
    } catch {
      // noop
    }
  };

  const abrirCrearEquipo = () => {
    setEquipoEditando(null);
    setMostrarFormulario(true);
  };

  const abrirEditarEquipo = (equipo: Equipo) => {
    setEquipoEditando(equipo);
    setMostrarFormulario(true);
  };

  const handleGuardarEquipo = (equipo: Equipo) => {
    if (equipoEditando) {
      const nuevaLista = listaEquipos.map((e) => (e.id === equipo.id ? equipo : e));
      persistirEquipos(nuevaLista);
      setEquipoEditando(null);
      setMostrarFormulario(false);
      return;
    }

    persistirEquipos([...listaEquipos, { ...equipo, activo: true }]);
    setMostrarFormulario(false);
  };

  const handleToggleActivo = (equipoId: string) => {
    const equipo = listaEquipos.find((e) => e.id === equipoId);
    if (!equipo) return;

    const accion = equipo.activo === false ? 'activar' : 'desactivar';
    if (!confirm(`¿Deseas ${accion} este equipo?`)) return;

    const nuevaLista = listaEquipos.map((e) =>
      e.id === equipoId ? { ...e, activo: e.activo === false } : e
    );

    persistirEquipos(nuevaLista);
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#f1f5f9' }}>
      <main style={{ minHeight: '100vh' }}>
        <header style={{ background: 'linear-gradient(135deg, #0A1650 0%, #0032A0 100%)', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 2px 16px rgba(0,50,160,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.10)', border: '1.5px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#2BB8D4', fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em', flexShrink: 0 }}>
              BX
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Blue Express</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', fontWeight: 600, marginTop: 1 }}>Equipos · {portafolio.nombre}</div>
            </div>
          </div>
          <span style={{ fontSize: 11, color: isAdmin ? '#fff' : 'rgba(255,255,255,0.65)', background: isAdmin ? '#2563eb' : 'rgba(255,255,255,0.08)', border: `1px solid ${isAdmin ? 'transparent' : 'rgba(255,255,255,0.14)'}`, borderRadius: 8, padding: '5px 12px', fontWeight: 700, textTransform: 'uppercase' as const, fontFamily: 'Manrope, sans-serif', letterSpacing: '0.06em' }}>
            {isAdmin ? 'Admin' : 'Usuario'}
          </span>
        </header>

        <section style={{ padding: 32 }}>
          <button onClick={onBack} style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 800, fontSize: 12, cursor: 'pointer', marginBottom: 10 }}>
            ← VOLVER
          </button>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>Equipos: {portafolio.nombre}</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>{portafolio.descripcion ?? 'Selecciona un equipo para continuar.'}</p>

          {isAdmin && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, margin: '14px 0 18px' }}>
              <button
                onClick={() => setEnModo(enModo === 'ver' ? 'administrar' : 'ver')}
                style={{ background: enModo === 'ver' ? '#0033A0' : '#f8fafc', color: enModo === 'ver' ? '#fff' : '#475569', border: '1px solid #d7e1f3', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                {enModo === 'ver' ? '⚙ Mantener Equipos' : '↩ Vista Equipos'}
              </button>
              {enModo === 'administrar' && (
                <button
                  onClick={abrirCrearEquipo}
                  style={{ background: '#0033A0', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                >
                  + Crear Equipo
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
            {(enModo === 'ver' ? equiposActivos : listaEquipos).map((equipo) => (
              <div key={equipo.id} style={{ background: '#fff', border: '1px solid #D8DEF0', borderRadius: 16, padding: 20, boxShadow: '0 10px 28px rgba(15,23,42,0.06)', opacity: enModo === 'administrar' && equipo.activo === false ? 0.55 : 1, transition: 'box-shadow 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: '#0032A018', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    📦
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#0032A0', marginBottom: 4 }}>Equipo</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1C40' }}>{equipo.nombre}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#475569', marginBottom: 16, minHeight: 40 }}>{equipo.descripcion ?? 'Sin descripción'}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {enModo === 'ver' ? (
                    <>
                      <button
                        onClick={() => onSelectEquipo(equipo.id)}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 18px', borderRadius: 999, background: '#0032A0', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
                      >
                        Ir al sitio →
                      </button>
                      {isAdmin && onConfigEquipo && (
                        <button
                          onClick={() => onConfigEquipo(equipo.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 18px', borderRadius: 999, background: '#F8FAFC', color: '#0032A0', fontSize: 12, fontWeight: 700, border: '1px solid #D8DEF0', cursor: 'pointer' }}
                        >
                          ⚙
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => abrirEditarEquipo(equipo)}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: 999, background: '#F8FAFC', color: '#475569', border: '1px solid #D8DEF0', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActivo(equipo.id)}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: 999, background: '#F8FAFC', color: equipo.activo === false ? '#059669' : '#ef4444', border: '1px solid #D8DEF0', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {equipo.activo === false ? 'Activar' : 'Desactivar'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {enModo === 'ver' && equiposActivos.length === 0 && (
            <div style={{ marginTop: 32, padding: '24px 28px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, maxWidth: 480 }}>
              <p style={{ fontWeight: 800, color: '#92400e', fontSize: 15, margin: '0 0 8px' }}>⚠️ No hay equipos cargados</p>
              <p style={{ color: '#78350f', fontSize: 13, margin: 0 }}>
                Este portafolio no tiene equipos activos en Firestore.<br />
                Usa el <strong>AdminPanel</strong> (botón arriba a la derecha en la pantalla de Portafolios) para poblar los equipos desde los datos de prueba.
              </p>
            </div>
          )}
          {enModo === 'administrar' && listaEquipos.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 18 }}>Aún no existen equipos para este portafolio.</p>
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
            <EquipoForm
              equipo={equipoEditando || undefined}
              portafolioId={portafolio.id}
              onSave={handleGuardarEquipo}
              onCancel={() => setMostrarFormulario(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}