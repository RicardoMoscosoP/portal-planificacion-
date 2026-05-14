// UsuariosRepository.ts — Firestore acceso usuarios
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { db } from '../integrations/firebase/firebase';

export interface Usuario {
  _id: string;
  email: string;
  nombre: string;
  rol: 'superadmin' | 'admin' | 'viewer';
  activo: boolean;
  canConfigure: boolean;
  portafoliosAdmin: string[];
  fechaRegistro: string;
  autoRegistro: boolean;
}

export async function getUsuarioById(uid: string): Promise<Usuario | null> {
  if (!db) return null;
  const ref = doc(db, 'usuarios', uid);
  const snap = await getDocFromServer(ref);
  return snap.exists() ? (snap.data() as Usuario) : null;
}

// Busca usuario por email (usado cuando el admin pre-registra por email antes del primer login)
export async function getUsuarioByEmail(email: string): Promise<Usuario | null> {
  if (!db) return null;
  const ref = doc(db, 'usuarios', email);
  const snap = await getDocFromServer(ref);
  return snap.exists() ? (snap.data() as Usuario) : null;
}

export async function saveUsuario(usuario: Usuario): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'usuarios', usuario._id);
  await setDoc(ref, usuario, { merge: true });
}
