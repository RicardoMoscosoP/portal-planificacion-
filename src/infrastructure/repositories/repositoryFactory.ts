// ─────────────────────────────────────────────────────────────────────────────
// repositoryFactory — Selección del repositorio según entorno (Infrastructure)
//
// Esta función encapsula la lógica de selección de repositorio dentro de la
// capa de infraestructura. La capa de application importa solo esta función,
// sin conocer los repositorios concretos.
//
// Orden de selección:
//   1. GASRepository   — cuando corre embebido en Google Apps Script
//   2. APIRepository   — cuando VITE_API_URL está definida
//   3. MockRepository  — desarrollo local (por defecto)
// ─────────────────────────────────────────────────────────────────────────────

import type { IDataRepository } from '../../domain/interfaces/IDataRepository';
import { APIRepository } from './APIRepository';
import { GASRepository } from './GASRepository';
import { MockRepository } from './MockRepository';

function isGASEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as { google?: unknown }).google !== 'undefined' &&
    typeof (window as { google?: { script?: unknown } }).google?.script !== 'undefined'
  );
}

export function createRepository(): IDataRepository {
  // Permitir forzar el repositorio desde localStorage (solo en local/dev)
  if (typeof window !== 'undefined') {
    const forced = window.localStorage.getItem('be_repo_type');
    if (forced === 'mock') return new MockRepository();
    if (forced === 'gas') return new GASRepository();
  }
  // google.script.run evita CORS — debe verificarse antes que VITE_API_URL
  if (isGASEnvironment()) {
    return new GASRepository();
  }
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  // Si VITE_API_URL está definida y no vacía, usarla. Si no, usar baseUrl vacía (fetch relativo)
  if (typeof apiUrl === 'string') {
    if (apiUrl.trim() !== '') {
      return new APIRepository(apiUrl);
    } else {
      // Build embebido: usar baseUrl vacía para fetch relativo
      return new APIRepository('');
    }
  }
  return new MockRepository();
}
