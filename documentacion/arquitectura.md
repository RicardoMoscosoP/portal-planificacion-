# LEGACY: Integración y Backend GAS (Apps Script)

Esta sección documenta la arquitectura, despliegue y API de los módulos gas-viewer y gas-admin, que permiten la integración de la SPA React con Google Apps Script y Firestore.

## Arquitectura Split — Viewer + Admin

Google Sites
│
├── iframe 1 → gas-viewer (Apps Script)
│               ├── FirestoreService.gs    ← JWT auth + REST primitivas
│               ├── ViewerDataLayer.gs     ← Read-only + whoami + auto-registro
│               └── WebApp.gs              ← doGet: dashboard|capacidad|roadmap|reviews|whoami
│
├── iframe 2 → gas-admin (Apps Script)  ← solo visible si canConfigure === true
│               ├── FirestoreService.gs    ← misma copia
│               ├── AdminDataLayer.gs      ← CRUD todas las entidades + gestión usuarios
│               └── WebApp.gs              ← doGet + doPost: CRUD + usuarios.*
│
└── Firestore (compartido)
  ├── config/general
  ├── equipo/eq_xxx
  ├── capacidades/cap_xxx
  ├── bets/bet_xxx
  ├── mos/mos_xxx
  ├── iniciativas/ini_xxx
  ├── entregables/ent_xxx
  ├── alcances/alc_xxx
  ├── aplicaciones/app_xxx
  ├── reviews/rev_xxx
  ├── stakeholders/stk_xxx
  ├── businessFlows/bf_xxx
  └── usuarios/usr_xxx          ← NUEVA colección

... (flujo de autenticación, reglas de negocio, setup y API, ver backend-gas.md para detalles completos)
# Arquitectura — site-equipo-planificacion

## Estado actual (Mayo 2026)

Aplicación web en React + TypeScript + Vite para gestión del equipo de planificación.

**Backend migrado a Firebase/Firestore.** GAS/Google Sheets ya no es el backend principal.  
El frontend usa `MockRepository` en desarrollo hasta que `FirebaseRepository` esté implementado.

> Ver [firebase-colecciones.md](./firebase-colecciones.md) para la estructura de colecciones y el plan de conexión.

## Stack técnico

- **Frontend:** React 19 + TypeScript
- **Build:** Vite + `vite-plugin-singlefile` → `dist/index.html` (bundle único ~1.1 MB)
- **Linter:** ESLint + eslint-plugin-react-refresh
- **Estilos:** CSS-in-JS inline (modalStyles, componentes)
- **Estado:** hooks (useAppData, useConfirm, contexts)
- **Backend:** Firebase / Firestore (`site-equipo`)
- **APIs externas:** Jira (opcional, no activo)

## Capas vigentes

```text
src/
├── domain/
│   ├── types/index.ts
│   └── interfaces/IDataRepository.ts
├── application/
│   ├── hooks/
│   │   ├── useAppData.ts
│   │   └── usePortfolios.ts
│   └── services/
│       ├── dataService.ts
│       ├── betMos.ts
│       ├── reviewUtils.ts
│       └── reviewEmbed.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── repositoryFactory.ts
│   │   ├── MockRepository.ts        ← datos de prueba en disco
│   │   ├── APIRepository.ts         ← legacy, no activo
│   │   ├── GASRepository.ts         ← legacy, no activo
│   │   └── (FirebaseRepository.ts)  ← PENDIENTE implementar
│   ├── adapters/
│   │   └── dataAdapter.ts
│   └── integrations/
│       ├── firebase/
│       │   └── firebase.ts          ← config Firestore (project: site-equipo)
│       └── jira/
│           ├── JiraService.ts
│           └── jiraTypes.ts
└── presentation/
    ├── App.tsx
    ├── main.tsx
    ├── contexts/UnsavedChangesContext.tsx
    ├── layouts/MainLayout.tsx
    ├── pages/
    │   ├── Home.tsx
    │   ├── Admin.tsx
    │   ├── Reviews.tsx
    │   ├── Roadmap.tsx
    │   ├── RoadmapGeneral.tsx
    │   ├── Capacitaciones.tsx
    │   ├── BusinessFlows.tsx
    │   └── Portafolios.tsx
    └── components/
        ├── EditableEntregablesGrid.tsx
        ├── ReviewEditor.tsx
        ├── ReviewPresentation.tsx
        ├── ReviewMockupWorkspace.tsx
        ├── RoadmapMosBlock.tsx
        ├── ConfirmDialog.tsx
        ├── FeedbackModal.tsx
        ├── SyncStatus.tsx
        ├── DevRepositorySwitch.tsx
        └── modalStyles.ts
```

