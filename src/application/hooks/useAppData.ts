// ─────────────────────────────────────────────────────────────────────────────
// useAppData — Hook principal de carga de datos
//
// Encapsula el ciclo de vida de la carga de AppData para que los componentes
// no necesiten saber de repositorios ni de promesas.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AppData } from '../../domain/types';
import { getAllData, filterAppDataByEquipo } from '../services/dataService';

interface UseAppDataResult {
  data: AppData | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  silentReload: () => void;
}

export function useAppData(equipoId?: string | null): UseAppDataResult {
  const [rawData, setRawData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAllData(equipoId ?? undefined)
      .then(setRawData)
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [equipoId]);

  const silentLoad = useCallback(() => {
    getAllData(equipoId ?? undefined)
      .then(data => {
        setRawData(data);
        setError(null);
      })
      .catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, [equipoId]);

  useEffect(() => {
    load();
  }, [load]);

  const data = useMemo(
    () => rawData && equipoId ? filterAppDataByEquipo(rawData, equipoId) : rawData,
    [rawData, equipoId],
  );

  return { data, loading, error, reload: load, silentReload: silentLoad };
}
