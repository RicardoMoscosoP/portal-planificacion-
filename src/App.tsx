import { useEffect, useState } from 'react';
import { useAppData } from './application/hooks/useAppData';
import { usePortfolios } from './application/hooks/usePortfolios';
import { clearAllLocalStorage } from './application/services/dataService';
import { UnsavedChangesProvider } from './presentation/contexts/UnsavedChangesContext';
import { useContext } from 'react';
import { AuthContext } from './presentation/contexts/AuthContext';
import Login from './presentation/pages/Login';

import MainLayout, { type PageKey } from './presentation/layouts/MainLayout';
import Portafolios from './presentation/pages/Portafolios';
import Equipos from './presentation/pages/Equipos';
import Home from './presentation/pages/Home';
import RoadmapGeneral from './presentation/pages/RoadmapGeneral';
import Reviews from './presentation/pages/Reviews';
import StudioReviews from './presentation/pages/StudioReviews';
import Noticias from './presentation/pages/Noticias';
import Capacitaciones from './presentation/pages/Capacitaciones';
import BusinessFlows from './presentation/pages/BusinessFlows';
import Induccion from './presentation/pages/Induccion';
import Admin from './presentation/pages/Admin';
import CapacidadRoadmap from './presentation/pages/CapacidadRoadmap';
import AdminPanel from './presentation/components/AdminPanel';
import PresentacionesPage from './presentation/pages/Presentaciones';
import fullMock from '../documentacion/mockDataLocal.json';

