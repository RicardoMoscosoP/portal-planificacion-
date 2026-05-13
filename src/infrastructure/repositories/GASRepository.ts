// ─────────────────────────────────────────────────────────────────────────────
// GASRepository — Implementación para Google Apps Script
//
// Usa google.script.run para comunicarse con el backend GAS.
// Solo funciona cuando la app está embebida en Google Sites / GAS Web App.
// ─────────────────────────────────────────────────────────────────────────────


import type { IDataRepository } from '../../domain/interfaces/IDataRepository';
import type { AppData } from '../../domain/types';

/**
 * Llama una función del servidor GAS de forma segura:
 * - Siempre difiere con setTimeout para salir del stack sincrónico de React.
 * - Evita el error "[e] is not a function" causado por invocar
 *   google.script.run antes de que el runtime de Apps Script esté listo.
 */
function gasRun<T>(method: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const g = window as any;
      const run = g?.google?.script?.run;
      if (!run) {
        reject(new Error('google.script.run no disponible'));
        return;
      }
      try {
        run
          .withSuccessHandler((result: T) => resolve(result))
          .withFailureHandler((err: any) => {
            reject(new Error(err?.message || `Error en ${method}`));
          })
          [method](...args);
      } catch (e: any) {
        reject(new Error(`Error llamando ${method}: ${e.message}`));
      }
    }, 0);
  });
}

/**
 * AppData vacío usado como valor por defecto cuando el backend GAS
 * no expone getAllData (p.ej. Codigo_Servidor.gs solo tiene obtenerPortafolios).
 */
const EMPTY_APP_DATA: AppData = {
  config: {},
  equipo: [],
  capacidades: [],
  iniciativas: [],
  entregables: [],
  bets: [],
  mos: [],
  stakeholders: [],
  businessFlows: [],
  aplicaciones: [],
  reviews: [],
};

export class GASRepository implements IDataRepository {
  async getAllData(equipoId?: string): Promise<AppData> {
    const eId = equipoId || 'eq_planificacion';
    try {
      const raw = await gasRun<string>('obtenerDatosEquipo', eId);
      const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!result?.ok) {
        console.error('obtenerDatosEquipo error:', result?.error);
        return { ...EMPTY_APP_DATA };
      }
      // Entregables viven como array nested dentro de cada iniciativa.
      // No hay colección plana separada.
      const iniciativas: any[] = (result.iniciativas ?? []).map((ini: any) => ({
        ...ini,
        entregables: Array.isArray(ini.entregables) ? ini.entregables : [],
      }));

      // Construir lista plana de entregables desde los nested (para compatibilidad con estado local)
      const flatEnts = iniciativas.flatMap((ini: any) => ini.entregables);

      return {
        config:         result.config        ?? {},
        equipo:         result.equipo        ?? [],
        capacidades:    result.capacidades   ?? [],
        iniciativas,
        entregables:    flatEnts,
        bets:           result.bets          ?? [],
        mos:            result.mos           ?? [],
        stakeholders:   result.stakeholders  ?? [],
        businessFlows:  result.businessFlows ?? [],
        aplicaciones:   result.aplicaciones  ?? [],
        reviews:        result.reviews       ?? [],
        salud:          result.salud         ?? [],
        capacitaciones: result.capacitaciones ?? [],
      };
    } catch (e: any) {
      console.error('GASRepository.getAllData error:', e);
      return { ...EMPTY_APP_DATA };
    }
  }

  async syncToSheet(data: Partial<AppData> & { _equipoId?: string }): Promise<{ ok: boolean; entities: string[] }> {
    const eId = data._equipoId || 'eq_planificacion';
    const entities: string[] = [];
    const promises: Promise<void>[] = [];

    if (data.config) {
      promises.push(this.guardarDocumentoGAS(eId, 'config', 'main', data.config));
      entities.push('config');
    }

    const colMap: Record<string, { col: string; idField: string } | null> = {
      equipo:        { col: 'miembros',       idField: 'id'  },
      capacidades:   { col: 'capacidades',    idField: 'key' },
      aplicaciones:  { col: 'aplicaciones',   idField: 'id'  },
      bets:          { col: 'bets',           idField: 'id'  },
      mos:           { col: 'mos',            idField: 'id'  },
      // Entregables van nested dentro del doc de cada iniciativa; no como colección separada
      iniciativas:   { col: 'iniciativas',    idField: 'id'  },
      stakeholders:  { col: 'stakeholders',   idField: 'id'  },
      businessFlows: { col: 'businessFlows',  idField: 'id'  },
      reviews:       { col: 'reviews',        idField: 'id'  },
      salud:         { col: 'salud',          idField: 'id'  },
      capacitaciones:{ col: 'capacitaciones', idField: 'id'  },
    };

    for (const [key, meta] of Object.entries(colMap)) {
      if (!meta) continue;
      const items = (data as any)[key] as any[] | undefined;
      if (!items?.length) continue;
      for (const item of items) {
        const docId = item[meta.idField] || item.id;
        if (!docId) continue;
        promises.push(this.guardarDocumentoGAS(eId, meta.col, docId, item));
      }
      entities.push(key);
    }

    await Promise.all(promises);
    return { ok: true, entities };
  }

  private async guardarDocumentoGAS(
    equipoId: string,
    coleccion: string,
    docId: string,
    data: object
  ): Promise<void> {
    const raw = await gasRun<string>('guardarDocumento', equipoId, coleccion, docId, data);
    const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!result?.ok) throw new Error(result?.error || `Error guardando ${coleccion}/${docId}`);
  }

}

