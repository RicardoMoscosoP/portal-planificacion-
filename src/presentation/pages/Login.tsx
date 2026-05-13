// Login.tsx — pantalla de login Google
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Login() {
  const ctx = useContext(AuthContext);
  if (!ctx) return null;
  const { login, loading } = ctx;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 120 }}>
      <h2>Iniciar sesión</h2>
      <button onClick={login} disabled={loading} style={{ padding: '12px 32px', fontSize: 18, borderRadius: 8, background: '#0033A0', color: '#fff', border: 'none', marginTop: 24, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Cargando...' : 'Ingresar con Google'}
      </button>
    </div>
  );
}