## Navegación (sidebar)

```
Panel (Home)
── Planificación
   ├── Roadmap General
   └── Reviews
── Recursos
   ├── Capacitaciones
   └── Flujos de Negocio
── Footer
   ├── ← Portafolios
```

Páginas eliminadas del nav: Bienvenida, Preparar Review, Noticias, Configuración, Guardar.

## Capas vigentes

```text
src/
├── domain/
│   ├── types/index.ts
│   └── interfaces/IDataRepository.ts
├── application/
│   ├── hooks/
│   │   ├── useAppData.ts
│   │   └── useConfirm.tsx
│   └── services/
│       ├── dataService.ts
│       ├── betMos.ts
│       ├── reviewUtils.ts
│       ├── reviewEmbed.ts
│       └── (helpers compartidos)
├── infrastructure/
│   ├── repositories/
│   │   ├── repositoryFactory.ts
│   │   ├── MockRepository.ts
│   │   ├── APIRepository.ts
│   │   └── GASRepository.ts
│   ├── adapters/
│   │   └── dataAdapter.ts
│   └── integrations/
│       └── jira/
│           ├── JiraService.ts
│           └── jiraTypes.ts
└── presentation/
    ├── App.tsx
    ├── main.tsx
    ├── contexts/UnsavedChangesContext.tsx
    ├── layouts/MainLayout.tsx
    ├── pages/
    │   ├── Home.tsx
    │   ├── CapacidadDetail.tsx
    │   ├── Admin.tsx
    │   ├── Reviews.tsx
    │   ├── RoadmapGeneral.tsx
    │   └── BusinessFlows.tsx
    ├── components/
    │   ├── MainLayout.tsx
    │   ├── Admin.tsx
    │   ├── EditableEntregablesGrid.tsx
    │   ├── ReviewEditor.tsx
    │   ├── ReviewPresentation.tsx
    │   ├── ReviewMockupWorkspace.tsx
    │   ├── RoadmapMosBlock.tsx
    │   ├── ConfirmDialog.tsx
    │   ├── FeedbackModal.tsx
    │   ├── SyncStatus.tsx
    │   ├── DevRepositorySwitch.tsx
    │   └── modalStyles.ts
    └── hooks/
        └── useConfirm.tsx
```

## Regla de dependencias

```text
presentation → application → domain ← infrastructure
```

- **presentation**: no debe depender directo de `infrastructure`. Solo usa servicios de `application`.
- **domain**: define contratos (`IDataRepository`), tipos y entidades. Sin dependencias.
- **application**: centraliza lógica, servicios, normalización. Depende solo de `domain`.
- **infrastructure**: implementa repositorios, adapters, integraciones. Depende de `domain`.

## Flujo de datos

### Lectura inicial

```
App.tsx
  ↓
useAppData() hook
  ↓
repositoryFactory.ts (elige MockRepository | APIRepository | GASRepository)
  ↓
Repository.getAllData()
  ↓
dataService.ts (normalización + localStorage merge)
  ↓
AppDataContext (estado global)
  ↓
Componentes consumidores
```

### Escritura administrativa

