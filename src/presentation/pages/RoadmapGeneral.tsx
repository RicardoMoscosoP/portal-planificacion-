import type { AppData } from '../../domain/types';
import { useEffect, useRef, useState } from 'react';
import RoadmapMosBlock from '../components/RoadmapMosBlock';

interface Props {
  data: AppData;
  q: number;
}

export default function RoadmapGeneral({ data, q }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === fullscreenRef.current) {
        await document.exitFullscreen();
        return;
      }
      await fullscreenRef.current?.requestFullscreen();
    } catch {
      setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
    }
  };

  return (
    <div
      ref={fullscreenRef}
      className="page-shell roadmap-page roadmap-contenedor"
      style={isFullscreen ? { background: '#F8FAFC', padding: '20px 24px', minHeight: '100vh', overflow: 'auto' } : undefined}
    >
      <div
        className="page-intro page-intro-row"
        style={isFullscreen ? {
          position: 'sticky',
          top: 0,
          zIndex: 100,
          minHeight: 120,
          paddingTop: 0,
          paddingBottom: 24,
          marginTop: 0,
          background: 'linear-gradient(180deg, #eaf8ff 100%, #F8FAFC 100%)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
          borderBottom: '2px solid #1B30CC', // Borde azul visible para pruebas
        } : undefined}
      >
        <div>
          <h1 className="page-title">Roadmap general</h1>
          <p className="page-subtitle">
            Vista reutilizable del roadmap general y los Measure of Success sincronizados por quarter.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              padding: '7px 14px',
              borderRadius: 999,
              border: '1px solid #94A3B8',
              background: '#fff',
              color: '#334155',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'Manrope, sans-serif',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
          </button>
        </div>
      </div>

      <div style={isFullscreen ? { paddingTop: 140 } : undefined} className="page-body roadmap-body">
        <RoadmapMosBlock
          data={data}
          initialQ={q}
          showHeader={false}
          showSelector={false}
          showQuarterIntroForSingleView={false}
        />
      </div>
    </div>
  );
}