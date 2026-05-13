import { useState } from 'react';
import type { Portafolio } from '../../domain/types';

interface Props {
  portafolio?: Portafolio;
  onSave: (portafolio: Portafolio) => void;
  onCancel: () => void;
}

export default function PortafolioForm({ portafolio, onSave, onCancel }: Props) {
  const [nombre, setNombre] = useState(portafolio?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(portafolio?.descripcion ?? '');
  const [equipos, setEquipos] = useState(
    portafolio?.equipos?.map(e => ({ nombre: e.nombre, descripcion: e.descripcion })) ?? [
      { nombre: '', descripcion: '' },
    ]
  );

  const isEditing = !!portafolio;

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

    if (isEditing && portafolio) {
      const portafolioActualizado: Portafolio = {
        ...portafolio,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        equipos: equiposFiltrados.map((e, idx) => {
          const equipoExistente = portafolio.equipos[idx];
          return {
            id: equipoExistente?.id ?? `eq_${portafolio.id}_${idx}`,
            nombre: e.nombre.trim(),
            descripcion: (e.descripcion ?? '').trim(),
            portafolioId: portafolio.id,
          };
        }),
      };
      onSave(portafolioActualizado);
    } else {
      const portafolioId = `port_${Date.now()}`;
      const nuevoPortafolio: Portafolio = {
        id: portafolioId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        activo: true,
        equipos: equiposFiltrados.map((e, idx) => ({
          id: `eq_${portafolioId}_${idx}`,
          nombre: e.nombre.trim(),
          descripcion: (e.descripcion ?? '').trim(),
          portafolioId,
          activo: true,
        })),
      };
      onSave(nuevoPortafolio);
    }
  };

  return (
    <div style={{ width: 'min(92vw, 720px)', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.22)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef2f7', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#1f2937' }}>Editor de Datos</h2>
        <button onClick={onCancel} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: 20, display: 'grid', gap: 14 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del portafolio"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Contexto</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Optimización, foco y alcance del portafolio"
            rows={2}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ paddingTop: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2563eb', display: 'block', marginBottom: 8 }}>Equipos del Portafolio</label>
          <div style={{ display: 'grid', gap: 8 }}>
            {equipos.map((equipo, idx) => (
              <div key={idx} style={{ border: '1px solid #dbeafe', background: '#eff6ff', borderRadius: 10, padding: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={equipo.nombre}
                    onChange={(e) => handleEquipoChange(idx, 'nombre', e.target.value)}
                    placeholder="Nombre equipo"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    value={equipo.descripcion}
                    onChange={(e) => handleEquipoChange(idx, 'descripcion', e.target.value)}
                    placeholder="Contexto equipo"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}
                  />
                  {equipos.length > 1 ? (
                    <button onClick={() => handleEliminarEquipo(idx)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                      Quitar
                    </button>
                  ) : <span style={{ width: 48 }} />}
                </div>
              </div>
            ))}

            {equipos.length < 5 && (
              <button
                onClick={handleAgregarEquipo}
                style={{ width: '100%', padding: '9px 10px', border: '2px dashed #e2e8f0', background: '#fff', borderRadius: 10, color: '#94a3b8', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                + AÑADIR EQUIPO
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #eef2f7', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onCancel} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>CANCELAR</button>
        <button onClick={handleSave} style={{ background: '#0033A0', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
          {isEditing ? 'GUARDAR' : 'CREAR'}
        </button>
      </div>
    </div>
  );
}