```
Admin.tsx (o componentes de edición)
  ↓
saveConfig / saveIniciativa / saveBet / ... handlers
  ↓
localStorage (actualización local)
  ↓
getAllData() + normalizadores
  ↓
useAppData() notifica cambios
  ↓
Vistas públicas re-renderean
```

### Ciclo de persistencia a GAS/API

```
Admin guardado en localStorage
  ↓
En deploy: GASRepository.updateData() o APIRepository
  ↓
Google Sheets (hojas Config, Iniciativas, Bets, etc.)
  ↓
GASRepository.getAllData() en próximas cargas
```

## Componentes críticos

### useAppData() hook
Ubicación: `src/application/hooks/useAppData.ts`

**Responsabilidades:**
- Carga inicial de datos desde repositorio elegido
- Sincronización con localStorage
- Normalización de datos
- Exposición de datos y handlers de actualización
- Control de cambios no guardados

**Contrato:**
```typescript
interface AppData {
  config: Config;
  iniciativas: Iniciativa[];
  bets: BET[];
  mos: MOSDelBet[];
  equipo: TeamMember[];
  capacidades: Capacidad[];
  aplicaciones: Aplicacion[];
  entregables: Entregable[];
  stakeholders: Stakeholder[];
  businessFlows: BusinessFlow[];
  reviews: Review[];
}
```

### dataService.ts
Ubicación: `src/application/services/dataService.ts`

**Responsabilidades:**
- Normalización de datos desde múltiples fuentes
- Completar campos opcionales
- Validación de integridad
- Cálculo de valores derivados
- Sincronización MOS: linea_base, meta, actual

### RoadmapMosBlock.tsx
Ubicación: `src/presentation/components/RoadmapMosBlock.tsx`

**Características:**
- Componente reutilizable de roadmap general + MOS
- Usado en: Home, CapacidadDetail, RoadmapGeneral, ReviewPresentation
- Selector local de quarter (no afecta selector global)
- Tabla de iniciativas por capacidad (colapsable)
- Cuadro de MOS del Bet (resumen global, no por quarter)

### Admin.tsx
Ubicación: `src/presentation/pages/Admin.tsx`

**Secciones:**
1. Configuración: campos de config, equipo
2. Capacidades/Alcances: grilla + editor
3. Iniciativas: grilla de roadmap
4. Entregables: panel integrado con filtros
5. Bets/LVT: grilla + modal
6. MOS del Bet: grilla con quarters
7. Stakeholders: grilla + modal + filtro por Q
8. Flujos de Negocio: grilla + modal
9. Seguimiento:
   - Reviews: grilla + editor dedicado

### ReviewPresentation.tsx
Ubicación: `src/presentation/components/ReviewPresentation.tsx`

**Características:**
- Modo broadcast de reviews
- Cabecera con `config.titulo` + metadatos
- Índice navegable
- Secciones dinámicas (indicadores, resultados, demo, riesgos, próximos pasos)
- Soporte para contenido embebido (Google Slides, PPT)
- Panel complementario Jira (opcional)

### MainLayout.tsx
Ubicación: `src/presentation/layouts/MainLayout.tsx`

**Responsabilidades:**
- Sidebar con navegación
- Header con título, selector de quarter
- Control de rutas
- Render de página activa

## Patrón: Repositorio

Interfaz: `src/domain/interfaces/IDataRepository.ts`

**Métodos:**
```typescript
interface IDataRepository {
  getAllData(): Promise<AppData>;
  saveConfig(config: Config): Promise<void>;
  saveIniciativa(iniciativa: Iniciativa): Promise<void>;
  saveBet(bet: BET): Promise<void>;
  saveMos(mos: MOSDelBet): Promise<void>;
  // ... más métodos para cada entidad
}
```

**Implementaciones:**

1. **MockRepository** (`src/infrastructure/repositories/MockRepository.ts`)
   - Devuelve datos hardcodeados
   - "Guarda" en memoria (temporal)
   - Usado en desarrollo local sin backend

