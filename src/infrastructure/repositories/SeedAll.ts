// SeedAll.ts — Seed completo de Firestore con TODOS los datos del mock
// Estructura:
//   portafolios/{portafolioId}
//   portafolios/{portafolioId}/equipos/{equipoId}
//   equipos/{equipoId}/config/main
//   equipos/{equipoId}/miembros/{id}
//   equipos/{equipoId}/capacidades/{key}
//   equipos/{equipoId}/bets/{id}
//   equipos/{equipoId}/mos/{id}
//   equipos/{equipoId}/iniciativas/{id}  ← los entregables van nested dentro del doc
//   equipos/{equipoId}/reviews/{id}
//   equipos/{equipoId}/stakeholders/{id}
//   equipos/{equipoId}/businessFlows/{id}
//   usuarios/{id}

import { doc, setDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { db } from '../integrations/firebase/firebase';
import { MOCK_DATA, MOCK_USUARIOS, MOCK_REVIEWS } from './MockRepository';
import { PORTFOLIOS_MOCK } from '../data/portfoliosMock';

const EQUIPO_ID = 'eq_planificacion';

// ─── helpers ──────────────────────────────────────────────────────────────────
function batchWrite<T extends object>(
  firestore: Firestore,
  docs: T[],
  pathFn: (item: T) => string
): Promise<void>[] {
  const batch = writeBatch(firestore);
  for (const item of docs) {
    batch.set(doc(firestore, pathFn(item)), item);
  }
  return [batch.commit()];
}

// ─── seed portafolios ─────────────────────────────────────────────────────────
async function seedPortafolios(firestore: Firestore) {
  for (const portafolio of PORTFOLIOS_MOCK.portafolios) {
    const { equipos, ...portafolioData } = portafolio;
    await setDoc(doc(firestore, `portafolios/${portafolio.id}`), portafolioData);
    if (Array.isArray(equipos)) {
      const batch = writeBatch(firestore);
      for (const equipo of equipos) {
        batch.set(doc(firestore, `portafolios/${portafolio.id}/equipos/${equipo.id}`), equipo);
      }
      await batch.commit();
    }
  }
}

// ─── seed usuarios ────────────────────────────────────────────────────────────
async function seedUsuarios(firestore: Firestore) {
  const batch = writeBatch(firestore);
  for (const usuario of MOCK_USUARIOS) {
    batch.set(doc(firestore, `usuarios/${usuario._id}`), usuario);
  }
  await batch.commit();
}

// ─── seed todas las subcolecciones de eq_planificacion ────────────────────────
async function seedEquipoPlanificacion(firestore: Firestore) {
  const eId = EQUIPO_ID;
  await setDoc(doc(firestore, `equipos/${eId}/config/main`), { ...MOCK_DATA.config, equipoId: eId });

  await Promise.all(batchWrite(firestore, MOCK_DATA.equipo.map(m => ({ ...m, equipoId: eId })),        m => `equipos/${eId}/miembros/${m.id}`));
  await Promise.all(batchWrite(firestore, MOCK_DATA.capacidades.map(c => ({ ...c, equipoId: eId })),   c => `equipos/${eId}/capacidades/${c.key}`));
  await Promise.all(batchWrite(firestore, MOCK_DATA.bets.map(b => ({ ...b, equipoId: eId })),           b => `equipos/${eId}/bets/${b.id}`));
  await Promise.all(batchWrite(firestore, MOCK_DATA.mos.map(m => ({ ...m, equipoId: eId })),            m => `equipos/${eId}/mos/${m.id}`));
  await Promise.all(batchWrite(firestore, MOCK_DATA.iniciativas.map(i => ({ ...i, equipoId: eId })),   i => `equipos/${eId}/iniciativas/${i.id}`));
  // Los entregables van nested dentro de cada doc de iniciativa; no existe colección separada.
  await Promise.all(batchWrite(firestore, MOCK_REVIEWS.map(r => ({ ...r, equipoId: eId })),            r => `equipos/${eId}/reviews/${r.id}`));

  if (Array.isArray(MOCK_DATA.stakeholders)) {
    await Promise.all(batchWrite(firestore, MOCK_DATA.stakeholders.map(s => ({ ...s, equipoId: eId })), s => `equipos/${eId}/stakeholders/${s.id}`));
  }
  if (Array.isArray(MOCK_DATA.businessFlows)) {
    await Promise.all(batchWrite(firestore, MOCK_DATA.businessFlows.map(b => ({ ...b, equipoId: eId })), b => `equipos/${eId}/businessFlows/${b.id}`));
  }
}

// ─── entry point ─────────────────────────────────────────────────────────────
export async function seedAll(): Promise<{ colecciones: string[] }> {
  if (!db) throw new Error('Firebase no está configurado. Agrega VITE_FIREBASE_API_KEY en .env.local y reconstruye.');

  await seedPortafolios(db);
  await seedUsuarios(db);
  await seedEquipoPlanificacion(db);

  return {
    colecciones: [
      'portafolios (+ subcolección equipos)',
      'usuarios',
      `equipos/${EQUIPO_ID}/config`,
      `equipos/${EQUIPO_ID}/miembros`,
      `equipos/${EQUIPO_ID}/capacidades`,
      `equipos/${EQUIPO_ID}/bets`,
      `equipos/${EQUIPO_ID}/mos`,
      `equipos/${EQUIPO_ID}/iniciativas (entregables nested)`,
      `equipos/${EQUIPO_ID}/reviews`,
      `equipos/${EQUIPO_ID}/stakeholders`,
      `equipos/${EQUIPO_ID}/businessFlows`,
    ],
  };
}
