import type { PortfolioData } from '../../domain/types';

// Datos idénticos a documentacion/mockDataLocal.json — misma estructura que Firestore
export const PORTFOLIOS_MOCK: PortfolioData = {
  portafolios: [
    {
      id: 'port_distribucion',
      nombre: 'Portafolio Distribución',
      descripcion: 'Planificación logística y optimización de rutas a lo largo de toda la red de distribución.',
      activo: true,
      equipos: [
        {
          id: 'eq_planificacion',
          nombre: 'Planificación del Transporte',
          descripcion: 'Optimización de rutas y planificación logística de primera, media y última milla.',
          portafolioId: 'port_distribucion',
          activo: true,
        },
      ],
    },
  ],
};