function App() {
  type NavigationLevel = 'portafolios' | 'equipos' | 'sitio' | 'config' | 'adminpanel';

  const [navLevel, setNavLevel] = useState<NavigationLevel>('portafolios');
  const [selectedPortafolioId] = useState<string | null>(null);
  const [selectedEquipoId, setSelectedEquipoId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<PageKey>('inicio');
  const [activeCapacidadKey, setActiveCapacidadKey] = useState<string | null>(null);
  const [q, setQ] = useState<number | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const { data, loading, error, reload, silentReload } = useAppData(
    (navLevel === 'sitio' || navLevel === 'config') ? selectedEquipoId : null
  );
  const { data: portfoliosData, loading: portfoliosLoading } = usePortfolios();
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthContext no inicializado');
  const { user, loading: authLoading, blocked } = auth;

  // isAdmin se deriva del usuario autenticado (disponible en todos los niveles de nav)
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';

  useEffect(() => {
    document.title = 'Área Tecnología - Blue Express';
  }, []);

  const navToCapacidad = (capacidadKey: string) => {
    // Scroll to top before navigating
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    setActiveCapacidadKey(capacidadKey);
    setActivePage('capacidad');
  };

  const handleReloadFromSheet = () => {
    clearAllLocalStorage();
    (window as unknown as { __GAS_DATA__?: unknown }).__GAS_DATA__ = null;
    reload();
  };

  if (authLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0A1650', zIndex: 50 }}>
        <div style={{ width: 192, height: 4, borderRadius: 9999, overflow: 'hidden', background: 'rgba(255,255,255,0.15)' }}>
          <div style={{ height: '100%', borderRadius: 9999, background: '#2BB8D4', animation: 'load 1.4s ease forwards', width: '0%' }} />
        </div>
        <p style={{ fontSize: 12, marginTop: 16, color: 'rgba(255,255,255,0.4)' }}>Cargando usuario…</p>
      </div>
    );
  }
  if (!user) {
    if (blocked) {
      return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0A1650', zIndex: 50, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F1C40', margin: '0 0 10px' }}>Acceso restringido</h2>
            <p style={{ fontSize: 14, color: '#6B7A9F', lineHeight: 1.6, margin: '0 0 20px' }}>
              Solo pueden ingresar usuarios con correo corporativo <strong>@blue.cl</strong> o <strong>@bx.cl</strong>.<br />
              Si crees que esto es un error, contacta al administrador.
            </p>
            <button
              onClick={() => auth.login()}
              style={{ padding: '10px 28px', fontSize: 14, borderRadius: 999, background: '#0032A0', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              Intentar con otra cuenta
            </button>
          </div>
        </div>
      );
    }
    return <Login />;
  }

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0A1650', zIndex: 50 }}>
        <div style={{ width: 192, height: 4, borderRadius: 9999, overflow: 'hidden', background: 'rgba(255,255,255,0.15)' }}>
          <div style={{ height: '100%', borderRadius: 9999, background: '#2BB8D4', animation: 'load 1.4s ease forwards', width: '0%' }} />
        </div>
        <p style={{ fontSize: 12, marginTop: 16, color: 'rgba(255,255,255,0.4)' }}>Cargando datos…</p>
      </div>
    );
  }

  // Mostrar aviso solo si NO hay error y NO hay datos (usuario aún no autorizó)
  if (!error && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#EEF2F8' }}>
        <div style={{ textAlign: 'center', padding: 40, maxWidth: 480, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: 10,
            padding: '14px 18px',
            margin: '0 0 18px 0',
            color: '#0F1C40',
            fontSize: 13,
            maxWidth: 600
          }}>
            <strong>🛡️ Aviso de privacidad y permisos:</strong> Esta aplicación <b>solo accede a la hoja de cálculo compartida</b> para mostrar y actualizar información según tu perfil.<br />
            <b>Nunca accedemos ni modificamos otros archivos de tu Google Drive.</b><br />
            El mensaje de Google sobre permisos es estándar y se muestra a todas las apps que editan hojas de cálculo.
          </div>
          <p style={{ fontSize: 13, color: '#6B7A9F', marginBottom: 16 }}>Por favor, otorga los permisos solicitados por Google para continuar.</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Mostrar el JSON recibido si está disponible para depuración
    let debugRaw = null;
    try {
      const raw = localStorage.getItem('be_plan_config');
      if (raw) debugRaw = JSON.parse(raw);
    } catch {}
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#EEF2F8' }}>
        <div style={{ textAlign: 'center', padding: 40, maxWidth: 480, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#E8352B', marginBottom: 8 }}>Error al cargar datos</p>
          <p style={{ fontSize: 13, color: '#6B7A9F', marginBottom: 16 }}>{error ?? 'Datos no disponibles'}</p>
          <button onClick={reload} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, color: '#fff', background: '#1B30CC', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
            Reintentar
          </button>
          {debugRaw && (
            <pre style={{ textAlign: 'left', fontSize: 12, background: '#F3F4F6', color: '#1B30CC', padding: 12, borderRadius: 8, marginTop: 16, maxHeight: 200, overflow: 'auto' }}>
              {JSON.stringify(debugRaw, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }


  // Pantalla de AdminPanel (seed)
  if (navLevel === 'adminpanel') {
    return (
      <AdminPanel onVolver={() => setNavLevel('portafolios')} />
    );
  }

  // Pantalla de Portafolios (inicio)
  if (navLevel === 'portafolios') {
    if (portfoliosLoading) {
      return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0A1650', zIndex: 50 }}>
          <div style={{ width: 192, height: 4, borderRadius: 9999, overflow: 'hidden', background: 'rgba(255,255,255,0.15)' }}>
            <div style={{ height: '100%', borderRadius: 9999, background: '#2BB8D4', animation: 'load 1.4s ease forwards', width: '0%' }} />
          </div>
          <p style={{ fontSize: 12, marginTop: 16, color: 'rgba(255,255,255,0.4)' }}>Cargando portafolios…</p>
        </div>
      );
    }

    if (!portfoliosData) return null;

    // Sin portafolios en Firestore → estado vacío (solo para admin)
    const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
    const isSuperAdmin = user?.email === 'ricardo.moscoso@blue.cl';
    const handleSeed = () => {
        setSeedLoading(true);
        setSeedMsg(null);
        const run = (window as any)?.google?.script?.run;
        if (!run) {
          setSeedMsg('❌ google.script.run no disponible (ejecutar en GAS)');
          setSeedLoading(false);
          return;
        }
        // Los entregables van nested dentro de cada iniciativa.
        // Se envía el mock tal cual, sin aplanar.
        const payload = JSON.stringify({
          ...fullMock,
          equipoId: (fullMock.config as any).equipoId ?? 'eq_planificacion',
        });
        run
          .withSuccessHandler((_res: any) => {
            setSeedLoading(false);
            setSeedMsg('✅ Datos cargados correctamente. Recargando...');
            setTimeout(() => window.location.reload(), 1200);
          })
          .withFailureHandler((err: any) => {
            setSeedMsg(`❌ ${err?.message ?? 'Error desconocido'}`);
            setSeedLoading(false);
          })
          .seedCompleto(payload);
    };
    if (isGAS && portfoliosData.length === 0) {
      return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 48px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 480 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1f2937', margin: '0 0 8px' }}>Sin portafolios</h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
              No hay portafolios en la base de datos aún.
            </p>
            {isSuperAdmin ? (
              <>
                <button
                  onClick={handleSeed}
                  disabled={seedLoading}
                  style={{ background: '#B45309', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: seedLoading ? 'not-allowed' : 'pointer', marginBottom: 10 }}
                >
                  {seedLoading ? '⏳ Cargando datos de ejemplo...' : '🗄️ Cargar datos de ejemplo (Seed)'}
                </button>
                {seedMsg && <div style={{ marginTop: 10, fontSize: 13, color: seedMsg.startsWith('✅') ? '#059669' : '#DC2626', fontWeight: 700 }}>{seedMsg}</div>}
                <div style={{ fontSize: 12, color: '#92400E', marginTop: 10 }}>Esta acción creará el portafolio y todos los datos de ejemplo.<br />Solo usar en entorno vacío.</div>
              </>
            ) : isAdmin ? (
              <button
                onClick={() => setNavLevel('adminpanel')}
                style={{ background: '#0033A0', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                + Crear portafolios (Admin)
              </button>
            ) : (
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Contacta a un administrador para configurar los portafolios.</p>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <Portafolios
          portafolios={portfoliosData}
          onSelectEquipo={(equipo) => {
            setSelectedEquipoId(equipo.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setNavLevel((equipo as any).config ? 'config' : 'sitio');
          }}
          isAdmin={isAdmin}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          usuario={user as any}
          onPortafolioCreated={() => {}}
        />
      </>
    );
  }

  // Pantalla de Equipos (dentro de un portafolio)
  if (navLevel === 'equipos') {
    const portafolio = portfoliosData?.find((p: any) => p.id === selectedPortafolioId);

    if (!portafolio) return null;

    return (
      <>
        <Equipos
          portafolio={portafolio}
          isAdmin={isAdmin}
          onSelectEquipo={(eqId) => {
            setSelectedEquipoId(eqId);
            setNavLevel('sitio');
          }}
          onConfigEquipo={(eqId) => {
            setSelectedEquipoId(eqId);
            setNavLevel('config');
          }}
          onBack={() => setNavLevel('portafolios')}
        />
      </>
    );
  }

  // Derivar nombre del equipo seleccionado para pasarlo a Admin
  const equipoNombreActual: string | undefined = (() => {
    if (!selectedEquipoId) return undefined;
    for (const port of (portfoliosData ?? [])) {
      const eq = (port.equipos ?? []).find(e => e.id === selectedEquipoId);
      if (eq) return eq.nombre;
    }
    return undefined;
  })();

  // Pantalla de Configuración del equipo (Admin sin MainLayout)
  if (navLevel === 'config') {
    if (!data) return null;
    return (
      <UnsavedChangesProvider>
        <Admin
          data={data}
          onNav={() => {}}
          onDataRefresh={silentReload}
          selectedEquipoId={selectedEquipoId}
          equipoNombre={equipoNombreActual}
          onBack={() => setNavLevel('portafolios')}
          fullScreen
        />
      </UnsavedChangesProvider>
    );
  }

  // Pantalla del Sitio (dentro de un equipo)
  if (!data) return null; // Por seguridad, aunque ya hay returns anticipados

  const configuredQuarter = Number((data.config.q_activo ?? 'Q2').replace(/\D/g, ''));
  const activeQuarter = configuredQuarter >= 1 && configuredQuarter <= 4 ? (q ?? configuredQuarter) : (q ?? 2);


  const renderPage = () => {
    switch (activePage) {
      case 'inicio':          return <Home data={data} q={activeQuarter} onNavCapacidad={navToCapacidad} onNav={setActivePage} />;
      case 'roadmap':         return <RoadmapGeneral data={data} q={activeQuarter} />;
      case 'reviews':         return <Reviews data={data} />;
      case 'studio-reviews':  return <StudioReviews data={data} />;
      case 'noticias':        return <Noticias />;
      case 'capacitaciones':  return <Capacitaciones data={data} />;
      case 'business-flows':  return <BusinessFlows data={data} />;
      case 'bienvenida':      return <Induccion />;
      case 'admin':           return <Admin data={data} onNav={setActivePage} onDataRefresh={silentReload} selectedEquipoId={selectedEquipoId} equipoNombre={equipoNombreActual} />;
      case 'capacidad': {
        const cap = data.capacidades.find(c => c.key === activeCapacidadKey);
        return cap
          ? <CapacidadRoadmap capacidad={cap} data={data} q={activeQuarter} onBack={() => setActivePage('inicio')} />
          : null;
      }
      case 'presentaciones':  return <PresentacionesPage data={data} />;
      default:
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, fontSize: 14, color: '#6B7A9F' }}>
            Sección en construcción.
          </div>
        );
    }
  };

  return (
    <UnsavedChangesProvider>
      <MainLayout
        data={data}
        config={data.config}
        activePage={activePage}
        onNav={setActivePage}
        q={activeQuarter}
        onQChange={setQ}
        onReloadFromSheet={handleReloadFromSheet}
        onBackToPortfolios={() => {
          setActivePage('inicio');
          setNavLevel('portafolios');
        }}
      >
        {renderPage()}
      </MainLayout>
    </UnsavedChangesProvider>
  );
}

export default App;



