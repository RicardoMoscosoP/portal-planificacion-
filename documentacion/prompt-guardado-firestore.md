# Prompt: Implementar guardado real a Firestore desde la sección Admin

## Contexto del proyecto

React 19 + TypeScript + Vite → compilado a `dist/index.html` (viteSingleFile) → embebido en Google Apps Script.

**Stack**:
- Frontend: React, arquitectura hexagonal (`src/application/`, `src/domain/`, `src/infrastructure/`)
- Backend GAS: `documentacion/Código.gs` — se copia manualmente a Apps Script
- Base de datos: Firestore vía REST (ServiceAccountApp JWT)
- Repositorio en producción: `GASRepository` (usa `google.script.run`)

## Problema actual

En entorno GAS (producción), **ningún guardado del Admin Panel persiste en Firestore**.

### Causa

Todas las funciones de guardado en `src/application/services/dataService.ts` escriben solo en `localStorage`:

```ts
export const saveConfig = (config: AppData['config']): void => {
  writeLS(LS_CONFIG, config);   // ← solo localStorage, no Firestore
  notifyDirty();
};

export const saveIniciativa = (ini): void => {
  // ... lista de localStorage
  writeLS(LS_INICIATIVAS, list);
  notifyDirty();
};
// idem para: saveBet, deleteBet, saveMOS, deleteMOS,
// saveTeamMember, deleteTeamMember, saveCapacidades,
// saveAplicacion, deleteAplicacion, saveStakeholder, deleteStakeholder,
// saveBusinessFlow, deleteBusinessFlow, saveReview, deleteReview,
// saveEntregable, deleteEntregable
```

En GAS el localStorage se resetea en cada sesión → los cambios se pierden al recargar.

`GASRepository.syncToSheet()` llama a `syncConfigData` y `syncSheetData` que **no existen** en `Código.gs`.

### Flujo de datos en Firestore

```
equipos/{equipoId}/config/main          ← config general del equipo
equipos/{equipoId}/miembros/{id}        ← team members
equipos/{equipoId}/capacidades/{key}    ← capacidades (key es el id)
equipos/{equipoId}/aplicaciones/{id}
equipos/{equipoId}/bets/{id}
equipos/{equipoId}/mos/{id}
equipos/{equipoId}/iniciativas/{id}
equipos/{equipoId}/entregables/{id}
equipos/{equipoId}/stakeholders/{id}
equipos/{equipoId}/businessFlows/{id}
equipos/{equipoId}/reviews/{id}
equipos/{equipoId}/salud/{id}
equipos/{equipoId}/capacitaciones/{id}
```

`firestoreSet(collectionPath, docId, data, token)` ya existe en `Código.gs` y hace PATCH a Firestore.

## Solución requerida

### Paso 1: Agregar funciones genéricas en `documentacion/Código.gs`

Agregar al final del archivo (antes del cierre):

```javascript
/**
 * Guarda un documento individual en una subcolección del equipo.
 * Llamado desde GASRepository para persistir cambios en Firestore.
 * @param {string} equipoId  - ID del equipo (ej: 'eq_planificacion')
 * @param {string} coleccion - Nombre de la subcolección (ej: 'miembros', 'bets', 'config')
 * @param {string} docId     - ID del documento (ej: 'eq_001', 'bet_q2_01', 'main')
 * @param {Object} data      - Datos a guardar
 * @returns {string} JSON { ok: boolean, error?: string }
 */
function guardarDocumento(equipoId, coleccion, docId, data) {
  try {
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
    var collPath = 'equipos/' + equipoId + '/' + coleccion;
    firestoreSet(collPath, docId, Object.assign({}, data, { equipoId: equipoId }), token);
    return JSON.stringify({ ok: true });
  } catch(e) {
    return JSON.stringify({ ok: false, error: e.toString() });
  }
}

/**
 * Elimina un documento de una subcolección del equipo.
 * @param {string} equipoId
 * @param {string} coleccion
 * @param {string} docId
 * @returns {string} JSON { ok: boolean, error?: string }
 */
function eliminarDocumento(equipoId, coleccion, docId) {
  try {
    var token = ServiceAccountApp.getAccessToken(CONFIG.client_email, CONFIG.private_key, 'https://www.googleapis.com/auth/datastore');
    var url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.project_id + '/databases/(default)/documents/equipos/' + equipoId + '/' + coleccion + '/' + docId;
    UrlFetchApp.fetch(url, {
      method: 'delete',
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    return JSON.stringify({ ok: true });
  } catch(e) {
    return JSON.stringify({ ok: false, error: e.toString() });
  }
}
```

