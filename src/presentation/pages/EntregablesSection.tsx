import { useState, useEffect, useRef } from 'react';
import type { Entregable, Iniciativa } from '../../domain/types';

interface EntregablesSectionProps {
  entregables: Entregable[];
  iniciativas: Iniciativa[];
  onChange: (entregables: Entregable[]) => void;
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'Todos'];

export default function EntregablesSection({ entregables, iniciativas, onChange }: EntregablesSectionProps) {
  // Filtros
  const [selectedIni, setSelectedIni] = useState<string>('');
  const [selectedQ, setSelectedQ] = useState<string>('Todos');
  const [filtered, setFiltered] = useState<Entregable[]>([]);
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [newEnt, setNewEnt] = useState<Partial<Entregable>>({
    q: 1,
    fechaCreacion: new Date().toISOString().slice(0, 10),
    fechaInicio: '',
    fechaFin: '',
    titulo: '',
    descripcion: '',
    url: '',
    activo: true,
  });
  const prevIni = useRef<string>('');
  const prevQ = useRef<string>('Todos');

  // Filtro de entregables
  useEffect(() => {
    if (!selectedIni) { setFiltered([]); return; }
    let res = entregables.filter(e => e.iniciativaId === selectedIni);
    if (selectedQ !== 'Todos') res = res.filter(e => `Q${e.q}` === selectedQ);
    setFiltered(res);
    setSelectedRows([]);
    if (res.length === 0) setShowNoDataModal(true);
  }, [selectedIni, selectedQ, entregables]);

  // Control de cambios no guardados
  const handleChangeFiltro = (ini: string, q: string) => {
    if (unsavedChanges) {
      if (!window.confirm('Si continúas, se perderán los cambios no guardados.')) return;
      setUnsavedChanges(false);
    }
    setSelectedIni(ini);
    setSelectedQ(q);
    prevIni.current = ini;
    prevQ.current = q;
  };

  // Eliminar seleccionados
  const handleDelete = () => {
    if (selectedRows.length === 0) return;
    const next = entregables.filter(e => !selectedRows.includes(e.id));
    onChange(next);
    setUnsavedChanges(true);
    setSelectedRows([]);
  };

  // Guardar nuevo entregable
  const handleSaveNew = () => {
    if (!newEnt.titulo?.trim()) return;
    const ent: Entregable = {
      ...newEnt,
      id: `ent_${Date.now()}`,
      iniciativaId: selectedIni,
      q: Number(selectedQ.replace('Q', '')) || 1,
      activo: newEnt.activo !== false,
      url: newEnt.url || '',
      orden: filtered.length + 1,
    } as Entregable;
    onChange([ent, ...entregables]);
    setShowAddModal(false);
    setUnsavedChanges(true);
    setNewEnt({ q: 1, fechaCreacion: new Date().toISOString().slice(0, 10), fechaInicio: '', fechaFin: '', titulo: '', descripcion: '', url: '', activo: true });
  };

  // Render
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 18 }}>
      {/* Filtros superiores */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <select value={selectedIni} onChange={e => handleChangeFiltro(e.target.value, selectedQ)} style={{ minWidth: 180 }}>
          <option value="">Selecciona iniciativa</option>
          {iniciativas.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
        </select>
        <select value={selectedQ} onChange={e => handleChangeFiltro(selectedIni, e.target.value)} style={{ minWidth: 100 }}>
          {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
        </select>
        <button onClick={() => { setFiltered(entregables.filter(e => e.iniciativaId === selectedIni && (selectedQ === 'Todos' || `Q${e.q}` === selectedQ))); }} style={{ padding: '7px 18px', borderRadius: 8, background: '#2563EB', color: '#fff', fontWeight: 700, border: 'none' }}>Buscar</button>
      </div>

      {/* Mensaje sin datos */}
      {filtered.length === 0 && selectedIni && (
        <div style={{ background: '#FEF9C3', color: '#B45309', fontWeight: 700, padding: 16, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 22 }}>⚠️</span> No existen entregables
        </div>
      )}

      {/* Botones acción */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button onClick={() => setShowAddModal(true)} disabled={!selectedIni} style={{ padding: '7px 18px', borderRadius: 8, background: '#22C55E', color: '#fff', fontWeight: 700, border: 'none', opacity: selectedIni ? 1 : 0.5 }}>Agregar entregable</button>
        <button onClick={handleDelete} disabled={selectedRows.length === 0} style={{ padding: '7px 18px', borderRadius: 8, background: '#F87171', color: '#fff', fontWeight: 700, border: 'none', opacity: selectedRows.length ? 1 : 0.5 }}>Eliminar seleccionados</button>
      </div>

      {/* Grilla */}
      {filtered.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F1F5F9' }}>
              <th></th>
              <th>Orden</th>
              <th>Quarter</th>
              <th>Fecha ingreso</th>
              <th>Título</th>
              <th>Descripción</th>
              <th>URL</th>
              <th>Fecha inicio</th>
              <th>Fecha fin</th>
              <th>Mostrar</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr key={row.id} style={{ background: row.activo === false ? '#F3F4F6' : '#fff' }}>
                <td><input type="checkbox" checked={selectedRows.includes(row.id)} onChange={e => setSelectedRows(sel => e.target.checked ? [...sel, row.id] : sel.filter(id => id !== row.id))} /></td>
                <td>{row.orden ?? idx + 1}</td>
                <td>{`Q${row.q}`}</td>
                <td>{row.fechaCreacion}</td>
                <td>{row.titulo}</td>
                <td>{row.descripcion}</td>
                <td>{row.url ? <a href={row.url} target="_blank" rel="noopener noreferrer">🔗</a> : '-'}</td>
                <td>{row.fechaInicio}</td>
                <td>{row.fechaFin}</td>
                <td>{row.activo !== false ? 'Sí' : 'No'}</td>
                <td>
                  <button onClick={() => { if (idx > 0) { const up = [...filtered]; [up[idx-1], up[idx]] = [up[idx], up[idx-1]]; setFiltered(up); setUnsavedChanges(true); } }} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: '#64748B', fontSize: 16, marginRight: 2 }}>▲</button>
                  <button onClick={() => { if (idx < filtered.length - 1) { const down = [...filtered]; [down[idx+1], down[idx]] = [down[idx], down[idx+1]]; setFiltered(down); setUnsavedChanges(true); } }} disabled={idx === filtered.length - 1} style={{ background: 'none', border: 'none', cursor: idx === filtered.length - 1 ? 'not-allowed' : 'pointer', color: '#64748B', fontSize: 16 }}>▼</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal sin datos */}
      {showNoDataModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fffbe8', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #0002', textAlign: 'center' }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>⚠️</div>
            <div style={{ fontWeight: 700, color: '#B45309', marginBottom: 12 }}>No existen entregables</div>
            <div style={{ color: '#B45309', marginBottom: 18 }}>Puedes crear el primer entregable usando el botón correspondiente.</div>
            <button onClick={() => setShowNoDataModal(false)} style={{ padding: '8px 22px', borderRadius: 8, background: '#FDE68A', color: '#B45309', fontWeight: 700, border: 'none' }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal alta entregable */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 340, boxShadow: '0 2px 16px #0002' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Nuevo entregable</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label>Quarter
                <select value={`Q${newEnt.q}`} onChange={e => setNewEnt(ent => ({ ...ent, q: Number(e.target.value.replace('Q', '')) }))}>
                  {['Q1','Q2','Q3','Q4'].map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </label>
              <label>Fecha ingreso
                <input type="date" value={newEnt.fechaCreacion || ''} onChange={e => setNewEnt(ent => ({ ...ent, fechaCreacion: e.target.value }))} />
              </label>
              <label>Título
                <input value={newEnt.titulo || ''} onChange={e => setNewEnt(ent => ({ ...ent, titulo: e.target.value }))} />
              </label>
              <label>Contexto / Descripción
                <textarea value={newEnt.descripcion || ''} onChange={e => setNewEnt(ent => ({ ...ent, descripcion: e.target.value }))} rows={2} />
              </label>
              <label>URL del entregable
                <input value={newEnt.url || ''} onChange={e => setNewEnt(ent => ({ ...ent, url: e.target.value }))} />
              </label>
              <label>Fecha inicio
                <input type="date" value={newEnt.fechaInicio || ''} onChange={e => setNewEnt(ent => ({ ...ent, fechaInicio: e.target.value }))} />
              </label>
              <label>Fecha fin
                <input type="date" value={newEnt.fechaFin || ''} onChange={e => setNewEnt(ent => ({ ...ent, fechaFin: e.target.value }))} />
              </label>
              <label>Mostrar entregable
                <input type="checkbox" checked={newEnt.activo !== false} onChange={e => setNewEnt(ent => ({ ...ent, activo: e.target.checked }))} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={handleSaveNew} style={{ padding: '8px 22px', borderRadius: 8, background: '#22C55E', color: '#fff', fontWeight: 700, border: 'none' }}>Guardar</button>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '8px 22px', borderRadius: 8, background: '#F3F4F6', color: '#334155', fontWeight: 700, border: 'none' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
