// ─────────────────────────────────────────────────────────────────────────────
// IDataRepository — Puerto del repositorio de datos
//
// Define el contrato que CUALQUIER implementación debe cumplir:
//   - GASRepository     → lee del Google Sheet vía google.script.run
//   - APIRepository     → consume una API REST externa vía fetch()
//   - MockRepository    → datos hardcodeados para desarrollo local
//
// El frontend SOLO conoce esta interfaz, nunca la implementación concreta.
// ─────────────────────────────────────────────────────────────────────────────

import type { AppData } from '../types';

export interface IDataRepository {
  /**
   * Obtiene todos los datos necesarios para montar la aplicación.
   * En entorno GAS, requiere equipoId para consultar Firestore.
   */
  getAllData(equipoId?: string): Promise<AppData>;

  /**
   * Sincroniza datos parciales al Sheet/backend.
   * Se invoca solo cuando el usuario hace una acción explícita de guardado.
   */
  syncToSheet(data: Partial<AppData>): Promise<{ ok: boolean; entities: string[] }>;
}
