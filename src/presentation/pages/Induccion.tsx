

export default function Induccion() {
  return (
    <div className="induccion-container" style={{ maxWidth: 700, margin: '40px auto', background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px 32px 32px 32px' }}>
      <div className="induccion-title" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8, color: '#0032A0' }}>Bienvenida</div>
      <div className="induccion-subtitle" style={{ fontSize: '1.1rem', color: '#2BB8D4', marginBottom: 28, fontWeight: 600 }}>Guía rápida de módulos y funcionalidades</div>
      <ul className="induccion-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li style={{ marginBottom: 22, background: '#F1F5F9', borderLeft: '4px solid #2BB8D4', borderRadius: 8, padding: '16px 18px 12px 18px', boxShadow: '0 1px 4px rgba(0,50,160,0.03)' }}>
          <div className="induccion-list-title" style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0032A0', marginBottom: 4 }}>Panel</div>
          <div className="induccion-list-desc" style={{ fontSize: '0.98rem', color: '#475569' }}>Muestra un resumen del estado actual del equipo, métricas clave del trimestre y accesos rápidos a las principales secciones de la plataforma.</div>
        </li>
        <li style={{ marginBottom: 22, background: '#F1F5F9', borderLeft: '4px solid #2BB8D4', borderRadius: 8, padding: '16px 18px 12px 18px', boxShadow: '0 1px 4px rgba(0,50,160,0.03)' }}>
          <div className="induccion-list-title" style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0032A0', marginBottom: 4 }}>Roadmap</div>
          <div className="induccion-list-desc" style={{ fontSize: '0.98rem', color: '#475569' }}>Permite visualizar y gestionar las iniciativas planificadas para el trimestre, su avance, responsables y fechas clave.</div>
        </li>
        <li style={{ marginBottom: 22, background: '#F1F5F9', borderLeft: '4px solid #2BB8D4', borderRadius: 8, padding: '16px 18px 12px 18px', boxShadow: '0 1px 4px rgba(0,50,160,0.03)' }}>
          <div className="induccion-list-title" style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0032A0', marginBottom: 4 }}>Reviews</div>
          <div className="induccion-list-desc" style={{ fontSize: '0.98rem', color: '#475569' }}>Muestra las presentaciones de avance del equipo, permitiendo consultar entregables, resultados y próximos pasos de cada iniciativa.</div>
        </li>
        <li style={{ marginBottom: 22, background: '#F1F5F9', borderLeft: '4px solid #2BB8D4', borderRadius: 8, padding: '16px 18px 12px 18px', boxShadow: '0 1px 4px rgba(0,50,160,0.03)' }}>
          <div className="induccion-list-title" style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0032A0', marginBottom: 4 }}>Preparar Review</div>
          <div className="induccion-list-desc" style={{ fontSize: '0.98rem', color: '#475569' }}>Herramienta para que los responsables preparen y estructuren las presentaciones de avance, cargando información y evidencias de cada iniciativa.</div>
        </li>
        <li style={{ marginBottom: 22, background: '#F1F5F9', borderLeft: '4px solid #2BB8D4', borderRadius: 8, padding: '16px 18px 12px 18px', boxShadow: '0 1px 4px rgba(0,50,160,0.03)' }}>
          <div className="induccion-list-title" style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0032A0', marginBottom: 4 }}>Noticias</div>
          <div className="induccion-list-desc" style={{ fontSize: '0.98rem', color: '#475569' }}>Sección para publicar y consultar comunicados, novedades y actualizaciones relevantes para el equipo.</div>
        </li>
        <li style={{ marginBottom: 22, background: '#F1F5F9', borderLeft: '4px solid #2BB8D4', borderRadius: 8, padding: '16px 18px 12px 18px', boxShadow: '0 1px 4px rgba(0,50,160,0.03)' }}>
          <div className="induccion-list-title" style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0032A0', marginBottom: 4 }}>Capacitaciones</div>
          <div className="induccion-list-desc" style={{ fontSize: '0.98rem', color: '#475569' }}>Acceso a recursos de aprendizaje, documentación interna y materiales de formación para el equipo.</div>
        </li>
        <li style={{ marginBottom: 22, background: '#F1F5F9', borderLeft: '4px solid #2BB8D4', borderRadius: 8, padding: '16px 18px 12px 18px', boxShadow: '0 1px 4px rgba(0,50,160,0.03)' }}>
          <div className="induccion-list-title" style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0032A0', marginBottom: 4 }}>Flujos de Negocio</div>
          <div className="induccion-list-desc" style={{ fontSize: '0.98rem', color: '#475569' }}>Visualiza los procesos clave del área, responsables y relaciones entre los distintos flujos de trabajo.</div>
        </li>
        <li style={{ marginBottom: 22, background: '#F1F5F9', borderLeft: '4px solid #2BB8D4', borderRadius: 8, padding: '16px 18px 12px 18px', boxShadow: '0 1px 4px rgba(0,50,160,0.03)' }}>
          <div className="induccion-list-title" style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0032A0', marginBottom: 4 }}>Configuración</div>
          <div className="induccion-list-desc" style={{ fontSize: '0.98rem', color: '#475569' }}>(Solo administradores) Permite ajustar parámetros generales, gestionar datos maestros y realizar tareas de mantenimiento de la plataforma.</div>
        </li>
      </ul>
      <div style={{ marginTop: 32 }}>
        <div className="induccion-section-title" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6, color: '#1B30CC' }}>Recomendaciones</div>
        <ul className="induccion-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: 12, background: '#F1F5F9', borderLeft: '4px solid #2BB8D4', borderRadius: 8, padding: '16px 18px 12px 18px', boxShadow: '0 1px 4px rgba(0,50,160,0.03)' }}>
            <div className="induccion-list-desc" style={{ fontSize: '0.98rem', color: '#475569' }}>Lee atentamente cada sección antes de editar información.</div>
          </li>
          <li style={{ marginBottom: 12, background: '#F1F5F9', borderLeft: '4px solid #2BB8D4', borderRadius: 8, padding: '16px 18px 12px 18px', boxShadow: '0 1px 4px rgba(0,50,160,0.03)' }}>
            <div className="induccion-list-desc" style={{ fontSize: '0.98rem', color: '#475569' }}>Si tienes dudas, consulta la documentación o contacta al responsable del sistema.</div>
          </li>
          <li style={{ marginBottom: 0, background: '#F1F5F9', borderLeft: '4px solid #2BB8D4', borderRadius: 8, padding: '16px 18px 12px 18px', boxShadow: '0 1px 4px rgba(0,50,160,0.03)' }}>
            <div className="induccion-list-desc" style={{ fontSize: '0.98rem', color: '#475569' }}>Recuerda guardar tus cambios antes de salir de la plataforma.</div>
          </li>
        </ul>
      </div>
    </div>
  );
}
