// AuthContext.tsx — contexto global de usuario autenticado
import { createContext, useContext } from 'react';
import type { Usuario } from '../../infrastructure/repositories/UsuariosRepository';

export interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  blocked: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext no inicializado');
  return ctx;
}
