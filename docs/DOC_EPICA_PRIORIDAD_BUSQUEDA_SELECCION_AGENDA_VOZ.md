# Épica: Prioridad, Búsqueda Ultra-Rápida, Selección Múltiple, Agendamiento e IA por Voz

Este documento resume los cambios recientes realizados en la API FastAPI de **Modelo Local de IA**, y cómo usarlos desde el front/IA.

Incluye:

- Servicio de **prioridad de proveedores** e **inmuebles destacados**.
- Motor de **búsqueda ultra-rápida** con afinidad.
- **Selección múltiple** de inmuebles reutilizable entre módulos.
- **Agendamiento inteligente** de citas.
- Capa de **IA por voz**, reutilizando el NLP textual.

---

## 1. Prioridad de proveedores e inmuebles destacados

### Archivos clave

- `integrations/providers/priority.py`
- `integrations/providers/highlight.py`
- `integrations/providers/registry.py`
- `app/api/v1/routes_providers_admin.py`

### Endpoints administrativos

- `GET /v1/providers/priority`  → obtiene orden de prioridad de proveedores.
- `PUT /v1/providers/priority`  → actualiza el orden, persistiendo en `data/config/providers_priority.json`.
- `GET /v1/providers/highlights` → lista inmuebles destacados (`source`, `source_id`, `weight`).
- `PUT /v1/providers/highlights` → crea/actualiza destacados.

### Efecto en la API

El orden y destacados afectan a:

- `GET /v1/providers/properties`
- `POST /v1/providers/properties` (si se amplía)
- `POST /v1/nlp/buscar`
- `POST /v1/nlp/chat`
- `POST /v1/buscar` (búsqueda estructurada vía `SearchEngine`)

Ranking aplicado (por defecto):

1. Peso de destacado (`weight`) descendente.
2. Prioridad de proveedor.
3. Orden estable por `source_id`.

---

## 2. Motor de búsqueda ultra-rápida y afinidad

### Archivos clave

- `integrations/search/engine.py` → `SearchEngine`.
- `integrations/affinity/engine.py` → `AffinityEngine`.
- `app/api/v1/routes_inmuebles.py` → integra el motor en `/v1/buscar`.
- `app/api/v1/routes_nlp.py` → integra afinidad en NLP.

### `SearchEngine`

- Carga inmuebles unificados desde proveedores (vía `fetch_all_properties`).
- Mantiene una lista en memoria de `UnifiedProperty`.
- Filtros soportados (en memoria):
  - `tipo` (vía `raw["tipo"]`),
  - `ciudad`,
  - `habitaciones_min`, `banos_min`,
  - `precio_min`, `precio_max`,
  - `area_min`, `area_max`.
- Ordena resultados combinando:
  - prioridad de proveedor + inmuebles destacados (via `rank_properties`),
  - `affinity_score` (0–100) calculado por `AffinityEngine` a partir de los **criterios originales**.

### Afinidad (`AffinityEngine`)

- Configurable en `data/config/affinity_config.json`:
  - Pesos por campo (`weight_price`, `weight_bedrooms`, etc.).
  - Niveles (`level_medium`, `level_high`, `level_very_high`, etc.).
- Calcula `affinity_score` (0–100) y `affinity_level` (`very_low` ... `very_high`).

### Búsqueda estructurada `/v1/buscar`

- Endpoint: `POST /v1/buscar`.
- Recibe criterios JSON (tipo, ciudad, precio, habitaciones, etc.).
- Ahora usa `SearchEngine` en memoria.
- Respuesta incluye:
  - `total_encontrados`, `total_retornados`.
  - `estadisticas` basadas en precio.
  - `resultados`: items provenientes de `UnifiedProperty.raw`, enriquecidos con:
    - `affinity_score` y `affinity_level`.

### Búsqueda NLP `/v1/nlp/buscar` y `/v1/nlp/chat`

- Los endpoints NLP:
  - infieren criterios por reglas + modelo NLP.
  - ejecutan búsqueda (modelo tabular actual) y relajan filtros si es necesario.
  - ordenan por similitud de texto (TF‑IDF) y prioridades/destacados.
  - calculan `affinity_score` y `affinity_level` usando los criterios originales.
- Si no hay resultados ni relajando filtros, `/v1/nlp/buscar` devuelve **sugerencias por afinidad**, no una lista vacía.

Ejemplo rápido:

```json
POST /v1/nlp/buscar
{
  "texto": "Quiero un apartamento en Cali, 3 habitaciones, con parqueadero, hasta 500 millones"
}
```

La respuesta incluirá, por inmueble:

- `score_similitud` (cuando aplica),
- `affinity_score`,
- `affinity_level`.

---

## 3. Selección múltiple reutilizable

### Archivos clave

- `integrations/selection/store.py` → `SelectionStore`.
- `app/api/v1/routes_selection.py`.

### Modelo

- Selección = conjunto de IDs de inmuebles unificados (`source:source_id`) + metadatos.
- Persistencia ligera en `data/config/selections.json`.

### Endpoints

- `POST /v1/selection/`
  - Crea una selección.
  - Body:

    ```json
    {
      "property_ids": ["wasi:9654730", "wasi:7179108"],
      "owner_id": "user_demo",
      "metadata": { "origen": "busqueda_rapida" }
    }
    ```

