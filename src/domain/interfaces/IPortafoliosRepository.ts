// Interfaz para acceso a portafolios (hexagonal)
// Reutilizamos el tipo canónico de domain/types para evitar duplicación
export type { Portafolio } from '../types/index';
import type { Portafolio } from '../types/index';

export interface IPortafoliosRepository {
  getAll(): Promise<Portafolio[]>;
  save(portafolio: Portafolio): Promise<void>;
  bulkSave(portafolios: Array<Omit<Portafolio, 'id'>>): Promise<void>;
}
