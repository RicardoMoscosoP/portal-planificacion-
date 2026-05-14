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

  const enGAS = isGAS();


  // ── Seed COMPLETO: todo el mockDataLocal.json → Firestore (una sola vez) ──
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

