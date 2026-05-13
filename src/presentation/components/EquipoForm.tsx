import { useState } from 'react';
import type { Equipo } from '../../domain/types';

interface Props {
  equipo?: Equipo;
  portafolioId: string;
  onSave: (equipo: Equipo) => void;
  onCancel: () => void;
}

export default function EquipoForm({ equipo, portafolioId, onSave, onCancel }: Props) {
  const [nombre, setNombre] = useState(equipo?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(equipo?.descripcion ?? '');

  const handleSave = () => {
    if (!nombre.trim()) {
      alert('El nombre del equipo es requerido');
      return;
    }
    onSave({
      id: equipo?.id ?? `eq_${portafolioId}_${Date.now()}`,
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      portafolioId,
      activo: equipo?.activo,
    });
  };

  return (
    <div style={{ width: 'min(92vw, 560px)', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.22)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef2f7', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#1f2937' }}>
          {equipo ? 'Editar Equipo' : 'Crear Equipo'}
        </h2>
        <button onClick={onCancel} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: 20, display: 'grid', gap: 14 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Nombre</label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Nombre del equipo"
            autoFocus
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Contexto</label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Descripción del equipo"
            rows={3}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #eef2f7', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onCancel} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>CANCELAR</button>
        <button onClick={handleSave} style={{ background: '#0033A0', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
          {equipo ? 'GUARDAR' : 'CREAR'}
        </button>
      </div>
    </div>
  );
}
