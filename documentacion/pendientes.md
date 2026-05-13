# Pendientes — Portal Hub Blue Express

> Actualizado: 11 Mayo 2026.

---

## BLOQUE 0 — Mejoras UI

### TAREA 0.2 — Mejorar íconos del menú lateral

- Usar íconos más representativos y consistentes por sección (Roadmap, Reviews, Presentaciones, etc.)
- **Estado:** ⬜️ PENDIENTE

---

## BLOQUE 1 — Panel de Administración

### TAREA 1.2 — Agregar opción de edición en mantenedor de portafolios

- Permitir editar nombre y descripción de portafolios/equipos desde AdminPanel (nunca eliminar).
- Backend ya soporta update si el objeto tiene `id` — solo falta la UI.
- **Estado:** ⬜️ PENDIENTE

---

## BLOQUE 2 — Admin.tsx UX post-guardado

### TAREA 2.1 — No volver al menú lateral después de guardar

- Al guardar en cualquier sección del Admin, permanecer en la sección activa.
- **Estado:** ⬜️ PENDIENTE

---

## BLOQUE 3 — Roles del equipo

### TAREA 3.1 — Definir roles canónicos (sin colección Firestore)

**Roles requeridos:**

| Código | Descripción (UI) |
|--------|-----------------|
| `tech_leader` | Tech Leader |
| `product_owner` | Product Owner |
| `iteration_manager` | Iteration Manager |
| `fullstack_frontend` | Full Stack / Front End |
| `datos_analytics` | Datos / Analytics |

**Implementación:**
1. Agregar constante `ROLES_EQUIPO` en `src/domain/types/index.ts`
2. En `EquipoSection` de `Admin.tsx`: reemplazar input libre por `<select>` que itera `ROLES_EQUIPO`
3. En tarjetas de equipo (Home, Bienvenida): usar `ROLES_EQUIPO.find(r => r.codigo === member.rol)?.descripcion ?? member.rol`

**Archivos:** `src/domain/types/index.ts`, `src/presentation/pages/Admin.tsx`
**Estado:** ⬜️ PENDIENTE

---

## BLOQUE 4 — Usuarios: solo en "Portafolio Distribución"

### TAREA 4.1 — Ocultar sección Usuarios para otros portafolios

- La sección "Usuarios" SOLO aparece cuando el portafolio activo es `port_distribucion`.
- Filtrar `OTROS_SECTIONS` excluyendo `'usuarios'` si `portafolioId !== 'port_distribucion'`.
- Bloquear render si se accede directo a `section === 'usuarios'` desde otro portafolio.

**Archivos:** `src/presentation/pages/Admin.tsx`, `src/App.tsx`
**Estado:** ⬜️ PENDIENTE

---

## ANÁLISIS — Cómo medir "Estado del Quarter" (tarjeta AVANCE)

### Problema actual

La tarjeta **AVANCE** siempre muestra 0% porque ninguna iniciativa tiene `tag === 'done'` en los datos reales. La fórmula actual es:

```
progressPercent = Math.round((iniciativasDone / totalIniciativas) * 100)
donde iniciativasDone = iniciativas con tag === 'done' en el quarter activo
```

### Causa raíz

Los datos en Firestore tienen todas las iniciativas con `tag: 'plan'` o `tag: 'wip'`. Nadie las actualiza a `'done'` cuando terminan.

### Opciones de medición (evaluar con el equipo)

#### Opción A — Tag de iniciativa (actual, requiere disciplina manual)
- Criterio: `tag === 'done'`
- Fórmula: `(done / total) * 100`
- Pros: Simple, visible, fácil de entender
- Contras: Requiere que el equipo marque las iniciativas como done activamente
- **Acción necesaria:** Crear flujo en Admin para actualizar el `tag` de una iniciativa

#### Opción B — Avance por entregables (más granular)
- Criterio: entregables completados vs totales dentro de las iniciativas del quarter
- Fórmula: `(entregables.filter(e => e.completado).length / entregables.filter(e => pertenece a ini del Q).length) * 100`
- Pros: Más fino, refleja trabajo real incremental
- Contras: Requiere que los entregables estén cargados y actualizados en Firestore

