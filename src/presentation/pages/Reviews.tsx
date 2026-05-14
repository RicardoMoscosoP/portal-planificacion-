import { useState } from 'react';
import type { AppData, Review } from '../../domain/types';
import { getReviews } from '../../application/services/dataService';
import { getReviewDisplayName } from '../../application/services/reviewUtils';
import ReviewPresentation from '../components/ReviewPresentation';
import ReviewEmbedModal from '../components/ReviewEmbedModal';
import '../styles/reviews.css';

function loadReviews(): Review[] {
  return getReviews().filter(review => review.activo !== false && review.estado === 'publicada');
}

export default function Reviews({ data }: { data: AppData }) {
  const [reviews] = useState<Review[]>(() => loadReviews().slice().reverse());
  const [embedReview, setEmbedReview] = useState<Review | null>(null);
  const [presentationReview, setPresentationReview] = useState<Review | null>(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedReviews = reviews.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Solo reviews con embedUrl para la navegación del modal
  const embedReviews = reviews.filter(r => r.embedUrl);

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
            <table className="reviews-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '28%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Título</th>
                  <th style={{ textAlign: 'left' }}>Q</th>
                  <th style={{ textAlign: 'left' }}>Sprint</th>
                  <th style={{ textAlign: 'left' }}>Fecha</th>
                  <th style={{ textAlign: 'left' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {pagedReviews.map(review => (
                  <tr key={review.id}>
                    <td style={{ verticalAlign: 'middle', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span className="review-title">{getReviewDisplayName(review)}</span>
                    </td>
                    <td style={{ fontSize: 13, verticalAlign: 'middle', textAlign: 'left' }}>{review.q || '—'}</td>
                    <td style={{ fontSize: 13, verticalAlign: 'middle', textAlign: 'left' }}>{review.sprint || '—'}</td>
                    <td style={{ fontSize: 13, whiteSpace: 'nowrap', verticalAlign: 'middle', textAlign: 'left' }}>{review.fecha || '—'}</td>
                    <td style={{ verticalAlign: 'middle', textAlign: 'left' }}>
                      <button
                        type="button"
                        onClick={() => review.embedUrl ? setEmbedReview(review) : setPresentationReview(review)}
                        style={{ fontSize: 13, color: '#0032A0', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}
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

      {embedReview && (
        <ReviewEmbedModal
          review={embedReview}
          all={embedReviews}
          config={data.config}
          onClose={() => setEmbedReview(null)}
        />
      )}
      {presentationReview && (
        <ReviewPresentation review={presentationReview} data={data} onClose={() => setPresentationReview(null)} />
      )}
    </div>
  );
}
