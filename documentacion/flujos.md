# Flujos de la aplicación — Portal Hub Blue Express

> Última actualización: Mayo 2026

Este documento describe los flujos funcionales que maneja la aplicación, independientemente de cómo está construida (ver `arquitectura.md`).

---

## Flujo 1 — Autenticación y acceso

```
Usuario abre la URL (GAS Web App o localhost)
    │
    ├── ¿Está disponible google.script.run?
    │       │
    │       ├── SÍ (producción GAS)
    │       │       │
    │       │       ▼
    │       │   GASRepository activo
    │       │   google.script.run.whoAmI()
    │       │       → devuelve { email, nombre, rol, canConfigure }
    │       │       → se guarda en AuthContext
    │       │
    │       └── NO (desarrollo local)
    │               │
    │               ▼
    │           MockRepository activo
    │           Login.tsx muestra formulario
    │               → usuario ingresa email
    │               → si email termina en @blue.cl → acceso como admin
    │               → se guarda en AuthContext
    │
    ▼
App.tsx evalúa AuthContext
    ├── No autenticado → redirige a /login
    ├── Autenticado sin canConfigure → vista de solo lectura (Home)
    └── Autenticado con canConfigure → acceso al Admin
```

**Archivos clave:** `AuthContext.tsx`, `AuthProvider.tsx`, `Login.tsx`, `App.tsx`

---

## Flujo 2 — Selección de portafolio y equipo

```
Home.tsx / App.tsx carga portafolios
    │
    ▼
PortafoliosRepository.getAll()
    → devuelve lista de portafolios activos con sus equipos
    │
    ▼
Usuario selecciona portafolio → lista de equipos del portafolio
    │
    ▼
Usuario selecciona equipo → se guarda equipoId en estado global
    │
    ▼
Trigger de carga de datos del equipo (Flujo 3)
```

**Invariante de aislamiento:** cada portafolio tiene sus propios equipos. Los datos de un equipo nunca se comparten con otro equipo. La selección del equipo determina qué datos se cargan en toda la sesión.

**Archivos clave:** `usePortfolios.ts`, `Portafolios.tsx`, `App.tsx`

---

## Flujo 3 — Carga inicial de datos del equipo

```
Equipo seleccionado → useAppData(equipoId)
    │
    ▼
repositoryFactory.ts selecciona repositorio activo
    │
    ├── GASRepository (producción)
    │       │
    │       ▼
    │   google.script.run.obtenerDatosEquipo(equipoId)
    │       → GAS llama Firestore REST API
    │       → devuelve: config, miembros, capacidades, bets, mos,
    │                   iniciativas, stakeholders, businessFlows,
    │                   reviews, capacitaciones, presentaciones, aplicaciones
    │
    └── MockRepository (local)
            │
            ▼
        Lee mockDataLocal.json + localStorage
        → devuelve misma estructura
    │
    ▼
dataService.ts normaliza datos
    → completa campos opcionales
    → ordena colecciones
    → calcula valores derivados
    │
    ▼
Estado React (useAppData hook)
    → todos los componentes consumen desde aquí
    → re-render automático cuando cambia equipoId
```

**Archivos clave:** `useAppData.ts`, `dataService.ts`, `repositoryFactory.ts`, `GASRepository.ts`

---

## Flujo 4 — Guardado en Admin (flujo general)

```
Admin.tsx — usuario edita un campo (config, bet, iniciativa, etc.)
    │
    ▼
handleSave(item) → dataService.saveX(item, equipoId)
    │
    ├── Actualiza estado React local (optimistic update)
    │
    ▼
repository.syncToSheet({
    ...item,
    _equipoId: equipoId,
    _coleccion: 'nombre_coleccion',
    _docId: item.id
})
    │
    ├── GASRepository (producción)
    │       │
    │       ▼
    │   google.script.run.guardarDocumento(equipoId, coleccion, docId, data)
    │       → GAS genera JWT service account
    │       → Firestore REST API PATCH /equipos/{equipoId}/{coleccion}/{docId}
    │
    └── MockRepository (local)
            │
            ▼
        localStorage.setItem(key, JSON.stringify(item))
    │
    ▼
SyncStatus.tsx muestra estado (guardando / guardado / error)
```

**Archivos clave:** `Admin.tsx`, `dataService.ts`, `GASRepository.ts`, `SyncStatus.tsx`

---

## Flujo 5 — CRUD de Presentaciones

> Las presentaciones tienen flujo propio porque usan `presentacionService.ts` separado del flujo general.

```
PresentacionesAdminSection.tsx
    │
    ├── AGREGAR presentación
    │       │
    │       ▼
    │   presentacionService.addPresentacion(p, equipoId)
    │       ├── localStorage.setItem(...)          ← copia local inmediata
    │       └── gasRun('guardarDocumento', equipoId, 'presentaciones', p.id, p)
    │               → Firestore async
    │       │
    │       ▼
    │   setList(prev => [...prev, item])           ← React state update directo
    │
    ├── EDITAR presentación
    │       │
    │       ▼
    │   presentacionService.updatePresentacion(p, equipoId)
    │       ├── localStorage update
    │       └── gasRun('guardarDocumento', ...)
    │       │
    │       ▼
    │   setList(prev => prev.map(x => x.id === p.id ? p : x))
    │
    └── ELIMINAR presentación
            │
            ▼
        presentacionService.deletePresentacion(id, equipoId)
            ├── localStorage remove
            └── gasRun('eliminarDocumento', equipoId, 'presentaciones', id)
            │
            ▼
        setList(prev => prev.filter(x => x.id !== id))
```

