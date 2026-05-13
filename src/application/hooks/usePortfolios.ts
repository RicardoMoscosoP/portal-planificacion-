
import { useState, useEffect, useCallback } from 'react';
import type { Portafolio } from '../../domain/interfaces/IPortafoliosRepository';
import { createPortafoliosRepository } from '../../infrastructure/repositories/portafolios/PortafoliosRepositoryFactory';

export function usePortfolios() {
  const [data, setData] = useState<Portafolio[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const repo = createPortafoliosRepository();
      const portafolios = await repo.getAll();
      setData(portafolios);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar portafolios');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
