// AuthProvider.tsx — proveedor global de autenticación
import { AuthContext } from './AuthContext';
import { useAuth } from '../../application/hooks/useAuth';
import type { ReactNode } from 'react';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
