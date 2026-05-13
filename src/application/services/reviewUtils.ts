import type { Review } from '../../domain/types';

export function getReviewDisplayName(review: Review): string {
  return review.sprint ? `Review SP${review.sprint}` : (review.titulo?.trim() || 'Review');
}

export function getReviewSourceLabel(review: Review): string {
  if (review.fuente === 'roadmap') return 'Roadmap general';
  if (review.fuente === 'embebida') return 'URL embebida';
  return 'Review interna';
}

export function sortReviews(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => {
    const dateA = a.fecha || '';
    const dateB = b.fecha || '';
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return (b.sprint || '').localeCompare(a.sprint || '', 'es', { numeric: true });
  });
}
