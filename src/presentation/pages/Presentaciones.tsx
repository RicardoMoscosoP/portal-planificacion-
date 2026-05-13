import { useState } from 'react';
import type { Presentacion } from '../../domain/types';
import { getPresentaciones } from '../../application/services/presentacionService';
import PresentacionPresentation from '../components/PresentacionPresentation';

function loadPresentaciones(): Presentacion[] {
  return getPresentaciones().slice().sort(
    (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
  );
}

export default function PresentacionesPage() {
  const [presentaciones] = useState<Presentacion[]>(loadPresentaciones);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [presenting, setPresenting] = useState<Presentacion | null>(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(presentaciones.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = presentaciones.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selected = presentaciones.find(p => p.id === selectedId) ?? null;

  return (
    <div className="page-shell">
      <div className="page-intro page-intro-row">
        <div>
          <h1 className="page-title">Presentaciones</h1>
          <p className="page-subtitle">
            {`${presentaciones.length} presentación${presentaciones.length !== 1 ? 'es' : ''} disponible${presentaciones.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ fontSize: 12, color: '#6B7A9F', textAlign: 'right', maxWidth: 320 }}>
          La creación y gestión de presentaciones se realiza desde Configuración.
        </div>
      </div>

      <div className="page-body">
        {presentaciones.length === 0 ? (
          <div className="reviews-table-container">
            <div className="reviews-empty">
              <div className="reviews-empty-icon">📊</div>
              <div className="reviews-empty-text">
                Aún no hay presentaciones configuradas.<br />
                Agrega la primera desde <span className="reviews-empty-link">Configuración → Presentaciones</span>.
              </div>
            </div>
          </div>
        ) : (
          <div className="reviews-table-container">
            <div className="reviews-header-bar">
              <span className="reviews-header-info">
                {selected ? `✓ Seleccionada: ${selected.titulo}` : '👉 Selecciona una presentación para ejecutar'}
              </span>
              <div className="reviews-header-actions">
                <button
                  type="button"
                  className="btn-execute-review"
                  onClick={() => selected && setPresenting(selected)}
                  disabled={!selected}
                >
                  ▶ Presentar
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="reviews-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>Sel.</th>
                    <th>Título</th>
                    <th>Descripción</th>
                    <th>Capacidad</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(p => {
                    const isSelected = selectedId === p.id;
                    return (
                      <tr
                        key={p.id}
                        className={isSelected ? 'selected' : ''}
                        onClick={() => setSelectedId(p.id)}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="radio"
                            name="selected-presentacion"
                            checked={isSelected}
                            onChange={() => setSelectedId(p.id)}
                            onClick={e => e.stopPropagation()}
                          />
                        </td>
                        <td><span className="review-title">{p.titulo}</span></td>
                        <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</td>
                        <td>{p.capacidad || '—'}</td>
                        <td>{p.fechaCreacion ? new Date(p.fechaCreacion).toLocaleDateString('es-CL') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="reviews-table-footer">
              <span>Página {safePage} de {totalPages}</span>
              <div className="reviews-pagination">
                <button type="button" className="btn-pagination" onClick={() => setPage(v => Math.max(1, v - 1))} disabled={safePage === 1}>← Anterior</button>
                <button type="button" className="btn-pagination" onClick={() => setPage(v => Math.min(totalPages, v + 1))} disabled={safePage === totalPages}>Siguiente →</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {presenting && (
        <PresentacionPresentation
          presentacion={presenting}
          all={presentaciones}
          onClose={() => setPresenting(null)}
        />
      )}
    </div>
  );
}
