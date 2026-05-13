import { useState } from 'react';
import type { AppData, Presentacion } from '../../domain/types';
import {
  getPresentaciones,
  addPresentacion,
  updatePresentacion,
  deletePresentacion,
} from '../../application/services/presentacionService';
import { BX_MODAL_OVERLAY_STYLE, BX_MODAL_PANEL_STYLE } from './modalStyles';

type FormState = {
  titulo: string;
  descripcion: string;
  capacidad: string;
  url: string;
  fechaCreacion: string;
};

const EMPTY_FORM: FormState = {
  titulo: '',
  descripcion: '',
  capacidad: '',
  url: '',
  fechaCreacion: new Date().toISOString().slice(0, 10),
};

interface Props {
  data: AppData;
  onSaved?: () => void;
}

export default function PresentacionesAdminSection({ data, onSaved }: Props) {
  const [list, setList] = useState<Presentacion[]>(getPresentaciones);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Presentacion | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<Presentacion | null>(null);
  const [error, setError] = useState('');

  const capacidades = [...data.capacidades].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));

  const inputStyle: React.CSSProperties = {
    padding: '7px 11px', border: '1px solid var(--border)', borderRadius: 7,
    fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
  };

  const reload = () => setList(getPresentaciones());

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (p: Presentacion) => {
    setEditing(p);
    setForm({
      titulo: p.titulo,
      descripcion: p.descripcion,
      capacidad: p.capacidad ?? '',
      url: p.url,
      fechaCreacion: p.fechaCreacion.slice(0, 10),
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setError('');
  };

  const handleSave = () => {
    if (!form.titulo.trim()) { setError('El Título es obligatorio.'); return; }
    if (!form.url.trim()) { setError('La URL es obligatoria.'); return; }

    const item: Presentacion = {
      id: editing?.id ?? `pres_${Date.now()}`,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      capacidad: form.capacidad || undefined,
      url: form.url.trim(),
      fechaCreacion: form.fechaCreacion
        ? new Date(form.fechaCreacion).toISOString()
        : new Date().toISOString(),
    };

    if (editing) {
      updatePresentacion(item);
    } else {
      addPresentacion(item);
    }
    reload();
    closeForm();
    onSaved?.();
  };

  const confirmDoDelete = () => {
    if (!confirmDelete) return;
    deletePresentacion(confirmDelete.id);
    reload();
    setConfirmDelete(null);
    onSaved?.();
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Presentaciones</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        Gestiona las presentaciones embebidas disponibles en el sitio.
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="f-add-btn" onClick={openNew}>+ Crear presentación</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFF' }}>
                {['Fecha', 'Título', 'Descripción', 'Capacidad', 'URL', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '26px 14px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                    No hay presentaciones configuradas.
                  </td>
                </tr>
              )}
              {list.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #EEF2F7', whiteSpace: 'nowrap', fontSize: 12, color: '#475569' }}>
                    {new Date(p.fechaCreacion).toLocaleDateString('es-CL')}
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #EEF2F7', fontWeight: 600, color: '#0F1C40' }}>
                    {p.titulo}
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #EEF2F7', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569', fontSize: 12 }}>
                    {p.descripcion || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #EEF2F7', fontSize: 12, color: '#475569' }}>
                    {p.capacidad
                      ? <span style={{ background: '#E8F0FF', color: '#1D3A9F', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{p.capacidad}</span>
                      : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #EEF2F7', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0032A0', fontSize: 12 }}>🔗 Ver</a>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #EEF2F7', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(p)} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 6, border: '1px solid #c7d2e8', background: '#f0f7ff', color: '#0032A0', cursor: 'pointer', marginRight: 6 }}>Editar</button>
                    <button onClick={() => setConfirmDelete(p)} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* â”€â”€ Modal Formulario â”€â”€ */}
      {showForm && (
        <div onClick={closeForm} style={{ ...BX_MODAL_OVERLAY_STYLE, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ ...BX_MODAL_PANEL_STYLE, width: 'min(580px, 100%)', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Cabecera modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1D4ED8', fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>
                  Admin presentaciones
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F1C40' }}>
                  {editing ? 'Editar presentación' : 'Nueva presentación'}
                </div>
              </div>
              <button type="button" onClick={closeForm} style={{ border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Campos */}
            <div style={{ padding: 22, display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
              <div>
                <div className="flbl">Título <span style={{ color: '#DC2626' }}>*</span></div>
                <input
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  style={inputStyle}
                  placeholder="Ej: Review Q2 2026 — Equipo Planificación"
                />
              </div>
              <div>
                <div className="flbl">Descripción <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></div>
                <textarea
                  rows={2}
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Resumen breve de la presentación"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="flbl">Capacidad <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></div>
                  <select
                    value={form.capacidad}
                    onChange={e => setForm(f => ({ ...f, capacidad: e.target.value }))}
                    style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}
                  >
                    <option value="">— Sin capacidad —</option>
                    {capacidades.map(c => (
                      <option key={c.key} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flbl">Fecha</div>
                  <input
                    type="date"
                    value={form.fechaCreacion}
                    onChange={e => setForm(f => ({ ...f, fechaCreacion: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <div className="flbl">URL <span style={{ color: '#DC2626' }}>*</span></div>
                <input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  style={inputStyle}
                  placeholder="https://docs.google.com/presentation/..."
                />
              </div>
            </div>

            {error && (
              <div style={{ margin: '0 22px', padding: '7px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontSize: 12 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px 22px' }}>
              <button type="button" onClick={closeForm} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Cancelar</button>
              <button type="button" className="btn-save" onClick={handleSave}>{editing ? 'Guardar cambios' : 'Guardar presentación'}</button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Confirm Delete â”€â”€ */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ ...BX_MODAL_OVERLAY_STYLE, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ ...BX_MODAL_PANEL_STYLE, width: 'min(420px, 100%)' }}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F1C40' }}>Â¿Eliminar presentación?</div>
            </div>
            <div style={{ padding: 22 }}>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Se eliminará <strong>"{confirmDelete.titulo}"</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 22px 22px' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Cancelar</button>
              <button onClick={confirmDoDelete} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
