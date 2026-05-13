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
    return [...this.data];
  }

  async save(portafolio: Omit<Portafolio, 'id'>): Promise<void> {
    const newId = `mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.data.push({ ...portafolio, id: newId });
  }

  async bulkSave(portafolios: Array<Omit<Portafolio, 'id'>>): Promise<void> {
    portafolios.forEach(p => {
      const newId = `mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      this.data.push({ ...p, id: newId });
    });
  }
}
