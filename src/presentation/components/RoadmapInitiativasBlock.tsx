import type { Entregable, Iniciativa } from '../../domain/types';

interface RoadmapData {
  iniciativa: Iniciativa;
  entregables: Entregable[];
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export default function RoadmapInitiativasBlock({
  roadmapData,
  title = 'Roadmap',
  subtitle = 'Iniciativas y entregables del quarter'
}: {
  roadmapData: RoadmapData[];
  title?: string;
  subtitle?: string;
}) {
  if (roadmapData.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px dashed #E2E8F0', borderRadius: 10, padding: 20, color: '#666', fontSize: 13, fontStyle: 'italic', textAlign: 'center' }}>
        No hay iniciativas para este quarter.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#1E56A0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: '#666' }}>{subtitle}</div>
      </div>

      {roadmapData.map((roadmapItem) => (
        <div key={roadmapItem.iniciativa.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {/* Header de Iniciativa */}
          <div style={{ padding: '16px 18px', background: 'linear-gradient(135deg, #0A1650 0%, #060D3D 100%)', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                  {roadmapItem.iniciativa.nombre}
                </h3>
                {roadmapItem.iniciativa.descripcion && (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
                    {roadmapItem.iniciativa.descripcion}
                  </p>
                )}
              </div>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Q{roadmapItem.iniciativa.q}
              </div>
            </div>
          </div>

          {/* Lista de Entregables */}
          <div style={{ padding: '12px 0' }}>
            {roadmapItem.entregables.length === 0 ? (
              <div style={{ padding: '16px 18px', color: '#999', fontSize: 12, fontStyle: 'italic', textAlign: 'center' }}>
                Sin entregables
              </div>
            ) : (
              roadmapItem.entregables.map((entregable, idx) => (
                  <div
                    key={entregable.id}
                    style={{
                      padding: '14px 18px',
                      borderTop: idx > 0 ? '1px solid #F0F4F8' : 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Título y Descripción del Entregable */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1650', marginBottom: 2 }}>
                        {entregable.titulo}
                      </div>
                      {entregable.descripcion && (
                        <p style={{ fontSize: 12, color: '#666', margin: '0 0 6px 0', lineHeight: 1.5 }}>
                          {entregable.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Fechas */}
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#999' }}>
                      <span>
                        Inicio: <span style={{ fontWeight: 600, color: '#0A1650' }}>{formatDate(entregable.fechaInicio)}</span>
                      </span>
                      <span>
                        Fin: <span style={{ fontWeight: 600, color: '#0A1650' }}>{formatDate(entregable.fechaFin)}</span>
                      </span>
                    </div>
                  </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
