// useAuth.ts — hook de autenticación y rol
// Si Firebase no está configurado (sin VITE_FIREBASE_API_KEY), auto-login
// como superadmin para que el HTML funcione desplegado en GAS sin credenciales.
import { useEffect, useState, useCallback } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth as firebaseAuth } from '../../infrastructure/integrations/firebase/firebase';
import { getUsuarioById, saveUsuario } from '../../infrastructure/repositories/UsuariosRepository';
import type { Usuario } from '../../infrastructure/repositories/UsuariosRepository';

// Dominios corporativos permitidos
const CORPORATE_DOMAINS = ['blue.cl', 'bx.cl', 'bluex.cl'];
function isCorporateEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return CORPORATE_DOMAINS.includes(domain);
}

// Usuario dev (sin Firebase): auto-login como admin local
const GUEST_USER: Usuario = {
  _id: 'dev_local',
  email: 'ricardo.moscoso@blue.cl',
  nombre: 'Ricardo Moscoso (dev)',
  rol: 'superadmin',
  activo: true,
  canConfigure: true,
  portafoliosAdmin: [],
  fechaRegistro: new Date().toISOString(),
  autoRegistro: false,
};


const SUPERADMIN_EMAILS = [
  'ricardo.moscoso@blue.cl',
  'ricardo.moscoso@bx.cl',
];


function resolveRol(email: string, storedRol: string): Usuario['rol'] {
  if (SUPERADMIN_EMAILS.includes(email.toLowerCase())) return 'superadmin';
  return storedRol as Usuario['rol'];
}

export function useAuth() {
  const [user, setUser]       = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);


  useEffect(() => {
    // Sin Firebase: auto-login como guest (comportamiento original)
    if (!firebaseAuth) {
      setUser(GUEST_USER);
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setBlocked(false);
        setLoading(false);
        return;
      }
      const { uid, email, displayName } = fbUser;

      // Bloquear correos no corporativos
      if (!isCorporateEmail(email || '')) {
        await firebaseAuth!.signOut();
        setUser(null);
        setBlocked(true);
        setLoading(false);
        return;
      }

      let usuario = await getUsuarioById(uid);
      if (!usuario) {
        usuario = {
          _id: uid,
          email: email || '',
          nombre: displayName || '',
          rol: resolveRol(email || '', 'viewer'),
          activo: true,
          canConfigure: SUPERADMIN_EMAILS.includes((email || '').toLowerCase()),
          portafoliosAdmin: [],
          fechaRegistro: new Date().toISOString(),
          autoRegistro: true,
        };
        await saveUsuario(usuario);
      }
      // Forzar superadmin si corresponde
      usuario.rol      = resolveRol(usuario.email, usuario.rol);
      usuario.canConfigure = usuario.rol === 'superadmin' || usuario.canConfigure;
      setBlocked(false);
      setUser(usuario);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = useCallback(async () => {
    if (!firebaseAuth) return;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(firebaseAuth, provider);
  }, []);

  const logout = useCallback(async () => {
    if (!firebaseAuth) { setUser(null); return; }
    await firebaseAuth.signOut();
    setUser(null);
  }, []);

  return { user, loading, blocked, login, logout };
}
