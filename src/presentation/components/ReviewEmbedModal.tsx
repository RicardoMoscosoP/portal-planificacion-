import { useState } from 'react';
import type { Config, Review } from '../../domain/types';

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
  review: Review;
  all: Review[]; // solo reviews con embedUrl
  config: Config;
  onClose: () => void;
}

const BTN_STYLE: React.CSSProperties = {
  width: 30, height: 30, borderRadius: '50%',
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.7)', fontSize: 16, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default function ReviewEmbedModal({ review, all, config, onClose }: Props) {
  const [current, setCurrent] = useState(() => Math.max(0, all.findIndex(r => r.id === review.id)));

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(all.length - 1, c + 1));
  const item = all[current] ?? review;
  const embedUrl = toEmbedUrl(item.embedUrl ?? '');
  const { portfolioName, teamName } = getPresentationIdentity(config.titulo);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A1650', zIndex: 340, display: 'flex', flexDirection: 'column', fontFamily: 'Manrope, sans-serif' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Izquierda: portafolio/equipo + REVIEW badge + sprint/fecha/q */}
          <div style={{ minWidth: 0 }}>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{portfolioName}</span>
              {teamName && <span style={{ fontSize: 20, fontWeight: 500, color: 'rgba(255,255,255,0.82)' }}>{` — ${teamName}`}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(191,219,254,0.82)', fontSize: 10 }}>REVIEW</span>
              <span style={{ opacity: 0.35 }}>·</span>
              <span>Sprint {item.sprint || '—'}</span>
              <span style={{ opacity: 0.35 }}>·</span>
              <span>{item.fecha || '—'}</span>
              <span style={{ opacity: 0.35 }}>·</span>
              <span>{item.q || '—'}</span>
            </div>
          </div>
          {/* Derecha: nav + acciones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {all.length > 1 && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{current + 1} / {all.length}</span>
            )}
            <button onClick={prev} disabled={current === 0} style={{ ...BTN_STYLE, cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.25 : 1 }}>‹</button>
            <button onClick={next} disabled={current === all.length - 1} style={{ ...BTN_STYLE, cursor: current === all.length - 1 ? 'not-allowed' : 'pointer', opacity: current === all.length - 1 ? 0.25 : 1 }}>›</button>
            <a
              href={item.embedUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, color: '#fff', fontWeight: 700, textDecoration: 'none' }}
            >
              Abrir en otra ventana
            </a>
            <button
              onClick={onClose}
              style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 14px', background: '#fff', border: 'none', borderRadius: 6, color: '#0A1650', cursor: 'pointer', fontWeight: 700, marginLeft: 4 }}
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Iframe con marco redondeado */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#fff' }}>
        <div style={{ position: 'relative', width: 'min(100%, calc((100dvh - 160px) * 16 / 9))', aspectRatio: '16 / 9', maxWidth: '100%', maxHeight: '100%', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 18px 48px rgba(0,0,0,0.22), inset 0 0 0 4px #fff' }}>
          <iframe
            key={item.id}
            src={embedUrl}
            title={item.titulo || `Review Sprint ${item.sprint}`}
            style={{ position: 'absolute', top: -4, left: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', border: 'none', display: 'block', background: '#fff' }}
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  );
}
