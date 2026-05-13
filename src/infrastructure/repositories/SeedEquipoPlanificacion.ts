// SeedEquipoPlanificacion.ts — Poblar todas las subcolecciones de eq_planificacion en Firestore
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../integrations/firebase/firebase';
import { MOCK_DATA } from './MockRepository';

const equipoId = 'eq_planificacion';

export async function seedEquipoPlanificacion() {
  if (!db) throw new Error('Firebase no está configurado. Agrega VITE_FIREBASE_API_KEY en .env.local y reconstruye.');
  const firestore = db;
  // Config
  await setDoc(doc(firestore, `equipos/${equipoId}/config/main`), {
    ...MOCK_DATA.config,
    equipoId,
  });

  // Miembros
  const miembrosBatch = writeBatch(firestore);
  for (const miembro of MOCK_DATA.equipo) {
    miembrosBatch.set(doc(firestore, `equipos/${equipoId}/miembros/${miembro.id}`), {
      ...miembro,
      equipoId,
    });
  }
  await miembrosBatch.commit();

  // Capacidades
  const capacidadesBatch = writeBatch(firestore);
  for (const cap of MOCK_DATA.capacidades) {
    capacidadesBatch.set(doc(firestore, `equipos/${equipoId}/capacidades/${cap.key}`), {
      ...cap,
      equipoId,
    });
  }
  await capacidadesBatch.commit();

  // Bets
  const betsBatch = writeBatch(firestore);
  for (const bet of MOCK_DATA.bets) {
    betsBatch.set(doc(firestore, `equipos/${equipoId}/bets/${bet.id}`), {
      ...bet,
      equipoId,
    });
  }
  await betsBatch.commit();

  // MOS
  const mosBatch = writeBatch(firestore);
  for (const mos of MOCK_DATA.mos) {
    mosBatch.set(doc(firestore, `equipos/${equipoId}/mos/${mos.id}`), {
      ...mos,
      equipoId,
    });
  }
  await mosBatch.commit();

  // Iniciativas
  const iniciativasBatch = writeBatch(firestore);
  for (const ini of MOCK_DATA.iniciativas) {
    iniciativasBatch.set(doc(firestore, `equipos/${equipoId}/iniciativas/${ini.id}`), {
      ...ini,
      equipoId,
    });
  }
  await iniciativasBatch.commit();

  // Reviews (si existen)
  if (Array.isArray(MOCK_DATA.reviews)) {
    const reviewsBatch = writeBatch(firestore);
    for (const rev of MOCK_DATA.reviews) {
      reviewsBatch.set(doc(firestore, `equipos/${equipoId}/reviews/${rev.id}`), {
        ...rev,
        equipoId,
      });
    }
    await reviewsBatch.commit();
  }

  // Stakeholders
  if (Array.isArray(MOCK_DATA.stakeholders)) {
    const stakeholdersBatch = writeBatch(firestore);
    for (const stk of MOCK_DATA.stakeholders) {
      stakeholdersBatch.set(doc(firestore, `equipos/${equipoId}/stakeholders/${stk.id}`), {
        ...stk,
        equipoId,
      });
    }
    await stakeholdersBatch.commit();
  }

  // BusinessFlows
  if (Array.isArray(MOCK_DATA.businessFlows)) {
    const bfBatch = writeBatch(firestore);
    for (const bf of MOCK_DATA.businessFlows) {
      bfBatch.set(doc(firestore, `equipos/${equipoId}/businessFlows/${bf.id}`), {
        ...bf,
        equipoId,
      });
    }
    await bfBatch.commit();
  }

  return true;
}