### Paso 2: Agregar helper en `src/infrastructure/repositories/GASRepository.ts`

Agregar métodos al final de la clase `GASRepository`, DENTRO del cuerpo de la clase, antes del cierre `}`:

```ts
  private async guardarDocumentoGAS(
    equipoId: string,
    coleccion: string,
    docId: string,
    data: object
  ): Promise<void> {
    const raw = await gasRun<string>('guardarDocumento', equipoId, coleccion, docId, data);
    const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!result?.ok) throw new Error(result?.error || `Error guardando ${coleccion}/${docId}`);
  }

  private async eliminarDocumentoGAS(
    equipoId: string,
    coleccion: string,
    docId: string
  ): Promise<void> {
    const raw = await gasRun<string>('eliminarDocumento', equipoId, coleccion, docId);
    const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!result?.ok) throw new Error(result?.error || `Error eliminando ${coleccion}/${docId}`);
  }
```

Y sobrescribir `syncToSheet` en `GASRepository`:

```ts
  override async syncToSheet(data: Partial<AppData> & { _equipoId?: string }): Promise<{ ok: boolean; entities: string[] }> {
    const eId = data._equipoId || 'eq_planificacion';
    const entities: string[] = [];
    const promises: Promise<void>[] = [];

    if (data.config) {
      promises.push(this.guardarDocumentoGAS(eId, 'config', 'main', data.config));
      entities.push('config');
    }

    const colMap: Record<string, { col: string; idField: string } | null> = {
      equipo:        { col: 'miembros',       idField: 'id'  },
      capacidades:   { col: 'capacidades',    idField: 'key' },
      aplicaciones:  { col: 'aplicaciones',   idField: 'id'  },
      bets:          { col: 'bets',           idField: 'id'  },
      mos:           { col: 'mos',            idField: 'id'  },
      iniciativas:   { col: 'iniciativas',    idField: 'id'  },
      entregables:   { col: 'entregables',    idField: 'id'  },
      stakeholders:  { col: 'stakeholders',   idField: 'id'  },
      businessFlows: { col: 'businessFlows',  idField: 'id'  },
      reviews:       { col: 'reviews',        idField: 'id'  },
      salud:         { col: 'salud',          idField: 'id'  },
      capacitaciones:{ col: 'capacitaciones', idField: 'id'  },
    };

    for (const [key, meta] of Object.entries(colMap)) {
      if (!meta) continue;
      const items = (data as any)[key] as any[] | undefined;
      if (!items?.length) continue;
      for (const item of items) {
        const docId = item[meta.idField] || item.id;
        if (!docId) continue;
        promises.push(this.guardarDocumentoGAS(eId, meta.col, docId, item));
      }
      entities.push(key);
    }

    await Promise.all(promises);
    return { ok: true, entities };
  }
```

### Paso 3: Modificar `src/application/services/dataService.ts`

Detectar entorno GAS en cada función de guardado y llamar a `repository.syncToSheet()` inmediatamente.

**Patrón a aplicar** — reemplazar CADA función `save*` y `delete*`:

```ts
// ANTES:
export const saveConfig = (config: AppData['config']): void => {
  writeLS(LS_CONFIG, config);
  notifyDirty();
};

// DESPUÉS:
export const saveConfig = (config: AppData['config'], equipoId = 'eq_planificacion'): void => {
  writeLS(LS_CONFIG, config);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ config, _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};
```

