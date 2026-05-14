import { useState } from 'react';
import type { AppData, Presentacion } from '../../domain/types';
import { getPresentaciones, seedPresentacionesIfEmpty } from '../../application/services/presentacionService';
import PresentacionPresentation from '../components/PresentacionPresentation';

function loadPresentaciones(): Presentacion[] {
  seedPresentacionesIfEmpty();
  return getPresentaciones().slice().sort(
    (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
  );
}

export default function PresentacionesPage({ data }: { data: AppData }) {
  const [presentaciones] = useState<Presentacion[]>(loadPresentaciones);
  const [presenting, setPresenting] = useState<Presentacion | null>(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(presentaciones.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = presentaciones.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
            <table className="reviews-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '32%' }} />
                <col style={{ width: '32%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Título</th>
                  <th style={{ textAlign: 'left' }}>Descripción</th>
                  <th style={{ textAlign: 'left' }}>Capacidad</th>
                  <th style={{ textAlign: 'left' }}>Fecha</th>
                  <th style={{ textAlign: 'left' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(p => (
                  <tr key={p.id}>
                    <td style={{ verticalAlign: 'middle', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span className="review-title">{p.titulo}</span>
                    </td>
                    <td style={{ fontSize: 13, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle', textAlign: 'left' }}>{p.descripcion}</td>
                    <td style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle', textAlign: 'left' }}>{p.capacidad || '—'}</td>
                    <td style={{ fontSize: 13, whiteSpace: 'nowrap', verticalAlign: 'middle', textAlign: 'left' }}>{p.fechaCreacion ? new Date(p.fechaCreacion).toLocaleDateString('es-CL') : '—'}</td>
                    <td style={{ verticalAlign: 'middle', textAlign: 'left' }}>
                      <button
                        type="button"
                        onClick={() => setPresenting(p)}
                        style={{ fontSize: 13, color: '#0032A0', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        ▶ Presentar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          config={data.config}
          onClose={() => setPresenting(null)}
        />
      )}
    </div>
  );
}
