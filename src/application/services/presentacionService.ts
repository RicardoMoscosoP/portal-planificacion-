import type { Presentacion } from '../../domain/types';

const LS_KEY = 'be_presentaciones';

function readLS(): Presentacion[] {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v ? (JSON.parse(v) as Presentacion[]) : [];
  } catch {
    return [];
  }
}

function writeLS(list: Presentacion[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* noop */ }
}

function isGAS(): boolean {
  return typeof window !== 'undefined' && !!(window as any)?.google?.script;
}

function gasAdminRun(method: 'adminCrear' | 'adminActualizar' | 'adminEliminar', ...args: unknown[]): void {
  setTimeout(() => {
    const run = (window as any)?.google?.script?.run;
    if (!run) return;
    run
      .withSuccessHandler(() => { /* ok */ })
      .withFailureHandler((err: unknown) => console.error(`[GAS][presentaciones] ${method}:`, err))
      [method](...args);
  }, 0);
}

const SEED_PRESENTACIONES: Presentacion[] = [
  {
    id: 'pres_demo_01',
    titulo: 'Portafolio Distribución - Planificación del Transporte',
    descripcion: 'Presentación general del portafolio: misión, visión, capacidades y roadmap Q2.',
    capacidad: 'plan',
    url: 'https://docs.google.com/presentation/d/1jLOsNwLUZSTflpAMhkgENB0jTfkV1La6/edit?slide=id.p23#slide=id.p23',
    fechaCreacion: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'pres_demo_02',
    titulo: 'Portafolio Distribución - Optimizador de Rutas',
    descripcion: 'Demo del MVP del Optimizador de Rutas para última milla — Base Valdivia.',
    capacidad: 'plan',
    url: 'https://docs.google.com/presentation/d/1jLOsNwLUZSTflpAMhkgENB0jTfkV1La6/edit?slide=id.p23#slide=id.p23',
    fechaCreacion: '2026-04-15T00:00:00.000Z',
  },
];

export function seedPresentacionesIfEmpty(): void {
  if (readLS().length === 0) {
    writeLS(SEED_PRESENTACIONES);
  }
}

export const getPresentaciones = (): Presentacion[] => readLS();

export const savePresentaciones = (presentaciones: Presentacion[]): void => writeLS(presentaciones);

export const addPresentacion = (p: Presentacion): void => {
  const list = readLS();
  list.push(p);
  writeLS(list);
  if (isGAS()) gasAdminRun('adminCrear', 'presentaciones', p);
};

export const updatePresentacion = (p: Presentacion): void => {
  writeLS(readLS().map(x => x.id === p.id ? p : x));
  if (isGAS()) gasAdminRun('adminActualizar', 'presentaciones', p.id, p);
};

export const deletePresentacion = (id: string): void => {
  writeLS(readLS().filter(p => p.id !== id));
  if (isGAS()) gasAdminRun('adminEliminar', 'presentaciones', id);
};

