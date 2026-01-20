# Documentación de Endpoints Backend – Busco Fácil

Base URL (local): `http://127.0.0.1:8000`

---

## 1. NLP + Agendamiento

### 1.1. `POST /v1/nlp/buscar`

Motor principal de búsqueda por lenguaje natural:

- Interpreta el texto del usuario (`texto`) con reglas y modelo NLP.
- Ejecuta la búsqueda de inmuebles con afinidad.
- Opcionalmente crea citas de agendamiento cuando `action == "schedule"`.

#### Request – solo búsqueda

```json
{
  "texto": "busco apartamento en Medellín en arriendo por 2 millones"
}
```

#### Request – búsqueda + agendamiento desde selección (recomendado)

```json
{
  "texto": "Quiero agendar visitas para estos inmuebles",
  "action": "schedule",
  "selected_properties": ["wasi:123", "wasi:456"],
  "user": {
    "name": "Juan Pérez",
    "phone": "+57...",
    "email": "juan@example.com"
  },
  "time_window": {
    "from": "2026-01-10T15:00:00Z",
    "to": "2026-01-10T18:00:00Z"
  },
  "notes": "Prefiero después de las 5pm"
}
```

Campos clave:

- `texto` (string): obligatorio.
- `action` (string | null): usar `"schedule"` para crear citas.
- `selected_properties` (string[]): IDs de inmuebles seleccionados (normalmente `"wasi:<id>"`).
- `appointments` (opcional): lista explícita de citas a crear (cada una con `property_id`, `time_window`, `notes`).
- `user`:
  - `name` (opcional)
  - `phone` (requerido si no hay email)
  - `email` (requerido si no hay phone)
- `time_window` (usado con `selected_properties`):
  - `from` (ISO datetime, opcional)
  - `to` (ISO datetime, opcional)
- `notes` (string): notas para la cita.

#### Response (resumen)