#### Opción C — Avance temporal del quarter (automático, sin acción del equipo)
- Criterio: posición del día actual dentro del trimestre
- Fórmula: ya implementada en `getQuarterProgress()` del sidebar
- Pros: Siempre actualizado, sin esfuerzo
- Contras: No refleja avance real del trabajo, solo el tiempo transcurrido
- **Nota:** Ya se usa esta lógica para la barra de progreso del header. Se podría reutilizar aquí como fallback.

#### Opción D — Híbrida recomendada
```
Si hay al menos 1 iniciativa con tag done → usar Opción A
Si no hay ninguna done pero sí wip → mostrar avance temporal (Opción C) con nota "En curso"
Si no hay iniciativas → mostrar 0% con mensaje "Sin datos"
```

### Decisión pendiente

- [ ] Confirmar con el equipo qué opción se adopta
- [ ] Si Opción A o B: agregar en Admin.tsx un botón/acción para marcar iniciativas como `done`
- [ ] Si Opción B: verificar que `entregables` llegan correctamente desde Firestore con campo `completado: boolean`
- [ ] Implementar lógica en `Home.tsx` una vez decidido

---

## VALIDACIÓN — Estructura JSON para Presentaciones (GAS)

### Estado: ✅ Estructura válida y lista para producción

**Colección Firestore:** `presentaciones`

**Campos del documento:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string | ✅ | Prefijo `pres_` + timestamp. Ej: `pres_1715432100000` |
| `titulo` | string | ✅ | Nombre visible de la presentación |
| `descripcion` | string | ✅ | Texto descriptivo corto |
| `fechaCreacion` | string (ISO 8601) | ✅ | Ej: `"2026-05-11T15:30:00.000Z"` |
| `url` | string | ✅ | URL completa de Google Slides o similar |
| `capacidad` | string | ⬜️ Opcional | Nombre de la capacidad asociada |

**Ejemplo JSON válido para guardar en Firestore:**
```json
{
  "id": "pres_1715432100000",
  "titulo": "Review Q2 - Capacidad Distribución",
  "descripcion": "Presentación de avance del quarter 2 para stakeholders.",
  "fechaCreacion": "2026-05-11T15:30:00.000Z",
  "url": "https://docs.google.com/presentation/d/1ABC.../edit",
  "capacidad": "Distribución"
}
```

**Flujo GAS validado:**

- **Crear:** `adminCrear('presentaciones', objeto)` → genera `id = pres_<timestamp>` si no viene en el objeto → guarda en Firestore
- **Actualizar:** `adminActualizar('presentaciones', id, campos)` → `fsUpdateFields('presentaciones', id, campos)`
- **Eliminar:** `adminEliminar('presentaciones', id)` → `fsDeleteDocument('presentaciones', id)`
- **Leer (viewer):** `obtenerPresentaciones()` → `fsListCollection('presentaciones')` ordenado por `fechaCreacion` DESC

**Verificaciones pendientes antes de deploy a producción:**

- [ ] Ejecutar en `gas-admin` una prueba manual de `adminCrear('presentaciones', {...})` desde el editor de Apps Script
- [ ] Verificar que `fsListCollection('presentaciones')` retorna los campos correctamente (sin omitir `url` ni `capacidad`)
- [ ] Confirmar que `gas-viewer/WebApp.gs` expone el case `'presentaciones'` — **YA ESTÁ**: `case 'presentaciones': data = obtenerPresentaciones(); break;`
- [ ] Si se activa la carga real desde Firestore en el app (hoy usa localStorage), agregar `presentaciones` al `obtenerDatosEquipo()` del `gas-viewer` para que llegue junto con el resto de la data

**Nota importante:** Hoy `getPresentaciones()` solo lee de `localStorage`. Si el usuario recarga o accede desde otro navegador, no verá las presentaciones guardadas. Para producción hay que agregar `presentaciones` al flujo de carga inicial del equipo en `ViewerDataLayer.gs → obtenerDatosEquipo()`.