**Aplicar el mismo patrón a todas estas funciones**, usando la colección y campo ID correcto:

| Función           | Colección GAS   | Acción  |
|-------------------|-----------------|---------|
| `saveConfig`      | config/main     | upsert  |
| `saveIniciativa`  | iniciativas     | upsert  |
| `deleteIniciativa`| iniciativas     | delete  |
| `saveBet`         | bets            | upsert  |
| `deleteBet`       | bets            | delete  |
| `saveMOS`         | mos             | upsert  |
| `deleteMOS`       | mos             | delete  |
| `saveTeamMember`  | miembros        | upsert  |
| `deleteTeamMember`| miembros        | delete  |
| `saveCapacidades` | capacidades     | upsert todos |
| `saveAplicacion`  | aplicaciones    | upsert  |
| `deleteAplicacion`| aplicaciones    | delete  |
| `saveStakeholder` | stakeholders    | upsert  |
| `deleteStakeholder`| stakeholders   | delete  |
| `saveBusinessFlow`| businessFlows   | upsert  |
| `deleteBusinessFlow`| businessFlows | delete  |
| `saveReview`      | reviews         | upsert  |
| `deleteReview`    | reviews         | delete  |
| `saveEntregable`  | entregables     | upsert  |
| `deleteEntregable`| entregables     | delete  |

Para las funciones `delete*`, el patrón es:

```ts
export const deleteIniciativa = (id: string, equipoId = 'eq_planificacion'): void => {
  const saved = readLS<AppData['iniciativas']>(LS_INICIATIVAS);
  if (saved) writeLS(LS_INICIATIVAS, saved.filter(i => i.id !== id));
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    gasRun('eliminarDocumento', equipoId, 'iniciativas', id).catch(console.error);
  } else {
    notifyDirty();
  }
};
```

Para `saveCapacidades` (guarda el array completo, `key` es el docId):

```ts
export const saveCapacidades = (capacidades: AppData['capacidades'], equipoId = 'eq_planificacion'): void => {
  writeLS(LS_CAPACIDADES, capacidades);
  const isGAS = typeof window !== 'undefined' && (window as any)?.google?.script !== undefined;
  if (isGAS) {
    repository.syncToSheet({ capacidades, _equipoId: equipoId } as any).catch(console.error);
  } else {
    notifyDirty();
  }
};
```

## Archivos a modificar

1. `documentacion/Código.gs` — agregar `guardarDocumento()` y `eliminarDocumento()`
2. `src/infrastructure/repositories/GASRepository.ts` — agregar helpers privados y sobrescribir `syncToSheet`
3. `src/application/services/dataService.ts` — actualizar todas las funciones `save*` y `delete*`

## Validación esperada

Después de implementar y compilar (`npm run build`):
1. Copiar `Código.gs` → Apps Script
2. Copiar `dist/index.html` → Apps Script index.html
3. Desplegar nueva versión
4. Abrir sitio → Admin → Configuración General → cambiar `sprint_actual` → Guardar
5. Recargar página → el valor debe persistir (viene de Firestore, no localStorage)
6. Admin → Iniciativas → Agregar nueva iniciativa → Guardar
7. Recargar → la iniciativa debe aparecer
8. Equipo → Agregar miembro → Guardar → recargar → debe persistir

## Notas importantes

- `gasRun` ya está definido en `GASRepository.ts` como función local (no método) — las funciones delete deben importarlo o replicar el patrón
- El `equipoId` debe propagarse desde el contexto de la app. Actualmente se puede leer de `data.config.equipoId` o hardcodear `'eq_planificacion'` como default
- Las funciones GAS `guardarDocumento` y `eliminarDocumento` generan un JWT nuevo por llamada — si se hacen muchas operaciones en paralelo puede ser lento pero no causa timeout (es 1 llamada, no un seed completo)
- En local dev (MockRepository), el comportamiento de localStorage se mantiene igual — sin cambios
