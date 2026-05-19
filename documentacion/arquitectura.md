# Arquitectura — site-3_5 (Portal Hub Blue Express)

> Última actualización: Mayo 2026

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript |
| Build | Vite 8 + `vite-plugin-singlefile` → `dist/index.html` (~1.27 MB, bundle único) |
| Linter | ESLint + eslint-plugin-react-refresh |
| Estilos | CSS-in-JS inline (modalStyles.ts + estilos por componente) |
| Estado | React hooks (`useAppData`, `usePortfolios`, contexts) |
| Backend | Google Apps Script (GAS) — Web App publicada |
| Base de datos | Firestore REST API (proyecto: `site-equipo`) |
| Auth Firestore | Service Account JWT (`firebase-adminsdk-fbsvc@site-equipo.iam.gserviceaccount.com`) |
| Deploy | `clasp push` vía npm script |

---

## Arquitectura general

```
Usuario (navegador)
    │
    │  iframe (Google Sites / URL directa)
    ▼
Google Apps Script Web App
    ├── index.html       ← SPA React compilada (viteSingleFile)
    └── Código.gs        ← Servidor: doGet() + funciones de datos
            │
            │  Firestore REST API + JWT service account
            ▼
    Firestore (project: site-equipo)
```

---

## Repositorios de datos (patrón Strategy)

```
repositoryFactory.ts
    ├── GASRepository     ← PRODUCCIÓN: google.script.run → Código.gs → Firestore
    ├── MockRepository    ← DESARROLLO LOCAL: localStorage + mockDataLocal.json
    └── APIRepository     ← NO USADO (placeholder para API REST externa futura)
```

**Selección automática:**
1. Si `window.google.script.run` existe → `GASRepository`
2. Si `VITE_API_URL` definida en `.env` → `APIRepository`
3. Si ninguna → `MockRepository`

---

## Estructura de capas (arquitectura hexagonal)

```
Regla: presentation → application → domain ← infrastructure

src/
├── domain/
│   ├── types/index.ts               ← Tipos y entidades del negocio
│   └── interfaces/
│       ├── IDataRepository.ts       ← Contrato de repositorio de datos
│       └── IPortafoliosRepository.ts
├── application/
│   ├── hooks/
│   │   ├── useAppData.ts            ← Carga y recarga de AppData
│   │   ├── usePortfolios.ts         ← Carga de portafolios
│   │   └── useAuth.ts
│   └── services/
│       ├── dataService.ts           ← Fachada principal de acceso a datos
│       ├── presentacionService.ts   ← CRUD presentaciones (localStorage + GAS)
│       ├── betMos.ts                ← Lógica bets/MOS
│       ├── reviewUtils.ts
│       └── reviewEmbed.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── repositoryFactory.ts
│   │   ├── GASRepository.ts         ← Producción (google.script.run)
│   │   ├── MockRepository.ts        ← Desarrollo local
│   │   ├── APIRepository.ts         ← No activo
│   │   ├── UsuariosRepository.ts
│   │   └── portafolios/
│   │       ├── GASPortafoliosRepository.ts
│   │       ├── MockPortafoliosRepository.ts
│   │       └── PortafoliosRepositoryFactory.ts
│   ├── adapters/dataAdapter.ts
│   └── integrations/
│       └── jira/ (no activo)
└── presentation/
    ├── App.tsx
    ├── main.tsx
    ├── contexts/
    │   ├── AuthContext.tsx
    │   ├── AuthProvider.tsx
    │   └── UnsavedChangesContext.tsx
    ├── layouts/MainLayout.tsx
    ├── hooks/useConfirm.tsx
    ├── pages/
    │   ├── Home.tsx
    │   ├── Admin.tsx                ← Panel de administración principal
    │   ├── Portafolios.tsx
    │   ├── CapacidadRoadmap.tsx
    │   ├── GrupoRoadmap.tsx
    │   ├── BusinessFlows.tsx
    │   ├── Capacitaciones.tsx
    │   ├── Equipos.tsx
    │   ├── Induccion.tsx
    │   ├── Noticias.tsx
    │   └── Login.tsx
    └── components/
        ├── AdminPanel.tsx
        ├── EditableEntregablesGrid.tsx
        ├── ReviewEditor.tsx
        ├── ReviewPresentation.tsx
        ├── ReviewMockupWorkspace.tsx
        ├── PresentacionesAdminSection.tsx
        ├── PresentacionesGrid.tsx
        ├── RoadmapMosBlock.tsx
        ├── RoadmapInitiativasBlock.tsx
        ├── PortafolioForm.tsx
        ├── CrearPortafolioForm.tsx
        ├── EquipoForm.tsx
        ├── ConfirmDialog.tsx
        ├── FeedbackModal.tsx
        ├── SyncStatus.tsx
        ├── DevRepositorySwitch.tsx
        └── modalStyles.ts
```

---

## Estructura de datos Firestore

```
portafolios/{portId}
    nombre, descripcion, activo, _orden
    equipos/{equipoId}            ← metadata: nombre, descripción

equipos/{equipoId}/
    config/main                   ← equipoId, portafolioId, titulo, año, q_activo, sprint_actual
    miembros/{id}                 ← nombre, rol, email
    capacidades/{key}             ← nombre, descripcion, responsable
    aplicaciones/{id}             ← nombre, url, tipo
    bets/{id}                     ← titulo, producto, quarter
    mos/{id}                      ← indicador, meta, betId
    iniciativas/{id}              ← titulo, tag, entregables[] (nested)
    stakeholders/{id}             ← nombre, email, rol, quarter
    businessFlows/{id}            ← nombre, url, descripcion
    reviews/{id}                  ← titulo, fecha, estructura nested
    capacitaciones/{id}           ← titulo, url, fecha
    presentaciones/{id}           ← titulo, url, descripcion, fechaCreacion
    salud/{id}

usuarios/{userId}                 ← email, nombre, rol, activo, canConfigure
```

---

## Proyecto GAS (clasp)

**Path local:** `C:\Bluex\proyectos\abril-2026\site-equipo-planificacion-gas`

**Archivos del proyecto:**
- `appsscript.json` — manifiesto GAS
- `Code.gs` — stub vacío (la lógica real se pega manualmente desde `documentacion/Código-apps-script.gs`)
- `index.html` — SPA React compilada (generada por `npm run deploy`)

**Script de deploy:**
```bash
npm run deploy
# = tsc -b && vite build && xcopy dist\index.html ..\site-equipo-planificacion-gas\index.html && clasp push
```

