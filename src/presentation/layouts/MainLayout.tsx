import type { ReactNode } from 'react';
import { MdHome, MdMap, MdRateReview, MdSchool, MdDashboard, MdPlayCircle, MdSettings, MdAltRoute } from 'react-icons/md';
import type { AppData, Config } from '../../domain/types';
import { betHasActiveMosForQuarter } from '../../application/services/betMos';
import { useUnsavedChanges } from '../contexts/UnsavedChangesContext';
import SyncStatus from '../components/SyncStatus';
import logoUrl from '../../assets/logo-blue.jpg';

export type PageKey = 'inicio' | 'bienvenida' | 'roadmap' | 'reviews' | 'studio-reviews' | 'noticias' | 'capacitaciones' | 'business-flows' | 'admin' | 'capacidad' | 'presentaciones';

const PAGE_LABEL: Record<PageKey, string> = {
  inicio:          'Panel',
  roadmap:         'Roadmap',
  reviews:         'Reviews',
  'studio-reviews':'Preparar Review',
  noticias:        'Noticias',
  capacitaciones:  'Capacitaciones',
  'business-flows':'Flujos de Negocio',
  bienvenida:       'Bienvenida',
  admin:           'Configuración',
  capacidad:       'Capacidad',
  presentaciones:  'Presentaciones',
};


interface Props {
  data: AppData;
  config: Config;
  activePage: PageKey;
  onNav: (page: PageKey) => void;
  q?: number;
  onQChange?: (q: number) => void;
  onReloadFromSheet: () => void;
  onBackToPortfolios?: () => void;
  children: ReactNode;
}

const icons: Record<string, ReactNode> = {
  bienvenida:       <MdHome size={20} />,
  inicio:           <MdDashboard size={20} />,
  reviews:          <MdRateReview size={20} />,
  'studio-reviews': <MdPlayCircle size={20} />,
  roadmap:          <MdMap size={20} />,
  noticias:         <MdDashboard size={20} />,
  capacitaciones:   <MdSchool size={20} />,
  'business-flows': <MdAltRoute size={20} />,
  admin:            <MdSettings size={20} />,
  presentaciones:   <MdPlayCircle size={20} />,
};

const QUARTER_MONTHS: Record<number, [string, string, string]> = {
  1: ['Ene', 'Feb', 'Mar'],
  2: ['Abr', 'May', 'Jun'],
  3: ['Jul', 'Ago', 'Sep'],
  4: ['Oct', 'Nov', 'Dic'],
};

function resolveYear(config: Config): number {
  const parsedYear = Number(config.año);
  return Number.isFinite(parsedYear) && parsedYear > 2000 ? parsedYear : new Date().getFullYear();
}

function normalizeQuarter(value: string | number | undefined): number | null {
  if (typeof value === 'number' && value >= 1 && value <= 4) return value;
  if (typeof value === 'string') {
    const match = value.match(/[1-4]/);
    return match ? Number(match[0]) : null;
  }
  return null;
}

function getQuarterProgress(quarter: number, year: number): number {
  const start = new Date(year, (quarter - 1) * 3, 1);
  const end = new Date(year, quarter * 3, 0, 23, 59, 59, 999);
  const now = new Date();

  if (now <= start) return 0;
  if (now >= end) return 100;

  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();
  return Math.max(0, Math.min(100, Math.round((elapsedMs / totalMs) * 100)));
}

