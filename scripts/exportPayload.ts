/**
 * Genera scripts/mockPayload.json con el payload completo que se envía a Firestore.
 * Úsalo para inspeccionar / validar la estructura de datos localmente.
 *
 * Ejecutar:
 *   npx tsx scripts/exportPayload.ts
 */

import fs from 'fs';
import path from 'path';
import { MOCK_DATA, MOCK_USUARIOS, MOCK_REVIEWS } from '../src/infrastructure/repositories/MockRepository';
import { PORTFOLIOS_MOCK } from '../src/infrastructure/data/portfoliosMock';

const payload = {
  portafolios: PORTFOLIOS_MOCK.portafolios,
  usuarios:    MOCK_USUARIOS,
  equipoId:    'eq_planificacion',
  config:      MOCK_DATA.config,
  miembros:    MOCK_DATA.equipo,
  capacidades: MOCK_DATA.capacidades,
  bets:        MOCK_DATA.bets,
  mos:         MOCK_DATA.mos,
  iniciativas: MOCK_DATA.iniciativas,
  entregables: MOCK_DATA.entregables,
  reviews:     MOCK_REVIEWS,
  stakeholders:  MOCK_DATA.stakeholders,
  businessFlows: MOCK_DATA.businessFlows,
};

const outPath = path.join(import.meta.dirname, 'mockPayload.json');
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');

console.log('✅ scripts/mockPayload.json generado');
console.log(`   portafolios:   ${payload.portafolios.length}`);
console.log(`   usuarios:      ${payload.usuarios.length}`);
console.log(`   miembros:      ${payload.miembros.length}`);
console.log(`   capacidades:   ${payload.capacidades.length}`);
console.log(`   bets:          ${payload.bets.length}`);
console.log(`   mos:           ${payload.mos.length}`);
console.log(`   iniciativas:   ${payload.iniciativas.length}`);
console.log(`   entregables:   ${payload.entregables.length}`);
console.log(`   reviews:       ${payload.reviews.length}`);
console.log(`   stakeholders:  ${payload.stakeholders.length}`);
console.log(`   businessFlows: ${payload.businessFlows.length}`);
