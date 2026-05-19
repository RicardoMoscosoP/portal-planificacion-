import type { IPortafoliosRepository, Portafolio } from '../../../domain/interfaces/IPortafoliosRepository';
import { PORTFOLIOS_MOCK } from '../../data/portfoliosMock';

const mockData: Portafolio[] = PORTFOLIOS_MOCK.portafolios;

export class MockPortafoliosRepository implements IPortafoliosRepository {
  private data: Portafolio[];

  constructor() {
    this.data = mockData.map((item, idx) => ({
      ...item,
      id: item.id || `mock_${idx}`,
      equipos: item.equipos ?? [],
    }));
  }

  async getAll(): Promise<Portafolio[]> {
    // Retorna ordenado por createdAt DESC (más reciente primero)
    return [...this.data].sort((a, b) => {
      const aDate = a.createdAt ?? '';
      const bDate = b.createdAt ?? '';
      return bDate.localeCompare(aDate);
    });
  }

  async save(portafolio: Portafolio): Promise<void> {
    const now = new Date().toISOString();
    const idx = this.data.findIndex(p => p.id === portafolio.id);
    if (idx >= 0) {
      this.data[idx] = { ...portafolio, updatedAt: now };
    } else {
      this.data.push({ ...portafolio, createdAt: portafolio.createdAt ?? now, updatedAt: now });
    }
  }

  async bulkSave(portafolios: Array<Omit<Portafolio, 'id'>>): Promise<void> {
    portafolios.forEach(p => {
      const newId = `mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      this.data.push({ ...p, id: newId });
    });
  }
}
