import type { IPortafoliosRepository, Portafolio } from '../../../domain/interfaces/IPortafoliosRepository';

/**
 * Espera a que google.script.run Y la función específica estén disponibles.
 * No llama nada sincrónicamente: siempre difiere con setTimeout(0) primero.
 * Esto evita el error "[e] is not a function" causado por invocar GAS
 * antes de que el runtime de Apps Script adjunte las funciones del servidor.
 */
function waitForGASFunction(fnName: string, maxWait = 6000): Promise<void> {
  return new Promise((resolve, reject) => {
    const INTERVAL = 80;
    let elapsed = 0;

    const check = () => {
      const g = (window as any);
      const run = g && g.google && g.google.script && g.google.script.run;
      if (run && typeof run[fnName] === 'function') {
        resolve();
        return;
      }
      elapsed += INTERVAL;
      if (elapsed >= maxWait) {
        reject(new Error(`GAS: la función "${fnName}" no está disponible después de ${maxWait}ms`));
        return;
      }
      setTimeout(check, INTERVAL);
    };

    // Siempre diferimos el primer intento para salir del stack de React
    setTimeout(check, 0);
  });
}

/**
 * Llama una función GAS de forma segura: espera a que exista, luego la invoca.
 */
function callGAS<T = any>(fnName: string, ...args: any[]): Promise<T> {
  return waitForGASFunction(fnName).then(
    () =>
      new Promise<T>((resolve, reject) => {
        const run = (window as any).google.script.run;
        run
          .withSuccessHandler((result: T) => resolve(result))
          .withFailureHandler((err: any) => {
            const msg = err && err.message ? err.message : `Error en ${fnName}`;
            reject(new Error(msg));
          })
          [fnName](...args);
      })
  );
}

export class GASPortafoliosRepository implements IPortafoliosRepository {
  async getAll(): Promise<Portafolio[]> {
    const result = await callGAS<any[]>('obtenerPortafolios');
    const lista = Array.isArray(result) ? result : [];
    // Garantizar que equipos siempre sea un array (nunca undefined)
    return lista.map((p: any) => ({
      ...p,
      equipos: Array.isArray(p.equipos) ? p.equipos : [],
    })) as Portafolio[];
  }

  async save(portafolio: Omit<Portafolio, 'id'>): Promise<void> {
    await callGAS('guardarPortafolio', portafolio);
  }

  async bulkSave(portafolios: Array<Omit<Portafolio, 'id'>>): Promise<void> {
    await callGAS('cargarMasivo', portafolios);
  }
}
