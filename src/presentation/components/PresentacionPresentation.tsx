import { useState } from 'react';
import type { Config, Presentacion } from '../../domain/types';

function getPresentationIdentity(configTitle?: string): { portfolioName: string; teamName: string } {
  const normalized = (configTitle ?? '').trim();
  const parts = normalized.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    return {
      portfolioName: parts[0],
      teamName: parts.slice(1).join(' - '),
    };
  }
  return {
    portfolioName: normalized || 'Portafolio',
    teamName: '',
  };
}

interface Props {
  presentacion: Presentacion;
  all: Presentacion[];
  config: Config;
  onClose: () => void;
}

function toEmbedUrl(url: string): string {
  try {
    const match = url.match(/\/presentation\/d\/([\w-]+)/);
    if (match) {
      const id = match[1];
      return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=0&rm=minimal`;
    }
  } catch { /* noop */ }
  return url;
}

export default function PresentacionPresentation({ presentacion, all, config, onClose }: Props) {
  const [current, setCurrent] = useState(() => Math.max(0, all.findIndex(p => p.id === presentacion.id)));

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(all.length - 1, c + 1));
  const item = all[current] ?? presentacion;
  const embedUrl = toEmbedUrl(item.url);
  const { portfolioName, teamName } = getPresentationIdentity(config.titulo);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A1650', zIndex: 340, display: 'flex', flexDirection: 'column', fontFamily: 'Manrope, sans-serif' }}>
      {/* Header navy compacto, mismo estilo que reviews embebidas */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 52 }}>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 600, display: 'inline' }}>{portfolioName}</span>
            {teamName && <span style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.82)', whiteSpace: 'nowrap' }}>{` — ${teamName}`}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{current + 1} / {all.length}</span>
            <button onClick={prev} disabled={current === 0} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 16, cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.25 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <button onClick={next} disabled={current === all.length - 1} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 16, cursor: current === all.length - 1 ? 'not-allowed' : 'pointer', opacity: current === all.length - 1 ? 0.25 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, color: '#fff', cursor: 'pointer', fontWeight: 700, textDecoration: 'none' }}>Abrir en otra ventana</a>
            <button onClick={onClose} style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 14px', background: '#fff', border: 'none', borderRadius: 6, color: '#0A1650', cursor: 'pointer', fontWeight: 700, marginLeft: 4 }}>Salir</button>
          </div>
        </div>
      </div>

      {/* Iframe con marco redondeado, igual que reviews embebidas */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#fff' }}>
        <div style={{ position: 'relative', width: 'min(100%, calc((100dvh - 140px) * 16 / 9))', aspectRatio: '16 / 9', maxWidth: '100%', maxHeight: '100%', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 18px 48px rgba(0,0,0,0.22), inset 0 0 0 4px #fff' }}>
          <iframe
            key={item.id}
            src={embedUrl}
            title={item.titulo}
            style={{ position: 'absolute', top: -4, left: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', border: 'none', display: 'block', background: '#fff' }}
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  );
}