- `POST /v1/selection/{selection_id}/add`
  - Agrega IDs a una selección.

- `POST /v1/selection/{selection_id}/remove`
  - Elimina IDs de una selección.

- `GET /v1/selection/{selection_id}`
  - Devuelve solo IDs y metadatos de la selección.

- `GET /v1/selection/`
  - Lista selecciones activas (filtrables por `owner_id`).

- `GET /v1/selection/{selection_id}/properties`
  - Usa `SearchEngine` para devolver propiedades completas de la selección con afinidad.

Uso típico en front/IA:

1. Usuario selecciona inmuebles → front llama `POST /v1/selection/`.
2. Guarda solo el `selection_id`.
3. Comparador, agendas, IA trabajan siempre sobre ese `selection_id`.

---

## 4. Agendamiento inteligente

### Archivos clave

- `integrations/appointments/store.py` → `AppointmentStore`.
- `app/api/v1/routes_appointments.py`.

### Modelo de cita (`Appointment`)

- `appointment_id`
- `property_ids` (IDs unificados)
- `owner_id` (opcional)
- `selection_id` (opcional)
- `channel` (`web`, `ia`, `voz`, etc.)
- `requester` (nombre, email, phone, preferred_contact)
- `time_window` (`from`, `to`)
- `notes`
- `status` (`pending`, `confirmed`, `cancelled`)
- `contact_phone_used` (teléfono efectivo de contacto)
- `metadata`
- `created_at`, `updated_at`

### Lógica de teléfono general

- Si un inmueble tiene teléfonos mapeados en `UnifiedProperty.raw` (`telefonos` o `phones`), se usa ese número.
- Si ninguno de los inmuebles de la cita tiene teléfono, se usa un **número general por defecto**: `+57 300 000 0000` (actualmente hardcodeado, se puede mover a config JSON).

### Endpoints

- `POST /v1/appointments/`
  - Crea una cita.
  - Body de ejemplo (desde un solo inmueble):

    ```json
    {
      "property_ids": ["wasi:9654730"],
      "owner_id": "user_demo",
      "channel": "web",
      "requester": {
        "name": "Manuel",
        "email": "manu@example.com",
        "phone": "+57 300 000 1111",
        "preferred_contact": "whatsapp"
      },
      "time_window": {
        "from": "2025-11-23T09:00:00",
        "to": "2025-11-23T18:00:00"
      },
      "notes": "Prueba cita individual",
      "metadata": {
        "origen": "boton_inmueble"
      }
    }
    ```

  - También acepta solo `selection_id` para agendar desde selección múltiple.

- `GET /v1/appointments/{appointment_id}`
  - Devuelve detalle de la cita.

- `GET /v1/appointments/`
  - Lista citas, filtrables por `owner_id`.

- `POST /v1/appointments/{appointment_id}/status`
  - Cambia el estado de la cita.

---

## 5. IA por voz (capa de voz → texto → NLP)

### Archivos clave

- `app/api/v1/routes_voice.py`.

### Endpoint principal

- `POST /v1/voice/command`

  Body de ejemplo:

  ```json
  {
    "texto": "Busco apartamento en Cali con 3 habitaciones hasta 500 millones",
    "context": {
      "canal": "voz_web"
    }
  }
  ```

  - Internamente construye un `BuscarNLPRequest` y delega en `buscar_nlp` (`/v1/nlp/buscar`).
  - Devuelve:

  ```json
  {
    "source": "voice",
    "texto_original": "...",
    "context": { ... },
    "nlp_response": { /* misma estructura que /v1/nlp/buscar */ }
  }
  ```

### Integración con front de voz

Un cliente (web, móvil, etc.) debe:

1. Capturar audio del usuario.
2. Usar un servicio de **ASR** (reconocimiento de voz) para convertir audio → texto.
3. Llamar a `POST /v1/voice/command` con `{"texto": "<transcripción>"}`.
4. Mostrar la respuesta de `nlp_response` o leerla con TTS.

No se implementa lógica de negocio nueva en la capa de voz: todo se reutiliza del módulo NLP textual y del resto de la API (búsqueda, selección, agenda).

---

## 6. Guía rápida de pruebas de esta iteración

1. **Búsqueda estructurada rápida**
   - `POST /v1/buscar` con criterios JSON.
   - Ver `affinity_score` / `affinity_level` en resultados.

2. **Búsqueda por texto (NLP)**
   - `POST /v1/nlp/buscar` con un texto en español.
   - Revisar criterios inferidos, prioridades y afinidad.

3. **Selección múltiple**
   - `POST /v1/selection/` → guarda `selection_id`.
   - `GET /v1/selection/{selection_id}/properties` → ver inmuebles seleccionados.

4. **Agendamiento**
   - `POST /v1/appointments/` con `property_ids` o `selection_id`.
   - `GET /v1/appointments/{appointment_id}` y `POST /v1/appointments/{appointment_id}/status`.

5. **Voz (simulada)**
   - `POST /v1/voice/command` con texto.
   - Confirmar que `nlp_response` coincide con `/v1/nlp/buscar`.

Esta documentación específica complementa al README principal y sirve como referencia rápida para integrar front, IA y voz con la API actual.
