import { useState } from 'react';
import type { Presentacion } from '../../domain/types';

interface Props {
  presentacion: Presentacion;
  all: Presentacion[];
  onClose: () => void;
}

/** Convierte una URL de Google Slides a modo presentación embebida (slideshow). */
function toEmbedUrl(url: string): string {
  try {
    // Extraer ID de presentación de cualquier variante de URL de Google Slides
    const match = url.match(/\/presentation\/d\/([\w-]+)/);
    if (match) {
      const id = match[1];
      return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=0&rm=minimal`;
    }
  } catch { /* noop */ }
  // Si no es Google Slides, devolver la URL tal cual
  return url;
}

export default function PresentacionPresentation({ presentacion, all, onClose }: Props) {
  const [current, setCurrent] = useState(() => all.findIndex(p => p.id === presentacion.id));

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(all.length - 1, c + 1));
  const item = all[current] ?? presentacion;
  const embedUrl = toEmbedUrl(item.url);
  const progress = all.length <= 1 ? 100 : Math.round((current / (all.length - 1)) * 100);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A1650', zIndex: 340, display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(191,219,254,0.82)', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
            Presentación embebida
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {item.titulo}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            {item.capacidad && <><span>{item.capacidad}</span><span style={{ opacity: 0.35 }}>•</span></>}
            <span>{new Date(item.fechaCreacion).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {item.descripcion && <><span style={{ opacity: 0.35 }}>•</span><span style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.descripcion}</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>
            {current + 1} / {all.length}
          </span>
          <button
            onClick={prev}
            disabled={current === 0}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 18, cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.2 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >‹</button>
          <button
            onClick={next}
            disabled={current === all.length - 1}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 18, cursor: current === all.length - 1 ? 'not-allowed' : 'pointer', opacity: current === all.length - 1 ? 0.2 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >›</button>
          <button
            onClick={onClose}
            style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 16px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 8, color: '#fff', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* ── Barra de progreso ── */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#2BB8D4', transition: 'width 0.3s ease' }} />
      </div>

      {/* ── Iframe ── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, background: '#fff' }}>
        <iframe
          key={item.id}
          src={embedUrl}
          title={item.titulo}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

    </div>
  );
}