export default function MainLayout({ data, config, activePage, onNav, q, onQChange, onReloadFromSheet, onBackToPortfolios, children }: Props) {
  const { hasPendingChanges } = useUnsavedChanges();
  const activeQuarter = q ?? normalizeQuarter(config.q_activo) ?? 1;
  const activeYear = resolveYear(config);
  const quarterMonths = QUARTER_MONTHS[activeQuarter];
  const quarterProgress = getQuarterProgress(activeQuarter, activeYear);
  const activeTeamCount = data.equipo.filter(member => member.activo).length || data.equipo.length;
  const activeBetsCount = data.bets.filter(bet => (bet.activo ?? true) && betHasActiveMosForQuarter(bet, data.mos, `Q${activeQuarter}`)).length;
  const activeIniciativasCount = data.iniciativas.filter(iniciativa => iniciativa.q === activeQuarter).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sb-logo">
          <img
            src={logoUrl}
            alt="Blue Express"
            onError={(e) => {
              const img = e.currentTarget;
              img.style.display = 'none';
              const placeholder = document.createElement('div');
              placeholder.style.cssText = 'width:100%;height:100%;background:#0A1650;display:flex;align-items:center;justify-content:center;color:#2BB8D4;font-weight:700;font-size:12px;text-align:center;padding:8px;';
              placeholder.textContent = 'Blue Express';
              img.parentElement?.appendChild(placeholder);
            }}
          />
        </div>


        <nav className="sb-nav">
          <button className={`sb-item${activePage === 'inicio' ? ' active' : ''}`} onClick={() => onNav('inicio')}>
            {icons.inicio} Panel
          </button>
          <div className="sb-group">Planificación</div>
          <button className={`sb-item${activePage === 'roadmap' ? ' active' : ''}`} onClick={() => onNav('roadmap')}>
            {icons.roadmap} Roadmap General
          </button>
          <button className={`sb-item${activePage === 'reviews' ? ' active' : ''}`} onClick={() => onNav('reviews')}>
            {icons.reviews} Reviews
          </button>
          <button className={`sb-item${activePage === 'presentaciones' ? ' active' : ''}`} onClick={() => onNav('presentaciones')}>
            {icons.presentaciones} Presentaciones
          </button>
          <div className="sb-group">Recursos</div>
          <button className={`sb-item${activePage === 'capacitaciones' ? ' active' : ''}`} onClick={() => onNav('capacitaciones')}>
            {icons.capacitaciones} Capacitaciones
          </button>
          <button className={`sb-item${activePage === 'business-flows' ? ' active' : ''}`} onClick={() => onNav('business-flows')}>
            {icons['business-flows']} Flujos de Negocio
          </button>
        </nav>

        <div className="sb-foot">
          <SyncStatus onReloadFromSheet={onReloadFromSheet} />
          {onBackToPortfolios && (
            <button
              onClick={onBackToPortfolios}
              style={{
                width: '100%',
                padding: '6px 8px',
                marginTop: 8,
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: '#f8fafc',
                color: '#64748B',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'Manrope, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E2E8F0';
                e.currentTarget.style.color = '#0032A0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              ← Portafolios
            </button>
          )}
        </div>
      </aside>

      {/* ── CONTENIDO ────────────────────────────────────────────────── */}
      <main className="main">

        {/* [layout-header] */}
        <div className="page-hdr">
          <div className="ph-inner">
            {hasPendingChanges && (
              <div style={{
                marginBottom: 12,
                padding: '6px 12px',
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                color: '#FCD34D',
                letterSpacing: '0.01em',
              }}>
                ⚠️ Tienes datos pendientes de guardar
              </div>
            )}
            <div className="ph-grid">
              <div className="ph-main">
                <div className="ph-title">{config.titulo}</div>
                <div className="ph-context-row">
                  <span className="ph-period">Q{activeQuarter} · {quarterMonths[0]}–{quarterMonths[2]} {activeYear}</span>
                  <span className="ph-period-sep">•</span>
                  <span className="ph-sprint">Sprint {config.sprint_actual ?? 'Sin dato'}</span>
                </div>
                <div className="ph-progress-row">
                  <div className="ph-progress-track" aria-label={`Avance del trimestre ${quarterProgress}%`}>
                    <span className="ph-progress-fill" style={{ width: `${quarterProgress}%` }} />
                  </div>
                  <span className="ph-progress-copy">{quarterProgress}% del Q</span>
                </div>
                <div className="ph-summary-row">
                  <span className="ph-summary-item"><strong>{activeBetsCount}</strong> Bets</span>
                  <span className="ph-summary-item"><strong>{activeIniciativasCount}</strong> iniciativas</span>
                  <span className="ph-summary-item"><strong>{activeTeamCount}</strong> miembros en el equipo</span>
                </div>
              </div>
              <div className="ph-side">
                <span className="ph-page-tag">
                  {PAGE_LABEL[activePage]}
                </span>
                <div className="ph-q-row">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      className={`ph-q-btn${q === n ? ' active' : ''}`}
                      key={n}
                      onClick={() => onQChange?.(n)}
                    >
                      Q{n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* [layout-content] */}
        <div className="layout-frame contenedor-global">
          <div className="layout-content pw" data-layout-content="true">
            {children}
          </div>
        </div>

      </main>

    </div>
  );
}

