# Pendientes — Portal Hub Blue Express

> Actualizado: 18 Mayo 2026
> Solo contiene ítems pendientes. Para historial de completados ver los commits de git.

---

## PRIORIDAD 0 — Análisis y evolución arquitectónica [CRÍTICO]

> Estas tareas definen el futuro del proyecto. Deben resolverse antes de seguir agregando features.

---

### P0.1 — Revisión general del proyecto: performance y problemas potenciales

**Objetivo:** identificar todos los puntos de mejora técnica, priorizados de más a menos crítico.

**Problemas identificados (ordenados por criticidad):**

| # | Problema | Criticidad | Impacto |
|---|---|---|---|
| 1 | **Sin aislamiento a nivel de DB**: los datos de equipos se separan por `equipoId` en el código, pero Firestore no tiene reglas de seguridad que lo enforzen. Cualquier llamada con un `equipoId` válido puede leer/escribir datos de otro equipo. | 🔴 CRÍTICO | Seguridad / integridad de datos |
| 2 | **Clave privada del service account expuesta en GAS**: la private key del JWT está en las propiedades del script GAS. Si el script es compartido o auditado, la key queda expuesta. | 🔴 CRÍTICO | Seguridad |
| 3 | **Bundle único de 1.27 MB sin lazy loading**: toda la app carga al inicio. Vite está configurado con `vite-plugin-singlefile` que deshabilita el code splitting. A medida que la app crece, el tiempo de carga aumentará linealmente. | 🟠 ALTO | Performance |
| 4 | **localStorage como staging sin TTL ni versioning**: los datos en localStorage pueden quedar desincronizados con Firestore indefinidamente. No hay mecanismo de invalidación ni timestamp de última sincronización. | 🟠 ALTO | Consistencia de datos |
| 5 | **Llamadas GAS secuenciales (no paralelas)**: `google.script.run` no soporta paralelismo real. Cada llamada toma 2-5 segundos. Cargar un equipo con muchas subcolecciones bloquea el UI. | 🟠 ALTO | Performance / UX |
| 6 | **Sin paginación**: toda la data de un equipo se carga de una vez desde Firestore. Si un equipo tiene cientos de iniciativas o reviews, el payload crece sin control. | 🟠 ALTO | Performance / escalabilidad |
| 7 | **Entregables como array nested dentro de iniciativas**: `iniciativas/{id}` contiene `entregables: []` dentro del documento. Esto limita el tamaño del documento y complica queries de entregables independientes. | 🟡 MEDIO | Modelado de datos |
| 8 | **Sin error boundaries en React**: si un componente falla (datos malformados, campo null), toda la app crashea sin mensaje de error útil. | 🟡 MEDIO | Resiliencia |
| 9 | **Sin optimistic updates consistentes**: solo `PresentacionesAdminSection` hace update optimista del estado React. El resto espera el roundtrip GAS (2-5s) para reflejar cambios. | 🟡 MEDIO | UX |
| 10 | **Sin soporte offline**: al usar Firestore vía REST API (no SDK), no hay cache offline ni Service Worker. Si la conexión cae, la app falla sin feedback claro. | 🟡 MEDIO | Resiliencia |
| 11 | **IDs en español y con timestamp**: `pres_1715432100000`, `bet_xxx`, `ini_xxx` — dificultan legibilidad en logs y queries. Si se migra a API independiente, los IDs deben ser más semánticos o usar Firestore auto-IDs. | 🟡 MEDIO | Mantenibilidad |
| 12 | **Sin tests automatizados**: ningún flujo crítico tiene cobertura de tests. | 🟢 BAJO | Mantenibilidad |

**Acción requerida:** revisar cada punto, decidir orden de implementación y crear sub-tareas en este documento.

---

### P0.2 — Análisis y rediseño de colecciones Firestore

**Objetivo:** tener un esquema de datos robusto, en inglés, con atributos de auditoría, IDs semánticos e índices correctos — listo para crecer hacia una API independiente.

#### A — Migración de nombres de colecciones a inglés

> ⏸️ **Diferido a P0.3** — Hacer en el mismo corte que la migración a API independiente.
> Cambiar los nombres sin migrar los datos en Firestore rompe la app. Requiere script de migración.

| Actual (ES) | Propuesto (EN) | Notas |
|---|---|---|
| `portafolios` | `portfolios` | |
| `equipos` | `teams` | |
| `miembros` | `members` | |
| `capacidades` | `capabilities` | |
| `aplicaciones` | `applications` | |
| `iniciativas` | `initiatives` | |
| `stakeholders` | `stakeholders` | ya en inglés |
| `businessFlows` | `business_flows` | normalizar a snake_case |
| `reviews` | `reviews` | ya en inglés |
| `capacitaciones` | `trainings` | |
| `presentaciones` | `presentations` | |
| `salud` | `health` | |
| `usuarios` | `users` | |
| `bets` | `bets` | ya en inglés |
| `mos` | `metrics` o `mos` | evaluar |
| `config` | `config` | mantener |

