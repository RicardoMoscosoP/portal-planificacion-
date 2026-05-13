import { useState } from 'react';
import type { Portafolio } from '../../domain/types';

interface Props {
  onSave: (portafolio: Portafolio) => void;
  onCancel: () => void;
}

export default function CrearPortafolioForm({ onSave, onCancel }: Props) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [equipos, setEquipos] = useState<Array<{ nombre: string; descripcion: string }>>([
    { nombre: '', descripcion: '' },
  ]);

  const handleAgregarEquipo = () => {
    setEquipos([...equipos, { nombre: '', descripcion: '' }]);
  };

  const handleEliminarEquipo = (index: number) => {
    setEquipos(equipos.filter((_, i) => i !== index));
  };

  const handleEquipoChange = (index: number, field: 'nombre' | 'descripcion', value: string) => {
    const nuevosEquipos = [...equipos];
    nuevosEquipos[index][field] = value;
    setEquipos(nuevosEquipos);
  };

  const handleSave = () => {
    if (!nombre.trim()) {
      alert('El nombre del portafolio es requerido');
      return;
    }

    const equiposFiltrados = equipos.filter(e => e.nombre.trim());
    if (equiposFiltrados.length === 0) {
      alert('Debe agregar al menos un equipo');
      return;
    }

    const portafolioId = `port_${Date.now()}`;
    const portafolio: Portafolio = {
      id: portafolioId,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      equipos: equiposFiltrados.map((e, idx) => ({
        id: `eq_${portafolioId}_${idx}`,
        nombre: e.nombre.trim(),
        descripcion: e.descripcion.trim(),
        portafolioId,
      })),
    };

    onSave(portafolio);
  };

  return (
    <div style={{ maxWidth: 600, background: '#fff', borderRadius: 16, padding: 28 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: 'var(--text)' }}>
        Crear Portafolio
      </h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
        Define el nombre, descripción y los equipos que pertenecen a este portafolio
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Nombre Portafolio */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
            Nombre del Portafolio
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Portafolio Distribución"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'Manrope, sans-serif',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Descripción Portafolio */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
            Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describa el propósito del portafolio..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'Manrope, sans-serif',
              minHeight: 80,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Equipos */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
              Equipos ({equipos.length})
            </label>
            <button
              onClick={handleAgregarEquipo}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--blue)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                padding: 0,
              }}
            >
              + Agregar Equipo
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {equipos.map((equipo, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 12,
                  background: '#fafbff',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Nombre Equipo
                    </label>
                    <input
                      type="text"
                      value={equipo.nombre}
                      onChange={(e) => handleEquipoChange(idx, 'nombre', e.target.value)}
                      placeholder="Ej: Planificación del Transporte"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        fontSize: 12,
                        fontFamily: 'Manrope, sans-serif',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={equipo.descripcion}
                      onChange={(e) => handleEquipoChange(idx, 'descripcion', e.target.value)}
                      placeholder="Ej: Optimización de rutas..."
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        fontSize: 12,
                        fontFamily: 'Manrope, sans-serif',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                {equipos.length > 1 && (
                  <button
                    onClick={() => handleEliminarEquipo(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: 0,
                    }}
                  >
                    ✕ Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            border: '1px solid var(--border)',
            background: '#fff',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--muted)',
            transition: 'all 0.15s',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 24px',
            background: 'var(--blue)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
        >
          Crear Portafolio
        </button>
      </div>
    </div>
  );
}
