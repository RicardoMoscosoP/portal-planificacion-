import React, { useState, useEffect } from 'react';

// Utilidad para detectar entorno local
function isLocalhost() {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

// Guarda la preferencia en localStorage
const LS_REPO_KEY = 'be_repo_type';

export const DevRepositorySwitch: React.FC = () => {
  const [repo, setRepo] = useState(() => localStorage.getItem(LS_REPO_KEY) || 'mock');

  useEffect(() => {
    localStorage.setItem(LS_REPO_KEY, repo);
    // Opcional: recargar la página para aplicar el cambio
    // window.location.reload();
  }, [repo]);

  if (!isLocalhost()) return null; // Solo visible en local

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, background: '#fff', border: '1px solid #ccc', padding: 8, zIndex: 9999 }}>
      <label>
        <strong>Repositorio de datos:</strong>
        <select value={repo} onChange={e => setRepo(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="mock">Mock (local)</option>
          <option value="gas">Google Sheet (GAS)</option>
        </select>
      </label>
    </div>
  );
};

// ---
// Para usarlo, importa <DevRepositorySwitch /> y agrégalo en tu App principal.
// Luego, en repositoryFactory.ts, lee localStorage.getItem('be_repo_type') para forzar el repositorio si está definido.
// Ejemplo en repositoryFactory:
//   const forced = localStorage.getItem('be_repo_type');
//   if (forced === 'mock') return new MockRepository();
//   if (forced === 'gas') return new GASRepository();
// ---
