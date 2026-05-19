# Documentación relevante — Portal Hub Blue Express

> Última actualización: Mayo 2026

---

## Documentos del proyecto

| Archivo | Qué encontrarás ahí |
|---|---|
| `documentacion/arquitectura.md` | Cómo está construida la aplicación: stack, capas hexagonales, árbol de archivos, patrón de repositorios, estructura de Firestore, proyecto GAS |
| `documentacion/flujos.md` | Los distintos flujos funcionales que maneja la app: autenticación, carga de datos, guardado, CRUD de presentaciones, creación de portafolios, exportación, reviews, roadmap |
| `documentacion/pendientes.md` | Tareas pendientes priorizadas: P0 (análisis crítico de arquitectura y datos), P1 (features activas), P2 (UX Admin), P3 (dominio) |
| `documentacion/Código-apps-script.gs` | ⭐ Código del servidor GAS — debe pegarse manualmente en el editor GAS online después de cada deploy |
| `documentacion/mockDataLocal.json` | Datos de prueba para desarrollo local (MockRepository) |
| `documentacion/ejemplo.html` | Referencia visual de la UI (prototipo estático de componentes) |
| `documentacion/portal-reviews.html` | Referencia visual de la sección Reviews |

---

## Modelo de datos del negocio

El sitio funciona con **portafolios y equipos**. Cada portafolio agrupa equipos. Cada equipo tiene su propio conjunto de datos (config, miembros, capacidades, bets, iniciativas, reviews, presentaciones, etc.). Los datos **no se cruzan entre equipos ni entre portafolios**.

```
portfolios/{portfolioId}
    └── teams/{teamId}          ← un portafolio puede tener N equipos

teams/{teamId}/
    config/main                 ← configuración del equipo
    members/                    ← integrantes
    capabilities/               ← capacidades técnicas
    bets/                       ← apuestas estratégicas
    metrics/                    ← MOS por bet
    initiatives/                ← roadmap (con entregables nested, por ahora)
    stakeholders/
    business_flows/
    reviews/
    trainings/
    presentations/
    applications/
    health/

users/                          ← roles y accesos globales
```

---

## Deploy — resumen rápido

```bash
npm run deploy          # desde C:\Bluex\proyectos\abril-2026\site-3_5
```

Luego, **manualmente en GAS online:**
1. Pegar `documentacion/Código-apps-script.gs` como `Código.gs`
2. Crear nueva **Versión** del deployment

---

## Entornos

| Entorno | Repositorio activo |
|---|---|
| `npm run dev` (local) | `MockRepository` — localStorage + mockDataLocal.json |
| GAS Web App (producción) | `GASRepository` — google.script.run → Firestore |
| API REST (futuro) | `APIRepository` — fetch() → API propia → Firestore/otra DB |