#### B — Atributos de auditoría faltantes (agregar a TODOS los documentos)

| Campo | Tipo | Descripción |
|---|---|---|
| `createdAt` | Timestamp ISO 8601 | Fecha/hora de creación del documento |
| `updatedAt` | Timestamp ISO 8601 | Fecha/hora de última modificación |
| `createdBy` | string (email) | Email del usuario que creó el documento |
| `updatedBy` | string (email) | Email del usuario que lo modificó por última vez |
| `isActive` | boolean | Soft delete: `false` = eliminado lógicamente |

**Impacto:** el frontend debe incluir estos campos al guardar (desde `AuthContext.currentUser.email`). El backend (GAS hoy, API mañana) debe inyectarlos si no vienen.

#### C — Revisión de IDs por colección

| Colección | ID actual | Propuesto | Motivo |
|---|---|---|---|
| portfolios | `port_distribucion` | mantener o UUID | El ID semántico está bien para top-level |
| teams | `ep_xxx` | `team_{slug}` o auto-ID | Más legible |
| presentations | `pres_1715432100000` | auto-ID Firestore | Timestamp como ID es frágil (colisiones, no ordenable por Firestore natively) |
| initiatives | `ini_xxx` | auto-ID Firestore | |
| members | `mbr_xxx` | auto-ID Firestore | |
| bets | `bet_xxx` | `bet_{slug}` o auto-ID | |
| metrics/mos | `mos_xxx` | auto-ID Firestore | |

#### D — Índices compuestos necesarios en Firestore

| Colección | Campos del índice | Tipo | Caso de uso |
|---|---|---|---|
| `teams/{teamId}/initiatives` | `quarter ASC`, `createdAt DESC` | Compuesto | Listar iniciativas por quarter, ordenadas por fecha |
| `teams/{teamId}/reviews` | `quarter ASC`, `date DESC` | Compuesto | Listar reviews del quarter más reciente primero |
| `teams/{teamId}/presentations` | `createdAt DESC` | Simple | Listado de presentaciones |
| `teams/{teamId}/members` | `role ASC`, `name ASC` | Compuesto | Listar miembros agrupados por rol |
| `users` | `portfolioId ASC`, `isActive ASC` | Compuesto | Usuarios activos por portafolio |

#### E — Reestructura de entregables (sacar del nested array)

**Situación actual:** `initiatives/{id}` tiene campo `entregables: []` (array de objetos) dentro del documento.

**Problema:** 
- Límite de 1 MB por documento en Firestore
- No se pueden hacer queries sobre entregables individuales
- No se puede paginar ni filtrar entregables sin cargar toda la iniciativa

**Propuesto:** subcollección independiente
```
teams/{teamId}/initiatives/{initiativeId}/deliverables/{deliverableId}
    title: string
    status: 'pending' | 'in-progress' | 'done' | 'cancelled'
    url?: string
    dueDate?: string
    assignee?: string
    createdAt: Timestamp
    updatedAt: Timestamp
    createdBy: string
    updatedBy: string
```

---

### P0.3 — Plan de evolución arquitectónica: Front + API + DB sin AppScript

**Objetivo:** que el sitio funcione sin depender de Google Apps Script. Arquitectura objetivo:

```
Browser (React SPA)
    │
    │  fetch() / axios → REST API con JWT propio
    ▼
API REST (Node.js / Express o similar)
    ├── Autenticación propia (no Google OAuth de GAS)
    ├── Validación de permisos por portfolio y team
    ├── Reglas: un usuario solo puede leer/escribir su team
    └── Inyecta createdBy, updatedBy, timestamps automáticamente
    │
    │  Firebase Admin SDK (no REST API manual)
    ▼
Firestore (o cualquier DB documental)
    ├── portfolios/
    └── teams/{teamId}/...
```

**Principios:**
- **Aislamiento total**: cada portafolio es un tenant. La API valida que el usuario pertenezca al team antes de cualquier operación.
- **Agnóstica de base de datos**: la API usa el patrón repositorio. Cambiar de Firestore a MongoDB no requiere tocar la API ni el frontend.
- **Frontend desacoplado**: el frontend llama solo endpoints REST. No importa si el backend es GAS, Node, Python, etc.
- **Arquitectura hexagonal mantenida**: `domain → application → infrastructure`. La capa de infraestructura cambia (de GASRepository a APIRepository), el dominio y la aplicación no cambian.

**Pasos de migración:**

