import type { ReactNode } from 'react';

export default function ConfirmDialog({
  message,
  title,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: {
  message: ReactNode;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, zIndex: 420, background: 'rgba(8,15,35,0.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={event => event.stopPropagation()}
        style={{ width: 'min(440px, 100%)', background: '#fff', borderRadius: 16, border: '1px solid #DCE7FF', boxShadow: '0 20px 50px rgba(15,23,42,0.22)', padding: 22 }}
      >
        {title && (
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1C40', marginBottom: 8, fontFamily: 'Manrope, sans-serif' }}>{title}</div>
        )}
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, marginBottom: 22, fontFamily: 'Manrope, sans-serif' }}>{message}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ padding: '8px 16px', borderRadius: 8, border: danger ? '1px solid #FECACA' : '1px solid #BFDBFE', background: danger ? '#FEF2F2' : '#EFF6FF', color: danger ? '#DC2626' : '#1D4ED8', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