```json
{
  "mensaje": "Se encontraron X inmuebles...",
  "texto_original": "...",
  "criterios_inferidos": { },
  "predicciones_nlp": { },
  "filtros_relajados": ["precio_min", "ciudad"],
  "total_encontrados": 120,
  "total_retornados": 50,
  "estadisticas": {
    "precio_promedio": 2000000,
    "precio_minimo": 1500000,
    "precio_maximo": 3000000
  },
  "resultados": [
    {
      "id": 123,
      "titulo": "...",
      "descripcion": "...",
      "ciudad": "Medellín",
      "zona": "Poblado",
      "precio": 2000000,
      "imagenes": ["..."],
      "affinity_score": 0.87,
      "affinity_level": "alto"
      // ...otros campos raw del inmueble
    }
  ],
  "appointments": [
    {
      "appointment_id": "apt_abc",
      "property_ids": ["wasi:123"],
      "owner_id": null,
      "selection_id": null,
      "channel": "chat",
      "requester": { "name": "Juan Pérez", "phone": "+57...", "email": "juan@example.com" },
      "time_window": { "from": "2026-01-10T15:00:00Z", "to": "2026-01-10T18:00:00Z" },
      "notes": "Prefiero después de las 5pm",
      "status": "pending",
      "contact_phone_used": "+57...",
      "metadata": { "criterios_inferidos": { } },
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

#### Uso recomendado desde el front

1. El usuario escribe una frase en el input principal → `POST /v1/nlp/buscar` solo con `texto`.
2. Mostrar `resultados` como tarjetas de inmuebles.
3. Permitir seleccionar inmuebles → construir `selected_properties`.
4. Cuando el usuario quiera agendar:
   - Pedir datos de contacto (`user`) y franja (`time_window`).
   - Llamar de nuevo a `/v1/nlp/buscar` con `action="schedule"`, `selected_properties`, `user`, `time_window`, `notes`.
   - Leer `appointments` y mostrar confirmación.

---

## 2. Búsqueda IA estructurada

### 2.1. `POST /v1/search/ia`

Motor de búsqueda con filtros estructurados y orden configurable.

#### Request

```json
{
  "filters": {
    "tipo": "Apartamento",
    "ciudad": "Medellín",
    "tipo_negocio": "Arriendo",
    "precio_min": 1500000,
    "precio_max": 2500000,
    "habitaciones_min": 2
  },
  "sort": "matching",        
  "page": 1,
  "size": 20
}
```

`sort` puede ser:

- `"matching"` (orden por afinidad / relevancia).
- `"price_asc"` / `"price_desc"`.
- `"newest"` (según fechas `updated_at`/`created_at`/`fecha_publicacion`).

#### Response (resumen)

```json
{
  "search_id": "1736179234000",
  "sort": "price_asc",
  "available_sorts": ["matching", "price_asc", "price_desc", "newest"],
  "total": 120,
  "total_returned": 20,
  "page": 1,
  "size": 20,
  "items": [
    {
      "id": 123,
      "precio": 1800000,
      "ciudad": "Medellín",
      "zona": "Poblado",
      "affinity_score": 0.9,
      "affinity_level": "alto"
      // ...otros campos raw
    }
  ],
  "stats": {
    "precio_promedio": 2000000,
    "precio_minimo": 1500000,
    "precio_maximo": 2500000
  },
  "filters": {
    "tipo": "Apartamento",
    "ciudad": "Medellín"
  }
}
```

#### Uso desde el front

- Para pantallas con filtros explícitos (sliders, combos, etc.).
- Enviar filtros y parámetros de paginación, actualizar la lista con `items`.

---

## 3. Datos de catálogo para filtros

Prefijo: `/v1` (router de inmuebles).

### 3.1. `GET /v1/tipos`

Retorna tipos de inmueble y conteos.

**Response:**

```json
{
  "tipos": ["Apartamento", "Casa", "Oficina"],
  "conteo": {
    "Apartamento": 300,
    "Casa": 120
  }
}
```

Uso: poblar select de “Tipo de inmueble”.

### 3.2. `GET /v1/ciudades`

Lista ciudades, cantidad y precio promedio.

```json
{
  "ciudades": ["Bogotá", "Medellín", "Cali"],
  "conteo": { "Bogotá": 150, "Medellín": 200 },
  "precio_promedio": { "Bogotá": 350000000, "Medellín": 280000000 }
}
```

Uso: select/autocomplete de ciudades.

### 3.3. `GET /v1/filtros-disponibles`

Devuelve el universo de filtros posibles.

```json
{
  "tipos": [...],
  "ciudades": [...],
  "zonas": [...],
  "tipo_negocio": ["Arriendo", "Venta"],
  "habitaciones": [1,2,3,4],
  "banos": [1,2,3],
  "caracteristicas_booleanas": [
    "tiene_piscina",
    "tiene_gimnasio",
    "tiene_parqueadero",
    "tiene_ascensor",
    "tiene_seguridad"
  ],
  "rangos_numericos": {
    "precio": { "min": 500000, "max": 5000000000 },
    "area_total": { "min": ..., "max": ... },
    "area_construida": { "min": ..., "max": ... }
  }
}
```

Uso: inicializar controles de filtros en el front.

---

## 4. Selecciones de inmuebles

Prefijo: `/v1/selection`.

### 4.1. `POST /v1/selection/`

Crear una selección (colección) de inmuebles.

**Request:**

```json
{
  "property_ids": ["wasi:123", "wasi:456"],
  "owner_id": "user-123",
  "metadata": { "origen": "web" }
}
```

**Response:**

```json
{
  "selection_id": "sel_abc",
  "total": 2,
  "owner_id": "user-123",
  "metadata": { "origen": "web" },
  "created_at": "...",
  "updated_at": "..."
}
```

Uso: carritos, favoritos, comparadores.

### 4.2. `POST /v1/selection/{selection_id}/add`
### 4.3. `POST /v1/selection/{selection_id}/remove`

Modificar inmuebles de una selección existente enviando:

```json
{ "property_ids": ["wasi:789"] }
```

### 4.4. `GET /v1/selection/{selection_id}`

Detalle de una selección (IDs + metadatos).

### 4.5. `GET /v1/selection/{selection_id}/properties`

Devuelve las propiedades de la selección con afinidad.

**Response (resumen):**

```json
{
  "selection_id": "sel_abc",
  "total": 3,
  "total_retornados": 3,
  "resultados": [
    {
      "id": 123,
      "precio": 2000000,
      "affinity_score": 0.9,
      "affinity_level": "alto"
    }
  ]
}
```

Uso: pantalla de “mis listas” o “favoritos”.

---

## 5. Citas / agendamiento directo

Prefijo: `/v1/appointments`.

### 5.1. `POST /v1/appointments/`

Crear una cita a partir de `property_ids` o de un `selection_id`.

**Request (property_ids):**

```json
{
  "property_ids": ["wasi:123", "wasi:456"],
  "owner_id": "user-123",
  "channel": "web",
  "requester": {
    "name": "Juan",
    "phone": "+57...",
    "email": "juan@example.com"
  },
  "time_window": {
    "from": "2026-01-10T15:00:00Z",
    "to": "2026-01-10T18:00:00Z"
  },
  "notes": "Comentario...",
