import type React from 'react';

export const BX_MODAL_OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.72)',
  zIndex: 260,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

export const BX_MODAL_PANEL_STYLE: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 24,
  boxShadow: '0 28px 70px rgba(15, 23, 42, 0.24)',
  overflow: 'hidden',
  border: '1px solid rgba(191, 219, 254, 0.9)',
};