import type { IPortafoliosRepository } from '../../../domain/interfaces/IPortafoliosRepository';
import { GASPortafoliosRepository } from './GASPortafoliosRepository';
import { MockPortafoliosRepository } from './MockPortafoliosRepository';

function isGASEnvironment(): boolean {
  const g = (window as any);
  return (
    typeof window !== 'undefined' &&
    g.google !== undefined &&
    g.google.script !== undefined
  );
}

export function createPortafoliosRepository(): IPortafoliosRepository {
  if (isGASEnvironment()) {
    return new GASPortafoliosRepository();
  }
  return new MockPortafoliosRepository();
}
