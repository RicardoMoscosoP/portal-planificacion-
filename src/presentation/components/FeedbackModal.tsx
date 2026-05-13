import { useEffect } from 'react';
import { BX_MODAL_OVERLAY_STYLE, BX_MODAL_PANEL_STYLE } from './modalStyles';

export type FeedbackModalVariant = 'error' | 'alert' | 'confirm';

interface FeedbackModalProps {
  open: boolean;
  variant: FeedbackModalVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

const VARIANT_STYLE: Record<FeedbackModalVariant, { accent: string; soft: string; icon: string; iconColor: string; iconBg: string }> = {
  error: {
    accent: '#DC2626',
    soft: '#FEF2F2',
    icon: '×',
    iconColor: '#FFFFFF',
    iconBg: '#DC2626',
  },
  alert: {
    accent: '#D97706',
    soft: '#FFF7ED',
    icon: '!',
    iconColor: '#FFFFFF',
    iconBg: '#F97316',
  },
  confirm: {
    accent: '#D97706',
    soft: '#FFF7ED',
    icon: '!',
    iconColor: '#FFFFFF',
    iconBg: '#F97316',
  },
};

export default function FeedbackModal({
  open,
  variant,
  title,
  message,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  onClose,
  onConfirm,
}: FeedbackModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const style = VARIANT_STYLE[variant];

  return (
    <div
      onClick={onClose}
      style={{
        ...BX_MODAL_OVERLAY_STYLE,
        zIndex: 400,
        padding: 20,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          ...BX_MODAL_PANEL_STYLE,
          width: 'min(460px, 100%)',
        }}
      >
        <div style={{ height: 6, background: style.accent }} />
        <div style={{ padding: '24px 24px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: style.iconBg,
                color: style.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: variant === 'error' ? 28 : 26,
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: `0 10px 24px ${style.accent}33`,
              }}
            >
              {style.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0F1C40', lineHeight: 1.2, marginBottom: 10 }}>
                {title}
              </div>
              <div style={{ background: style.soft, borderRadius: 14, border: `1px solid ${style.accent}22`, padding: '14px 16px', fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {message}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            {variant === 'confirm' && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={variant === 'confirm' ? onConfirm : onClose}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                background: style.accent,
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif',
                boxShadow: `0 10px 22px ${style.accent}33`,
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}