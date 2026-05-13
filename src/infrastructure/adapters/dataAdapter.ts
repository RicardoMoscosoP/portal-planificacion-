// ─────────────────────────────────────────────────────────────────────────────
// dataAdapter — Transformaciones / mapeo de datos crudos del backend
//
// El backend (Sheet/API) puede retornar strings donde necesitamos tipos
// específicos (fechas, booleans, números). Este módulo centraliza esas
// transformaciones para que los repositorios entreguen datos limpios.
// ─────────────────────────────────────────────────────────────────────────────

import type { AppData } from '../../domain/types';

/**
 * Normaliza un AppData crudo proveniente del Sheet:
 * - Convierte strings 'TRUE'/'FALSE' a boolean
 * - Normaliza fechas YYYY-MM-DD
 * - Elimina filas vacías
 *
 * Ampliar cuando se diseñen las entidades finales.
 */
export function normalizeAppData(raw: unknown): AppData {
  const data = raw as AppData;
  return {
    ...data,
    equipo: (data.equipo ?? []).map(m => ({
      ...m,
      activo: toBoolean(m.activo),
    })),
    stakeholders: (data.stakeholders ?? []).map(stakeholder => ({
      ...stakeholder,
      activo: toBoolean(stakeholder.activo),
      q: stakeholder.q ?? 'ALL',
      capacidadKeys: Array.isArray(stakeholder.capacidadKeys) ? stakeholder.capacidadKeys : [],
    })),
    businessFlows: (data.businessFlows ?? []).map(flow => ({
      ...flow,
      activo: toBoolean(flow.activo),
      orden: typeof flow.orden === 'number' ? flow.orden : 99,
    })),
  };
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toUpperCase() === 'TRUE' || value === '1';
  return Boolean(value);
}