**Nota:** No se llama `reload()` ni se mezclan fuentes. El estado React es la única fuente de verdad durante la sesión.

**Archivos clave:** `presentacionService.ts`, `PresentacionesAdminSection.tsx`

---

## Flujo 6 — Creación de portafolio y equipo

```
AdminPanel.tsx → sección "Portafolios"
    │
    ▼
CrearPortafolioForm.tsx — usuario completa nombre, descripción, equipo inicial
    │
    ▼
GASPortafoliosRepository.save(portafolio)
    │
    ▼
google.script.run.guardarPortafolio(data)
    │
    ├── ¿Existe ya portafolios/{portId}/config/main?
    │       ├── SÍ → solo actualiza metadata del portafolio
    │       └── NO → crea portafolio + config/main del equipo inicial
    │
    └── Firestore escribe en:
            portafolios/{portId}
            equipos/{equipoId}/config/main
    │
    ▼
Portafolios.tsx refresca desde repo.getAll()
    → lista actualizada sin recargar la página
```

**Archivos clave:** `CrearPortafolioForm.tsx`, `Portafolios.tsx`, `GASPortafoliosRepository.ts`

---

## Flujo 7 — Exportación de datos

```
Admin → sección "Exportar datos" (ExportarPage)
    │
    ├── [Portafolios] → gasCall('obtenerPortafolios')
    │       → JSON con todos los portafolios y equipos
    │       → triggerDownload('portafolios.json', data)
    │
    ├── [Usuarios] → gasCall('obtenerUsuarios')
    │       → JSON con todos los usuarios
    │       → triggerDownload('usuarios.json', data)
    │
    ├── [Por equipo] → dropdown selecciona equipoId
    │       → gasCall('obtenerDatosEquipo', equipoId)
    │       → JSON con todas las colecciones del equipo
    │       → triggerDownload('equipo-{id}.json', data)
    │
    └── [Exportar todo] → gasCall('exportarDatos', portafolioId?)
            → JSON con toda la data (o filtrada por portafolio)
            → triggerDownload('export-all.json', data)

triggerDownload(filename, data):
    → crea Blob(JSON.stringify(data))
    → URL.createObjectURL(blob)
    → <a download> simulado con click
    → URL.revokeObjectURL()
```

**Archivos clave:** `Admin.tsx` (componentes `ExportarColecciones`, `ExportarPage`)

**Alternativa local (sin GAS):**
```bash
node scripts/firestore-download.cjs <coleccion>
# genera scripts/output/<coleccion>-YYYY-MM-DD.json
```

---

## Flujo 8 — Reviews

```
Admin → sección Reviews
    │
    ▼
ReviewEditor.tsx — usuario crea/edita review
    │
    │   Campos: título, sprint, fecha, quarter, fuente, estructura de secciones
    │
    ▼
dataService.saveReview(review, equipoId) → Firestore

─────────────────────────────────────────────────
Visualización (modo presentación)
─────────────────────────────────────────────────

ReviewPresentation.tsx recibe review seleccionado
    │
    ├── fuente: 'roadmap'
    │       → renderiza RoadmapMosBlock con datos del quarter
    │
    ├── fuente: 'interna'
    │       → renderiza secciones editables (indicadores, resultados, demo,
    │          riesgos, próximos pasos)
    │
    └── fuente: 'embebida'
            │
            ▼
        reviewEmbed.ts detecta tipo de URL:
            ├── Google Slides → extrae ID → URL de preview embed
            ├── PPT público → iframe directo
            └── Otro → enlace a abrir en pestaña nueva
```

**Archivos clave:** `ReviewEditor.tsx`, `ReviewPresentation.tsx`, `reviewEmbed.ts`, `reviewUtils.ts`

---

## Flujo 9 — Roadmap e Iniciativas

```
Home.tsx / CapacidadRoadmap.tsx
    │
    ▼
data.iniciativas (desde useAppData)
    │
    ▼
Filtro por quarter activo (q_activo desde config/main)
    │
    ▼
RoadmapMosBlock.tsx
    ├── Selector local de quarter (no afecta selector global)
    ├── Tabla de iniciativas agrupadas por capacidad
    │       → tag: plan / wip / done / cancelled
    └── Cuadro de MOS del Bet
            → linea_base, meta, actual
            → indicadores filtrados por quarter
    │
    ▼
RoadmapInitiativasBlock.tsx
    → detalle de entregables por iniciativa
    → EditableEntregablesGrid.tsx en modo Admin
```

**Invariante:** el selector de quarter del `RoadmapMosBlock` es local — no afecta el quarter global del sidebar. El quarter global solo afecta la vista de Home y las secciones de Stakeholders.

**Archivos clave:** `RoadmapMosBlock.tsx`, `RoadmapInitiativasBlock.tsx`, `CapacidadRoadmap.tsx`, `Home.tsx`, `EditableEntregablesGrid.tsx`
