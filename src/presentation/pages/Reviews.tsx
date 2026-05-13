import { useState } from 'react';
import type { AppData, Review } from '../../domain/types';
import { getReviews } from '../../application/services/dataService';
import { getReviewDisplayName, getReviewSourceLabel } from '../../application/services/reviewUtils';
import ReviewPresentation from '../components/ReviewPresentation';
import '../styles/reviews.css';

function loadReviews(): Review[] {
  return getReviews().filter(review => review.activo !== false && review.estado === 'publicada');
}

export default function Reviews({ data }: { data: AppData }) {
  const [reviews] = useState<Review[]>(() => loadReviews().slice().reverse());
  const [presentationReview, setPresentationReview] = useState<Review | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedReviews = reviews.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedReview = reviews.find(review => review.id === selectedReviewId) ?? null;

  return (
    <div className="page-shell reviews-page reviews-contenedor">
      <div className="page-intro page-intro-row">
        <div>
          <h1 className="page-title">Reviews</h1>
          <p className="page-subtitle">
            {`${reviews.length} review${reviews.length !== 1 ? 's' : ''} publicada${reviews.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ fontSize: 12, color: '#6B7A9F', textAlign: 'right', maxWidth: 320 }}>
          La creación y preparación de reviews se realiza desde Preparar Review.
        </div>
      </div>

      <div className="page-body reviews-body">
        {reviews.length === 0 ? (
          <div className="reviews-table-container">
            <div className="reviews-empty">
              <div className="reviews-empty-icon">📋</div>
              <div className="reviews-empty-text">
                Aún no hay reviews publicadas.<br />
                Crea la primera desde <span className="reviews-empty-link">Preparar Review</span>.
              </div>
            </div>
          </div>
        ) : (
          <div className="reviews-table-container">
            <div className="reviews-header-bar">
              <span className="reviews-header-info">
                {selectedReview ? `✓ Seleccionada: ${getReviewDisplayName(selectedReview)}` : '👉 Selecciona una review para ejecutar'}
              </span>
              <div className="reviews-header-actions">
                <button
                  type="button"
                  className="btn-execute-review"
                  onClick={() => selectedReview && setPresentationReview(selectedReview)}
                  disabled={!selectedReview}
                >
                  ▶ Presentar
                </button>
                {selectedReview?.embedUrl && (
                  <a
                    href={selectedReview.embedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-execute-review"
                    style={{ textDecoration: 'none', opacity: 1 }}
                  >
                    ↗ Abrir en pestaña
                  </a>
                )}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="reviews-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>Sel.</th>
                    <th>Título</th>
                    <th>Q</th>
                    <th>Sprint</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Panel</th>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedReviews.map(review => {
                    const selected = selectedReviewId === review.id;
                    return (
                    <tr
                      key={review.id}
                      className={selected ? 'selected' : ''}
                      onClick={() => setSelectedReviewId(review.id)}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="radio"
                          name="selected-public-review"
                          checked={selected}
                          onChange={() => setSelectedReviewId(review.id)}
                          onClick={event => event.stopPropagation()}
                        />
                      </td>
                      <td><span className="review-title">{getReviewDisplayName(review)}</span></td>
                      <td>{review.q}</td>
                      <td>{review.sprint || '—'}</td>
                      <td>{review.fecha || 'Sin fecha'}</td>
                      <td>
                        <span className={`review-type-badge ${review.fuente === 'embebida' || review.embedUrl ? 'external' : 'internal'}`}>
                          {getReviewSourceLabel(review)}
                        </span>
                      </td>
                      <td>
                        {review.jiraPanelUrl ? (
                          <a href={review.jiraPanelUrl} target="_blank" rel="noreferrer" className="review-panel-link">🔗 Abrir</a>
                        ) : '—'}
                      </td>
                      <td onClick={event => event.stopPropagation()}>
                        {review.embedUrl ? (
                          <a href={review.embedUrl} target="_blank" rel="noreferrer" className="review-panel-link">↗ Abrir</a>
                        ) : '—'}
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
            <div className="reviews-table-footer">
              <span>Página {safePage} de {totalPages}</span>
              <div className="reviews-pagination">
                <button
                  type="button"
                  className="btn-pagination"
                  onClick={() => setPage(value => Math.max(1, value - 1))}
                  disabled={safePage === 1}
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  className="btn-pagination"
                  onClick={() => setPage(value => Math.min(totalPages, value + 1))}
                  disabled={safePage === totalPages}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {presentationReview && (
        <ReviewPresentation review={presentationReview} data={data} onClose={() => setPresentationReview(null)} />
      )}
    </div>
  );
}

