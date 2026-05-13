const NOTICIAS = [
  {
    cat: 'Funcionalidad',
    color: '#1B30CC',
    bg: '#EEF2FF',
    title: 'Optimización multi-depósito en Última Milla',
    date: '07 Abr 2026',
    desc: 'Se habilitó la capacidad de planificar rutas desde múltiples depósitos simultáneamente.',
  },
  {
    cat: 'Actualización',
    color: '#0891B2',
    bg: '#E0F7FA',
    title: 'Geosolver v2.1 — Mejora precisión georreferenciación',
    date: '02 Abr 2026',
    desc: 'Reducción del 8% en errores de tipo MRH.',
  },
  {
    cat: 'Release',
    color: '#10B981',
    bg: '#ECFDF5',
    title: 'Release Sprint 65 — Disponible en producción',
    date: '01 Abr 2026',
    desc: 'Entregables de Migración Salida Ruta y Smart Retiros disponibles para validación.',
  },
];

export default function Noticias() {
  return (
    <div className="page-shell noticias-page noticias-contenedor">
      {/* [noticias-page] */}
      {/* [noticias-header] */}
      <div className="page-intro">
        <h1 className="page-title">Noticias</h1>
        <p className="page-subtitle">Actualizaciones del equipo y los productos</p>
      </div>
      <div className="page-body noticias-body">
        {/* [noticias-body] */}
      {/* [noticias-contenido] */}
      {/* [noticias-lista] */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {NOTICIAS.map((n, i) => (
          <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: n.bg, color: n.color,
              padding: '3px 9px', borderRadius: 5, whiteSpace: 'nowrap', marginTop: 2,
            }}>
              {n.cat}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{n.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 5 }}>{n.desc}</div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--border)' }}>
                {n.date}
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
