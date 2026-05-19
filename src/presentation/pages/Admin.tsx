import { useContext, useEffect, useRef, useState } from 'react';
import type { AppData, Config, Iniciativa, EntregableItem, Bet, MOS, TeamMember, Capacidad, Alcance, Aplicacion, Stakeholder, BusinessFlow, Review, Usuario, UltimoRelease, Capacitacion } from '../../domain/types';
import { saveConfig, saveIniciativa, deleteIniciativa, saveBet, deleteBet, saveMOS, deleteMOS, saveTeamMember, deleteTeamMember, saveCapacidades, saveAplicacion, deleteAplicacion, saveStakeholder, deleteStakeholder, saveBusinessFlow, deleteBusinessFlow, getReviews, saveReview, deleteReview, flushToSheet, getUsuarios, cambiarRolUsuario, toggleUsuarioActivo, saveUsuario as saveUsuarioLocal, saveCapacitacion, deleteCapacitacion } from '../../application/services/dataService';
import { AuthContext } from '../contexts/AuthContext';

import { getBetPrimaryProduct, getBetProducts, getMosByBet, getMosQuarters } from '../../application/services/betMos';
import { isValidExternalUrl, resolveReviewEmbed, sanitizeExternalUrl } from '../../application/services/reviewEmbed';
import { getReviewDisplayName, sortReviews } from '../../application/services/reviewUtils';
import type { PageKey } from '../layouts/MainLayout';
import FeedbackModal, { type FeedbackModalVariant } from '../components/FeedbackModal';
import { BX_MODAL_OVERLAY_STYLE, BX_MODAL_PANEL_STYLE } from '../components/modalStyles';
import ReviewEditor, { createEmptyReview } from '../components/ReviewEditor';
import ReviewMockupWorkspace, { type ReviewWorkspaceHandle } from '../components/ReviewMockupWorkspace';
import ReviewPresentation from '../components/ReviewPresentation';
import PresentacionesAdminSection from '../components/PresentacionesAdminSection';

import Portafolios from './Portafolios';
import type { Equipo } from '../../domain/types';
import StudioReviews from './StudioReviews';
import fullMock from '../../../documentacion/mockDataLocal.json';

type AdminSection = 'bienvenida' | 'config' | 'equipo' | 'capacidades' | 'stakeholders' | 'business-flows' | 'aplicaciones' | 'bets' | 'mos' | 'reviews' | 'presentaciones' | 'iniciativas' | 'entregables' | 'noticias' | 'capacitaciones' | 'usuarios' | 'seed' | 'exportar';

type AdminDialogHelpers = {
  showError: (message: string, title?: string) => void;
  showAlert: (message: string, title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, options?: { title?: string; confirmLabel?: string; cancelLabel?: string }) => void;
};

type AdminDialogState = {
  open: boolean;
  variant: FeedbackModalVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
};

const ADMIN_SECTION_STORAGE_KEY = 'be_admin_active_section';
const BETS_UI_STATE_STORAGE_KEY = 'be_admin_bets_ui_state';

function readSessionValue<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeSessionValue<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
}

const Q_MONTHS: Record<number, string[]> = {
  1: ['Ene', 'Feb', 'Mar'],
  2: ['Abr', 'May', 'Jun'],
  3: ['Jul', 'Ago', 'Sep'],
  4: ['Oct', 'Nov', 'Dic'],
};

const TAGS = ['plan', 'wip', 'done'] as const;
const TAG_LABEL: Record<string, string> = { plan: 'Backlog', wip: 'In Progress', done: 'Done' };



const STAKEHOLDER_Q_OPTIONS = ['ALL', 'Q1', 'Q2', 'Q3', 'Q4'] as const;
const STAKEHOLDER_Q_LABEL: Record<(typeof STAKEHOLDER_Q_OPTIONS)[number], string> = {
  ALL: 'Todos los Q',
  Q1: 'Q1',
  Q2: 'Q2',
  Q3: 'Q3',
  Q4: 'Q4',
};

type BusinessFlowForm = {
  titulo: string;
  descripcionTarjeta: string;
  confluenceUrl: string;
  presentacionUrl: string;
  capacidadKey: string;
  activo: boolean;
};

const emptyBusinessFlowForm = (): BusinessFlowForm => ({
  titulo: '',
  descripcionTarjeta: '',
  confluenceUrl: '',
  presentacionUrl: '',
  capacidadKey: '',
  activo: true,
});

const ADMIN_MODAL_OVERLAY_STYLE: React.CSSProperties = {
  ...BX_MODAL_OVERLAY_STYLE,
};

const ADMIN_MODAL_PANEL_STYLE: React.CSSProperties = {
  ...BX_MODAL_PANEL_STYLE,
};

// ── Sección Config General ────────────────────────────────────────────────────
function ConfigSection({ data, onSaved }: { data: AppData; onSaved: () => void }) {
  const equipoId = (data.config as any).equipoId ?? 'eq_planificacion';
  const [form, setForm] = useState<Config>({ ...data.config });
  const [saved, setSaved] = useState(false);

  const fields: { key: keyof Config; label: string; type?: string }[] = [
    { key: 'titulo',              label: 'Portafolio al que pertenece y célula' },
    { key: 'q_activo',           label: 'Q Activo (Q1…Q4)' },
    { key: 'fecha_actualizacion',label: 'Fecha actualización (ej: 08/04/26)' },
    { key: 'po',                 label: 'Product Owner' },
    { key: 'im',                 label: 'Iteration Manager' },
    { key: 'tl',                 label: 'Tech Lead' },
    { key: 'total_devs',         label: 'Total devs', type: 'number' },
    { key: 'version',            label: 'Versión' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(form, equipoId);
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Configuración General</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 22 }}>
        Estos valores se muestran en el encabezado principal. El portafolio visible actual debe quedar como Portafolio Distribución.
      </p>
      <form onSubmit={handleSave} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fields.map(f => (
            <div key={f.key}>
              <div className="flbl">{f.label}</div>
              <input
                className="fmi"
                type={f.type ?? 'text'}
                value={(form[f.key] as string | number | undefined) ?? ''}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                style={{ padding: '9px 12px', fontSize: 13 }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22 }}>
          <button className="btn-save" type="submit">Guardar cambios</button>
          {saved && <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>✓ Guardado</span>}
        </div>
      </form>
    </div>
  );
}

// ── Sección Usuarios ──────────────────────────────────────────────────────────
function UsuariosSection({ onSaved, dialogs }: { data: AppData; onSaved: () => void; dialogs: AdminDialogHelpers }) {
  const authCtx = useContext(AuthContext);
  const emailActual = authCtx?.user?.email ?? '';
  const esSuperAdmin = authCtx?.user?.rol === 'superadmin';

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  const isGAS = typeof window !== 'undefined' && !!(window as any)?.google?.script;

  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [agregarMsg, setAgregarMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Cargar usuarios: desde GAS/Firestore si está disponible, sino desde localStorage
  useEffect(() => {
    if (isGAS) {
      const run = (window as any)?.google?.script?.run;
      if (run) {
        run
          .withSuccessHandler((res: any) => {
            const r = typeof res === 'string' ? JSON.parse(res) : res;
            if (r.ok) setUsuarios(r.usuarios ?? []);
            setLoadingUsuarios(false);
          })
          .withFailureHandler(() => {
            setUsuarios(getUsuarios());
            setLoadingUsuarios(false);
          })
          .obtenerUsuarios();
      } else {
        setUsuarios(getUsuarios());
        setLoadingUsuarios(false);
      }
    } else {
      setUsuarios(getUsuarios());
      setLoadingUsuarios(false);
    }
  }, [isGAS]);

  // Agregar admin por email (pre-registro antes del primer login)
  const handleAgregarAdmin = () => {
    const email = nuevoEmail.trim().toLowerCase();
    const nombre = nuevoNombre.trim();
    const domain = email.split('@')[1] ?? '';
    if (!nombre) {
      setAgregarMsg({ ok: false, text: '\u274c Ingresa el nombre completo' });
      return;
    }
    if (!['blue.cl', 'bx.cl', 'bluex.cl'].includes(domain)) {
      setAgregarMsg({ ok: false, text: '\u274c Solo correos @blue.cl o @bx.cl' });
      return;
    }
    if (usuarios.some(u => u.email === email)) {
      setAgregarMsg({ ok: false, text: '\u274c Ya est\u00e1 registrado' });
      return;
    }
    setAgregando(true);
    setAgregarMsg(null);
    const nuevo: Usuario = {
      _id: email,
      email,
      nombre,
      rol: 'admin',
      activo: true,
      canConfigure: true,
      fechaRegistro: new Date().toISOString(),
      autoRegistro: false,
    };
    setUsuarios(prev => [...prev, nuevo]);
    if (isGAS) {
      const run = (window as any)?.google?.script?.run;
      if (run) {
        run
          .withSuccessHandler(() => {
            setAgregarMsg({ ok: true, text: `\u2705 ${nombre} agregado como Admin` });
            setNuevoEmail('');
            setNuevoNombre('');
            setAgregando(false);
          })
          .withFailureHandler((err: any) => {
            setAgregarMsg({ ok: false, text: `\u274c ${err?.message ?? 'Error al guardar'}` });
            setAgregando(false);
          })
          .actualizarUsuario(email, nuevo);
        return;
      }
    }
    saveUsuarioLocal(nuevo);
    setAgregarMsg({ ok: true, text: `\u2705 ${nombre} agregado (local)` });
    setNuevoEmail('');
    setNuevoNombre('');
    setAgregando(false);
  };

  const persistirRol = (u: Usuario, nuevoRol: 'admin' | 'viewer') => {
    const canConfigure = nuevoRol !== 'viewer';
    const updated = { ...u, rol: nuevoRol, canConfigure };
    setUsuarios(prev => prev.map(x => x._id === u._id ? updated : x));
    cambiarRolUsuario(u._id, nuevoRol);
    if (isGAS) {
      const run = (window as any)?.google?.script?.run;
      if (run) run.actualizarUsuario(u._id, { rol: nuevoRol, canConfigure });
    }
    onSaved();
  };

  // Persistir cambio activo: GAS + localStorage
  const persistirActivo = (u: Usuario, activo: boolean) => {
    setUsuarios(prev => prev.map(x => x._id === u._id ? { ...x, activo } : x));
    toggleUsuarioActivo(u._id, activo);
    if (isGAS) {
      const run = (window as any)?.google?.script?.run;
      if (run) run.actualizarUsuario(u._id, { activo });
    }
    onSaved();
  };

  const handleCambiarRol = (u: Usuario, nuevoRol: 'admin' | 'viewer') => {
    if (u.email === emailActual) {
      dialogs.showError('No puedes cambiar tu propio rol.', 'Acción no permitida');
      return;
    }
    const label = nuevoRol === 'admin' ? 'Admin' : 'Viewer';
    const desc = nuevoRol === 'admin'
      ? 'Podrá administrar la configuración de su portafolio.'
      : nuevoRol === 'viewer'
      ? 'Solo podrá navegar el portal, sin acceso a configuración.'
      : 'Acceso total de administrador.';
    dialogs.showConfirm(
      `¿Cambiar rol de ${u.nombre || u.email} a ${label}?\n${desc}`,
      () => persistirRol(u, nuevoRol),
      { confirmLabel: 'Cambiar' }
    );
  };

  const handleToggleActivo = (u: Usuario) => {
    if (u.email === emailActual) {
      dialogs.showError('No puedes desactivarte a ti mismo.', 'Acción no permitida');
      return;
    }
    const accion = u.activo ? 'desactivar' : 'activar';
    dialogs.showConfirm(
      `¿Deseas ${accion} a ${u.nombre || u.email}?`,
      () => persistirActivo(u, !u.activo),
      { confirmLabel: accion.charAt(0).toUpperCase() + accion.slice(1) }
    );
  };

  const adminsRegistrados = usuarios.filter(u => u.rol === 'admin' || u.rol === 'superadmin' || u.rol === 'super_admin');

  return (
    <div style={{ border: '1px solid #DCE7FF', borderRadius: 18, padding: 18, background: '#fff' }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>🔐 Admins registrados</h3>
      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>Solo estos usuarios tienen acceso al módulo de configuración.</p>

      {/* Agregar admin por email — solo superadmin */}
      {esSuperAdmin && (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px', color: '#1e293b' }}>Agregar Admin</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              placeholder="Nombre completo"
              value={nuevoNombre}
              onChange={e => { setNuevoNombre(e.target.value); setAgregarMsg(null); }}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
              <input
                type="email"
                placeholder="correo@blue.cl"
                value={nuevoEmail}
                onChange={e => { setNuevoEmail(e.target.value); setAgregarMsg(null); }}
                onKeyDown={e => e.key === 'Enter' && handleAgregarAdmin()}
                style={{ flex: 1, minWidth: 200, padding: '7px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
              />
              <button
                onClick={handleAgregarAdmin}
                disabled={agregando || !nuevoEmail.trim() || !nuevoNombre.trim()}
                style={{ padding: '7px 18px', borderRadius: 8, background: '#0033A0', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: agregando || !nuevoEmail.trim() || !nuevoNombre.trim() ? 'not-allowed' : 'pointer', opacity: agregando || !nuevoEmail.trim() || !nuevoNombre.trim() ? 0.6 : 1 }}
              >
                {agregando ? 'Guardando…' : '+ Agregar'}
              </button>
            </div>
          </div>
          {agregarMsg && (
            <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: agregarMsg.ok ? '#059669' : '#dc2626' }}>
              {agregarMsg.text}
            </p>
          )}
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#94A3B8' }}>
            El usuario podr\u00e1 entrar con su cuenta corporativa y tendr\u00e1 rol Admin desde el primer login.
          </p>
        </div>
      )}

      {loadingUsuarios ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: 13 }}>Cargando…</div>
      ) : adminsRegistrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: 13 }}>
          No hay admins registrados. Usa el formulario de arriba para agregar el primero.
        </div>
      ) : (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
            {['Nombre', 'Email', 'Estado', 'Acciones'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {adminsRegistrados.map(u => {
            const esSelf = u.email === emailActual;
            return (
              <tr key={u._id} style={{ borderBottom: '1px solid #F1F5F9', opacity: u.activo ? 1 : 0.5 }}>
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                  {u.nombre || '—'}
                  {esSelf && <span style={{ marginLeft: 6, fontSize: 10, color: '#2BB8D4', fontWeight: 700 }}>Tú</span>}
                </td>
                <td style={{ padding: '8px 12px', color: '#64748B' }}>{u.email}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: u.activo ? '#22C55E' : '#EF4444', marginRight: 6 }} />
                  {u.activo ? 'Activo' : 'Inactivo'}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleCambiarRol(u, 'viewer')} disabled={esSelf}
                      style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#475569', cursor: esSelf ? 'not-allowed' : 'pointer', opacity: esSelf ? 0.4 : 1 }}>
                      Quitar Admin
                    </button>
                    <button onClick={() => handleToggleActivo(u)} disabled={esSelf}
                      style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', cursor: esSelf ? 'not-allowed' : 'pointer', opacity: esSelf ? 0.4 : 1 }}>
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      )}
    </div>
  );
}

// ── Sección Iniciativas ───────────────────────────────────────────────────────
const ENT_ESTADO_STYLE: Record<string, { bg: string; color: string }> = {
  backlog:     { bg: '#f1f5f9', color: '#475569' },
  in_progress: { bg: '#fef9c3', color: '#92400e' },
  done:        { bg: '#dcfce7', color: '#166534' },
};

