import { useEffect, useState } from 'react';
import { useUnsavedChanges } from '../contexts/UnsavedChangesContext';

declare const __APP_VERSION__: string;

interface SyncState {
  lastSync: Date | null;
  error: string | null;
}

interface Props {
  onReloadFromSheet: () => void;
}

export default function SyncStatus({ onReloadFromSheet: _onReloadFromSheet }: Props) {
  const { hasPendingChanges } = useUnsavedChanges();
  const [state, setState] = useState<SyncState>({
    lastSync: null,
    error: null,
  });

  useEffect(() => {
    const lastSync = localStorage.getItem('__sync_timestamp');
    if (lastSync) {
      setState(s => ({ ...s, lastSync: new Date(lastSync) }));
    }
  }, []);

  const formatDate = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${mi}:${ss}`;
  };

  return (
    <div style={{
      marginTop: 12,
      padding: '10px 8px',
      borderRadius: 8,
      border: hasPendingChanges ? '1px solid rgba(234,179,8,0.5)' : '1px solid #E5E7EB',
      background: hasPendingChanges ? 'rgba(234,179,8,0.08)' : '#F9FAFB',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
    }}>
      {hasPendingChanges && (
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#D97706',
          letterSpacing: '0.04em',
          textAlign: 'center',
        }}>
          ⚠️ CAMBIOS SIN GUARDAR
        </div>
      )}

      <div style={{
        fontSize: 10,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 2,
      }}>
        {state.error ? (
          <span style={{ color: '#E8352B', fontWeight: 600 }}>
            ❌ {state.error}
          </span>
        ) : state.lastSync ? (
          <>
            <div>Sincronizado:</div>
            <div style={{ fontWeight: 600, color: '#6B7280' }}>
              {formatDate(state.lastSync)}
            </div>
          </>
        ) : (
          <div style={{ fontWeight: 600, color: '#6B7280' }}>
            {formatDate(new Date())}
          </div>
        )}
      <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', fontFamily: 'Manrope, sans-serif' }}>
        v{__APP_VERSION__}
      </div>
      </div>
    </div>
  );
}
