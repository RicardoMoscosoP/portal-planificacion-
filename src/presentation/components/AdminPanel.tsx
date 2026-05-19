import { useState } from 'react';
import type { Portafolio } from '../../domain/interfaces/IPortafoliosRepository';
import PortafolioForm from './PortafolioForm';
import { createPortafoliosRepository } from '../../infrastructure/repositories/portafolios/PortafoliosRepositoryFactory';
import fullMock from '../../../documentacion/mockDataLocal.json';

function isGAS(): boolean {
  const g = window as any;
  return typeof g?.google?.script !== 'undefined';
}

export default function AdminPanel({ onVolver, userEmail }: { onVolver?: () => void; userEmail?: string }) {
  const [seedingCompleto, setSeedingCompleto] = useState(false);
  const [seedCompletoMsg, setSeedCompletoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ── Export por equipo ──────────────────────────────────────────────────────
  type PortItem = { id: string; nombre: string; equipos: { id: string; nombre: string }[] };
  const [portafoliosLista, setPortafoliosLista] = useState<PortItem[]>([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
  const [exportandoEquipo, setExportandoEquipo] = useState(false);
  const [exportEquipoMsg, setExportEquipoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const enGAS = isGAS();

  // ── Exportar datos completos → descarga JSON ──────────────────────────────
  const handleExportar = () => {
    setExporting(true);
    setExportMsg(null);
    const g = window as any;
    const run = g?.google?.script?.run;
    if (!run) {
      setExportMsg({ ok: false, text: '❌ google.script.run no disponible' });
      setExporting(false);
      return;
    }
    run
      .withSuccessHandler((res: any) => {
        const r = typeof res === 'string' ? JSON.parse(res) : res;
        if (r.ok) {
          const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const fecha = new Date().toISOString().slice(0, 10);
          a.href = url;
          a.download = `backup-firestore-${fecha}.json`;
          a.click();
          URL.revokeObjectURL(url);
          const totalEquipos = (r.portafolios ?? []).reduce((acc: number, p: any) => acc + (p.equipos?.length ?? 0), 0);
          setExportMsg({ ok: true, text: `✅ Exportado: ${r.portafolios?.length ?? 0} portafolios, ${totalEquipos} equipos` });
        } else {
          setExportMsg({ ok: false, text: `❌ Error: ${r.error}` });
        }
        setExporting(false);
      })
      .withFailureHandler((err: any) => {
        setExportMsg({ ok: false, text: `❌ ${err?.message ?? 'Error desconocido'}` });
        setExporting(false);
      })
      .exportarDatos();
  };

  // ── Cargar lista de portafolios/equipos para el selector ──────────────────
  const handleCargarLista = () => {
    setLoadingLista(true);
    setExportEquipoMsg(null);
    const g = window as any;
    const run = g?.google?.script?.run;
    if (!run) { setLoadingLista(false); return; }
    run
      .withSuccessHandler((res: any) => {
        const r = typeof res === 'string' ? JSON.parse(res) : res;
        if (r.ok) setPortafoliosLista(r.portafolios ?? []);
        setLoadingLista(false);
      })
      .withFailureHandler(() => setLoadingLista(false))
      .listarPortafoliosEquipos();
  };

  // ── Exportar un equipo específico → JSON ──────────────────────────────────
  const handleExportarEquipo = () => {
    if (!equipoSeleccionado) return;
    setExportandoEquipo(true);
    setExportEquipoMsg(null);
    const g = window as any;
    const run = g?.google?.script?.run;
    if (!run) { setExportandoEquipo(false); return; }
    // Buscamos el nombre del equipo para el nombre del archivo
    let nombreEquipo = equipoSeleccionado;
    portafoliosLista.forEach(p => {
      const eq = p.equipos.find(e => e.id === equipoSeleccionado);
      if (eq) nombreEquipo = eq.nombre.replace(/\s+/g, '-').toLowerCase();
    });
    run
      .withSuccessHandler((res: any) => {
        const r = typeof res === 'string' ? JSON.parse(res) : res;
        if (r.ok) {
          const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const fecha = new Date().toISOString().slice(0, 10);
          a.href = url;
          a.download = `equipo-${nombreEquipo}-${fecha}.json`;
          a.click();
          URL.revokeObjectURL(url);
          setExportEquipoMsg({ ok: true, text: `✅ Exportado equipo "${nombreEquipo}"` });
        } else {
          setExportEquipoMsg({ ok: false, text: `❌ Error: ${r.error}` });
        }
        setExportandoEquipo(false);
      })
      .withFailureHandler((err: any) => {
        setExportEquipoMsg({ ok: false, text: `❌ ${err?.message ?? 'Error desconocido'}` });
        setExportandoEquipo(false);
      })
      .exportarEquipo(equipoSeleccionado);
  };

  const handleSeedCompleto = () => {
    setSeedingCompleto(true);
    setSeedCompletoMsg(null);
    const g = window as any;
    const run = g?.google?.script?.run;
    if (!run) {
      setSeedCompletoMsg({ ok: false, text: '❌ google.script.run no disponible' });
      setSeedingCompleto(false);
      return;
    }
    // Los entregables van nested dentro de cada iniciativa.
    // Se envía el mock tal cual, sin aplanar.
    const payload = JSON.stringify({
      ...fullMock,
      equipoId: (fullMock.config as any).equipoId ?? 'eq_planificacion',
    });
    run
      .withSuccessHandler((res: any) => {
        const r = typeof res === 'string' ? JSON.parse(res) : res;
        setSeedCompletoMsg(r.ok
          ? { ok: true, text: `✅ Seed completo OK (equipo: ${r.equipoId})` }
          : { ok: false, text: `❌ Error: ${r.error}` });
        setSeedingCompleto(false);
      })
      .withFailureHandler((err: any) => {
        setSeedCompletoMsg({ ok: false, text: `❌ ${err?.message ?? 'Error desconocido'}` });
        setSeedingCompleto(false);
      })
      .seedCompleto(payload);
  };

  // ── Crear portafolio individual → Firestore ────────────────────────────────
  const handleGuardarPortafolio = async (portafolio: Portafolio) => {
    setSavingForm(true);
    setFormMsg(null);
    try {
      const repo = createPortafoliosRepository();
      // Pasamos el portafolio completo con su id generado por el form,
      // para que portafolioId en cada equipo sea consistente con el doc en Firestore.
      // GAS usa objeto.id si está presente, o genera uno si no.
      await repo.save(portafolio);
      setFormMsg({ ok: true, text: `✅ Portafolio "${portafolio.nombre}" guardado en Firestore.` });
      setMostrarForm(false);
    } catch (e) {
      setFormMsg({ ok: false, text: `❌ Error: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setSavingForm(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: 32 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          {onVolver && (
            <button
              onClick={onVolver}
              style={{ background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#475569' }}
            >
              ← Volver
            </button>
          )}
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 20, margin: 0, color: '#0f172a' }}>Panel de Administración</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
              {enGAS ? 'Operaciones sobre Firestore' : 'Entorno local — solo visualización'}
            </p>
          </div>
        </div>

        {/* ── GAS: Seed COMPLETO (una sola vez, solo super admin) ── */}
        {enGAS && userEmail === 'ricardo.moscoso@blue.cl' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '2px solid #0033A0', padding: '20px 24px', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px', color: '#0033A0' }}>
              🗄️ Cargar TODO el mock → Firestore (una sola vez)
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px' }}>
              Inserta portafolios, equipos, usuarios, config, miembros, capacidades, aplicaciones, bets, MOS, iniciativas, entregables, stakeholders, businessFlows y reviews. <strong>Solo ejecutar una vez.</strong>
            </p>
            <button
              onClick={handleSeedCompleto}
              disabled={seedingCompleto}
              style={{ background: '#0033A0', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: seedingCompleto ? 'not-allowed' : 'pointer', opacity: seedingCompleto ? 0.7 : 1 }}
            >
              {seedingCompleto ? 'Cargando todo...' : '🚀 Seed Completo → Firestore'}
            </button>
            {seedCompletoMsg && (
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: seedCompletoMsg.ok ? '#059669' : '#dc2626' }}>
                {seedCompletoMsg.text}
              </div>
            )}
          </div>
        )}

        {/* Eliminado: Seed portafolios base (solo queda seed completo para super admin) */}

        {/* ── GAS: Crear portafolio nuevo ── */}
        {enGAS && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px', color: '#1e293b' }}>
              Crear portafolio nuevo
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px' }}>
              Define nombre, descripción y equipos. Se guarda directamente en Firestore.
            </p>
            {formMsg && (
              <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: formMsg.ok ? '#059669' : '#dc2626' }}>
                {formMsg.text}
              </div>
            )}
            {!mostrarForm ? (
              <button
                onClick={() => { setMostrarForm(true); setFormMsg(null); }}
                style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                + Nuevo portafolio
              </button>
            ) : (
              <div style={{ opacity: savingForm ? 0.6 : 1, pointerEvents: savingForm ? 'none' : 'auto' }}>
                <PortafolioForm
                  onSave={handleGuardarPortafolio}
                  onCancel={() => setMostrarForm(false)}
                />
              </div>
            )}
          </div>
        )}

        {/* ── GAS: Exportar datos completos → JSON ── */}
        {enGAS && userEmail === 'ricardo.moscoso@blue.cl' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px', color: '#1e293b' }}>
              📦 Exportar todos los datos → JSON
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px' }}>
              Descarga un backup completo de Firestore: portafolios, equipos y todas las subcolecciones (miembros, bets, MOS, presentaciones, etc.).
            </p>
            <button
              onClick={handleExportar}
              disabled={exporting}
              style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.7 : 1 }}
            >
              {exporting ? 'Exportando...' : '⬇️ Descargar backup JSON'}
            </button>
            {exportMsg && (
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: exportMsg.ok ? '#059669' : '#dc2626' }}>
                {exportMsg.text}
              </div>
            )}
          </div>
        )}

        {/* ── GAS: Exportar por equipo ── */}
        {enGAS && userEmail === 'ricardo.moscoso@blue.cl' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px', color: '#1e293b' }}>
              🗂️ Exportar por equipo → JSON
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px' }}>
              Selecciona un equipo para descargar solo sus datos (config, miembros, bets, MOS, presentaciones, etc.).
            </p>

            {portafoliosLista.length === 0 ? (
              <button
                onClick={handleCargarLista}
                disabled={loadingLista}
                style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: loadingLista ? 'not-allowed' : 'pointer', opacity: loadingLista ? 0.7 : 1 }}
              >
                {loadingLista ? 'Cargando lista...' : '🔄 Cargar equipos'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <select
                  value={equipoSeleccionado}
                  onChange={e => { setEquipoSeleccionado(e.target.value); setExportEquipoMsg(null); }}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, color: '#1e293b', background: '#f8fafc' }}
                >
                  <option value=''>— Selecciona un equipo —</option>
                  {portafoliosLista.map(p => (
                    <optgroup key={p.id} label={p.nombre}>
                      {p.equipos.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleExportarEquipo}
                    disabled={!equipoSeleccionado || exportandoEquipo}
                    style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: (!equipoSeleccionado || exportandoEquipo) ? 'not-allowed' : 'pointer', opacity: (!equipoSeleccionado || exportandoEquipo) ? 0.6 : 1 }}
                  >
                    {exportandoEquipo ? 'Exportando...' : '⬇️ Descargar equipo'}
                  </button>
                  <button
                    onClick={() => { setPortafoliosLista([]); setEquipoSeleccionado(''); setExportEquipoMsg(null); }}
                    style={{ background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#64748b', cursor: 'pointer' }}
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            )}

            {exportEquipoMsg && (
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: exportEquipoMsg.ok ? '#059669' : '#dc2626' }}>
                {exportEquipoMsg.text}
              </div>
            )}
          </div>
        )}

        {/* ── Local: aviso ── */}
        {!enGAS && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #fde68a', padding: '20px 24px' }}>
            <p style={{ fontSize: 14, color: '#92400e', fontWeight: 600, margin: 0 }}>
              ⚠️ Entorno local detectado
            </p>
            <p style={{ fontSize: 13, color: '#78716c', margin: '8px 0 0' }}>
              En local los datos vienen del archivo <code>portfoliosMock.ts</code>. Para crear portafolios reales, usa el despliegue en Apps Script.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