/** Formatea un ISO 8601 a "DD/MM/YYYY HH:mm" para mostrar en admin */
function fmtAudit(iso: string | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();
    const hh    = String(d.getHours()).padStart(2, '0');
    const mm    = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hh}:${mm}`;
  } catch { return iso; }
}

/** Chip compacto de auditoría — solo visible en admin */
function AuditMeta({ createdAt, updatedAt, createdBy, updatedBy }: {
  createdAt?: string; updatedAt?: string; createdBy?: string; updatedBy?: string;
}) {
  if (!createdAt && !updatedAt) return null;
  return (
    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 11, color: '#94a3b8' }}>
      {createdAt && (
        <span>Creado: <strong style={{ color: '#64748b' }}>{fmtAudit(createdAt)}</strong>{createdBy ? ` · ${createdBy}` : ''}</span>
      )}
      {updatedAt && updatedAt !== createdAt && (
        <span>Modificado: <strong style={{ color: '#64748b' }}>{fmtAudit(updatedAt)}</strong>{updatedBy ? ` · ${updatedBy}` : ''}</span>
      )}
    </div>
  );
}

function IniciativasSection({ data, onSaved, dialogs }: { data: AppData; onSaved: () => void; dialogs: AdminDialogHelpers }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Iniciativa> | null>(null);
  const [entModal, setEntModal] = useState<{ iniId: string; form: Partial<EntregableItem>; editId?: string } | null>(null);
  // Toast inline de éxito en operaciones de entregables (sin disparar reload del padre)
  const [entToast, setEntToast] = useState<string | null>(null);

  // Obtener todos los productos de Bets/LVT activos
  const equipoId = (data.config as any).equipoId ?? 'eq_planificacion';
  const allProducts = data.bets.filter(b => b.activo !== false).flatMap(b => b.productos && b.productos.length > 0 ? b.productos : [b.producto]);
  const qDefault = parseInt(data.config.q_activo?.replace('Q', '') ?? '2');
  const [q, setQ] = useState(qDefault);
  const [adding, setAdding] = useState(false);
  const [iniciativas, setIniciativas] = useState<Iniciativa[]>(() => [...data.iniciativas]);
  const [newForm, setNewForm] = useState<Partial<Iniciativa>>({
    q, tag: 'plan', emoji: '📌',
    bar: { s: 0, e: 2, sp: 0, ep: 100 },
    label: '',
    descripcion: '',
    producto: '',
    capacidadKeys: [],
  });

  // Solo sync desde el padre cuando se recibe data nueva (evitar sobreescribir cambios locales)
  const prevDataRef = useRef(data.iniciativas);
  useEffect(() => {
    if (prevDataRef.current !== data.iniciativas) {
      prevDataRef.current = data.iniciativas;
      setIniciativas([...data.iniciativas]);
    }
  }, [data.iniciativas]);

  const filtered = iniciativas
    .filter(i => i.q === q)
    .sort((a, b) => (a.producto > b.producto ? 1 : -1));

  const showEntToast = (msg: string) => {
    setEntToast(msg);
    setTimeout(() => setEntToast(null), 2500);
  };

  // saveIniLocal: guarda y actualiza el estado local. No recarga desde el padre.
  // Usar para operaciones de entregables (sin riesgo de race condition en GAS).
  const saveIniLocal = (ini: Iniciativa) => {
    saveIniciativa(ini, equipoId);
    setIniciativas(prev => prev.map(i => i.id === ini.id ? ini : i));
  };

  // saveIni: guarda y notifica al padre (para cambios de iniciativa que requieren flush completo)
  const saveIni = (ini: Iniciativa) => {
    saveIniciativa(ini, equipoId);
    setIniciativas(prev => prev.map(i => i.id === ini.id ? ini : i));
    // Marcar la ref actualizada para evitar que el useEffect posterior revierta el cambio
    prevDataRef.current = prevDataRef.current.map(i => i.id === ini.id ? ini : i);
    onSaved();
  };

  const addEntregable = () => {
    if (!entModal) return;
    const { iniId, form, editId } = entModal;
    if (!form.titulo?.trim() || !form.fechaInicio || !form.fechaFin) {
      dialogs.showError('Título, fecha inicio y fecha fin son obligatorios.', 'Datos incompletos');
      return;
    }
    const ini = iniciativas.find(i => i.id === iniId);
    if (!ini) return;
    if (editId) {
      // Editar existente
      saveIniLocal({ ...ini, entregables: (ini.entregables ?? []).map(e => e.id === editId ? { ...e, ...form, titulo: form.titulo!.trim() } : e) });
      showEntToast('✓ Entregable actualizado');
    } else {
      // Nuevo
      const item: EntregableItem = {
        id: `ent_${Date.now()}`,
        iniciativaId: iniId,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion?.trim() ?? '',
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        label: form.label?.trim() ?? '',
        q,
        activo: true,
        estado: form.estado ?? 'backlog',
        url: form.url?.trim() || undefined,
        aplicacionId: form.aplicacionId || undefined,
      };
      saveIniLocal({ ...ini, entregables: [...(ini.entregables ?? []), item] });
      showEntToast('✓ Entregable agregado');
    }
    setEntModal(null);
  };

  const changeEntregableEstado = (ini: Iniciativa, entId: string, estado: EntregableItem['estado']) => {
    const updatedEnts = (ini.entregables ?? []).map(e => e.id === entId ? { ...e, estado } : e);
    const active = updatedEnts.filter(e => e.activo !== false);
    const autoEp = active.length > 0 ? Math.round(active.filter(e => e.estado === 'done').length / active.length * 100) : (ini.bar?.ep ?? 0);
    saveIniLocal({ ...ini, entregables: updatedEnts, bar: { ...ini.bar, ep: autoEp } });
    showEntToast('✓ Estado guardado');
  };

  const toggleEntregableActivo = (ini: Iniciativa, entId: string) => {
    saveIniLocal({ ...ini, entregables: (ini.entregables ?? []).map(e => e.id === entId ? { ...e, activo: !e.activo } : e) });
    showEntToast('✓ Cambio guardado');
  };

  const toggleIniciativaActivo = (ini: Iniciativa) => {
    saveIni({ ...ini, activo: ini.activo === false ? true : false });
  };

  const deleteEntregable = (ini: Iniciativa, entId: string) => {
    dialogs.showConfirm('¿Eliminar este entregable?', () => {
      const updatedEnts = (ini.entregables ?? []).filter(e => e.id !== entId);
      const active = updatedEnts.filter(e => e.activo !== false);
      const autoEp = active.length > 0 ? Math.round(active.filter(e => e.estado === 'done').length / active.length * 100) : (ini.bar?.ep ?? 0);
      // Guardar la iniciativa completa con el array de entregables actualizado.
      // Los entregables viven nested en el doc de la iniciativa en Firestore.
      saveIniLocal({ ...ini, entregables: updatedEnts, bar: { ...ini.bar, ep: autoEp } });
      showEntToast('✓ Entregable eliminado');
    }, { confirmLabel: 'Eliminar' });
  };

  const handleAddNew = () => {
    if (!newForm.nombre?.trim() || !newForm.producto) {
      dialogs.showError('Nombre y producto son obligatorios.', 'Datos incompletos');
      return;
    }
    if (!newForm.capacidadKeys?.length) {
      dialogs.showError('Debes asociar al menos una capacidad.', 'Datos incompletos');
      return;
    }
    const ini: Iniciativa = {
      id: `ini_${Date.now()}`,
      nombre: newForm.nombre!.trim(),
      descripcion: newForm.descripcion?.trim() ?? '',
      emoji: newForm.emoji ?? '📌',
      fechas: newForm.fechas ?? '',
      tag: newForm.tag ?? 'plan',
      producto: newForm.producto!,
      q,
      bar: newForm.bar ?? { s: 0, e: 2, sp: 0, ep: 100 },
      label: newForm.label ?? '',
      capacidadKeys: newForm.capacidadKeys ?? [],
      entregables: [],
    };
    saveIniciativa(ini, equipoId);
    setIniciativas(prev => [...prev, ini]);
    onSaved();
    setAdding(false);
    setNewForm({ q, tag: 'plan', emoji: '📌', bar: { s: 0, e: 2, sp: 0, ep: 100 }, label: '', descripcion: '', producto: '', capacidadKeys: [] });
  };

  /* ── helpers UI ── */
  const openEntModal = (iniId: string) =>
    setEntModal({ iniId, form: { estado: 'backlog' } });

  const openEntEdit = (iniId: string, ent: EntregableItem) =>
    setEntModal({ iniId, editId: ent.id, form: { ...ent } });

  const setEnt = (patch: Partial<EntregableItem>) =>
    setEntModal(m => m ? { ...m, form: { ...m.form, ...patch } } : m);

  return (
    <div>
      {/* ── Toast de éxito para operaciones de entregables ── */}
      {entToast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 9998, background: '#059669', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, fontFamily: 'Manrope, sans-serif', boxShadow: '0 4px 20px rgba(0,0,0,0.18)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {entToast}
        </div>
      )}
      {/* ── Modal agregar / editar entregable ── */}
      {entModal && (() => {
        const ini = iniciativas.find(i => i.id === entModal.iniId);
        if (!ini) return null;
        const isEdit = !!entModal.editId;
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 500, maxWidth: '95vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0032A0', marginBottom: 16 }}>
                {isEdit ? '✏️ Editar entregable' : '📦 Nuevo entregable'} — <span style={{ fontWeight: 400 }}>{ini.nombre}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <div className="flbl">Título *</div>
                  <input className="fmi" autoFocus value={entModal.form.titulo ?? ''} onChange={e => setEnt({ titulo: e.target.value })} placeholder="Nombre del entregable" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <div className="flbl">Descripción</div>
                  <input className="fmi" value={entModal.form.descripcion ?? ''} onChange={e => setEnt({ descripcion: e.target.value })} placeholder="Descripción breve" />
                </div>
                <div>
                  <div className="flbl">Fecha inicio *</div>
                  <input className="fmi" type="date" value={entModal.form.fechaInicio ?? ''} onChange={e => setEnt({ fechaInicio: e.target.value })} />
                </div>
                <div>
                  <div className="flbl">Fecha término *</div>
                  <input className="fmi" type="date" value={entModal.form.fechaFin ?? ''} onChange={e => setEnt({ fechaFin: e.target.value })} />
                </div>
                <div>
                  <div className="flbl">Label barra Roadmap</div>
                  <input className="fmi" value={entModal.form.label ?? ''} onChange={e => setEnt({ label: e.target.value })} placeholder="Texto corto" />
                </div>
                <div>
                  <div className="flbl">Estado</div>
                  <select className="fmi" value={entModal.form.estado ?? 'backlog'} onChange={e => setEnt({ estado: e.target.value as EntregableItem['estado'] })}>
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">En progreso</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <div className="flbl">Aplicación (opcional)</div>
                  <select className="fmi" value={entModal.form.aplicacionId ?? ''} onChange={e => setEnt({ aplicacionId: e.target.value || undefined })}>
                    <option value="">Sin aplicación</option>
                    {(data.aplicaciones ?? []).filter(a => a.activo !== false).map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <div className="flbl">URL presentación / foto (opcional)</div>
                  <input className="fmi" type="url" value={entModal.form.url ?? ''} onChange={e => setEnt({ url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <button onClick={() => setEntModal(null)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: '#f9fafb', fontSize: 14, cursor: 'pointer', color: '#374151' }}>Cancelar</button>
                <button className="btn-save" onClick={addEntregable}>{isEdit ? 'Guardar cambios' : 'Agregar'}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Iniciativas del Roadmap</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Gestiona las iniciativas por producto y quarter.</p>
        </div>
        {!adding && <button className="btn-save" onClick={() => setAdding(true)}>+ Nueva iniciativa</button>}
      </div>

      {/* ── Q selector ── */}
      <div style={{ display: 'flex', gap: 6, margin: '16px 0' }}>
        {[1, 2, 3, 4].map(n => (
          <button key={n} className={`q-btn q-btn-dk${n === q ? ' active' : ''}`}
            onClick={() => { setQ(n); setAdding(false); }}>
            Q{n}{data.config.q_activo === `Q${n}` ? ' ✦' : ''}
          </button>
        ))}
      </div>

      {/* ── Formulario nueva iniciativa ── */}
      {adding && (
        <div style={{ background: '#EEF2F8', border: '1px solid #c7d2e8', borderRadius: 12, padding: '18px 20px', marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)', marginBottom: 14 }}>Nueva iniciativa — Q{q}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 150px 180px', gap: 10, marginBottom: 10 }}>
            <div>
              <div className="flbl">Emoji</div>
              <input className="fmi" value={newForm.emoji ?? ''} onChange={e => setNewForm(p => ({ ...p, emoji: e.target.value }))} />
            </div>
            <div>
              <div className="flbl">Nombre *</div>
              <input className="fmi" value={newForm.nombre ?? ''} onChange={e => setNewForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Optimización Última Milla" />
            </div>
            <div>
              <div className="flbl">Estado</div>
              <select className="fmi" value={newForm.tag ?? 'plan'} onChange={e => setNewForm(p => ({ ...p, tag: e.target.value as Iniciativa['tag'] }))}>
                {TAGS.map(t => <option key={t} value={t}>{TAG_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <div className="flbl">Producto *</div>
              <select className="fmi" value={newForm.producto ?? ''} onChange={e => setNewForm(p => ({ ...p, producto: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {allProducts.map(prod => <option key={prod} value={prod}>{prod}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <div className="flbl">Detalle iniciativa</div>
              <textarea className="fmi" value={newForm.descripcion ?? ''} onChange={e => setNewForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción para el popup del roadmap" rows={3} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <div className="flbl">Capacidades * <span style={{ fontWeight: 400, color: '#94A3B8' }}>(selecciona al menos una)</span></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {(data.capacidades ?? []).map(cap => {
                  const sel = (newForm.capacidadKeys ?? []).includes(cap.key);
                  return (
                    <label key={cap.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${sel ? cap.color : '#E2E8F0'}`, background: sel ? cap.color + '18' : '#F8FAFC', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: sel ? cap.color : '#64748B', transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={sel} style={{ accentColor: cap.color }} onChange={() => setNewForm(p => { const prev = p.capacidadKeys ?? []; return { ...p, capacidadKeys: sel ? prev.filter(k => k !== cap.key) : [...prev, cap.key] }; })} />
                      {cap.label}
                    </label>
                  );
                })}
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div className="flbl">Label barra</div>
              <input className="fmi" value={newForm.label ?? ''} onChange={e => setNewForm(p => ({ ...p, label: e.target.value }))} placeholder="Texto corto" />
            </div>
            <div>
              <div className="flbl">Mes inicio</div>
              <select className="fmi" value={newForm.bar?.s ?? 0} onChange={e => setNewForm(p => ({ ...p, bar: { s: +e.target.value, e: p.bar?.e ?? 2, sp: 0, ep: p.bar?.ep ?? 0 } }))}>
                {Q_MONTHS[q]?.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <div className="flbl">Mes fin</div>
              <select className="fmi" value={newForm.bar?.e ?? 2} onChange={e => setNewForm(p => ({ ...p, bar: { s: p.bar?.s ?? 0, e: +e.target.value, sp: 0, ep: p.bar?.ep ?? 0 } }))}>
                {Q_MONTHS[q]?.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setAdding(false)} style={{ padding: '9px 18px', border: '1px solid #d1d5db', borderRadius: 8, background: '#f9fafb', fontSize: 14, cursor: 'pointer', color: '#374151' }}>Cancelar</button>
            <button className="btn-save" onClick={handleAddNew}>Guardar iniciativa</button>
          </div>
        </div>
      )}

      {/* ── Lista ── */}
      {filtered.length === 0 && !adding && (
        <div className="rev-empty">Sin iniciativas para Q{q}. Agrega una con el botón de arriba.</div>
      )}
      <ul style={{ margin: '18px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map(ini => {
          const expanded = editingId === ini.id;
          const ents = ini.entregables ?? [];
          return (
            <li key={ini.id} style={{ background: '#fff', border: expanded ? '2px solid #0032A0' : '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: expanded ? '0 2px 12px #0032a01a' : 'none', transition: 'border 0.15s', opacity: ini.activo === false ? 0.55 : 1 }}>
              {/* ── Cabecera ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'start', gap: 12, padding: '14px 18px', cursor: 'pointer', background: expanded ? '#f0f7ff' : '#fff' }}
                onClick={() => { setEditingId(expanded ? null : ini.id); setEditForm(expanded ? null : { ...ini }); }}>
                <span style={{ fontSize: 26, lineHeight: 1.2, paddingTop: 3 }}>{ini.emoji}</span>
                <div>
                  {/* Línea 1: nombre + estado */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                    <div style={{ flex: '1 1 0', fontWeight: 800, fontSize: 15, color: '#0F1C40', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {ini.nombre.length > 60 ? ini.nombre.slice(0, 60) + '\u2026' : ini.nombre}
                    </div>
                    {(() => { const ts = ENT_ESTADO_STYLE[ini.tag === 'wip' ? 'in_progress' : ini.tag === 'done' ? 'done' : 'backlog']; return <span style={{ background: ts.bg, color: ts.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap', lineHeight: '18px' }}>{TAG_LABEL[ini.tag]}</span>; })()}
                  </div>
                  {/* Línea 2: barra de progreso */}
                  {(() => { const ep = ini.bar?.ep ?? 0; const bc = ini.tag === 'done' ? '#059669' : ini.tag === 'wip' ? '#0032A0' : '#94a3b8'; return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <div style={{ width: 200, height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ width: `${ep}%`, height: '100%', background: bc, borderRadius: 99, transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: bc }}>{ep}%</span>
                    </div>
                  ); })()}
                  {/* Línea 3: capacidades */}
                  {(ini.capacidadKeys ?? []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
                      {(ini.capacidadKeys ?? []).map(key => { const cap = (data.capacidades ?? []).find(c => c.key === key); return cap ? <span key={key} style={{ fontSize: 10, fontWeight: 700, color: cap.color, background: cap.color + '18', borderRadius: 5, padding: '1px 7px', border: `1px solid ${cap.color}35` }}>{cap.label}</span> : null; })}
                    </div>
                  )}
                  {/* Línea 4: fecha · label · entregables */}
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    {(() => { const months = Q_MONTHS[q] ?? []; const startM = months[ini.bar?.s ?? 0] ?? ''; const endM = months[ini.bar?.e ?? 2] ?? ''; const fechaStr = startM && endM ? `${startM}\u2013${endM}` : ini.fechas; const labelStr = ini.label?.trim() ? `(${ini.label.trim()})` : ''; return [fechaStr, labelStr, `${ents.length} entregable${ents.length !== 1 ? 's' : ''}`].filter(Boolean).join(' · '); })()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={e => { e.stopPropagation(); setEditingId(expanded ? null : ini.id); setEditForm(expanded ? null : { ...ini }); }}
                    style={{ padding: '4px 10px', border: '1px solid #c7d2e8', borderRadius: 8, background: '#f0f7ff', color: '#0032A0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Editar
                  </button>
                  <button onClick={e => { e.stopPropagation(); toggleIniciativaActivo(ini); }}
                    style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: ini.activo === false ? '#059669' : '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {ini.activo === false ? 'Activar' : 'Desactivar'}
                  </button>
                  <button onClick={e => { e.stopPropagation(); dialogs.showConfirm('¿Eliminar esta iniciativa?', () => { deleteIniciativa(ini.id, equipoId); setIniciativas(prev => prev.filter(i => i.id !== ini.id)); onSaved(); }, { confirmLabel: 'Eliminar' }); }}
                    style={{ padding: '4px 10px', border: '1px solid #fecaca', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Eliminar
                  </button>
                </div>
              </div>

              {/* ── Formulario edición ── */}
              {expanded && (
                <form onSubmit={e => {
                  e.preventDefault();
                  if (!editForm?.nombre?.trim() || !editForm?.producto) { dialogs.showError('Nombre y producto son obligatorios.', 'Datos incompletos'); return; }
                  if (!editForm?.capacidadKeys?.length) { dialogs.showError('Debes asociar al menos una capacidad.', 'Datos incompletos'); return; }
                  const updated: Iniciativa = { ...ini, ...editForm, nombre: editForm.nombre!.trim(), producto: editForm.producto!, descripcion: editForm.descripcion ?? '', fechas: editForm.fechas ?? '', tag: editForm.tag ?? 'plan', emoji: editForm.emoji ?? '📌', label: editForm.label ?? '', bar: editForm.bar ?? ini.bar, capacidadKeys: editForm.capacidadKeys ?? [], entregables: ini.entregables };
                  saveIniciativa(updated, equipoId);
                  setIniciativas(prev => prev.map(i => i.id === ini.id ? updated : i));
                  setEditingId(null); setEditForm(null); onSaved();
                }} style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#fafbff' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 150px 180px', gap: 10, marginBottom: 10 }}>
                    <div>
                      <div className="flbl">Emoji</div>
                      <input className="fmi" value={editForm?.emoji ?? ''} onChange={e => setEditForm(f => ({ ...f!, emoji: e.target.value }))} />
                    </div>
                    <div>
                      <div className="flbl">Nombre *</div>
                      <input className="fmi" value={editForm?.nombre ?? ''} onChange={e => setEditForm(f => ({ ...f!, nombre: e.target.value }))} />
                    </div>
                    <div>
                      <div className="flbl">Estado</div>
                      <select className="fmi" value={editForm?.tag ?? 'plan'} onChange={e => setEditForm(f => ({ ...f!, tag: e.target.value as Iniciativa['tag'] }))}>
                        {TAGS.map(t => <option key={t} value={t}>{TAG_LABEL[t]}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="flbl">Producto *</div>
                      <select className="fmi" value={editForm?.producto ?? ''} onChange={e => setEditForm(f => ({ ...f!, producto: e.target.value }))}>
                        <option value="">Seleccionar...</option>
                        {allProducts.map(prod => <option key={prod} value={prod}>{prod}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <div className="flbl">Detalle iniciativa</div>
                      <textarea className="fmi" value={editForm?.descripcion ?? ''} onChange={e => setEditForm(f => ({ ...f!, descripcion: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <div className="flbl">Capacidades * <span style={{ fontWeight: 400, color: '#94A3B8' }}>(selecciona al menos una)</span></div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                        {(data.capacidades ?? []).map(cap => {
                          const sel = (editForm?.capacidadKeys ?? []).includes(cap.key);
                          return (
                            <label key={cap.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${sel ? cap.color : '#E2E8F0'}`, background: sel ? cap.color + '18' : '#F8FAFC', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: sel ? cap.color : '#64748B', transition: 'all 0.15s' }}>
                              <input type="checkbox" checked={sel} style={{ accentColor: cap.color }} onChange={() => setEditForm(f => { if (!f) return f; const prev = f.capacidadKeys ?? []; return { ...f, capacidadKeys: sel ? prev.filter(k => k !== cap.key) : [...prev, cap.key] }; })} />
                              {cap.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div className="flbl">Label barra</div>
                      <input className="fmi" value={editForm?.label ?? ''} onChange={e => setEditForm(f => ({ ...f!, label: e.target.value }))} />
                    </div>
                    <div>
                      <div className="flbl">Mes inicio</div>
                      <select className="fmi" value={editForm?.bar?.s ?? 0} onChange={e => setEditForm(f => f ? { ...f, bar: { s: +e.target.value, e: f.bar?.e ?? 2, sp: 0, ep: f.bar?.ep ?? 0 } } : f)}>
                        {Q_MONTHS[q]?.map((m, i) => <option key={m} value={i}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="flbl">Mes fin</div>
                      <select className="fmi" value={editForm?.bar?.e ?? 2} onChange={e => setEditForm(f => f ? { ...f, bar: { s: f.bar?.s ?? 0, e: +e.target.value, sp: 0, ep: f.bar?.ep ?? 0 } } : f)}>
                        {Q_MONTHS[q]?.map((m, i) => <option key={m} value={i}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <AuditMeta createdAt={ini.createdAt} updatedAt={ini.updatedAt} createdBy={ini.createdBy} updatedBy={ini.updatedBy} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button type="button" onClick={() => { setEditingId(null); setEditForm(null); }} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: '#f9fafb', fontSize: 14, cursor: 'pointer', color: '#374151' }}>Cancelar</button>
                    <button type="submit" className="btn-save">Guardar</button>
                  </div>
                </form>
              )}

              {/* ── Entregables ── */}
              {expanded && (
                <div style={{ padding: '0 20px 18px', borderTop: '1px solid #e8edf5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 10px' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0032A0' }}>📋 Entregables</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="f-add-btn" onClick={() => openEntModal(ini.id)}>+ Agregar entregable</button>
                    </div>
                  </div>
                  {ents.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Sin entregables todavía.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Entregable</th>
                            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Inicio</th>
                            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Término</th>
                            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Label</th>
                            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>App</th>
                            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Estado</th>
                            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>URL</th>
                            <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#475569' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {ents.map((ent, idx) => {
                            const es = ENT_ESTADO_STYLE[ent.estado ?? 'backlog'];
                            return (
                              <tr key={ent.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: ent.activo === false ? 0.45 : 1, background: idx % 2 === 0 ? '#fff' : '#fafbff' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0F1C40' }}>
                                  {ent.titulo}
                                  {ent.descripcion && <div style={{ fontWeight: 400, color: '#64748b', fontSize: 12, marginTop: 1 }}>{ent.descripcion}</div>}
                                </td>
                                <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: '#475569' }}>{ent.fechaInicio}</td>
                                <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: '#475569' }}>{ent.fechaFin}</td>
                                <td style={{ padding: '8px 10px', color: '#475569' }}>{ent.label || '—'}</td>
                                <td style={{ padding: '8px 10px' }}>
                                  {(() => { const app = (data.aplicaciones ?? []).find(a => a.id === ent.aplicacionId); return app ? <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#EEF2FF', borderRadius: 5, padding: '2px 8px', border: '1px solid #C7D7FE' }}>{app.nombre}</span> : <span style={{ color: '#cbd5e1' }}>—</span>; })()}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <select value={ent.estado ?? 'backlog'} onChange={e => changeEntregableEstado(ini, ent.id, e.target.value as EntregableItem['estado'])}
                                    style={{ background: es.bg, color: es.color, border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                    <option value="backlog">Backlog</option>
                                    <option value="in_progress">En progreso</option>
                                    <option value="done">Done</option>
                                  </select>
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  {ent.url ? <a href={ent.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0032A0', fontSize: 12 }}>🔗 Ver</a> : <span style={{ color: '#cbd5e1' }}>—</span>}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <button onClick={() => openEntEdit(ini.id, ent)} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 6, border: '1px solid #c7d2e8', background: '#f0f7ff', color: '#0032A0', cursor: 'pointer', marginRight: 4 }}>Editar</button>
                                  <button onClick={() => toggleEntregableActivo(ini, ent.id)} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: ent.activo === false ? '#059669' : '#475569', cursor: 'pointer', marginRight: 4 }}>
                                    {ent.activo === false ? 'Activar' : 'Desactivar'}
                                  </button>
                                  <button onClick={() => deleteEntregable(ini, ent.id)} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>Eliminar</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}


// ── Sección BETs / MOS ────────────────────────────────────────────────────────
const PALETA: string[] = ['#0032A0', '#7B2FBE', '#1E7A4C', '#0891B2', '#DC2626', '#DB2777', '#7C3AED'];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {PALETA.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${value === c ? '#fff' : c}`,
            boxShadow: value === c ? `0 0 0 2px ${c}` : 'none', cursor: 'pointer', padding: 0, transition: 'transform 0.1s' }}
        />
      ))}
    </div>
  );
}

type BetSubTab = 'bets' | 'mos';

interface BetMosDraft { id?: string; descripcion: string; }
interface BetForm { descripcion: string; mosItems: BetMosDraft[]; productos: string[]; productoDraft: string; color: string; aplicacionId?: string; }
const emptyBetForm = (): BetForm => ({ descripcion: '', mosItems: [{ descripcion: '' }], productos: [], productoDraft: '', color: PALETA[0], aplicacionId: '' });

function buildMosSelections(bets: Bet[]): Record<string, Set<string>> {
  const selections: Record<string, Set<string>> = {};
  for (const bet of bets) {
    const inactivos = new Set(bet.mos_inactivos ?? []);
    selections[bet.id] = new Set(bet.mos_ids.filter(id => !inactivos.has(id)));
  }
  return selections;
}

function buildMosQuarterSelections(mos: MOS[]): Record<string, Set<string>> {
  const selections: Record<string, Set<string>> = {};
  for (const item of mos) {
    selections[item.id] = new Set(getMosQuarters(item));
  }
  return selections;
}

function normalizeProducts(items: string[]): string[] {
  return items
    .map(item => item.trim())
    .filter((item, index, list) => item.length > 0 && list.findIndex(entry => entry.toLowerCase() === item.toLowerCase()) === index);
}

function BetsSection({ data, onSaved, dialogs, mode }: { data: AppData; onSaved: () => void; dialogs: AdminDialogHelpers; mode: BetSubTab }) {
  const QS = ['Q1','Q2','Q3','Q4'];
  const storedUiState = readSessionValue<{ selectedQ: string; expandedId: string | null; mosExpanded: string | null }>(BETS_UI_STATE_STORAGE_KEY, {
    selectedQ: data.config.q_activo ?? 'Q2',
    expandedId: null,
    mosExpanded: null,
  });
  const [selectedQ, setSelectedQ] = useState(storedUiState.selectedQ);
  const [localBets, setLocalBets] = useState<Bet[]>(() => [...data.bets]);
  const [localMos, setLocalMos]   = useState<MOS[]>(() => [...data.mos]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<BetForm>(emptyBetForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(storedUiState.expandedId);
  const [editBetForm, setEditBetForm] = useState<BetForm>(emptyBetForm());
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  // MOS sub-tab state
  const [mosExpanded, setMosExpanded] = useState<string | null>(storedUiState.mosExpanded);
  const [mosSelections, setMosSelections] = useState<Record<string, Set<string>>>(() => buildMosSelections(data.bets));
  const [mosQuarterSelections, setMosQuarterSelections] = useState<Record<string, Set<string>>>(() => buildMosQuarterSelections(data.mos));
  const [mosFields,     setMosFields]     = useState<Record<string, { linea_base: string; meta: string; actual: string }>>(() => {
    const init: Record<string, { linea_base: string; meta: string; actual: string }> = {};
    for (const m of data.mos) init[m.id] = { linea_base: m.linea_base ?? '', meta: m.meta ?? '', actual: m.actual ?? '' };
    return init;
  });
  const equipoId = (data.config as any).equipoId ?? 'eq_planificacion';
  const [savedBetId, setSavedBetId] = useState<string | null>(null);

  const betsQ = localBets.filter(b => b.q === selectedQ).sort((a, b) => a.orden - b.orden);
  const visibleBetsForMos = [...localBets].filter(b => b.activo !== false).sort((a, b) => getBetPrimaryProduct(a).localeCompare(getBetPrimaryProduct(b), 'es') || (a.orden ?? 99) - (b.orden ?? 99));

  useEffect(() => {
    writeSessionValue(BETS_UI_STATE_STORAGE_KEY, { selectedQ, expandedId, mosExpanded });
  }, [selectedQ, expandedId, mosExpanded]);

  const mosByBet = (bet: Bet): MOS[] => getMosByBet(bet, localMos);

  const normalizeMosDrafts = (items: BetMosDraft[]): BetMosDraft[] =>
    items
      .map(item => ({ ...item, descripcion: item.descripcion.trim() }))
      .filter(item => item.descripcion);

  const validateBetValues = (values: BetForm, currentBetId?: string) => {
    const e: Record<string, string> = {};
    const products = normalizeProducts(values.productos);
    if (!values.descripcion.trim()) e.descripcion = 'El Bet es obligatorio.';
    if (normalizeMosDrafts(values.mosItems).length === 0) e.mosItems = 'Ingresa al menos un MOS del Bet.';
    if (products.length === 0) {
      e.productos = 'Crea al menos un producto.';
    } else {
      const otherProducts = localBets
        .filter(bet => bet.id !== currentBetId)
        .flatMap(bet => getBetProducts(bet).map(product => ({ product, betDescription: bet.descripcion })));
      const conflicting = products.find(product => otherProducts.some(item => item.product.toLowerCase() === product.toLowerCase()));
      if (conflicting) {
        e.productos = `El producto "${conflicting}" ya está asociado a otro Bet / LVT.`;
      }
    }
    return e;
  };

  const validate = () => {
    const nextErrors = validateBetValues(form);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddBet = () => {
    if (!validate()) return;
    const mosDrafts = normalizeMosDrafts(form.mosItems);
    const products = normalizeProducts(form.productos);
    const newMosIds = mosDrafts.map((_, i) => `mos_new_${Date.now()}_${i}`);
    const newMosItems: MOS[] = mosDrafts.map((item, i) => ({
      id: newMosIds[i], q: '', qs: [], descripcion: item.descripcion, linea_base: '', meta: '', actual: '', orden: i + 1,
    }));
    const newBet: Bet = {
      id: `bet_${Date.now()}`, q: selectedQ, descripcion: form.descripcion.trim(),
      producto: products[0], productos: products, color: form.color,
      aplicacionId: form.aplicacionId || undefined,
      mos_ids: newMosIds, mos_inactivos: [], orden: betsQ.length + 1, activo: true,
    };
    saveBet(newBet, equipoId);
    newMosItems.forEach(m => saveMOS(m, equipoId));
    setLocalBets(prev => [...prev, newBet]);
    setLocalMos(prev => [...prev, ...newMosItems]);
    setMosSelections(prev => ({ ...prev, [newBet.id]: new Set(newBet.mos_ids) }));
    setMosQuarterSelections(prev => {
      const next = { ...prev };
      newMosItems.forEach(m => { next[m.id] = new Set<string>(); });
      return next;
    });
    setMosFields(prev => {
      const next = { ...prev };
      newMosItems.forEach(m => { next[m.id] = { linea_base: '', meta: '', actual: '' }; });
      return next;
    });
    setForm(emptyBetForm());
    setErrors({});
    setAdding(false);
    onSaved();
  };

  const handleDeleteBet = (bet: Bet) => {
    dialogs.showConfirm(`¿Eliminar Bet "${bet.descripcion.slice(0, 40)}…"?`, () => {
      deleteBet(bet.id, equipoId);
      setLocalBets(prev => prev.filter(b => b.id !== bet.id));
      onSaved();
    }, { title: 'Eliminar Bet', confirmLabel: 'Eliminar' });
  };

  const startEditBet = (bet: Bet) => {
    setExpandedId(current => current === bet.id ? null : bet.id);
    setEditBetForm({
      descripcion: bet.descripcion,
      productos: getBetProducts(bet),
      productoDraft: '',
      color: bet.color,
      aplicacionId: bet.aplicacionId ?? '',
      mosItems: mosByBet(bet).map(item => ({ id: item.id, descripcion: item.descripcion })),
    });
    setEditErrors({});
  };

  const handleSaveBetEdit = (bet: Bet) => {
    const nextErrors = validateBetValues(editBetForm, bet.id);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const existingMos = mosByBet(bet);
    const nextMosItems = normalizeMosDrafts(editBetForm.mosItems);
    const products = normalizeProducts(editBetForm.productos);
    const updatedMos: MOS[] = nextMosItems.map((item, index) => {
      const currentMos = item.id ? existingMos.find(existing => existing.id === item.id) : undefined;
      if (currentMos) {
        return { ...currentMos, descripcion: item.descripcion, orden: index + 1 };
      }
      return {
        id: `mos_${Date.now()}_${index}`,
        q: '',
        qs: [],
        descripcion: item.descripcion,
        linea_base: '',
        meta: '',
        actual: '',
        orden: index + 1,
      };
    });

    const nextMosIds = new Set(updatedMos.map(item => item.id));
    const removedMosIds = existingMos.filter(item => !nextMosIds.has(item.id)).map(item => item.id);
    const updatedBet: Bet = {
      ...bet,
      descripcion: editBetForm.descripcion.trim(),
      producto: products[0],
      productos: products,
      color: editBetForm.color,
      aplicacionId: editBetForm.aplicacionId || undefined,
      mos_ids: updatedMos.map(m => m.id),
      mos_inactivos: (bet.mos_inactivos ?? []).filter(id => updatedMos.some(m => m.id === id)),
    };

    saveBet(updatedBet, equipoId);
    updatedMos.forEach(m => saveMOS(m, equipoId));
    removedMosIds.forEach(id => deleteMOS(id, equipoId));

    setLocalBets(prev => prev.map(item => item.id === bet.id ? updatedBet : item));
    setLocalMos(prev => {
      const preserved = prev.filter(item => !removedMosIds.includes(item.id));
      const withoutCurrentBetMos = preserved.filter(item => !existingMos.some(existing => existing.id === item.id));
      return [...withoutCurrentBetMos, ...updatedMos].sort((a, b) => a.orden - b.orden);
    });
    setMosFields(prev => {
      const next = { ...prev };
      removedMosIds.forEach(id => { delete next[id]; });
      updatedMos.forEach(m => {
        const current = prev[m.id];
        next[m.id] = current ?? { linea_base: m.linea_base ?? '', meta: m.meta ?? '', actual: m.actual ?? '' };
      });
      return next;
    });
    setMosQuarterSelections(prev => {
      const next = { ...prev };
      removedMosIds.forEach(id => { delete next[id]; });
      updatedMos.forEach(m => {
        next[m.id] = prev[m.id] ?? new Set(getMosQuarters(m));
      });
      return next;
    });
    setMosSelections(prev => {
      const current = prev[bet.id] ?? new Set<string>(bet.mos_ids.filter(id => !(bet.mos_inactivos ?? []).includes(id)));
      const nextActiveIds = updatedMos.map(m => m.id).filter(id => current.has(id) || !bet.mos_ids.includes(id));
      return { ...prev, [bet.id]: new Set(nextActiveIds) };
    });
    setSavedBetId(bet.id);
    setExpandedId(bet.id);
    onSaved();
    setTimeout(() => setSavedBetId(null), 2000);
  };

  const handleToggleActivo = (betId: string) => {
    const updated = localBets.map(b => b.id === betId ? { ...b, activo: b.activo === false ? true : false } : b);
    setLocalBets(updated);
    const bet = updated.find(b => b.id === betId)!;
    saveBet(bet, equipoId);
  };

  // MOS tab: toggle selection
  const toggleMos = (betId: string, mosId: string) => {
    setMosSelections(prev => {
      const cur = new Set(prev[betId] ?? []);
      if (cur.has(mosId)) cur.delete(mosId); else cur.add(mosId);
      return { ...prev, [betId]: cur };
    });
  };

  const toggleMosQuarter = (mosId: string, quarter: string) => {
    setMosQuarterSelections(prev => {
      const current = new Set(prev[mosId] ?? []);
      if (current.has(quarter)) current.delete(quarter); else current.add(quarter);
      return { ...prev, [mosId]: current };
    });
  };

  const handleSaveMosSelection = (bet: Bet, mosBet: MOS[]) => {
    const activos = mosSelections[bet.id] ?? new Set<string>();
    const inactivos = bet.mos_ids.filter(id => !activos.has(id));
    const updated = { ...bet, mos_inactivos: inactivos };
    setLocalBets(prev => prev.map(b => b.id === bet.id ? updated : b));
    saveBet(updated, equipoId);
    const updatedMos = mosBet.map(m => {
      const f = mosFields[m.id];
      const quarters = [...(mosQuarterSelections[m.id] ?? new Set<string>())].sort((a, b) => QS.indexOf(a) - QS.indexOf(b));
      return {
        ...m,
        q: quarters[0] ?? '',
        qs: quarters,
        linea_base: f?.linea_base ?? m.linea_base ?? '',
        meta: f?.meta ?? m.meta ?? '',
        actual: f?.actual ?? m.actual ?? '',
      };
    });
    setLocalMos(prev => prev.map(m => updatedMos.find(item => item.id === m.id) ?? m));
    for (const item of updatedMos) {
      saveMOS(item, equipoId);
    }
    setSavedBetId(bet.id);
    onSaved();
    setTimeout(() => setSavedBetId(null), 2000);
  };

  const inputStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const errStyle:   React.CSSProperties = { fontSize: 11, color: '#DC2626', marginTop: 3 };

  const addProduct = (setter: React.Dispatch<React.SetStateAction<BetForm>>) => {
    setter(prev => {
      const nextProduct = prev.productoDraft.trim();
      if (!nextProduct) return prev;
      const nextProducts = normalizeProducts([...prev.productos, nextProduct]);
      return { ...prev, productos: nextProducts, productoDraft: '' };
    });
  };

  const removeProduct = (setter: React.Dispatch<React.SetStateAction<BetForm>>, product: string) => {
    setter(prev => ({
      ...prev,
      productos: prev.productos.filter(item => item.toLowerCase() !== product.toLowerCase()),
    }));
  };

  const updateMosDraft = (setter: React.Dispatch<React.SetStateAction<BetForm>>, index: number, patch: Partial<BetMosDraft>) => {
    setter(prev => ({
      ...prev,
      mosItems: prev.mosItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  };

  const addMosDraft = (setter: React.Dispatch<React.SetStateAction<BetForm>>) => {
    setter(prev => ({
      ...prev,
      mosItems: [...prev.mosItems, { descripcion: '' }],
    }));
  };

  const removeMosDraft = (setter: React.Dispatch<React.SetStateAction<BetForm>>, index: number) => {
    setter(prev => ({
      ...prev,
      mosItems: prev.mosItems.length === 1 ? [{ descripcion: '' }] : prev.mosItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const renderMosDraftEditor = (values: BetForm, setter: React.Dispatch<React.SetStateAction<BetForm>>, currentErrors: Record<string, string>) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
        <div className="flbl" style={{ marginBottom: 0 }}>MOS del Bet <span style={{ color: '#DC2626' }}>*</span></div>
        <button type="button" className="f-add-btn" onClick={() => addMosDraft(setter)}>+ Agregar MOS del Bet</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
        {values.mosItems.map((item, index) => (
          <div key={item.id ?? `draft_${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'start' }}>
            <input value={item.descripcion} onChange={e => updateMosDraft(setter, index, { descripcion: e.target.value })} placeholder="Describe el MoS" style={inputStyle} />
            <button type="button" onClick={() => removeMosDraft(setter, index)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#64748B', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Quitar
            </button>
          </div>
        ))}
      </div>
      {currentErrors.mosItems && <div style={errStyle}>{currentErrors.mosItems}</div>}
    </div>
  );

  const renderProductEditor = (values: BetForm, setter: React.Dispatch<React.SetStateAction<BetForm>>, currentErrors: Record<string, string>) => (
    <div>
      <div className="flbl">Productos <span style={{ color: '#DC2626' }}>*</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'start', marginTop: 6 }}>
        <input
          value={values.productoDraft}
          onChange={e => setter(prev => ({ ...prev, productoDraft: e.target.value }))}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addProduct(setter);
            }
          }}
          placeholder="Ej: Optimizador de Rutas"
          style={{ ...inputStyle, borderColor: currentErrors.productos ? '#DC2626' : undefined }}
        />
        <button type="button" className="f-add-btn" onClick={() => addProduct(setter)}>+ Crear producto</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {values.productos.map(product => (
          <span key={product} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: '#E0E7FF', color: '#1E3A8A', fontSize: 12, fontWeight: 700 }}>
            {product}
            <button type="button" onClick={() => removeProduct(setter, product)} style={{ border: 'none', background: 'transparent', color: '#1E3A8A', cursor: 'pointer', fontSize: 12, fontWeight: 800, padding: 0 }}>
              ×
            </button>
          </span>
        ))}
        {values.productos.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Aún no hay productos creados para este Bet / LVT.</span>}
      </div>
      {currentErrors.productos && <div style={errStyle}>{currentErrors.productos}</div>}
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Cada producto queda asociado a un solo Bet / LVT.</div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{mode === 'bets' ? 'Bets / LVT' : 'MOS del Bet'}</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        {mode === 'bets'
          ? 'Configura el Bet / LVT, sus productos asociados y el catálogo de MOS del Bet. La asignación a quarters se define después en Seguimiento.'
          : (
            <>
              <div>Gestiona los MOS del Bet, sus valores y en qué quarters se utilizan, incluyendo soporte para más de un Q por indicador.</div>
              <div style={{marginTop:8, color:'#64748B', fontSize:13}}>
                <b>¿Cómo funciona?</b> Cada MOS está siempre asociado a un Bet/LVT. Se crean/editan desde el formulario del Bet y aquí puedes verlos, editarlos y asignar sus valores y quarters. <i>Los MOS no existen sueltos.</i>
              </div>
            </>
          )}
      </p>

      {/* Q selector */}
      {mode === 'bets' && (
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {QS.map(q => (
          <button key={q} onClick={() => { setSelectedQ(q); setAdding(false); setExpandedId(null); setMosExpanded(null); }}
            style={{ padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              background: selectedQ === q ? '#0032A0' : 'var(--white)', color: selectedQ === q ? '#fff' : 'var(--muted)',
              border: `1px solid ${selectedQ === q ? '#0032A0' : 'var(--border)'}` }}>
            {q}{data.config.q_activo === q && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>*</span>}
          </button>
        ))}
      </div>
      )}

      {/* ─── BETS TAB ─── */}
      {mode === 'bets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            {!adding && (
              <button className="f-add-btn" onClick={() => setAdding(true)}>+ Agregar Bet / LVT</button>
            )}
          </div>

          {/* Formulario nuevo Bet / LVT */}
          {adding && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0032A0', marginBottom: 14 }}>Nuevo Bet / LVT — {selectedQ}</div>
              <div style={{ marginBottom: 12 }}>
                <div className="flbl">Color</div>
                <ColorPicker value={form.color} onChange={c => setForm(p => ({ ...p, color: c }))} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div className="flbl">Bet / LVT <span style={{ color: '#DC2626' }}>*</span></div>
                <textarea rows={3} value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Describe el objetivo del Bet / LVT..."
                  style={{ ...inputStyle, resize: 'vertical', borderColor: errors.descripcion ? '#DC2626' : undefined }} />
                {errors.descripcion && <div style={errStyle}>{errors.descripcion}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                <div>
                  {renderProductEditor(form, setForm, errors)}
                </div>
                <div>
                  <div className="flbl">Quarter base del Bet / LVT</div>
                  <div style={{ ...inputStyle, background: '#F8FAFC', color: '#475569' }}>{selectedQ}</div>
                </div>
                <div>
                  <div className="flbl">Aplicación asociada</div>
                  <select value={form.aplicacionId ?? ''} onChange={e => setForm(p => ({ ...p, aplicacionId: e.target.value }))}
                    style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
                    <option value="">— Sin aplicación asociada —</option>
                    {data.aplicaciones.map(app => (
                      <option key={app.id} value={app.id}>{app.nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  {renderMosDraftEditor(form, setForm, errors)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button className="btn-save" onClick={handleAddBet}>Guardar Bet / LVT</button>
                <button onClick={() => { setAdding(false); setErrors({}); setForm(emptyBetForm()); }}
                  style={{ padding: '9px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: 'var(--muted)' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {betsQ.length === 0 && !adding && (
            <div className="rev-empty">No hay Bets / LVT para {selectedQ}. Usa "+ Agregar Bet / LVT" para crear uno.</div>
          )}

          {/* Cabeceras */}
          {betsQ.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1.5fr auto', padding: '0 14px 6px', gap: 12 }}>
                {['Bet / LVT', 'MOS del Bet', 'Producto', ''].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>{h}</span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {betsQ.map(bet => {
                  const isExpanded = expandedId === bet.id;
                  return (
                    <div key={bet.id} style={{ position: 'relative', border: `2px solid ${isExpanded ? bet.color : 'var(--border)'}`, borderRadius: 12, opacity: bet.activo === false ? 0.5 : 1, background: 'var(--white)' }}>
                      {/* Barra de color vertical */}
                      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: bet.color, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1.5fr auto', gap: 24, alignItems: 'center', padding: '8px 14px 8px 14px', cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : bet.id)}>
                        {/* Bet/LVT descripción */}
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12 }}>{bet.descripcion}</div>
                        {/* MOS del Bet (solo nombres) */}
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          {mosByBet(bet).map(mos => mos.descripcion).join(' · ')}
                        </div>
                        {/* Productos */}
                        <div style={{ fontSize: 12, color: '#0032A0', fontWeight: 600 }}>
                          {getBetProducts(bet).join(', ')}
                        </div>
                        {/* Acciones */}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={e => { e.stopPropagation(); startEditBet(bet); }}
                            style={{ background: '#f0f7ff', border: '1px solid #c7d2e8', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#0032A0', padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Editar
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleToggleActivo(bet.id); }}
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, fontWeight: 600, color: bet.activo === false ? '#059669' : '#475569', padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {bet.activo === false ? 'Activar' : 'Desactivar'}
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDeleteBet(bet); }}
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 11, fontWeight: 600, padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                      {/* Panel de edición expandido */}
                      {isExpanded && (
                        <div style={{ gridColumn: '1 / -1', background: `${bet.color}06`, borderTop: `1px solid ${bet.color}20`, padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ fontSize: 13, color: '#0032A0', fontWeight: 700, marginBottom: 8 }}>Editar Bet / LVT</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 10 }}>
                            <div>
                              <div className="flbl">Color</div>
                              <ColorPicker value={editBetForm.color} onChange={c => setEditBetForm(p => ({ ...p, color: c }))} />
                            </div>
                            <div>
                              <div className="flbl">Quarter base</div>
                              <div style={{ padding: '8px 12px', background: '#F8FAFC', color: '#475569', borderRadius: 8, fontSize: 13 }}>{bet.q}</div>
                            </div>
                            <div>
                              <div className="flbl">Aplicación asociada</div>
                              <select value={editBetForm.aplicacionId ?? ''}
                                onChange={e => setEditBetForm(p => ({ ...p, aplicacionId: e.target.value }))}
                                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, width: '100%', background: '#fff', cursor: 'pointer' }}>
                                <option value="">— Sin aplicación asociada —</option>
                                {data.aplicaciones.map(app => (
                                  <option key={app.id} value={app.id}>{app.nombre}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div className="flbl">Bet / LVT <span style={{ color: '#DC2626' }}>*</span></div>
                              <textarea rows={3} value={editBetForm.descripcion} onChange={e => setEditBetForm(p => ({ ...p, descripcion: e.target.value }))}
                                placeholder="Describe el objetivo del Bet / LVT..."
                                style={{ width: '100%', resize: 'vertical', borderRadius: 8, border: editErrors.descripcion ? '1px solid #DC2626' : '1px solid var(--border)', padding: '8px 12px', fontSize: 13 }} />
                              {editErrors.descripcion && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 3 }}>{editErrors.descripcion}</div>}
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              {renderProductEditor(editBetForm, setEditBetForm, editErrors)}
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              {renderMosDraftEditor(editBetForm, setEditBetForm, editErrors)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                            <button className="btn-save" onClick={() => handleSaveBetEdit(bet)}>Guardar cambios</button>
                            <button onClick={() => setExpandedId(null)}
                              style={{ padding: '9px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: 'var(--muted)' }}>
                              Cancelar
                            </button>
                          </div>
                          <AuditMeta createdAt={bet.createdAt} updatedAt={bet.updatedAt} createdBy={bet.createdBy} updatedBy={bet.updatedBy} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── MOS TAB ─── */}
      {mode === 'mos' && (
        <div>
          {/* Q selector igual que en bets */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {QS.map(q => (
              <button key={q} onClick={() => { setSelectedQ(q); setMosExpanded(null); }}
                style={{ padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  background: selectedQ === q ? '#0032A0' : 'var(--white)', color: selectedQ === q ? '#fff' : '#64748B',
                  border: `1px solid ${selectedQ === q ? '#0032A0' : 'var(--border)'}` }}>
                {q}{data.config.q_activo === q && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>*</span>}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Selecciona los MOS activos de cada Bet / LVT, define sus valores y marca en qué quarters aplica cada indicador.
          </p>
          {visibleBetsForMos.filter(bet => bet.q === selectedQ).length === 0 && (
            <div className="rev-empty">No hay Bets / LVT activos para {selectedQ}. Crea un registro primero en la pestaña "Bets / LVT".</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleBetsForMos.filter(bet => bet.q === selectedQ).map(bet => {
              const mosBet = mosByBet(bet);
              const activos = mosSelections[bet.id] ?? new Set<string>();
              const isSaved = savedBetId === bet.id;
              const isExpanded = mosExpanded === bet.id;
              return (
                <div key={bet.id} style={{ border: `1px solid ${isExpanded ? `${bet.color}50` : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden' }}>
                  <button onClick={() => setMosExpanded(isExpanded ? null : bet.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'stretch', textAlign: 'left', background: '#fff', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <span style={{ width: 6, flexShrink: 0, background: bet.color }} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 4 }}>Productos asociados</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                          {getBetProducts(bet).map(product => (
                            <span key={product} style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, color: '#fff', background: bet.color }}>
                              {product}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'start' }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 4 }}>Objetivo del Bet / LVT</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{bet.descripcion}</div>
                          </div>
                          <div style={{ minWidth: 120 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 4 }}>MOS activos</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: bet.color }}>{activos.size} / {mosBet.length}</div>
                            {/* Mostrar quarters activos por MOS */}
                            <div style={{ marginTop: 6 }}>
                              {mosBet.map(m => {
                                const quarters = mosQuarterSelections[m.id] ?? new Set<string>();
                                if (!(activos.has(m.id)) || quarters.size === 0) return null;
                                return (
                                  <div key={m.id} style={{ fontSize: 10, color: bet.color, fontWeight: 600, marginBottom: 2 }}>
                                    {m.descripcion.length > 18 ? m.descripcion.slice(0,18) + '…' : m.descripcion}: {Array.from(quarters).sort((a,b)=>QS.indexOf(a)-QS.indexOf(b)).join(', ')}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${bet.color}20`, background: `${bet.color}06`, padding: '14px 18px' }}>
                      {mosBet.length === 0 && (
                        <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
                          Este Bet / LVT no tiene MOS del Bet cargados todavía.
                        </p>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                        {mosBet.map(m => {
                          const isChecked = activos.has(m.id);
                          const f = mosFields[m.id] ?? { linea_base: '', meta: '', actual: '' };
                          const quarters = mosQuarterSelections[m.id] ?? new Set<string>();
                          return (
                            <div key={m.id} style={{ background: '#fff', border: `1px solid ${isChecked ? `${bet.color}40` : '#f3f4f6'}`, borderRadius: 10, overflow: 'hidden' }}>
                              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', cursor: 'pointer' }}>
                                <div onClick={() => toggleMos(bet.id, m.id)}
                                  style={{ flexShrink: 0, width: 16, height: 16, marginTop: 2, borderRadius: 4, border: `2px solid ${isChecked ? bet.color : '#D1D5DB'}`,
                                    background: isChecked ? bet.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                  {isChecked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                                </div>
                                <span style={{ fontSize: 13, lineHeight: 1.5, color: isChecked ? 'var(--text)' : 'var(--muted)', fontWeight: isChecked ? 600 : 400 }}>
                                  {m.descripcion}
                                </span>
                              </label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 14px 12px', borderTop: `1px solid ${bet.color}20`, opacity: isChecked ? 1 : 0.72 }}>
                                <div style={{ paddingTop: 10 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: bet.color, marginBottom: 6 }}>Usar en quarters</div>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {QS.map(q => {
                                      const isActive = quarters.has(q);
                                      return (
                                        <button
                                          key={`${m.id}_${q}`}
                                          type="button"
                                          onClick={() => toggleMosQuarter(m.id, q)}
                                          style={{
                                            padding: '6px 12px',
                                            borderRadius: 999,
                                            border: `1px solid ${isActive ? bet.color : '#CBD5E1'}`,
                                            background: isActive ? `${bet.color}18` : '#fff',
                                            color: isActive ? bet.color : '#64748B',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          {q}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                  <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: bet.color, marginBottom: 4 }}>Línea Base</div>
                                    <input value={f.linea_base} onChange={e => setMosFields(prev => ({ ...prev, [m.id]: { ...prev[m.id], linea_base: e.target.value } }))}
                                      placeholder="—" style={{ ...inputStyle }} />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: bet.color, marginBottom: 4 }}>Meta</div>
                                    <input value={f.meta} onChange={e => setMosFields(prev => ({ ...prev, [m.id]: { ...prev[m.id], meta: e.target.value } }))}
                                      placeholder="—" style={{ ...inputStyle }} />
                                  </div>
                                </div>
                                {(m.createdAt || m.updatedAt) && (
                                  <div style={{ fontSize: 10, color: '#94a3b8', paddingTop: 4 }}>
                                    {m.createdAt && `Creado: ${fmtAudit(m.createdAt)}`}{m.updatedAt && m.updatedAt !== m.createdAt && ` · Mod: ${fmtAudit(m.updatedAt)}`}{m.createdBy && ` — ${m.createdBy}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {mosBet.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <button className="btn-save" onClick={() => handleSaveMosSelection(bet, mosBet)}
                            style={{ background: bet.color }}>
                            Guardar selección
                          </button>
                          {isSaved && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>✓ Guardado</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sección Equipo ───────────────────────────────────────────────────────────
const ROL_CLR: Record<string, string> = {
  'Product Owner': '#2563EB', 'Iteration Manager': '#7C3AED', 'Tech Leader': '#0032A0',
  'Front End': '#EA580C', 'Full Stack': '#0891B2', 'Backend': '#059669',
};
const ROL_OPTIONS = ['Product Owner', 'Iteration Manager', 'Tech Leader', 'Front End', 'Full Stack', 'Backend'];

type MemberForm = { nombre: string; rol: string; iniciales: string; foto_url: string; activo: boolean };
const emptyMemberForm = (): MemberForm => ({ nombre: '', rol: 'Full Stack', iniciales: '', foto_url: '', activo: true });



function EquipoSection({ data, onSaved, dialogs }: { data: AppData; onSaved: () => void; dialogs: AdminDialogHelpers }) {
  // Tour eliminado temporalmente por incompatibilidad
  const [localMembers, setLocalMembers] = useState<TeamMember[]>(() => [...data.equipo]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<MemberForm>(emptyMemberForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const equipoId = (data.config as any).equipoId ?? 'eq_planificacion';
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MemberForm>(emptyMemberForm());
  const [savedId, setSavedId] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };

  const validate = (f: MemberForm) => {
    const e: Record<string, string> = {};
    if (!f.nombre.trim())    e.nombre    = 'El nombre es obligatorio.';
    if (!f.iniciales.trim()) e.iniciales = 'Las iniciales son obligatorias.';
    return e;
  };

  const handleAdd = () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    const newMember: TeamMember = { id: `eq_${Date.now()}`, nombre: form.nombre.trim(), rol: form.rol, iniciales: form.iniciales.trim().toUpperCase(), foto_url: form.foto_url.trim() || undefined, activo: form.activo };
    saveTeamMember(newMember, equipoId);
    setLocalMembers(prev => [...prev, newMember]);
    setForm(emptyMemberForm());
    setErrors({});
    setAdding(false);
    onSaved();
  };

  const startEdit = (m: TeamMember) => {
    setEditId(m.id);
    setEditForm({ nombre: m.nombre, rol: m.rol, iniciales: m.iniciales, foto_url: m.foto_url ?? '', activo: m.activo });
  };

  const handleSaveEdit = (id: string) => {
    const e = validate(editForm);
    if (Object.keys(e).length) return;
    const updated: TeamMember = { id, nombre: editForm.nombre.trim(), rol: editForm.rol, iniciales: editForm.iniciales.trim().toUpperCase(), foto_url: editForm.foto_url.trim() || undefined, activo: editForm.activo };
    saveTeamMember(updated, equipoId);
    setLocalMembers(prev => prev.map(m => m.id === id ? updated : m));
    setSavedId(id);
    setEditId(null);
    onSaved();
    setTimeout(() => setSavedId(null), 2000);
  };

  const handleDelete = (m: TeamMember) => {
    dialogs.showConfirm(`¿Eliminar a "${m.nombre}" del equipo?`, () => {
      deleteTeamMember(m.id, equipoId);
      setLocalMembers(prev => prev.filter(x => x.id !== m.id));
      onSaved();
    }, { title: 'Eliminar integrante', confirmLabel: 'Eliminar' });
  };

  const handleToggleActivo = (id: string) => {
    const updated = localMembers.map(m => m.id === id ? { ...m, activo: !m.activo } : m);
    setLocalMembers(updated);
    const m = updated.find(x => x.id === id)!;
    saveTeamMember(m, equipoId);
  };

  const MemberAvatar = ({ m, size = 40 }: { m: TeamMember; size?: number }) => {
    const color = ROL_CLR[m.rol] ?? '#374151';
    return m.foto_url
      ? <img src={m.foto_url} alt={m.nombre} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      : <div style={{ width: size, height: size, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>{m.iniciales}</div>;
  };

  const RowForm = ({ f, setF, onOk, onCancel, okLabel }: { f: MemberForm; setF: (fn: (p: MemberForm) => MemberForm) => void; onOk: () => void; onCancel: () => void; okLabel: string }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', gap: 10, alignItems: 'end' }}>
      <div>
        <div className="flbl">Nombre <span style={{ color: '#DC2626' }}>*</span></div>
        <input value={f.nombre} onChange={e => setF(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} placeholder="Javiera León" />
        {errors.nombre && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 3 }}>{errors.nombre}</div>}
      </div>
      <div>
        <div className="flbl">Rol</div>
        <select value={f.rol} onChange={e => setF(p => ({ ...p, rol: e.target.value }))} style={inputStyle}>
          {ROL_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <div className="flbl">Iniciales <span style={{ color: '#DC2626' }}>*</span></div>
        <input value={f.iniciales} maxLength={3} onChange={e => setF(p => ({ ...p, iniciales: e.target.value }))} style={inputStyle} placeholder="JL" />
        {errors.iniciales && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 3 }}>{errors.iniciales}</div>}
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="flbl">URL Foto (opcional)</div>
        <input value={f.foto_url} onChange={e => setF(p => ({ ...p, foto_url: e.target.value }))} style={inputStyle} placeholder="https://..." />
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
        <button className="btn-save" onClick={onOk}>{okLabel}</button>
        <button onClick={onCancel} className="btn-admin-alt">Cancelar</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', cursor: 'pointer', marginLeft: 8 }}>
          <input type="checkbox" checked={f.activo} onChange={e => setF(p => ({ ...p, activo: e.target.checked }))} />
          Activo
        </label>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Equipo</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>Gestiona los integrantes del equipo. Estos aparecen en la página principal.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="f-add-btn" onClick={() => setAdding(true)}>+ Agregar integrante</button>
        </div>
      </div>

      {/* Formulario nuevo */}
      {adding && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0032A0', marginBottom: 14 }}>Nuevo integrante</div>
          {RowForm({ f: form, setF: setForm, onOk: handleAdd, onCancel: () => { setAdding(false); setErrors({}); setForm(emptyMemberForm()); }, okLabel: 'Agregar' })}
        </div>
      )}

      {/* Tabla */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Cabecera */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 120px auto', gap: 12, padding: '8px 16px', background: 'var(--light)', borderBottom: '1px solid var(--border)' }}>
          {['', 'Nombre', 'Rol', 'Acciones'].map((h, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>{h}</span>
          ))}
        </div>

        {localMembers.length === 0 && (
          <div className="rev-empty">No hay integrantes. Agrega uno con el botón de arriba.</div>
        )}

        {localMembers.map(m => {
          const rolColor = ROL_CLR[m.rol] ?? '#374151';
          const isEditing = editId === m.id;
          return (
            <div key={m.id} style={{ borderBottom: '1px solid var(--border)', opacity: m.activo ? 1 : 0.5 }}>
              {/* Fila normal */}
              {!isEditing && (
                <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 120px auto', gap: 12, padding: '10px 16px', alignItems: 'center' }}>
                  {MemberAvatar({ m, size: 36 })}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{m.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{m.iniciales}</div>
                  </div>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fff', background: rolColor }}>{m.rol}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEdit(m)} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid #c7d2e8', background: '#f0f7ff', color: '#0032A0' }}>
                      Editar
                    </button>
                    <button onClick={() => handleToggleActivo(m.id)}
                      style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f8fafc', color: m.activo ? '#475569' : '#059669' }}>
                      {m.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => handleDelete(m)} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626' }}>
                      Eliminar
                    </button>
                    {savedId === m.id && <span style={{ fontSize: 12, color: '#059669' }}>✓</span>}
                  </div>
                </div>
              )}
              {/* Fila edición */}
              {isEditing && (
                <div style={{ padding: '14px 16px', background: '#FAFAFA' }}>
                  {RowForm({
                    f: editForm,
                    setF: setEditForm,
                    onOk: () => handleSaveEdit(m.id),
                    onCancel: () => { setEditId(null); setErrors({}); },
                    okLabel: 'Guardar',
                  })}
                  <AuditMeta createdAt={m.createdAt} updatedAt={m.updatedAt} createdBy={m.createdBy} updatedBy={m.updatedBy} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sección Capacidades ───────────────────────────────────────────────────────
const COLOR_OPTIONS = ['#1B30CC','#7C3AED','#EA580C','#0891B2','#DB2777','#1E40AF','#0369A1','#059669','#D97706','#9D174D','#0032A0','#065F46'];

function ColorDot({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {COLOR_OPTIONS.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: `3px solid ${value === c ? '#fff' : c}`, boxShadow: value === c ? `0 0 0 2px ${c}` : 'none', cursor: 'pointer', padding: 0 }}
        />
      ))}
    </div>
  );
}

type AlcanceForm = { nombre: string; icon: string; color: string; descripcion: string; contexto: string; badge: string };
const emptyAlcanceForm = (capColor: string): AlcanceForm => ({ nombre: '', icon: '📌', color: capColor, descripcion: '', contexto: '', badge: '' });
type CapacidadForm = { label: string; nombre: string; color: string };
const emptyCapacidadForm = (): CapacidadForm => ({ label: '', nombre: '', color: COLOR_OPTIONS[0] });

function CapacidadesSection({ data, onSaved, dialogs }: { data: AppData; onSaved: () => void; dialogs: AdminDialogHelpers }) {
  const [localCaps, setLocalCaps] = useState<Capacidad[]>(() =>
    [...data.capacidades].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
  );
  const [expandedCap, setExpandedCap] = useState<string | null>(null);
  const [addingAlcanceCap, setAddingAlcanceCap] = useState<string | null>(null);
  const [alcanceForm, setAlcanceForm] = useState<AlcanceForm>(emptyAlcanceForm(COLOR_OPTIONS[0]));
  const [editingAlcanceKey, setEditingAlcanceKey] = useState<string | null>(null);
  const [editAlcanceForm, setEditAlcanceForm] = useState<AlcanceForm>(emptyAlcanceForm(COLOR_OPTIONS[0]));
  const [addingCapacidad, setAddingCapacidad] = useState(false);
  const [capacidadForm, setCapacidadForm] = useState<CapacidadForm>(emptyCapacidadForm());
  const [editingCapacidadKey, setEditingCapacidadKey] = useState<string | null>(null);
  const [editCapacidadForm, setEditCapacidadForm] = useState<CapacidadForm>(emptyCapacidadForm());

  const equipoId = (data.config as any).equipoId ?? 'eq_planificacion';

  const persist = (caps: Capacidad[]) => {
    saveCapacidades(caps, equipoId);
    setLocalCaps(caps);
    onSaved();
  };

  const handleAddAlcanceSub = (capKey: string) => {
    if (!alcanceForm.nombre.trim()) return;
    const cap = localCaps.find(c => c.key === capKey)!;
    const newAlcance: Alcance = {
      key: `alc_${Date.now()}`,
      capacidadKey: capKey,
      nombre: alcanceForm.nombre.trim(),
      icon: alcanceForm.icon || '📌',
      color: alcanceForm.color,
      descripcion: alcanceForm.descripcion.trim(),
      contexto: alcanceForm.contexto.trim() || undefined,
      alcances: [],
      badge: alcanceForm.badge.trim() || undefined,
    };
    const updated = localCaps.map(c =>
      c.key === capKey ? { ...c, alcances: [...(c.alcances ?? []), newAlcance] } : c
    );
    persist(updated);
    setAddingAlcanceCap(null);
    setAlcanceForm(emptyAlcanceForm(cap.color));
  };

  const handleSaveEditAlcance = (capKey: string, alcanceKey: string) => {
    if (!editAlcanceForm.nombre.trim()) return;
    const updated = localCaps.map(c =>
      c.key === capKey ? {
        ...c,
        alcances: (c.alcances ?? []).map(a => a.key === alcanceKey ? {
          ...a,
          nombre: editAlcanceForm.nombre.trim(),
          icon: editAlcanceForm.icon || '📌',
          color: editAlcanceForm.color,
          descripcion: editAlcanceForm.descripcion.trim(),
          contexto: editAlcanceForm.contexto.trim() || undefined,
          badge: editAlcanceForm.badge.trim() || undefined,
        } : a),
      } : c
    );
    persist(updated);
    setEditingAlcanceKey(null);
  };

  const handleDeleteAlcanceSub = (capKey: string, alcanceKey: string, nombre: string) => {
    dialogs.showConfirm(`¿Eliminar el alcance "${nombre}"?`, () => {
      setLocalCaps(prev => {
        const updated = prev.map(c =>
          c.key === capKey ? { ...c, alcances: (c.alcances ?? []).filter(a => a.key !== alcanceKey) } : c
        );
        saveCapacidades(updated, equipoId);
        return updated;
      });
      onSaved();
    }, { title: 'Eliminar alcance', confirmLabel: 'Eliminar' });
  };

  const handleAddCapacidad = () => {
    if (!capacidadForm.label.trim() || !capacidadForm.nombre.trim()) return;
    const key = `cap_${Date.now()}`;
    const newCap: Capacidad = { key, label: capacidadForm.label.trim(), nombre: capacidadForm.nombre.trim(), color: capacidadForm.color, orden: localCaps.length + 1, alcances: [] };
    persist([...localCaps, newCap]);
    setAddingCapacidad(false);
    setCapacidadForm(emptyCapacidadForm());
  };

  const handleDeleteCapacidad = (capKey: string, nombre: string) => {
    dialogs.showConfirm(`¿Eliminar la capacidad "${nombre}"? Se eliminarán también todos sus alcances.`, () => {
      persist(localCaps.filter(c => c.key !== capKey));
      onSaved();
    }, { title: 'Eliminar capacidad', confirmLabel: 'Eliminar' });
  };

  const handleSaveCapacidad = (capKey: string) => {
    if (!editCapacidadForm.label.trim() || !editCapacidadForm.nombre.trim()) return;
    const updated = localCaps.map(c =>
      c.key === capKey ? { ...c, label: editCapacidadForm.label.trim(), nombre: editCapacidadForm.nombre.trim(), color: editCapacidadForm.color } : c
    );
    persist(updated);
    setEditingCapacidadKey(null);
  };


  const inputStyle: React.CSSProperties = { padding: '7px 11px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };

  const AlcanceFormFields = ({ f, setF }: { f: AlcanceForm; setF: (fn: (p: AlcanceForm) => AlcanceForm) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 8 }}>
        <div>
          <div className="flbl">Icono</div>
          <input value={f.icon} onChange={e => setF(p => ({ ...p, icon: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <div className="flbl">Nombre <span style={{ color: '#DC2626' }}>*</span></div>
          <input value={f.nombre} onChange={e => setF(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} placeholder="Primera Milla" />
        </div>
      </div>
      <div>
        <div className="flbl">Descripción corta</div>
        <input value={f.descripcion} onChange={e => setF(p => ({ ...p, descripcion: e.target.value }))} style={inputStyle} placeholder="Descripción breve para la tarjeta" />
      </div>
      <div>
        <div className="flbl">Contexto <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>(qué hace este alcance)</span></div>
        <textarea rows={3} value={f.contexto} onChange={e => setF(p => ({ ...p, contexto: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Explica el alcance y propósito..." />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div className="flbl">Color</div>
          <ColorDot value={f.color} onChange={c => setF(p => ({ ...p, color: c }))} />
        </div>
        <div>
          <div className="flbl">Badge (opcional)</div>
          <input value={f.badge} onChange={e => setF(p => ({ ...p, badge: e.target.value }))} style={inputStyle} placeholder="Nueva" />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Capacidades</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        Gestiona las capacidades del equipo y sus alcances. Los cambios se reflejan en la página principal y en los roadmaps.
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {!addingCapacidad && <button className="f-add-btn" onClick={() => setAddingCapacidad(true)}>+ Nueva capacidad</button>}
      </div>

      {/* Formulario nueva capacidad */}
      {addingCapacidad && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0032A0', marginBottom: 14 }}>Nueva capacidad</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 12 }}>
            <div>
              <div className="flbl">Etiqueta corta <span style={{ color: '#DC2626' }}>*</span></div>
              <input value={capacidadForm.label} onChange={e => setCapacidadForm(p => ({ ...p, label: e.target.value }))} style={inputStyle} placeholder="Planificación" />
            </div>
            <div>
              <div className="flbl">Nombre completo <span style={{ color: '#DC2626' }}>*</span></div>
              <input value={capacidadForm.nombre} onChange={e => setCapacidadForm(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} placeholder="Planificación del Transporte" />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div className="flbl">Color</div>
            <ColorDot value={capacidadForm.color} onChange={c => setCapacidadForm(p => ({ ...p, color: c }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-save" onClick={handleAddCapacidad}>Agregar capacidad</button>
            <button onClick={() => { setAddingCapacidad(false); setCapacidadForm(emptyCapacidadForm()); }} className="btn-admin-alt">Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista de capacidades */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {localCaps.map(cap => {
          const isExpanded = expandedCap === cap.key;
          const isEditingCap = editingCapacidadKey === cap.key;
          return (
            <div key={cap.key} style={{ background: '#fff', border: `1.5px solid`, borderColor: isExpanded ? `${cap.color}60` : 'var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {/* Cabecera capacidad */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: cap.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{cap.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{(cap.alcances ?? []).length} alcances</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedCap(null);
                        setEditingCapacidadKey(null);
                      } else {
                        setExpandedCap(cap.key);
                        setEditingCapacidadKey(cap.key);
                        setEditCapacidadForm({ label: cap.label, nombre: cap.nombre, color: cap.color });
                      }
                    }}
                    style={{ fontSize: 12, padding: '5px 12px', background: '#f0f7ff', border: `1px solid ${isExpanded ? '#0032A0' : '#c7d2e8'}`, borderRadius: 7, cursor: 'pointer', color: '#0032A0', fontWeight: 600 }}>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteCapacidad(cap.key, cap.nombre)}
                    style={{ fontSize: 12, padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Alcances expandidos */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${cap.color}20`, background: `${cap.color}04`, padding: '12px 18px' }}>
                  {isEditingCap && (
                    <div style={{ background: '#fff', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0032A0', marginBottom: 12 }}>Editar capacidad</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 10 }}>
                        <input value={editCapacidadForm.label} onChange={e => setEditCapacidadForm(p => ({ ...p, label: e.target.value }))} style={inputStyle} placeholder="Etiqueta corta" />
                        <input value={editCapacidadForm.nombre} onChange={e => setEditCapacidadForm(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} placeholder="Nombre completo" />
                        <div style={{ gridColumn: '1 / -1' }}>
                          <ColorDot value={editCapacidadForm.color} onChange={c => setEditCapacidadForm(p => ({ ...p, color: c }))} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-save" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => handleSaveCapacidad(cap.key)}>Guardar</button>
                        <button onClick={() => setEditingCapacidadKey(null)} className="btn-admin-alt" style={{ padding: '6px 10px', fontSize: 12 }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cap.color, fontFamily: 'Manrope, sans-serif' }}>Alcances</span>
                    {addingAlcanceCap !== cap.key && (
                      <button className="f-add-btn" style={{ fontSize: 11, padding: '5px 12px' }}
                        onClick={() => { setAddingAlcanceCap(cap.key); setAlcanceForm(emptyAlcanceForm(cap.color)); }}>
                        + Agregar alcance
                      </button>
                    )}
                  </div>

                  {/* Formulario nuevo alcance */}
                  {addingAlcanceCap === cap.key && (
                    <div style={{ background: '#fff', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0032A0', marginBottom: 12 }}>Nuevo alcance en {cap.label}</div>
                      {AlcanceFormFields({ f: alcanceForm, setF: setAlcanceForm })}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button className="btn-save" onClick={() => handleAddAlcanceSub(cap.key)}>Agregar</button>
                        <button onClick={() => setAddingAlcanceCap(null)} className="btn-admin-alt" style={{ padding: '7px 12px', fontSize: 12 }}>Cancelar</button>
                      </div>
                    </div>
                  )}

                  {/* Lista alcances */}
                  {(cap.alcances ?? []).length === 0 && addingAlcanceCap !== cap.key && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>Sin alcances. Agrega el primero.</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(cap.alcances ?? []).map(alc => {
                      const isEditingAlc = editingAlcanceKey === alc.key;
                      return (
                        <div key={alc.key}>
                          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px' }}>
                          {isEditingAlc ? (
                            <div>
                              {AlcanceFormFields({ f: editAlcanceForm, setF: setEditAlcanceForm })}
                              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <button className="btn-save" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => handleSaveEditAlcance(cap.key, alc.key)}>Guardar</button>
                                <button onClick={() => setEditingAlcanceKey(null)} className="btn-admin-alt" style={{ padding: '6px 10px', fontSize: 12 }}>Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{alc.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{alc.nombre}</span>
                                  {alc.badge && <span style={{ fontSize: 9, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '1px 6px', borderRadius: 3 }}>{alc.badge}</span>}
                                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: alc.color, display: 'inline-block', flexShrink: 0 }} />
                                </div>
                                {alc.contexto && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>{alc.contexto.slice(0, 120)}{alc.contexto.length > 120 ? '…' : ''}</div>}
                              </div>
                              <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                                <button onClick={() => { setEditingAlcanceKey(alc.key); setEditAlcanceForm({ nombre: alc.nombre, icon: alc.icon, color: alc.color, descripcion: alc.descripcion, contexto: alc.contexto ?? '', badge: alc.badge ?? '' }); }}
                                  style={{ fontSize: 11, padding: '3px 8px', background: 'none', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', color: 'var(--text)' }}>Editar</button>
                                <button onClick={() => handleDeleteAlcanceSub(cap.key, alc.key, alc.nombre)}
                                  style={{ fontSize: 11, padding: '3px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>Eliminar</button>
                              </div>
                            </div>
                          )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aplicaciones ──────────────────────────────────────────────────────────────
function AplicacionesSection({ data, onSaved, dialogs }: { data: AppData; onSaved: () => void; dialogs: AdminDialogHelpers }) {
  const [apps, setApps] = useState<Aplicacion[]>(() => [...(data.aplicaciones ?? [])]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', capacidadKey: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', descripcion: '', capacidadKey: '' });
  const [releaseEditingId, setReleaseEditingId] = useState<string | null>(null);
  const emptyRelease = (): UltimoRelease => ({ version: '', fecha: '', estado: 'done', descripcion: '', changelog: [''] });
  const equipoId = (data.config as any).equipoId ?? 'eq_planificacion';
  const [releaseForm, setReleaseForm] = useState<UltimoRelease>(emptyRelease());

  const inputStyle: React.CSSProperties = { padding: '7px 11px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };

  const persist = (list: Aplicacion[]) => { setApps(list); };

  const handleAdd = () => {
    if (!form.nombre.trim() || !form.capacidadKey) return;
    const newApp: Aplicacion = { id: `app_${Date.now()}`, nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), capacidadKey: form.capacidadKey };
    const updated = [...apps, newApp];
    persist(updated);
    saveAplicacion(newApp, equipoId);
    setAdding(false);
    setForm({ nombre: '', descripcion: '', capacidadKey: '' });
    onSaved();
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm.nombre.trim() || !editForm.capacidadKey) return;
    const updated = apps.map(a => a.id === id ? { ...a, nombre: editForm.nombre.trim(), descripcion: editForm.descripcion.trim(), capacidadKey: editForm.capacidadKey } : a);
    persist(updated);
    updated.filter(a => a.id === id).forEach(a => saveAplicacion(a, equipoId));
    setEditingId(null);
    onSaved();
  };

  const handleDelete = (id: string, nombre: string) => {
    dialogs.showConfirm(`¿Eliminar la aplicación "${nombre}"?`, () => {
      setApps(prev => prev.filter(a => a.id !== id));
      deleteAplicacion(id, equipoId);
      onSaved();
    }, { title: 'Eliminar aplicación', confirmLabel: 'Eliminar' });
  };

  const getCapacidadInfo = (key: string) => data.capacidades.find(c => c.key === key);

  const FormFields = ({ f, setF }: { f: typeof form; setF: (fn: (p: typeof form) => typeof form) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div className="flbl">Nombre <span style={{ color: '#DC2626' }}>*</span></div>
        <input value={f.nombre} onChange={e => setF(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} placeholder="Ej: Blue Planner Web" />
      </div>
      <div>
        <div className="flbl">Descripción</div>
        <textarea rows={3} value={f.descripcion} onChange={e => setF(p => ({ ...p, descripcion: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="¿Qué hace esta aplicación?" />
      </div>
      <div>
        <div className="flbl">Capacidad <span style={{ color: '#DC2626' }}>*</span></div>
        <select value={f.capacidadKey} onChange={e => setF(p => ({ ...p, capacidadKey: e.target.value }))} style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
          <option value="">— Seleccionar capacidad —</option>
          {data.capacidades.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)).map(capacidad => (
            <option key={capacidad.key} value={capacidad.key}>{capacidad.nombre}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Aplicaciones</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        Registra las aplicaciones del equipo y asócialas a la capacidad que habilitan.
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {!adding && <button className="f-add-btn" onClick={() => setAdding(true)}>+ Nueva aplicación</button>}
      </div>

      {/* Formulario nueva */}
      {adding && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0032A0', marginBottom: 14 }}>Nueva aplicación</div>
          {FormFields({ f: form, setF: setForm })}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn-save" onClick={handleAdd}>Agregar</button>
            <button onClick={() => { setAdding(false); setForm({ nombre: '', descripcion: '', capacidadKey: '' }); }} className="btn-admin-alt">Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {apps.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 13 }}>Sin aplicaciones registradas.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {apps.map(app => {
          const cap = getCapacidadInfo(app.capacidadKey);
          const isEditing = editingId === app.id;
          return (
            <div key={app.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
              {isEditing ? (
                <div>
                  {FormFields({ f: editForm, setF: setEditForm })}
                  <AuditMeta createdAt={app.createdAt} updatedAt={app.updatedAt} createdBy={app.createdBy} updatedBy={app.updatedBy} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn-save" style={{ fontSize: 12 }} onClick={() => handleSaveEdit(app.id)}>Guardar</button>
                    <button onClick={() => setEditingId(null)} className="btn-admin-alt" style={{ padding: '7px 12px', fontSize: 12 }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: cap ? `${cap.color}18` : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      📱
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{app.nombre}</div>
                      {app.descripcion && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, lineHeight: 1.4 }}>{app.descripcion}</div>}
                      {cap && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${cap.color}12`, border: `1px solid ${cap.color}30`, borderRadius: 5, padding: '2px 8px' }}>
                          <span style={{ fontSize: 10, width: 6, height: 6, borderRadius: '50%', background: cap.color, display: 'inline-block' }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: cap.color }}>{cap.nombre}</span>
                        </div>
                      )}
                      {/* Último release badge */}
                      {app.ultimo_release && (
                        <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '2px 10px' }}>
                          <span style={{ fontSize: 10 }}>🚀</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>v{app.ultimo_release.version}</span>
                          <span style={{ fontSize: 10, color: '#6B7280' }}>·</span>
                          <span style={{ fontSize: 11, color: '#4B5563' }}>{app.ultimo_release.fecha}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setEditingId(app.id); setEditForm({ nombre: app.nombre, descripcion: app.descripcion, capacidadKey: app.capacidadKey }); }}
                        style={{ fontSize: 12, padding: '5px 12px', background: '#f0f7ff', border: '1px solid #c7d2e8', borderRadius: 7, cursor: 'pointer', color: '#0032A0', fontWeight: 600 }}>
                        Editar
                      </button>
                      <button onClick={() => {
                        setReleaseEditingId(releaseEditingId === app.id ? null : app.id);
                        setReleaseForm(app.ultimo_release ? { ...app.ultimo_release, changelog: [...app.ultimo_release.changelog] } : emptyRelease());
                      }}
                        style={{ fontSize: 12, padding: '5px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, cursor: 'pointer', color: '#16a34a', fontWeight: 600 }}>
                        🚀 Release
                      </button>
                      <button onClick={() => handleDelete(app.id, app.nombre)}
                        style={{ fontSize: 12, padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                  {/* Panel edición último release */}
                  {releaseEditingId === app.id && (
                    <div style={{ marginTop: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#15803D', marginBottom: 12 }}>🚀 Último Release</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <div className="flbl">Versión</div>
                          <input value={releaseForm.version} onChange={e => setReleaseForm(p => ({ ...p, version: e.target.value }))} placeholder="1.0.0" style={inputStyle} />
                        </div>
                        <div>
                          <div className="flbl">Fecha</div>
                          <input type="date" value={releaseForm.fecha} onChange={e => setReleaseForm(p => ({ ...p, fecha: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                          <div className="flbl">Estado</div>
                          <select value={releaseForm.estado} onChange={e => setReleaseForm(p => ({ ...p, estado: e.target.value as UltimoRelease['estado'] }))} style={{ ...inputStyle, background: '#fff' }}>
                            <option value="done">✅ Lanzado</option>
                            <option value="in_progress">🔄 En progreso</option>
                            <option value="backlog">📋 Backlog</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div className="flbl">Descripción</div>
                        <input value={releaseForm.descripcion} onChange={e => setReleaseForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Qué incluye este release..." style={inputStyle} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div className="flbl" style={{ marginBottom: 0 }}>Changelog</div>
                          <button type="button" className="f-add-btn" style={{ fontSize: 11 }} onClick={() => setReleaseForm(p => ({ ...p, changelog: [...p.changelog, ''] }))}>+ Agregar</button>
                        </div>
                        {releaseForm.changelog.map((line, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 6 }}>
                            <input value={line} onChange={e => setReleaseForm(p => { const c = [...p.changelog]; c[idx] = e.target.value; return { ...p, changelog: c }; })}
                              placeholder={`Cambio ${idx + 1}`} style={{ ...inputStyle }} />
                            <button type="button" onClick={() => setReleaseForm(p => ({ ...p, changelog: p.changelog.filter((_, i) => i !== idx) }))}
                              style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', background: '#fff', color: '#64748b', cursor: 'pointer' }}>✕</button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button className="btn-save" style={{ fontSize: 12 }} onClick={() => {
                          const updated = apps.map(a => a.id === app.id ? { ...a, ultimo_release: { ...releaseForm, changelog: releaseForm.changelog.filter(l => l.trim()) } } : a);
                          persist(updated);
                          updated.filter(a => a.id === app.id).forEach(a => saveAplicacion(a, equipoId));
                          setReleaseEditingId(null);
                          onSaved();
                        }}>Guardar Release</button>
                        <button onClick={() => setReleaseEditingId(null)} className="btn-admin-alt" style={{ padding: '7px 12px', fontSize: 12 }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stakeholders ─────────────────────────────────────────────────────────────
type StakeholderForm = {
  nombre: string;
  area: string;
  q: Stakeholder['q'];
  capacidadKeys: string[];
  activo: boolean;
};

const emptyStakeholderForm = (): StakeholderForm => ({
  nombre: '',
  area: '',
  q: 'ALL',
  capacidadKeys: [],
  activo: true,
});

function StakeholdersSection({ data, onSaved, dialogs }: { data: AppData; onSaved: () => void; dialogs: AdminDialogHelpers }) {
  const capacidadOptions = [...data.capacidades]
    .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
    .map(capacidad => ({ key: capacidad.key, nombre: capacidad.nombre, color: capacidad.color, label: capacidad.label }));
  const capacidadMap = new Map(capacidadOptions.map(capacidad => [capacidad.key, capacidad]));

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(() =>
    [...(data.stakeholders ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  );
  const [selectedQ, setSelectedQ] = useState<Stakeholder['q']>('ALL');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StakeholderForm>(emptyStakeholderForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const equipoId = (data.config as any).equipoId ?? 'eq_planificacion';
  const [savedId, setSavedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 13,
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
  };

  const persist = (list: Stakeholder[]) => {
    setStakeholders([...list].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
  };

  const validate = (nextForm: StakeholderForm) => {
    const nextErrors: Record<string, string> = {};
    if (!nextForm.nombre.trim()) nextErrors.nombre = 'El nombre es obligatorio.';
    if (nextForm.capacidadKeys.length === 0) nextErrors.capacidadKeys = 'Debes asociar al menos una capacidad.';
    return nextErrors;
  };

  const toStakeholder = (id: string, nextForm: StakeholderForm): Stakeholder => ({
    id,
    nombre: nextForm.nombre.trim(),
    area: nextForm.area.trim() || undefined,
    q: nextForm.q,
    capacidadKeys: [...new Set(nextForm.capacidadKeys)],
    activo: nextForm.activo,
  });

  const resetForm = (stakeholderQ: Stakeholder['q'] = selectedQ === 'ALL' ? 'ALL' : selectedQ) => {
    setForm({ ...emptyStakeholderForm(), q: stakeholderQ });
  };

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setErrors({});
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingId(null);
    setErrors({});
    resetForm();
  };

  const handleSave = () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const stakeholder = toStakeholder(editingId ?? `stk_${Date.now()}`, form);
    persist(editingId ? stakeholders.map(item => item.id === editingId ? stakeholder : item) : [...stakeholders, stakeholder]);
    saveStakeholder(stakeholder, equipoId);
    closeEditor();
    onSaved();
    setSavedId(stakeholder.id);
    setTimeout(() => setSavedId(null), 2000);
  };

  const startEdit = (stakeholder: Stakeholder) => {
    setEditingId(stakeholder.id);
    setForm({
      nombre: stakeholder.nombre,
      area: stakeholder.area ?? '',
      q: stakeholder.q,
      capacidadKeys: [...stakeholder.capacidadKeys],
      activo: stakeholder.activo,
    });
    setErrors({});
    setIsEditorOpen(true);
  };

  const handleDelete = (stakeholder: Stakeholder) => {
    dialogs.showConfirm(`¿Eliminar a "${stakeholder.nombre}" de stakeholders?`, () => {
      setStakeholders(prev => {
        const updated = prev.filter(item => item.id !== stakeholder.id);
        return [...updated].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      });
      deleteStakeholder(stakeholder.id, equipoId);
      onSaved();
    }, { title: 'Eliminar stakeholder', confirmLabel: 'Eliminar' });
  };

  const handleToggleActivo = (stakeholder: Stakeholder) => {
    const updatedStakeholder = { ...stakeholder, activo: !stakeholder.activo };
    persist(stakeholders.map(item => item.id === stakeholder.id ? updatedStakeholder : item));
    saveStakeholder(updatedStakeholder, equipoId);
    onSaved();
  };

  const toggleCapacidad = (
    capacidadKey: string,
    setter: (fn: (prev: StakeholderForm) => StakeholderForm) => void,
  ) => {
    setter(prev => ({
      ...prev,
      capacidadKeys: prev.capacidadKeys.includes(capacidadKey)
        ? prev.capacidadKeys.filter(key => key !== capacidadKey)
        : [...prev.capacidadKeys, capacidadKey],
    }));
  };

  const filteredStakeholders = stakeholders.filter(stakeholder => {
    if (selectedQ !== 'ALL' && stakeholder.q !== 'ALL' && stakeholder.q !== selectedQ) {
      return false;
    }

    const haystack = [
      stakeholder.nombre,
      stakeholder.area ?? '',
      STAKEHOLDER_Q_LABEL[stakeholder.q],
      ...stakeholder.capacidadKeys.map(key => capacidadMap.get(key)?.nombre ?? key),
    ].join(' ').toLowerCase();

    return haystack.includes(searchTerm.trim().toLowerCase());
  });

  const StakeholderFormFields = ({
    currentForm,
    setCurrentForm,
    onOk,
    onCancel,
    okLabel,
  }: {
    currentForm: StakeholderForm;
    setCurrentForm: (fn: (prev: StakeholderForm) => StakeholderForm) => void;
    onOk: () => void;
    onCancel: () => void;
    okLabel: string;
  }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div>
        <div className="flbl">Nombre <span style={{ color: '#DC2626' }}>*</span></div>
        <input value={currentForm.nombre} onChange={e => setCurrentForm(prev => ({ ...prev, nombre: e.target.value }))} style={inputStyle} placeholder="Ej: Carlos Muñoz" />
        {errors.nombre && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{errors.nombre}</div>}
      </div>
      <div>
        <div className="flbl">Quarter</div>
        <select value={currentForm.q} onChange={e => setCurrentForm(prev => ({ ...prev, q: e.target.value as Stakeholder['q'] }))} style={{ ...inputStyle, background: '#fff' }}>
          {STAKEHOLDER_Q_OPTIONS.map(option => <option key={option} value={option}>{STAKEHOLDER_Q_LABEL[option]}</option>)}
        </select>
      </div>
      <div>
        <div className="flbl">Área</div>
        <input value={currentForm.area} onChange={e => setCurrentForm(prev => ({ ...prev, area: e.target.value }))} style={inputStyle} placeholder="Ej: Operaciones" />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="flbl">Capacidades asociadas <span style={{ color: '#DC2626' }}>*</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
          {capacidadOptions.map(capacidad => {
            const checked = currentForm.capacidadKeys.includes(capacidad.key);
            return (
              <label
                key={capacidad.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  justifyContent: 'space-between',
                  padding: '9px 10px',
                  borderRadius: 10,
                  border: `1px solid ${checked ? capacidad.color : 'var(--border)'}`,
                  background: checked ? `${capacidad.color}14` : '#fff',
                  color: checked ? capacidad.color : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCapacidad(capacidad.key, setCurrentForm)}
                />
                <span style={{ flex: 1 }}>{capacidad.nombre}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: checked ? capacidad.color : 'var(--muted)' }}>{capacidad.label}</span>
              </label>
            );
          })}
        </div>
        {errors.capacidadKeys && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{errors.capacidadKeys}</div>}
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
        <button className="btn-save" onClick={onOk}>{okLabel}</button>
        <button onClick={onCancel} className="btn-admin-alt">Cancelar</button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={currentForm.activo} onChange={e => setCurrentForm(prev => ({ ...prev, activo: e.target.checked }))} />
          Activo
        </label>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Stakeholders</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Administra stakeholders por quarter y asígnalos a una o más capacidades con un editor modal.
          </p>
        </div>
        <button className="f-add-btn" onClick={openCreate}>+ Nuevo stakeholder</button>
      </div>

      <div style={{ display: 'flex', gap: 6, margin: '18px 0 14px', flexWrap: 'wrap' }}>
        {STAKEHOLDER_Q_OPTIONS.map(option => (
          <button
            key={option}
            onClick={() => setSelectedQ(option)}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${selectedQ === option ? '#0032A0' : 'var(--border)'}`, background: selectedQ === option ? '#0032A0' : 'none', color: selectedQ === option ? '#fff' : 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {STAKEHOLDER_Q_LABEL[option]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '0 0 16px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {filteredStakeholders.length} stakeholder{filteredStakeholders.length !== 1 ? 's' : ''} en {STAKEHOLDER_Q_LABEL[selectedQ]}
        </div>
        <input
          className="fmi"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, área o capacidad"
          style={{ maxWidth: 320, width: '100%' }}
        />
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 130px 1.4fr 1fr', gap: 12, padding: '8px 16px', background: 'var(--light)', borderBottom: '1px solid var(--border)' }}>
          {['Stakeholder', 'Q', 'Capacidades', ''].map((header, index) => (
            <span key={index} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>{header}</span>
          ))}
        </div>

        {filteredStakeholders.length === 0 && (
          <div className="rev-empty">
            {searchTerm.trim() ? 'No hay stakeholders para la búsqueda actual.' : 'No hay stakeholders registrados todavía.'}
          </div>
        )}

        {filteredStakeholders.map(stakeholder => {
          const capacidadesList = stakeholder.capacidadKeys
            .map(capacidadKey => capacidadMap.get(capacidadKey)?.nombre ?? capacidadKey)
            .join(', ');
          return (
            <div key={stakeholder.id} style={{ borderBottom: '1px solid var(--border)', opacity: stakeholder.activo ? 1 : 0.56 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 130px 1.4fr 1fr', gap: 12, padding: '12px 16px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{stakeholder.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                    {stakeholder.area ?? 'Sin área'}
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: stakeholder.q === 'ALL' ? '#1D4ED8' : 'var(--text)' }}>
                  {STAKEHOLDER_Q_LABEL[stakeholder.q]}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.45 }}>
                  {capacidadesList || 'Sin capacidades'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => startEdit(stakeholder)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid #C7D7FE', background: '#EEF2FF', color: '#1D4ED8' }}>
                    Editar
                  </button>
                  <button onClick={() => handleToggleActivo(stakeholder)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: stakeholder.activo ? '#FEF3C7' : '#F0FDF4', color: stakeholder.activo ? '#92400E' : '#166534', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {stakeholder.activo ? 'Desactivar' : 'Publicar'}
                  </button>
                  <button onClick={() => handleDelete(stakeholder)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>
                    Eliminar
                  </button>
                  {savedId === stakeholder.id && <span style={{ fontSize: 12, color: '#059669' }}>✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isEditorOpen && (
        <div onClick={closeEditor} style={ADMIN_MODAL_OVERLAY_STYLE}>
          <div onClick={event => event.stopPropagation()} style={{ ...ADMIN_MODAL_PANEL_STYLE, width: 'min(760px, 100%)', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1D4ED8', fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>
                  Admin stakeholders
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F1C40' }}>{editingId ? 'Editar stakeholder' : 'Crear stakeholder'}</div>
              </div>
              <button type="button" onClick={closeEditor} style={{ border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 22, maxHeight: 'calc(90vh - 84px)', overflowY: 'auto' }}>
              {StakeholderFormFields({
                currentForm: form,
                setCurrentForm: setForm,
                onOk: handleSave,
                onCancel: closeEditor,
                okLabel: editingId ? 'Guardar cambios' : 'Guardar stakeholder',
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CapacitacionesSection
// ─────────────────────────────────────────────────────────────────────────────
type CapacitacionForm = {
  titulo: string;
  descripcion: string;
  fecha: string;
  emoji: string;
  url: string;
  confluenceUrl: string;
  activo: boolean;
};

function emptyCapacitacionForm(): CapacitacionForm {
  return { titulo: '', descripcion: '', fecha: '', emoji: '📘', url: '', confluenceUrl: '', activo: true };
}

function CapacitacionesSection({ data, onSaved, dialogs }: { data: AppData; onSaved: () => void; dialogs: AdminDialogHelpers }) {
  const [caps, setCaps] = useState<Capacitacion[]>(() => [...(data.capacitaciones ?? [])].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)));
  const equipoId = (data.config as any).equipoId ?? 'eq_planificacion';
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CapacitacionForm>(emptyCapacitacionForm());

  const inputStyle: React.CSSProperties = { padding: '7px 11px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };

  const persist = (next: Capacitacion[]) => setCaps([...next].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)));

  const persistOrdered = (next: Capacitacion[]) => {
    const ordered = next.map((c, i) => ({ ...c, orden: i + 1 }));
    persist(ordered);
    ordered.forEach(c => saveCapacitacion(c, equipoId));
    onSaved();
  };

  const openCreate = () => { setEditingId(null); setForm(emptyCapacitacionForm()); setIsEditorOpen(true); };

  const openEdit = (cap: Capacitacion) => {
    setEditingId(cap.id);
    setForm({
      titulo: cap.titulo,
      descripcion: cap.descripcion,
      fecha: cap.fecha ?? '',
      emoji: cap.emoji ?? '📘',
      url: cap.url ?? '',
      confluenceUrl: cap.confluenceUrl ?? '',
      activo: cap.activo,
    });
    setIsEditorOpen(true);
  };

  const closeEditor = () => { setEditingId(null); setForm(emptyCapacitacionForm()); setIsEditorOpen(false); };

  const handleSave = () => {
    if (!form.titulo.trim()) {
      dialogs.showError('El título es obligatorio.', 'Datos incompletos');
      return;
    }
    const current = editingId ? caps.find(c => c.id === editingId) : null;
    const next: Capacitacion = {
      id: editingId ?? `cap_${Date.now()}`,
      equipoId,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      fecha: form.fecha.trim() || undefined,
      emoji: form.emoji.trim() || '📘',
      url: form.url.trim() || undefined,
      confluenceUrl: form.confluenceUrl.trim() || undefined,
      activo: form.activo,
      orden: current?.orden ?? caps.length + 1,
    };
    const updated = editingId ? caps.map(c => c.id === editingId ? next : c) : [...caps, next];
    persist(updated);
    saveCapacitacion(next, equipoId);
    onSaved();
    closeEditor();
  };

  const handleDelete = (cap: Capacitacion) => {
    dialogs.showConfirm(`¿Eliminar la capacitación "${cap.titulo}"?`, () => {
      setCaps(prev => [...prev].filter(c => c.id !== cap.id));
      deleteCapacitacion(cap.id, equipoId);
      onSaved();
    }, { title: 'Eliminar capacitación', confirmLabel: 'Eliminar' });
  };

  const handleToggle = (cap: Capacitacion) => {
    const updated = { ...cap, activo: !cap.activo };
    persist(caps.map(c => c.id === cap.id ? updated : c));
    saveCapacitacion(updated, equipoId);
    onSaved();
  };

  const handleMove = (id: string, dir: 'up' | 'down') => {
    const sorted = [...caps].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
    const idx = sorted.findIndex(c => c.id === id);
    if (idx < 0) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= sorted.length) return;
    const reordered = [...sorted];
    const [item] = reordered.splice(idx, 1);
    reordered.splice(target, 0, item);
    persistOrdered(reordered);
  };

  const filtered = caps.filter(c => [c.titulo, c.descripcion, c.tipo ?? '', c.audiencia ?? '', c.url ?? ''].join(' ').toLowerCase().includes(searchTerm.trim().toLowerCase()));

  const EditorModal = () => {
    if (!isEditorOpen) return null;
    return (
      <div onClick={closeEditor} style={{ ...ADMIN_MODAL_OVERLAY_STYLE, padding: 20 }}>
        <div onClick={e => e.stopPropagation()} style={{ ...ADMIN_MODAL_PANEL_STYLE, width: 'min(680px, 100%)', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#059669', fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>Admin capacitaciones</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F1C40' }}>{editingId ? 'Editar capacitación' : 'Nueva capacitación'}</div>
            </div>
            <button type="button" onClick={closeEditor} style={{ border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="flbl">Título <span style={{ color: '#DC2626' }}>*</span></div>
              <input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} style={inputStyle} placeholder="Ej: Introducción a Blue Planner" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="flbl">Descripción</div>
              <textarea rows={3} value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Resumen breve de la capacitación" />
            </div>
            <div>
              <div className="flbl">Fecha</div>
              <input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <div className="flbl">Emoji</div>
              <input value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} style={inputStyle} placeholder="📘" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="flbl">URL Presentación / Recurso <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></div>
              <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} style={inputStyle} placeholder="https://docs.google.com/presentation/..." />
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Google Slides se mostrará embebida; cualquier otra URL abrirá en nueva pestaña.</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="flbl">URL Confluence <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></div>
              <input value={form.confluenceUrl} onChange={e => setForm(p => ({ ...p, confluenceUrl: e.target.value }))} style={inputStyle} placeholder="https://confluence.blue.cl/display/..." />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="cap-activo" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} />
              <label htmlFor="cap-activo" style={{ fontSize: 13, color: '#374151' }}>Visible para los usuarios</label>
            </div>
          </div>
          {editingId && (() => {
            const cap = caps.find(c => c.id === editingId);
            return cap ? <div style={{ padding: '0 22px 12px' }}><AuditMeta createdAt={cap.createdAt} updatedAt={cap.updatedAt} createdBy={cap.createdBy} updatedBy={cap.updatedBy} /></div> : null;
          })()}
          <div style={{ padding: '0 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={closeEditor} style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border)', background: '#F8FAFC', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
            <button type="button" onClick={handleSave} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Guardar</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EditorModal />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#059669', fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>Configuración</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0F1C40' }}>🎓 Capacitaciones</div>
        </div>
        <button type="button" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+ Nueva</button>
      </div>

      <input
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Buscar capacitación..."
        style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13, outline: 'none', background: '#F8FAFC' }}
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', border: '1px dashed var(--border)', borderRadius: 14, color: 'var(--muted)', fontSize: 13 }}>
          {searchTerm ? 'Sin resultados para esa búsqueda.' : 'Aún no hay capacitaciones. Crea la primera con + Nueva.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((cap, idx) => (
            <div key={cap.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, opacity: cap.activo ? 1 : 0.6 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{cap.emoji || '📘'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1C40', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cap.titulo}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: '0 10px' }}>
                  {cap.fecha && <span>{cap.fecha}</span>}
                  {cap.createdAt && <span style={{ fontSize: 11, color: '#94a3b8' }}>Creado: {fmtAudit(cap.createdAt)}{cap.createdBy ? ` · ${cap.createdBy}` : ''}</span>}
                  {cap.updatedAt && cap.updatedAt !== cap.createdAt && <span style={{ fontSize: 11, color: '#94a3b8' }}>Modificado: {fmtAudit(cap.updatedAt)}</span>}
                </div>
              </div>
              {cap.url && <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: '#ECFDF5', borderRadius: 6, padding: '2px 7px', border: '1px solid #A7F3D0', flexShrink: 0 }}>URL ✓</span>}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" onClick={() => handleMove(cap.id, 'up')} disabled={idx === 0} title="Subir" style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.4 : 1, fontSize: 12 }}>↑</button>
                  <button type="button" onClick={() => handleMove(cap.id, 'down')} disabled={idx === filtered.length - 1} title="Bajar" style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: idx === filtered.length - 1 ? 'default' : 'pointer', opacity: idx === filtered.length - 1 ? 0.4 : 1, fontSize: 12 }}>↓</button>
                  <button type="button" onClick={() => openEdit(cap)} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #C7D7FE', background: '#EEF2FF', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#1D4ED8' }}>Editar</button>
                  <button type="button" onClick={() => handleToggle(cap)} title={cap.activo ? 'Desactivar' : 'Publicar'} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #E2E8F0', background: cap.activo ? '#FEF3C7' : '#F0FDF4', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: cap.activo ? '#92400E' : '#166534' }}>{cap.activo ? 'Desactivar' : 'Publicar'}</button>
                  <button type="button" onClick={() => handleDelete(cap)} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#DC2626' }}>Eliminar</button>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BusinessFlowsSection({ data, onSaved, dialogs }: { data: AppData; onSaved: () => void; dialogs: AdminDialogHelpers }) {
  const [flows, setFlows] = useState<BusinessFlow[]>(() => [...(data.businessFlows ?? [])].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)));
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const equipoId = (data.config as any).equipoId ?? 'eq_planificacion';
  const [form, setForm] = useState<BusinessFlowForm>(emptyBusinessFlowForm());

  const inputStyle: React.CSSProperties = { padding: '7px 11px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };

  const persist = (nextFlows: BusinessFlow[]) => {
    setFlows([...nextFlows].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)));
  };

  const persistOrdered = (nextFlows: BusinessFlow[]) => {
    const ordered = nextFlows.map((flow, index) => ({ ...flow, orden: index + 1 }));
    persist(ordered);
    ordered.forEach(f => saveBusinessFlow(f, equipoId));
    onSaved();
  };

  const resetForm = () => setForm(emptyBusinessFlowForm());

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setIsEditorOpen(true);
  };

  const openEdit = (flow: BusinessFlow) => {
    setEditingId(flow.id);
    setForm({
      titulo: flow.titulo,
      descripcionTarjeta: flow.descripcionTarjeta,
      confluenceUrl: flow.confluenceUrl ?? '',
      presentacionUrl: flow.presentacionUrl ?? '',
      capacidadKey: flow.capacidadKey ?? '',
      activo: flow.activo,
    });
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setEditingId(null);
    resetForm();
    setIsEditorOpen(false);
  };

  const validateForm = () => {
    if (!form.titulo.trim() || !form.descripcionTarjeta.trim()) {
      dialogs.showError('Completa al menos título y descripción de la tarjeta.', 'Datos incompletos');
      return false;
    }



    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const current = editingId ? flows.find(flow => flow.id === editingId) : null;
    const nextFlow: BusinessFlow = {
      id: editingId ?? `bf_${Date.now()}`,
      titulo: form.titulo.trim(),
      descripcionTarjeta: form.descripcionTarjeta.trim(),
      contenido: '',
      confluenceUrl: form.confluenceUrl.trim() || undefined,
      presentacionUrl: form.presentacionUrl.trim() || undefined,
      capacidadKey: form.capacidadKey.trim() || undefined,
      activo: form.activo,
      orden: current?.orden ?? flows.length + 1,
      icono: current?.icono ?? '🧭',
      color: current?.color ?? '#1B30CC',
    };

    const updated = editingId
      ? flows.map(flow => flow.id === editingId ? nextFlow : flow)
      : [...flows, nextFlow];

    persist(updated);
    saveBusinessFlow(nextFlow, equipoId);
    onSaved();
    closeEditor();
  };

  const handleDelete = (flow: BusinessFlow) => {
    dialogs.showConfirm(`¿Eliminar el flujo "${flow.titulo}"?`, () => {
      setFlows(prev => {
        const updated = prev.filter(item => item.id !== flow.id);
        return [...updated].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
      });
      deleteBusinessFlow(flow.id, equipoId);
      onSaved();
    }, { title: 'Eliminar flujo', confirmLabel: 'Eliminar' });
  };

  const handleToggleActivo = (flow: BusinessFlow) => {
    const updatedFlow = { ...flow, activo: !flow.activo };
    persist(flows.map(item => item.id === flow.id ? updatedFlow : item));
    saveBusinessFlow(updatedFlow, equipoId);
    onSaved();
  };

  const handleMove = (flowId: string, direction: 'up' | 'down') => {
    const orderedFlows = [...flows].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
    const currentIndex = orderedFlows.findIndex(flow => flow.id === flowId);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedFlows.length) return;

    const reordered = [...orderedFlows];
    const [currentFlow] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, currentFlow);
    persistOrdered(reordered);
  };

  const filteredFlows = flows.filter(flow => [flow.titulo, flow.descripcionTarjeta, flow.confluenceUrl ?? '', flow.presentacionUrl ?? ''].join(' ').toLowerCase().includes(searchTerm.trim().toLowerCase()));

  const EditorModal = () => {
    if (!isEditorOpen) return null;

    return (
      <div onClick={closeEditor} style={{ ...ADMIN_MODAL_OVERLAY_STYLE, padding: 20 }}>
        <div onClick={(event) => event.stopPropagation()} style={{ ...ADMIN_MODAL_PANEL_STYLE, width: 'min(760px, 100%)', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1D4ED8', fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>
                Admin flujos de negocio
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F1C40' }}>{editingId ? 'Editar flujo' : 'Crear flujo'}</div>
            </div>
            <button type="button" onClick={closeEditor} style={{ border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: 22, display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            <div>
              <div className="flbl">Título de la tarjeta <span style={{ color: '#DC2626' }}>*</span></div>
              <input value={form.titulo} onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))} style={inputStyle} placeholder="Ej: Modelo Geográfico" />
            </div>
            <div>
              <div className="flbl">Descripción de la tarjeta <span style={{ color: '#DC2626' }}>*</span></div>
              <textarea rows={3} value={form.descripcionTarjeta} onChange={e => setForm(prev => ({ ...prev, descripcionTarjeta: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Resumen breve que se ve en la tarjeta" />
            </div>
            <div>
              <div className="flbl">URL Confluence <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></div>
              <input value={form.confluenceUrl} onChange={e => setForm(prev => ({ ...prev, confluenceUrl: e.target.value }))} style={inputStyle} placeholder="https://..." />
            </div>
            <div>
              <div className="flbl">URL Presentación / Slides <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional — se embebe en modal)</span></div>
              <input value={form.presentacionUrl} onChange={e => setForm(prev => ({ ...prev, presentacionUrl: e.target.value }))} style={inputStyle} placeholder="https://docs.google.com/presentation/..." />
            </div>
            <div>
              <div className="flbl">Capacidad relacionada <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></div>
              <select value={form.capacidadKey} onChange={e => setForm(prev => ({ ...prev, capacidadKey: e.target.value }))} style={{ ...inputStyle, background: '#fff' }}>
                <option value="">— Sin capacidad asignada —</option>
                {(data.capacidades ?? []).map(cap => (
                  <option key={cap.key} value={cap.key}>{cap.nombre} ({cap.label})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.activo} onChange={e => setForm(prev => ({ ...prev, activo: e.target.checked }))} />
                Mostrar flujo en la vista pública
              </label>
            </div>
          </div>

          {editingId && (() => { const bf = flows.find(f => f.id === editingId); return bf ? <div style={{ padding: '0 22px 10px' }}><AuditMeta createdAt={bf.createdAt} updatedAt={bf.updatedAt} createdBy={bf.createdBy} updatedBy={bf.updatedBy} /></div> : null; })()}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 22px 22px' }}>
            <button type="button" onClick={closeEditor} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Cancelar</button>
            <button type="button" className="btn-save" onClick={handleSave}>{editingId ? 'Guardar cambios' : 'Guardar flujo'}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Flujos de negocio</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        Administra las tarjetas públicas de flujos de negocio. Puedes dejar una URL de Confluence, contenido propio o ambas opciones.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por título o contenido" style={{ ...inputStyle, width: 320, background: '#fff' }} />
        <button className="f-add-btn" onClick={openCreate}>+ Crear flujo</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1080, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFF' }}>
                {['Estado', 'Título', 'Descripción tarjeta', 'Confluence', 'Presentación', 'Acciones'].map(header => (
                  <th key={header} style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFlows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '26px 14px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                    {searchTerm.trim() ? 'No hay flujos para la búsqueda actual.' : 'No hay flujos de negocio configurados.'}
                  </td>
                </tr>
              )}
              {filteredFlows.map(flow => {
                const isActive = flow.activo;
                const orderedFlows = [...flows].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
                const flowPosition = orderedFlows.findIndex(item => item.id === flow.id);
                const canMoveUp = flowPosition > 0;
                const canMoveDown = flowPosition >= 0 && flowPosition < orderedFlows.length - 1;
                return (
                  <tr key={flow.id} style={{ background: isActive ? '#fff' : '#FCFCFD' }}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: isActive ? '#DCFCE7' : '#E2E8F0', color: isActive ? '#166534' : '#475569', fontSize: 11, fontWeight: 700 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#22C55E' : '#94A3B8', display: 'inline-block' }} />
                        {isActive ? 'Visible' : 'Oculto'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7', fontSize: 12, fontWeight: 700, color: '#0F1C40', minWidth: 180 }}>{flow.titulo}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7', fontSize: 12, color: '#475569', minWidth: 280, lineHeight: 1.5 }}>{flow.descripcionTarjeta}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7', fontSize: 12, color: '#334155', minWidth: 180 }}>
                      {flow.confluenceUrl ? <a href={flow.confluenceUrl} target="_blank" rel="noreferrer">Abrir enlace</a> : 'Sin URL'}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7', fontSize: 12, color: '#334155', minWidth: 180 }}>
                      {flow.presentacionUrl ? <a href={flow.presentacionUrl} target="_blank" rel="noreferrer">Abrir enlace</a> : 'Sin URL'}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button type="button" onClick={() => handleMove(flow.id, 'up')} disabled={!canMoveUp} title="Subir" style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: canMoveUp ? 'pointer' : 'default', opacity: canMoveUp ? 1 : 0.4, fontSize: 12 }}>↑</button>
                        <button type="button" onClick={() => handleMove(flow.id, 'down')} disabled={!canMoveDown} title="Bajar" style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: canMoveDown ? 'pointer' : 'default', opacity: canMoveDown ? 1 : 0.4, fontSize: 12 }}>↓</button>
                        <button type="button" onClick={() => openEdit(flow)} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #C7D7FE', background: '#EEF2FF', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#1D4ED8' }}>Editar</button>
                        <button type="button" onClick={() => handleToggleActivo(flow)} title={flow.activo ? 'Desactivar' : 'Publicar'} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #E2E8F0', background: flow.activo ? '#FEF3C7' : '#F0FDF4', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: flow.activo ? '#92400E' : '#166534' }}>{flow.activo ? 'Desactivar' : 'Publicar'}</button>
                        <button type="button" onClick={() => handleDelete(flow)} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#DC2626' }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {EditorModal()}
    </div>
  );
}


export function ReviewsSection({ data, onSaved, dialogs }: { data: AppData; onSaved: () => void; dialogs: AdminDialogHelpers }) {
  const [reviews, setReviews] = useState<Review[]>(() => sortReviews(getReviews()));
  const [screen, setScreen] = useState<'list' | 'editor'>('list');
  const [editorMode, setEditorMode] = useState<'mockup' | 'classic'>('mockup');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review>(() => createEmptyReview(data.config.q_activo ?? 'Q2'));
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const equipoId = (data.config as any).equipoId ?? 'eq_planificacion';
  const workspaceRef = useRef<ReviewWorkspaceHandle>(null);
  const [isDirty, setIsDirty] = useState(false);

  const resetForm = () => {
    setEditingReview(createEmptyReview(data.config.q_activo ?? 'Q2'));
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setEditorMode('mockup');
    setScreen('editor');
  };

  const openEdit = (review: Review) => {
    setEditingId(review.id);
    setEditingReview(review);
    setEditorMode('mockup');
    setScreen('editor');
  };

  const closeEditor = () => {
    setScreen('list');
    setEditorMode('mockup');
    resetForm();
    setIsDirty(false);
  };

  const handleCloseEditor = () => {
    if (isDirty) {
      dialogs.showConfirm('Tienes cambios sin guardar. ¿Cerrar el editor de todas formas?', closeEditor, { confirmLabel: 'Cerrar sin guardar', cancelLabel: 'Seguir editando' });
    } else {
      closeEditor();
    }
  };

  const handleSave = (review: Review) => {
    if (!review.sprint?.trim() || !review.fecha || !review.q?.trim()) {
      dialogs.showError('Completa sprint, fecha y quarter antes de guardar la review.', 'Datos incompletos');
      return;
    }

    const embedUrl = sanitizeExternalUrl(review.embedUrl);
    const jiraPanelUrl = sanitizeExternalUrl(review.jiraPanelUrl);

    if (review.fuente === 'embebida' && !embedUrl) {
      dialogs.showError('Si la review usa contenido embebido, debes ingresar una URL pública válida.', 'Falta URL embebida');
      return;
    }

    if (review.fuente === 'embebida' && !isValidExternalUrl(embedUrl)) {
      dialogs.showError('La URL embebida debe comenzar con http o https.', 'URL embebida inválida');
      return;
    }

    if (jiraPanelUrl && !isValidExternalUrl(jiraPanelUrl)) {
      dialogs.showError('El enlace de Jira o panel debe comenzar con http o https.', 'URL de panel inválida');
      return;
    }

    const embedConfig = resolveReviewEmbed(embedUrl);

    if (review.fuente === 'embebida' && embedConfig.provider === 'atlassian') {
      dialogs.showError('Una URL de Jira o Atlassian no debe usarse como fuente embebida principal. Guárdala en el campo de panel Jira y usa otra URL pública para la presentación.', 'Jira no es embebible');
      return;
    }

    const nextReview: Review = {
      ...review,
      titulo: `Review SP${review.sprint.trim()}`,
      estado: review.estado ?? 'borrador',
      activo: review.activo ?? true,
      fuente: review.fuente ?? 'interna',
      embedUrl: embedConfig.rawUrl,
      jiraPanelUrl,
    };

    saveReview(nextReview, equipoId);
    const updated = editingId
      ? reviews.map(review => review.id === editingId ? nextReview : review)
      : [...reviews, nextReview];
    setReviews(sortReviews(updated));
    onSaved();
    closeEditor();
  };

  const handleDelete = (review: Review) => {
    dialogs.showConfirm(`¿Eliminar la review "${getReviewDisplayName(review)}"?`, () => {
      deleteReview(review.id, equipoId);
      setReviews(prev => prev.filter(item => item.id !== review.id));
      setSelectedReviewId(current => current === review.id ? null : current);
      onSaved();
    }, { title: 'Eliminar review', confirmLabel: 'Eliminar' });
  };

  const handleToggleActivo = (review: Review) => {
    const updatedReview: Review = { ...review, activo: !(review.activo !== false) };
    saveReview(updatedReview, equipoId);
    setReviews(prev => sortReviews(prev.map(item => item.id === review.id ? updatedReview : item)));
    onSaved();
  };

  const handleDuplicate = (review: Review) => {
    const duplicatedReview: Review = {
      ...review,
      id: `rev_${Date.now()}`,
      titulo: `${getReviewDisplayName(review)} (copia)`,
      estado: 'borrador',
      activo: false,
      fuente: review.fuente ?? 'interna',
      embedUrl: review.embedUrl ?? '',
      jiraPanelUrl: review.jiraPanelUrl ?? '',
      contenido: { items: [...review.contenido.items] },
      secciones: review.secciones?.map(section => ({
        ...section,
        items: section.items?.map(item => ({ ...item })),
      })),
      indicadores: review.indicadores.map(item => ({ ...item })),
      resultados: review.resultados.map(item => ({ ...item })),
      demo: [...review.demo],
      demoItems: review.demoItems?.map(item => ({ ...item })),
      riesgos: review.riesgos.map(item => ({ ...item })),
    };

    saveReview(duplicatedReview, equipoId);
    setReviews(prev => sortReviews([...prev, duplicatedReview]));
    setSelectedReviewId(duplicatedReview.id);
    onSaved();
  };

  const [previewReview, setPreviewReview] = useState<Review | null>(null);
  const selectedReview = selectedReviewId ? reviews.find(review => review.id === selectedReviewId) ?? null : null;

  if (screen === 'editor') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10, padding: '10px 14px', background: '#F8FAFF', border: '1px solid #DCE7FF', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F1C40', whiteSpace: 'nowrap' }}>{editingId ? 'Editor de review' : 'Nueva review'}</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, background: '#E0E7FF', color: '#3730A3', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{editingReview.q || data.config.q_activo || 'Q2'}</span>
            <span style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{editingReview.sprint?.trim() ? getReviewDisplayName(editingReview) : 'Sin sprint definido'}</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={() => setEditorMode('mockup')} style={{ padding: '4px 9px', borderRadius: 7, border: `1px solid ${editorMode === 'mockup' ? '#BFDBFE' : '#CBD5E1'}`, background: editorMode === 'mockup' ? '#EFF6FF' : '#fff', color: editorMode === 'mockup' ? '#1D4ED8' : '#64748B', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Guiado</button>
            <button type="button" onClick={() => setEditorMode('classic')} style={{ padding: '4px 9px', borderRadius: 7, border: `1px solid ${editorMode === 'classic' ? '#BFDBFE' : '#CBD5E1'}`, background: editorMode === 'classic' ? '#EFF6FF' : '#fff', color: editorMode === 'classic' ? '#1D4ED8' : '#64748B', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Clásico</button>
            <div style={{ width: 1, height: 20, background: '#CBD5E1', margin: '0 2px' }} />
            <button type="button" onClick={() => workspaceRef.current?.reset()} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Limpiar</button>
            <button type="button" onClick={() => workspaceRef.current?.save()} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid #0032A0', background: '#0032A0', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Guardar</button>
            <button type="button" onClick={() => editorMode === 'mockup' ? workspaceRef.current?.preview() : setPreviewReview(editingReview)} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Previsualizar</button>
            <button type="button" onClick={handleCloseEditor} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Cerrar</button>
          </div>
        </div>

        {editorMode === 'mockup' ? (
          <div style={{ background: '#fff', border: '1px solid #DCE7FF', borderRadius: 24, boxShadow: '0 20px 48px rgba(15,23,42,0.10)', padding: 24, marginBottom: 18 }}>
            <ReviewMockupWorkspace
              ref={workspaceRef}
              initialReview={editingReview}
              onSave={handleSave}
              onCancel={closeEditor}
              onPresent={setPreviewReview}
              onDirtyChange={setIsDirty}
              saveLabel={editingId ? 'Guardar cambios' : 'Guardar review'}
            />
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #DCE7FF', borderRadius: 24, boxShadow: '0 20px 48px rgba(15,23,42,0.10)', padding: 24, marginBottom: 18 }}>
            <ReviewEditor
              key={`${editingId ?? 'new'}-${editingReview.id}`}
              initialReview={editingReview}
              onSave={handleSave}
              onCancel={closeEditor}
              onPresent={setPreviewReview}
              saveLabel={editingId ? 'Guardar cambios' : 'Guardar review'}
            />
          </div>
        )}

        {previewReview && <ReviewPresentation review={previewReview} data={data} onClose={() => setPreviewReview(null)} />}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Preparar Reviews</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        Administra la base de reviews visibles en el módulo público. El armado completo se abre en una vista dedicada para trabajar el contenido sin mezclarlo con la grilla principal.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''} configurada{reviews.length !== 1 ? 's' : ''}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="f-add-btn" onClick={openCreate}>+ Crear review</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap', padding: '14px 16px', background: '#fff', border: '1px solid var(--border)', borderRadius: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {selectedReview ? `Seleccionada: ${getReviewDisplayName(selectedReview)}` : 'Selecciona una review para ejecutar acciones'}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => selectedReview && openEdit(selectedReview)} className="btn-admin-alt" style={{ padding: '7px 10px', fontSize: 12, opacity: selectedReview ? 1 : 0.5, cursor: selectedReview ? 'pointer' : 'not-allowed' }} disabled={!selectedReview}>Editar</button>
          <button onClick={() => selectedReview && setPreviewReview(selectedReview)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 700, cursor: selectedReview ? 'pointer' : 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: selectedReview ? 1 : 0.5 }} disabled={!selectedReview}>Presentar</button>
          <button onClick={() => selectedReview && handleDuplicate(selectedReview)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 700, cursor: selectedReview ? 'pointer' : 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: selectedReview ? 1 : 0.5 }} disabled={!selectedReview}>Duplicar</button>
          <button onClick={() => selectedReview && handleToggleActivo(selectedReview)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: selectedReview?.activo !== false ? '#FFF7ED' : '#ECFDF5', color: selectedReview?.activo !== false ? '#C2410C' : '#047857', fontSize: 12, fontWeight: 700, cursor: selectedReview ? 'pointer' : 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: selectedReview ? 1 : 0.5 }} disabled={!selectedReview}>
            {selectedReview?.activo !== false ? 'Desactivar' : 'Activar'}
          </button>
          <button onClick={() => selectedReview && handleDelete(selectedReview)} style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: selectedReview ? 'pointer' : 'not-allowed', fontFamily: 'Manrope, sans-serif', opacity: selectedReview ? 1 : 0.5 }} disabled={!selectedReview}>Eliminar</button>
          {selectedReview?.embedUrl && (
            <a href={selectedReview.embedUrl} target="_blank" rel="noreferrer" style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>↗ Abrir URL</a>
          )}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFF' }}>
                {['', 'Fecha', 'Visibilidad', 'Título', 'Q', 'URL'].map(header => (
                  <th key={header} style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '26px 18px', textAlign: 'center', color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
                    Aún no hay reviews configuradas.
                  </td>
                </tr>
              )}
              {reviews.map(review => {
                const isActive = review.activo !== false;
                const isSelected = selectedReviewId === review.id;
                return (
                  <tr key={review.id} onClick={() => setSelectedReviewId(review.id)} style={{ background: isSelected ? '#EFF6FF' : isActive ? '#fff' : '#FCFCFD', cursor: 'pointer' }}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7', width: 44 }}>
                      <input type="radio" name="selected-review" checked={isSelected} onChange={() => setSelectedReviewId(review.id)} onClick={event => event.stopPropagation()} />
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7', fontSize: 12, color: '#334155', whiteSpace: 'nowrap' }}>{review.fecha}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: isActive ? '#DCFCE7' : '#E2E8F0', color: isActive ? '#166534' : '#475569', fontSize: 11, fontWeight: 700 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#22C55E' : '#94A3B8', display: 'inline-block' }} />
                        {isActive ? 'Visible' : 'Oculto'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7', fontSize: 12, fontWeight: 700, color: '#0F1C40', width: '24%', maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getReviewDisplayName(review)}>
                        {getReviewDisplayName(review)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7', fontSize: 12, color: '#334155', whiteSpace: 'nowrap' }}>{review.q}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #EEF2F7' }} onClick={e => e.stopPropagation()}>
                      {review.embedUrl ? (
                        <a href={review.embedUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }} title={review.embedUrl}>↗ Abrir</a>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {previewReview && <ReviewPresentation review={previewReview} data={data} onClose={() => setPreviewReview(null)} />}
    </div>
  );
}

// (Legacy EntregablesSection removido, ahora se usa el nuevo componente avanzado)

// ── Panel: sin equipo seleccionado ───────────────────────────────────────────
function NoEquipoPanel() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 16, background: '#FAFAFA' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>Sin equipo seleccionado</div>
      <div style={{ fontSize: 13, maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
        Esta sección pertenece a la configuración de un equipo. Regresa a la pantalla de Portafolios y selecciona un equipo para acceder a ella.
      </div>
    </div>
  );
}

// ── Admin principal ───────────────────────────────────────────────────────────

// ── ExportarColecciones ──────────────────────────────────────────────────────
function triggerDownload(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function gasCall<T = any>(fnName: string, ...args: any[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = (window as any)?.google?.script?.run;
    if (!run) { reject(new Error('google.script.run no disponible')); return; }
    run
      .withSuccessHandler(resolve)
      .withFailureHandler((err: any) => reject(new Error(err?.message ?? 'Error GAS')))
      [fnName](...args);
  });
}

type ExportCard = {
  id: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
};

const EXPORT_CARDS: ExportCard[] = [
  { id: 'portafolios', label: 'Portafolios',  desc: 'Colección portafolios con sus subequipos', icon: '🗂️', color: '#0033A0' },
  { id: 'usuarios',   label: 'Usuarios',      desc: 'Colección usuarios (roles y accesos)',      icon: '👥', color: '#0F766E' },
  { id: 'equipo',     label: 'Por equipo',    desc: 'Todas las subcolecciones de un equipo',     icon: '📦', color: '#7C3AED' },
  { id: 'todo',       label: 'Exportar todo', desc: 'Todos los portafolios con sus equipos y subcolecciones', icon: '💾', color: '#92400E' },
];

function ExportarColecciones({ isGAS, portafolios: portafoliosProp = [] }: { isGAS: boolean; portafolios?: { id: string; nombre: string }[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg]         = useState<{ id: string; ok: boolean; text: string } | null>(null);
  const [equipoSel, setEquipoSel] = useState<string>('');
  const [portSel, setPortSel]     = useState<string>('');

  // Cargar equipos y portafolios desde GAS al montar
  const [equipos, setEquipos]         = useState<{ id: string; nombre: string }[]>([]);
  const [portafolios, setPortafolios] = useState<{ id: string; nombre: string }[]>(portafoliosProp);

  useEffect(() => {
    if (!isGAS) return;
    gasCall<any[]>('obtenerPortafolios')
      .then(lista => {
        const arr = Array.isArray(lista) ? lista : [];
        setPortafolios(arr.map((p: any) => ({ id: p.id, nombre: p.nombre ?? p.id })));
        const eqs: { id: string; nombre: string }[] = [];
        arr.forEach((p: any) => {
          (p.equipos || []).forEach((eq: any) => {
            eqs.push({ id: eq.id, nombre: eq.nombre ?? eq.id });
          });
        });
        setEquipos(eqs);
      })
      .catch(() => {});
  }, [isGAS]);

  const today = new Date().toISOString().slice(0, 10);

  const handle = async (cardId: string) => {
    if (!isGAS) { setMsg({ id: cardId, ok: false, text: '⚠️ Solo disponible en GAS' }); return; }
    setLoading(cardId);
    setMsg(null);
    try {
      if (cardId === 'portafolios') {
        const res = await gasCall<any[]>('obtenerPortafolios');
        const lista = Array.isArray(res) ? res : [];
        triggerDownload(lista, `bx-portafolios-${today}.json`);
        setMsg({ id: cardId, ok: true, text: `✅ ${lista.length} portafolios descargados` });
      } else if (cardId === 'usuarios') {
        const res = await gasCall<string>('obtenerUsuarios');
        const parsed = typeof res === 'string' ? JSON.parse(res) : res;
        if (!parsed.ok) throw new Error(parsed.error);
        triggerDownload(parsed.usuarios, `bx-usuarios-${today}.json`);
        setMsg({ id: cardId, ok: true, text: `✅ ${parsed.usuarios.length} usuarios descargados` });
      } else if (cardId === 'equipo') {
        if (!equipoSel) { setMsg({ id: cardId, ok: false, text: '⚠️ Selecciona un equipo' }); setLoading(null); return; }
        const res = await gasCall<string>('obtenerDatosEquipo', equipoSel);
        const parsed = typeof res === 'string' ? JSON.parse(res) : res;
        if (!parsed.ok) throw new Error(parsed.error);
        triggerDownload(parsed, `bx-equipo-${equipoSel}-${today}.json`);
        setMsg({ id: cardId, ok: true, text: `✅ Datos de ${equipoSel} descargados` });
      } else if (cardId === 'todo') {
        const res = await gasCall<string>('exportarDatos', portSel || null);
        const parsed = typeof res === 'string' ? JSON.parse(res) : res;
        if (!parsed.ok) throw new Error(parsed.error);
        const portNombre = portSel ? (portafolios.find(p => p.id === portSel)?.nombre ?? portSel) : 'todos';
        triggerDownload(parsed, `bx-export-${portNombre}-${today}.json`);
        setMsg({ id: cardId, ok: true, text: `✅ Export completo descargado` });
      }
    } catch (e) {
      setMsg({ id: cardId, ok: false, text: `❌ ${(e as Error).message}` });
    }
    setLoading(null);
  };

  return (
    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 24, marginTop: 4 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F1C40', marginBottom: 4 }}>📥 Exportar colecciones</div>
      <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
        Descarga colecciones individuales de Firestore como JSON. Útil para respaldo o migración.
      </p>
      {!isGAS && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#9A3412', fontWeight: 700, marginBottom: 16 }}>
          ⚠️ Solo disponible en producción (GAS). En local no hay conexión a Firestore.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {EXPORT_CARDS.map(card => (
          <div key={card.id} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{card.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F1C40' }}>{card.label}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{card.desc}</div>
              </div>
            </div>

            {/* Selector equipo */}
            {card.id === 'equipo' && (
              <select
                value={equipoSel}
                onChange={e => setEquipoSel(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #CBD5E1', fontSize: 12, color: '#0F1C40', background: '#F8FAFF' }}
              >
                <option value="">— Selecciona equipo —</option>
                {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
              </select>
            )}

            {/* Selector portafolio (export todo) */}
            {card.id === 'todo' && (
              <select
                value={portSel}
                onChange={e => setPortSel(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #CBD5E1', fontSize: 12, color: '#0F1C40', background: '#F8FAFF' }}
              >
                <option value="">Todos los portafolios</option>
                {portafolios.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            )}

            <button
              onClick={() => handle(card.id)}
              disabled={loading === card.id || !isGAS}
              style={{ padding: '9px 14px', borderRadius: 9, border: 'none', background: card.color, color: '#fff', fontSize: 12, fontWeight: 800, cursor: loading === card.id || !isGAS ? 'not-allowed' : 'pointer', opacity: loading === card.id || !isGAS ? 0.6 : 1, fontFamily: 'Manrope, sans-serif' }}
            >
              {loading === card.id ? '⏳ Descargando...' : '⬇ Descargar JSON'}
            </button>

            {msg?.id === card.id && (
              <div style={{ fontSize: 11, fontWeight: 700, color: msg.ok ? '#065F46' : '#DC2626', background: msg.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: 7, padding: '8px 10px' }}>
                {msg.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ExportarPage — sección standalone del sidebar ────────────────────────────
function ExportarPage() {
  const isGAS = typeof window !== 'undefined' && !!(window as any)?.google?.script;
  return (
    <div style={{ maxWidth: 780 }}>
      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0891B2', marginBottom: 4 }}>
        Administración
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0F1C40', marginBottom: 4 }}>Exportar colecciones</div>
      <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 0 }}>
        Descarga colecciones de Firestore como archivos JSON. Útil para respaldo o migración de datos.
      </p>
      <ExportarColecciones isGAS={isGAS} />
    </div>
  );
}

// ── SeedSection ──────────────────────────────────────────────────────────────
function SeedSection() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Descarga JSON
  const [portafolios, setPortafolios] = useState<{ id: string; nombre: string }[]>([]);

  const isGAS = typeof window !== 'undefined' && !!(window as any)?.google?.script;

  // Cargar lista de portafolios al montar (solo en GAS)
  useEffect(() => {
    if (!isGAS) return;
    const run = (window as any)?.google?.script?.run;
    if (!run) return;
    run
      .withSuccessHandler((res: any) => {
        try {
          const list = Array.isArray(res) ? res : JSON.parse(res);
          setPortafolios(list.map((p: any) => ({ id: p.id, nombre: p.nombre ?? p.id })));
        } catch { /* ignorar */ }
      })
      .withFailureHandler(() => { /* ignorar */ })
      .obtenerPortafolios();
  }, [isGAS]);

  const handleSeed = () => {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    setMsg(null);
    const run = (window as any)?.google?.script?.run;
    if (!run) {
      setMsg({ ok: false, text: '❌ google.script.run no disponible (ejecutar en GAS)' });
      setLoading(false);
      setConfirmed(false);
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
        setMsg(r.ok
          ? { ok: true, text: `✅ Datos cargados correctamente (equipo: ${r.equipoId}). Recarga la página para ver los cambios.` }
          : { ok: false, text: `❌ Error: ${r.error}` });
        setLoading(false);
        setConfirmed(false);
      })
      .withFailureHandler((err: any) => {
        setMsg({ ok: false, text: `❌ ${err?.message ?? 'Error desconocido'}` });
        setLoading(false);
        setConfirmed(false);
      })
      .seedCompleto(payload);
  };

  const collections = [
    'portafolios + equipos', 'usuarios', 'config', 'equipo/miembros',
    'capacidades', 'aplicaciones', 'bets', 'mos',
    'iniciativas', 'entregables', 'stakeholders', 'businessFlows', 'reviews',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
      <div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B45309', marginBottom: 4 }}>
          Super Admin — Carga inicial
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0F1C40' }}>Datos de ejemplo · Planificación del Transporte</div>
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65, marginTop: 8 }}>
          Inserta todos los datos de ejemplo del equipo <strong>eq_planificacion</strong> directamente en Firestore.
          Usar <strong>solo una vez</strong> en un entorno vacío. Si ya hay datos en Firestore, este proceso los sobreescribirá.
        </p>
      </div>

      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 10 }}>📦 Colecciones que se cargarán:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {collections.map(c => (
            <span key={c} style={{ fontSize: 11, fontWeight: 700, background: '#FEF3C7', color: '#78350F', borderRadius: 6, padding: '3px 9px', border: '1px solid #FDE68A' }}>{c}</span>
          ))}
        </div>
      </div>

      {!isGAS && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#9A3412', fontWeight: 600 }}>
          ⚠️ Solo disponible en el entorno GAS (Google Apps Script). Esta función no tiene efecto en local.
        </div>
      )}

      {msg && (
        <div style={{ background: msg.ok ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${msg.ok ? '#A7F3D0' : '#FECACA'}`, borderRadius: 12, padding: '14px 18px', fontSize: 13, fontWeight: 700, color: msg.ok ? '#065F46' : '#DC2626', lineHeight: 1.6 }}>
          {msg.text}
        </div>
      )}

      {confirmed && !loading && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#DC2626', fontWeight: 700 }}>
          ⚠️ ¿Confirmas? Esta acción sobreescribirá los datos existentes en Firestore. Haz clic de nuevo en el botón para continuar.
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={handleSeed}
          disabled={loading || !isGAS}
          style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: confirmed ? '#DC2626' : '#0033A0', color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading || !isGAS ? 'not-allowed' : 'pointer', opacity: loading || !isGAS ? 0.6 : 1, fontFamily: 'Manrope, sans-serif' }}
        >
          {loading ? '⏳ Cargando...' : confirmed ? '⚠️ Confirmar y cargar datos' : '🚀 Cargar datos de ejemplo'}
        </button>
        {confirmed && !loading && (
          <button onClick={() => setConfirmed(false)} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#64748B' }}>
            Cancelar
          </button>
        )}
      </div>

      {/* ── Exportar colecciones ── */}
      <ExportarColecciones isGAS={isGAS} portafolios={portafolios} />
    </div>
  );
}

const SECTIONS: Record<AdminSection | 'noticias' | 'capacitaciones', { label: string; icon: string }> = {
  bienvenida: { label: 'Bienvenida', icon: '👋' },
  seed: { label: 'Carga inicial', icon: '🗄️' },
  config: { label: 'Config General', icon: '⚙️' },
  equipo: { label: 'Equipo', icon: '👥' },
  capacidades: { label: 'Capacidades', icon: '🧩' },
  stakeholders: { label: 'Stakeholders', icon: '🤝' },
  aplicaciones: { label: 'Aplicaciones', icon: '📱' },
  bets: { label: 'Bets / LVT', icon: '🎯' },
  mos: { label: 'MOS del Bet', icon: '📈' },
  iniciativas: { label: 'Iniciativas & Entregables', icon: '🗂️' },
  entregables: { label: 'Entregables', icon: '📋' },
  reviews: { label: 'Reviews', icon: '📝' },
  presentaciones: { label: 'Presentaciones', icon: '📊' },
  noticias: { label: 'Noticias', icon: '📰' },
  capacitaciones: { label: 'Capacitaciones', icon: '🎓' },
  'business-flows': { label: 'Flujos de negocio', icon: '🧭' },
  'usuarios': { label: 'Usuarios', icon: '🔐' },
  'exportar': { label: 'Exportar datos', icon: '📥' },
};

// Grupos del sidebar
const INDICADORES_SECTIONS: AdminSection[] = ['bets', 'mos', 'iniciativas', 'reviews', 'presentaciones'];
const CONFIG_SECTIONS: AdminSection[] = ['config', 'equipo', 'capacidades', 'aplicaciones', 'stakeholders'];
const OTROS_SECTIONS: AdminSection[] = ['business-flows', 'capacitaciones', 'usuarios', 'exportar'];
const SUPERADMIN_EMAIL = 'ricardo.moscoso@blue.cl';

interface Props {
  data: AppData;
  onNav: (page: PageKey) => void;
  onDataRefresh: () => void;
  selectedEquipoId?: string | null;
  equipoNombre?: string;
  onBack?: () => void;
  fullScreen?: boolean;
}

export default function Admin({ data, onNav, onDataRefresh, selectedEquipoId, equipoNombre, onBack, fullScreen = false }: Props) {
  // Si ya viene con equipo seleccionado (fullScreen desde 'Configurar equipo'), ir directo a config
  const [section, setSection] = useState<AdminSection>(selectedEquipoId ? 'config' : 'bienvenida');
  const [equipoId, setEquipoId] = useState<string | null>(selectedEquipoId ?? null);
  const [_equipoNombreState, setEquipoNombreState] = useState<string | null>(equipoNombre ?? null);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<AdminDialogState>({
    open: false,
    variant: 'alert',
    title: '',
    message: '',
  });

  useEffect(() => {
    writeSessionValue(ADMIN_SECTION_STORAGE_KEY, section);
  }, [section]);

  const handleDataRefresh = async () => {
    setSaving(true);
    try {
      await flushToSheet();
    } catch (err) {
      dialogHelpers.showError('❌ ' + (err instanceof Error ? err.message : 'Error al guardar'));
    }
    onDataRefresh();
    setSaving(false);
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, open: false, onConfirm: undefined }));
  };

  const dialogHelpers: AdminDialogHelpers = {
    showError: (message, title = 'Error') => {
      setDialog({ open: true, variant: 'error', title, message, confirmLabel: 'Cerrar' });
    },
    showAlert: (message, title = 'Atención') => {
      setDialog({ open: true, variant: 'alert', title, message, confirmLabel: 'Entendido' });
    },
    showConfirm: (message, onConfirm, options) => {
      setDialog({
        open: true,
        variant: 'confirm',
        title: options?.title ?? 'Confirmar acción',
        message,
        confirmLabel: options?.confirmLabel ?? 'Aceptar',
        cancelLabel: options?.cancelLabel ?? 'Cancelar',
        onConfirm: () => {
          closeDialog();
          onConfirm();
        },
      });
    },
  };

  return (
    <div className="page-shell admin-page admin-contenedor" style={{ minHeight: fullScreen ? '100vh' : 'calc(100vh - 80px)', width: '100%', background: 'var(--light)', borderRadius: fullScreen ? 0 : 16, overflow: 'hidden' }}>
      {/* Toast: guardando */}
      {saving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,28,64,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '48px 64px', minWidth: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', fontFamily: 'Manrope, sans-serif' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 0.85s linear infinite' }}>
              <circle cx="24" cy="24" r="20" stroke="#E2E8F0" strokeWidth="4" />
              <path d="M24 4a20 20 0 0 1 20 20" stroke="#0032A0" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0F1C40', letterSpacing: '-0.01em' }}>Guardando…</span>
            <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Por favor espera</span>
          </div>
        </div>
      )}
      {/* [admin-page] */}

      {/* [admin-header] */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingBottom: 0 }}>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 2 }}>
              Configuración Portal
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              {equipoNombre ?? 'Configuración'}
            </div>
            <p style={{ maxWidth: 720, fontSize: 13, lineHeight: 1.55, color: 'var(--muted)', marginBottom: 12 }}>
              Módulo para administrar la configuración general del sitio, incorporar KPIs de seguimiento y mantener iniciativas, capacidades y entregables que se reflejan en las distintas vistas de la plataforma.
            </p>
          </div>
          {/* Mostrar correo del usuario logueado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>
              {data.usuario?.email || 'Sin usuario'}
            </span>
          </div>
        </div>
      </div>

      <div className="page-body admin-body">
      {/* [admin-body] */}
      {/* [admin-content] */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
          <aside style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '8px 6px 8px 8px', position: 'sticky', top: 24, minWidth: 0, maxWidth: 240, width: 240 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6, fontFamily: 'Manrope, sans-serif' }}>
              Secciones
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

              {/* ⚙️ Configuración */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C3AED', marginBottom: 4, fontFamily: 'Manrope, sans-serif', lineHeight: 1.4 }}>
                  {selectedEquipoId ? `⚙️ ${equipoNombre ?? 'Configuración'}` : '⚙️ Configuración'}
                </div>
                {!selectedEquipoId ? (
                  <div style={{ fontSize: 11, color: '#94A3B8', padding: '4px 8px', fontStyle: 'italic', lineHeight: 1.5 }}>Selecciona un equipo.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {CONFIG_SECTIONS.map(item => {
                      const meta = SECTIONS[item];
                      const active = section === item;
                      return (
                        <button key={item} onClick={() => setSection(item)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 6px', borderRadius: 8, border: active ? '1px solid #DDD6FE' : '1px solid transparent', background: active ? '#F5F3FF' : 'transparent', color: active ? '#7C3AED' : '#334155', cursor: 'pointer', fontSize: 11, fontWeight: active ? 800 : 500, textAlign: 'left', fontFamily: 'Manrope, sans-serif' }}>
                          <span style={{ fontSize: 12 }}>{meta.icon}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 168, marginLeft: 2 }}>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '2px 4px' }} />

              {/* 📈 Indicadores */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
                  📈 Indicadores
                </div>
                {!selectedEquipoId ? (
                  <div style={{ fontSize: 11, color: '#94A3B8', padding: '4px 8px', fontStyle: 'italic', lineHeight: 1.5 }}>Selecciona un equipo.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {INDICADORES_SECTIONS.map(item => {
                      const meta = SECTIONS[item];
                      const active = section === item;
                      return (
                        <button key={item} onClick={() => setSection(item)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 6px', borderRadius: 8, border: active ? '1px solid #99F6E4' : '1px solid transparent', background: active ? '#F0FDF4' : 'transparent', color: active ? '#0F766E' : '#334155', cursor: 'pointer', fontSize: 11, fontWeight: active ? 800 : 500, textAlign: 'left', fontFamily: 'Manrope, sans-serif' }}>
                          <span style={{ fontSize: 12 }}>{meta.icon}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 168, marginLeft: 2 }}>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '2px 4px' }} />

              {/* 🌐 Otros */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0891B2', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
                  🌐 Otros
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {OTROS_SECTIONS.map(item => {
                    const meta = SECTIONS[item];
                    const active = section === item;
                    return (
                      <button key={item} onClick={() => setSection(item)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 6px', borderRadius: 8, border: active ? '1px solid #A5F3FC' : '1px solid transparent', background: active ? '#ECFEFF' : 'transparent', color: active ? '#0E7490' : '#334155', cursor: 'pointer', fontSize: 11, fontWeight: active ? 800 : 500, textAlign: 'left', fontFamily: 'Manrope, sans-serif' }}>
                        <span style={{ fontSize: 12 }}>{meta.icon}</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 168, marginLeft: 2 }}>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 🗄️ Super admin */}
              {data.usuario?.email === SUPERADMIN_EMAIL && (
                <>
                  <div style={{ height: 1, background: 'var(--border)', margin: '2px 4px' }} />
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B45309', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
                      🔧 Super admin
                    </div>
                    <button
                      onClick={() => setSection('seed')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 6px', borderRadius: 8, border: section === 'seed' ? '1px solid #FDE68A' : '1px solid transparent', background: section === 'seed' ? '#FFFBEB' : 'transparent', color: section === 'seed' ? '#92400E' : '#334155', cursor: 'pointer', fontSize: 11, fontWeight: section === 'seed' ? 800 : 500, textAlign: 'left', fontFamily: 'Manrope, sans-serif' }}
                    >
                      <span style={{ fontSize: 12 }}>🗄️</span>
                      <span>Carga inicial</span>
                    </button>
                  </div>
                </>
              )}

            </div>

            {/* Volver al portafolio */}
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => onBack ? onBack() : onNav('inicio')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 8px 8px 6px', borderRadius: 10, border: '1px solid var(--border)', background: '#F8FAFF', color: '#334155', cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'left', fontFamily: 'Manrope, sans-serif' }}
              >
                <span style={{ fontSize: 14 }}>←</span>
                <span>Volver al portafolio</span>
              </button>
            </div>
          </aside>

          <div style={{ minWidth: 0, maxWidth: '100%', paddingLeft: 16 }}>
            {/* ── Portafolios mantenedor ── */}
            {/* Portafolios SIEMPRE recibe onSelectEquipo para evitar errores de navegación */}
            {section === 'bienvenida' && (
              <Portafolios
                portafolios={[]}
                isAdmin={true}
                usuario={data.usuario}
                onSelectEquipo={(equipo: Equipo & { config?: boolean }) => {
                  const superAdminEmail = 'ricardo.moscoso@blue.cl';
                  const isSuperAdmin = data.usuario?.email === superAdminEmail;
                  if (equipo.config) {
                    if (isSuperAdmin) {
                      setEquipoId(equipo.id);
                      setEquipoNombreState(equipo.nombre);
                      setSection('config');
                    } else {
                      dialogHelpers.showAlert('Solo el super admin puede acceder a la configuración del equipo.', 'Acceso restringido');
                    }
                  } else {
                    setEquipoId(equipo.id);
                    setEquipoNombreState(equipo.nombre);
                    setSection('equipo');
                  }
                }}
              />
            )}
            {/* ── Secciones Otros ── */}
            {section === 'business-flows' && <BusinessFlowsSection data={data} onSaved={handleDataRefresh} dialogs={dialogHelpers} />}
            {section === 'usuarios'     && <UsuariosSection data={data} onSaved={handleDataRefresh} dialogs={dialogHelpers} />}
            {section === 'capacitaciones' && <CapacitacionesSection data={data} onSaved={handleDataRefresh} dialogs={dialogHelpers} />}
            {section === 'exportar'     && <ExportarPage />}
            {section === 'seed' && <SeedSection />}

            {/* ── Secciones de Equipo (requieren selectedEquipoId) ── */}
            {section === 'config'       && (equipoId
              ? <ConfigSection data={data} onSaved={handleDataRefresh} />
              : <NoEquipoPanel />
            )}
            {section === 'equipo'       && (equipoId
              ? <EquipoSection data={data} onSaved={handleDataRefresh} dialogs={dialogHelpers} />
              : <NoEquipoPanel />
            )}
            {section === 'capacidades'  && (selectedEquipoId
              ? <CapacidadesSection data={data} onSaved={handleDataRefresh} dialogs={dialogHelpers} />
              : <NoEquipoPanel />
            )}
            {section === 'stakeholders' && (selectedEquipoId
              ? <StakeholdersSection data={data} onSaved={handleDataRefresh} dialogs={dialogHelpers} />
              : <NoEquipoPanel />
            )}
            {section === 'aplicaciones' && (selectedEquipoId
              ? <AplicacionesSection data={data} onSaved={handleDataRefresh} dialogs={dialogHelpers} />
              : <NoEquipoPanel />
            )}
            {section === 'bets'         && (selectedEquipoId
              ? <BetsSection data={data} onSaved={handleDataRefresh} dialogs={dialogHelpers} mode="bets" />
              : <NoEquipoPanel />
            )}
            {section === 'mos'          && (selectedEquipoId
              ? <BetsSection data={data} onSaved={handleDataRefresh} dialogs={dialogHelpers} mode="mos" />
              : <NoEquipoPanel />
            )}
            {section === 'reviews'      && (selectedEquipoId
              ? <StudioReviews data={data} />
              : <NoEquipoPanel />
            )}
            {section === 'presentaciones' && <PresentacionesAdminSection data={data} onSaved={handleDataRefresh} />}
            {section === 'iniciativas'  && (selectedEquipoId
              ? <IniciativasSection data={data} onSaved={handleDataRefresh} dialogs={dialogHelpers} />
              : <NoEquipoPanel />
            )}
          </div>
        </div>
      </div>
      </div>
      <FeedbackModal
        open={dialog.open}
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        cancelLabel={dialog.cancelLabel}
        onClose={closeDialog}
        onConfirm={dialog.onConfirm}
      />
    </div>
  );
}
