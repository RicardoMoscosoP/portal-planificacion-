import { useState } from 'react';
import type { Entregable, Iniciativa, Capacidad } from '../../domain/types';

interface EditableEntregablesGridProps {
  entregables: Entregable[];
  iniciativas: Iniciativa[];
  capacidades: Capacidad[];
  onChange: (entregables: Entregable[]) => void;
}

export default function EditableEntregablesGrid({ entregables, iniciativas, capacidades, onChange }: EditableEntregablesGridProps) {
  const [rows, setRows] = useState<Entregable[]>(entregables);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<Entregable>({
    id: '',
    iniciativaId: '',
    q: 1,
    titulo: '',
    descripcion: '',
    fechaCreacion: new Date().toISOString().slice(0, 10),
    fechaInicio: '',
    fechaFin: '',
    activo: true,
  });

  const handleAdd = () => setAdding(true);
  const handleCancel = () => { setAdding(false); setNewRow({ ...newRow, id: '', iniciativaId: '', titulo: '', descripcion: '', fechaCreacion: new Date().toISOString().slice(0, 10), fechaInicio: '', fechaFin: '', activo: true }); };
  const handleInput = (field: keyof Entregable, value: any) => setNewRow(prev => ({ ...prev, [field]: value }));
  const handleSave = () => {
    const rowToAdd = { ...newRow, id: `ent_${Date.now()}` };
    const next = [rowToAdd, ...rows];
    setRows(next);
    setAdding(false);
    setNewRow({ ...newRow, id: '', iniciativaId: '', titulo: '', descripcion: '', fechaCreacion: new Date().toISOString().slice(0, 10), fechaInicio: '', fechaFin: '', activo: true });
    onChange(next);
  };
  const moveRow = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= rows.length) return;
    const updated = [...rows];
    const [removed] = updated.splice(index, 1);
    updated.splice(newIndex, 0, removed);
    setRows(updated);
    onChange(updated);
  };
  const handleDelete = () => {
    if (!selectedId) return;
    const next = rows.filter(row => row.id !== selectedId);
    setRows(next);
    setSelectedId(null);
    onChange(next);
  };

  return (
    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 12, maxWidth: '100%', minWidth: 1400 }}>
      {/* Fila de inputs para agregar */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#F1F5F9' }}>
            <th></th>
            <th></th>
            <th>Q</th>
            <th>Fecha ingreso</th>
            <th>Capacidad</th>
            <th>Fecha desde</th>
            <th>Fecha hasta</th>
            <th>Iniciativa</th>
            <th>Título</th>
            <th>Descripción</th>
            <th>Visible</th>
          </tr>
          <tr>
            <td colSpan={2}>
              {!adding ? (
                <button onClick={handleAdd} style={{ padding: '6px 14px', borderRadius: 8, background: '#E0E7FF', border: 'none', fontWeight: 700, color: '#1E293B' }}>+ Agregar entregable</button>
              ) : (
                <>
                  <button onClick={handleSave} style={{ padding: '6px 14px', borderRadius: 8, background: '#22C55E', border: 'none', fontWeight: 700, color: '#fff', marginRight: 6 }}>Guardar</button>
                  <button onClick={handleCancel} style={{ padding: '6px 14px', borderRadius: 8, background: '#F3F4F6', border: 'none', fontWeight: 700, color: '#334155' }}>Cancelar</button>
                </>
              )}
            </td>
            <td>
              <select disabled={!adding} value={newRow.q} onChange={e => handleInput('q', Number(e.target.value))}>
                {[1,2,3,4].map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </td>
            <td>
              <input disabled={!adding} type="date" value={newRow.fechaCreacion || ''} onChange={e => handleInput('fechaCreacion', e.target.value)} />
            </td>
            <td>
              <select disabled={!adding} value={newRow.iniciativaId} onChange={e => handleInput('iniciativaId', e.target.value)}>
                <option value="">--</option>
                {iniciativas.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
              </select>
            </td>
            <td>
              <input disabled={!adding} type="date" value={newRow.fechaInicio || ''} onChange={e => handleInput('fechaInicio', e.target.value)} />
            </td>
            <td>
              <input disabled={!adding} type="date" value={newRow.fechaFin || ''} onChange={e => handleInput('fechaFin', e.target.value)} />
            </td>
            <td>
              {/* Ya cubierto arriba, se elimina este select duplicado */}
            </td>
            <td>
              <input disabled={!adding} value={newRow.titulo} onChange={e => handleInput('titulo', e.target.value)} style={{ width: 120 }} />
            </td>
            <td>
              <input disabled={!adding} value={newRow.descripcion || ''} onChange={e => handleInput('descripcion', e.target.value)} style={{ width: 160 }} />
            </td>
            <td>
              <input disabled={!adding} type="checkbox" checked={newRow.activo !== false} onChange={e => handleInput('activo', e.target.checked)} />
            </td>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const ini = iniciativas.find(i => i.id === row.iniciativaId);
            const cap = ini ? capacidades.find(c => c.key === ini.producto) : capacidades[0];
            return (
              <tr key={row.id} style={{ background: row.activo === false ? '#F3F4F6' : '#fff' }}>
                <td style={{ minWidth: 36 }}>
                  <button onClick={() => moveRow(idx, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: '#64748B', fontSize: 16, marginRight: 2 }} title="Subir">▲</button>
                  <button onClick={() => moveRow(idx, 1)} disabled={idx === rows.length - 1} style={{ background: 'none', border: 'none', cursor: idx === rows.length - 1 ? 'not-allowed' : 'pointer', color: '#64748B', fontSize: 16 }} title="Bajar">▼</button>
                </td>
                <td>
                  <input type="radio" name="entregable-select" checked={selectedId === row.id} onChange={() => setSelectedId(row.id)} />
                </td>
                <td>{row.q}</td>
                <td>{row.fechaCreacion}</td>
                <td>{cap?.nombre || ''}</td>
                <td>{row.fechaInicio}</td>
                <td>{row.fechaFin}</td>
                <td>{iniciativas.find(i => i.id === row.iniciativaId)?.nombre || ''}</td>
                <td>{row.titulo}</td>
                <td>{row.descripcion}</td>
                <td>{row.activo !== false ? 'Sí' : 'No'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
        <button onClick={handleDelete} disabled={!selectedId} style={{ padding: '7px 18px', borderRadius: 8, background: '#F87171', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, opacity: selectedId ? 1 : 0.5, cursor: selectedId ? 'pointer' : 'not-allowed' }}>Eliminar seleccionado</button>
      </div>
    </div>
  );
}