| Paso | Descripción | Prioridad |
|---|---|---|
| 1 | Definir contratos de API (OpenAPI/Swagger) para cada colección | Antes de codificar |
| 2 | Implementar `APIRepository` (ya existe el stub) que reemplaza a `GASRepository` | Alta |
| 3 | Crear API REST con autenticación propia (JWT o session) | Alta |
| 4 | Implementar reglas de Firestore Security Rules (interim mientras existe GAS) | Alta |
| 5 | Migrar el frontend para que `APIRepository` sea el repositorio de producción | Media |
| 6 | Deprecar GAS como backend de datos (mantener solo para doGet del HTML si aplica) | Baja |

**Variable de activación (ya preparada):**
```env
# .env.production
VITE_API_URL=https://mi-api.example.com/api/v1
```
Cuando `VITE_API_URL` esté definida, `repositoryFactory.ts` activa `APIRepository`.

---

## PRIORIDAD 1 — Funcionalidades pendientes activas

### TAREA 1.A — Roadmap por Capacidad: terminar implementación
- La página `CapacidadRoadmap.tsx` necesita completar lógica y visualización.
- **Estado:** ⬜️ PENDIENTE

### TAREA 1.B — Flujos de Negocio: mejorar apertura de URL
- Mejorar UX al abrir una URL (modal con preview o nueva pestaña más clara).
- **Estado:** ⬜️ PENDIENTE

### TAREA 1.C — Capacitaciones: mejorar apertura de URL
- Mismo patrón que Flujos de Negocio.
- **Estado:** ⬜️ PENDIENTE

### TAREA 1.D — Entregables: agregar campo URL + modal más grande
- Agregar `url?: string` a `EntregableItem` en `domain/types/index.ts`.
- Agrandar el modal en `EditableEntregablesGrid.tsx`.
- **Estado:** ⬜️ PENDIENTE

---

## PRIORIDAD 2 — Admin UX

### TAREA 2.1 — No volver al menú lateral después de guardar
- Permanecer en la sección activa tras guardar cualquier formulario en Admin.
- **Estado:** ⬜️ PENDIENTE

### TAREA 2.2 — Mejorar íconos del menú lateral
- Íconos más representativos y consistentes por sección.
- **Estado:** ⬜️ PENDIENTE

### TAREA 2.3 — Editar portafolios y equipos desde AdminPanel
- Permitir editar nombre y descripción. No eliminar.
- El backend ya soporta update si el objeto tiene `id`.
- **Estado:** ⬜️ PENDIENTE

---

## PRIORIDAD 3 — Dominio y reglas de negocio

### TAREA 3.1 — Roles canónicos del equipo (constante en domain)

**Roles requeridos:**

| Código | Descripción (UI) |
|---|---|
| `tech_leader` | Tech Leader |
| `product_owner` | Product Owner |
| `iteration_manager` | Iteration Manager |
| `fullstack_frontend` | Full Stack / Front End |
| `datos_analytics` | Datos / Analytics |

**Implementación:**
1. Constante `ROLES_EQUIPO` en `src/domain/types/index.ts`
2. `EquipoSection` en `Admin.tsx`: `<select>` iterando `ROLES_EQUIPO`
3. Tarjetas de equipo: `ROLES_EQUIPO.find(r => r.codigo === m.rol)?.descripcion ?? m.rol`

**Estado:** ⬜️ PENDIENTE

### TAREA 3.2 — Usuarios: sección visible solo en "Portafolio Distribución"

- Filtrar `OTROS_SECTIONS` excluyendo `'usuarios'` si `portafolioId !== 'port_distribucion'`.
- Bloquear render si se accede directo a `section === 'usuarios'` desde otro portafolio.
- **Archivos:** `Admin.tsx`, `App.tsx`
- **Estado:** ⬜️ PENDIENTE

---

## ANÁLISIS PENDIENTE — Cómo medir "Estado del Quarter" (tarjeta AVANCE)

La tarjeta **AVANCE** en `Home.tsx` siempre muestra 0% porque ninguna iniciativa tiene `tag === 'done'` en datos reales.

| Opción | Criterio | Pros | Contras |
|---|---|---|---|
| A | `tag === 'done'` por iniciativa | Simple | Requiere disciplina manual del equipo |
| B | Entregables completados vs totales | Granular | Requiere campo `completado` en cada entregable |
| C | Posición del día en el trimestre | Automático, sin esfuerzo | No refleja avance real |
| **D (recomendada)** | Híbrida: A si hay done, C como fallback | Siempre muestra algo | Algo de complejidad |

**Decisión pendiente:**
- [ ] Confirmar con el equipo qué opción adoptar
- [ ] Si A o D: agregar acción en `Admin.tsx` para marcar iniciativas como `done`
- [ ] Implementar en `Home.tsx` una vez decidido