2. **APIRepository** (`src/infrastructure/repositories/APIRepository.ts`)
   - Llamadas REST a backend
   - Requiere `VITE_API_URL` definida
   - Comunicación bidireccional

3. **GASRepository** (`src/infrastructure/repositories/GASRepository.ts`)
   - Integración directa con Google Apps Script
   - Usa `window.google.script.run`
   - Llamadas asincrónicas a funciones GAS
   - Lee/escribe Google Sheets directamente

## Decisiones de arquitectura

### Normalización en frontend
- `dataService.ts` completa campos opcionales desde base cuando falten en localStorage
- Permite cambios de estructura sin romper datos antiguos
- Crítico para mantener compatibilidad

### localStorage como staging
- Admin edita en localStorage (rápido, sin latencia)
- Deploy: snapshot se envía a GAS/API
- Próxima carga: se sincroniza desde Sheet base
- Ventaja: edición fluida sin roundtrip
- Riesgo: pérdida de cambios si no se deploya

### Bloque compartido RoadmapMosBlock
- `RoadmapMosBlock` se renderiza en 4+ lugares
- Selector local de quarter no afecta global
- Sincronizado: usa misma data de `useAppData()`
- Optimiza reutilización de lógica

### Reviews: múltiples modos
- `fuente: 'roadmap'`: usa RoadmapMosBlock
- `fuente: 'interna'`: contenido editable en formulario
- `fuente: 'embebida'`: carga URL pública en iframe
- Permite máxima flexibilidad sin duplicación

### URL embebida: reconocimiento
- Google Slides: extrae ID, adapta a URL preview, preserva slide
- PPT público: extrae URL, intenta en iframe
- Fallback: enlace para abrir en pestaña nueva
- Centralizado en `reviewEmbed.ts`

## Validaciones y restricciones

### Validación de entregables
- El mismo producto no puede pertenecer a múltiples BETs
- Cada entregable tiene iniciativa y quarter únicos en su contexto
- Estado INACTIVO nunca se muestra en vistas públicas

### Validación de reviews
- Sprint, fecha y quarter son obligatorios
- Modo embebida requiere URL válida
- Nombre se deriva automáticamente de sprint

### Validación de quarters
- Los selectores permiten solo Q1, Q2, Q3, Q4
- No existe "Ver todo" como opción de quarter

## Puntos de mantenimiento importantes

Cuando se agrega o cambia una entidad:

1. **Types:** Actualizar `src/domain/types/index.ts`
2. **Mock:** Revisar `MockRepository.ts` con datos de ejemplo
3. **Normalización:** Agregar lógica en `dataService.ts` si aplica
4. **Admin:** Agregar sección en `Admin.tsx` (grilla/modal)
5. **Vistas públicas:** Incluir visualización en Home/detalle/roadmap
6. **Validación:** Actualizar reglas en `reviewUtils.ts`
7. **Persistencia:** Agregar métodos en repositorios
8. **Deploy:** Documentar en `DEPLOYMENT.md`

## Performance

- **Code splitting:** Vite automático por ruta (lazy loading)
- **Re-renders:** useAppData() memoiza contexto
- **MOS normalization:** cacheo en dataService
- **localStorage:** lectura síncrona (crítico para UX)

## Testing (pendiente)

- Base de tests aún no implementada
- Prioridad: flujos críticos (admin, reviews, persistencia)
- Recomendación: Vitest + React Testing Library

## Próximas mejoras arquitectónicas

- [ ] Tests automatizados para flujos críticos
- [ ] Persistencia de Reviews en Google Sheet
- [ ] Backend para Jira integration en producción
- [ ] Service Worker para sincronización offline
- [ ] Caché estratégica para datos grandes
- [ ] Error boundaries para componentes críticos
- [ ] Logging centralizado para debugging en producción
