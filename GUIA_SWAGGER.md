# Guía de Uso de Swagger / OpenAPI

Esta guía explica cómo acceder y utilizar la documentación interactiva de la API de inmuebles con integración WASI utilizando **Swagger UI**.

---

## 1. ¿Qué es Swagger UI en este proyecto?

La API expone su especificación **OpenAPI** en el archivo `openapi_wasi.yaml` y una interfaz web de **Swagger UI** en el endpoint:

- `GET /docs`

Swagger UI te permite:
- **Explorar todos los endpoints disponibles**.
- Ver **parámetros**, **cuerpos de petición** y **respuestas** esperadas.
- **Probar la API** directamente desde el navegador sin usar herramientas externas como Postman o curl.

---

## 2. Levantar la API localmente

1. Asegúrate de tener el entorno listo:
   - Python y dependencias instaladas:
     ```bash
     pip install -r requirements.txt
     ```

2. Ejecuta el servidor de la API principal (`api_wasi.py`):
   ```bash
   python api_wasi.py
   ```

3. Por defecto, el servidor se levanta en:
   - URL base: `http://localhost:5001`

   En la consola verás un listado de endpoints disponibles, incluido `/docs`.

---

## 3. Acceder a Swagger UI

Con el servidor corriendo, abre tu navegador y entra a:

- **URL de documentación interactiva**: `http://localhost:5001/docs`

Ahí verás la interfaz de Swagger UI cargando la especificación OpenAPI desde:

- `GET /openapi.yaml`

Si la página no carga:
- Verifica que el servidor está corriendo sin errores.
- Confirma que estás usando el puerto correcto (`5001`).

---

## 4. Estructura de la documentación

En la pantalla principal de Swagger verás:

- **Información general de la API**: título, descripción, versión.
- Lista de **endpoints agrupados por recurso**.

Los endpoints principales documentados incluyen (dependen de `openapi_wasi.yaml`):
- `GET /` – Información general de la API.
- `GET /estadisticas` – Estadísticas del dataset.
- `POST /buscar` – Búsqueda avanzada de inmuebles.
- `GET /similares/{id}` – Inmuebles similares.
- `GET /tipos` – Tipos de inmuebles.
- `GET /ciudades` – Ciudades disponibles.
- `GET /filtros-disponibles` – Filtros para construir búsquedas.
- `POST /sincronizar` – Forzar sincronización con WASI.
- `GET /inmueble/{id}` – Detalle de inmueble específico.

> La definición exacta de cada endpoint (campos, ejemplos, etc.) está en `openapi_wasi.yaml` y es lo que Swagger UI te muestra.

---

## 5. Cómo probar endpoints desde Swagger

### 5.1. Endpoints `GET` (ejemplo: `/estadisticas`)

1. En Swagger UI, busca la sección del endpoint `GET /estadisticas`.
2. Haz clic en la fila del endpoint para desplegar detalles.
3. Pulsa el botón **"Try it out"** / **"Probar"**.
4. Haz clic en **"Execute"** / **"Ejecutar"**.
5. Revisa:
   - Código de respuesta (por ejemplo `200`).
   - Cuerpo de la respuesta en formato JSON.

### 5.2. Endpoint `POST /buscar` (búsqueda avanzada)

1. Busca el endpoint `POST /buscar`.
2. Haz clic en **"Try it out"** / **"Probar"**.
3. En el cuerpo del request (`Request body`), edita el JSON con tus criterios. Ejemplo:
   ```json
   {
     "tipo": "Apartamento",
     "ciudad": "Bogotá",
     "habitaciones_min": 2,
     "precio_max": 500000000,
     "tiene_piscina": true
   }
   ```
4. Haz clic en **"Execute"** / **"Ejecutar"**.
5. Revisa la respuesta:
   - `total_encontrados` y `total_retornados`.
   - `estadisticas` de los resultados (precio promedio, mínimo, máximo).
   - Lista de `resultados` (cada inmueble como JSON).

### 5.3. Endpoint `GET /similares/{id}`

1. Busca `GET /similares/{id}`.
2. Haz clic en **"Try it out"**.
3. En el parámetro `id`, ingresa un índice de inmueble válido (por ejemplo `0`, `10`, etc.).
4. Opcional: en el query param `n` puedes indicar cuántos similares quieres (por ejemplo `5`).
5. Ejecuta y revisa:
   - `inmueble_referencia`.
   - Lista de `similares`.

### 5.4. Endpoint `POST /sincronizar`

1. Busca `POST /sincronizar`.
2. Haz clic en **"Try it out"**.
3. Pulsa **"Execute"**.
4. Swagger mostrará el JSON con el resultado de la sincronización y el nuevo `total_inmuebles`.

> Ten en cuenta que sincronizar puede tardar un poco porque se conecta con WASI y luego reentrena/actualiza el modelo.

---

## 6. Actualizar o revisar la especificación OpenAPI

La especificación está en el archivo:

- `openapi_wasi.yaml`

Si necesitas:
- Añadir un nuevo endpoint.
- Actualizar parámetros, ejemplos o descripciones.

Entonces:
1. Edita `openapi_wasi.yaml` respetando la sintaxis YAML y el estándar OpenAPI.
2. Guarda los cambios.
3. Recarga la página `http://localhost:5001/docs` en el navegador.
4. Verifica que la nueva definición se ve correctamente y que no hay errores en Swagger.

> Consejo: si Swagger deja de cargar, revisa que el YAML no tenga errores de indentación o comas inválidas (usa un validador de OpenAPI/YAML si es necesario).

---

## 7. Errores comunes y solución

- **`Failed to fetch` en Swagger UI**
  - Verifica que el servidor de la API esté corriendo (`python api_wasi.py`).
  - Revisa que la URL `http://localhost:5001/openapi.yaml` responda en el navegador.

- **Error al llamar endpoints (500 o 400)**
  - Revisa en la consola donde corre `api_wasi.py` el mensaje de error.
  - Valida que el JSON enviado desde Swagger cumple con lo indicado en el esquema.

- **Swagger no carga estilos o se ve sin formato**
  - Revisa que tengas acceso a internet (Swagger UI carga CSS/JS desde CDN `unpkg.com`).

---

## 8. Uso recomendado en el flujo de desarrollo

1. Definir/actualizar la API en `openapi_wasi.yaml`.
2. Levantar la API con `python api_wasi.py`.
3. Abrir `http://localhost:5001/docs` para:
   - Validar que la especificación se ve correcta.
   - Probar rápidamente nuevos endpoints.
   - Compartir con otros desarrolladores o frontend cómo usar la API.

---

## 9. Ejemplos de peticiones y respuestas por endpoint

A continuación se resumen los tipos de peticiones, cuerpos de solicitud y ejemplos de respuesta para los endpoints más usados. Todos estos ejemplos se pueden ejecutar directamente desde Swagger.

### 9.1. `GET /` – Información general de la API

- **Método**: `GET`
- **Cuerpo de la solicitud**: no aplica
- **Ejemplo de respuesta (200)**:
```json
{
  "nombre": "API de Búsqueda de Inmuebles - WASI",
  "version": "2.0",
  "fuente_datos": "WASI API",
  "ultima_sincronizacion": "2024-01-01T12:34:56",
  "total_inmuebles": 1000,
  "endpoints": {
    "/": "Información de la API",
    "/estadisticas": "Estadísticas del dataset",
    "/buscar": "Buscar inmuebles (POST)",
    "/similares/<id>": "Inmuebles similares",
    "/tipos": "Tipos de inmuebles disponibles",
    "/ciudades": "Ciudades disponibles",
    "/filtros-disponibles": "Todos los filtros disponibles",
    "/sincronizar": "Forzar sincronización con WASI (POST)",
    "/inmueble/<id>": "Detalle de inmueble específico"
  }
}
```

### 9.2. `GET /estadisticas` – Estadísticas generales del dataset

- **Método**: `GET`
- **Cuerpo de la solicitud**: no aplica
- **Ejemplo de respuesta (200)**:
```json
{
  "total_inmuebles": 1000,
  "ultima_sincronizacion": "2024-01-01T12:34:56",
  "precio_promedio": 350000000.0,
  "precio_minimo": 80000000.0,
  "precio_maximo": 1200000000.0,
  "precio_mediana": 320000000.0,
  "distribucion_tipos": {
    "Apartamento": 600,
    "Casa": 300,
    "Oficina": 100
  },
  "distribucion_ciudades": {
    "Bogotá": 400,
    "Medellín": 300,
    "Cali": 300
  },
  "habitaciones_promedio": 3.2,
  "area_promedio": 95.5
}
```

En caso de error interno, la respuesta típica es:
```json
{
  "error": "mensaje de error"
}
```

### 9.3. `POST /buscar` – Búsqueda avanzada de inmuebles

- **Método**: `POST`
- **Content-Type**: `application/json`
- **Cuerpo de la solicitud (ejemplo)**:
```json
{
  "tipo": "Apartamento",
  "ciudad": "Bogotá",
  "habitaciones_min": 2,
  "precio_max": 500000000,
  "tiene_piscina": true
}
```

- **Parámetros soportados (ejemplos)**:
  - `tipo`: string (ej. `"Casa"`, `"Apartamento"`)
  - `ciudad`: string
  - `habitaciones_min`, `banos_min`: enteros
  - `precio_min`, `precio_max`: números
  - Booleanos como `tiene_piscina`, `tiene_gimnasio`, `tiene_parqueadero`, etc.

- **Ejemplo de respuesta con resultados (200)**:
```json
{
  "total_encontrados": 47,
  "total_retornados": 47,
  "criterios": {
    "tipo": "Apartamento",
    "ciudad": "Bogotá",
    "habitaciones_min": 2,
    "precio_max": 500000000,
    "tiene_piscina": true
  },
  "estadisticas": {
    "precio_promedio": 320000000.0,
    "precio_minimo": 180000000.0,
    "precio_maximo": 500000000.0
  },
  "resultados": [
    {
      "id": "12345",
      "tipo": "Apartamento",
      "ciudad": "Bogotá",
      "habitaciones": 3,
      "banos": 2,
      "precio": 350000000.0,
      "area_total": 85.0
    }
  ]
}
```

- **Ejemplo de respuesta cuando no se envían criterios (400)**:
```json
{
  "error": "No se proporcionaron criterios de búsqueda"
}
```

- **Ejemplo de respuesta de error interno (500)**:
```json
{
  "error": "mensaje de error"
}
```

### 9.4. `GET /similares/{id}` – Inmuebles similares

- **Método**: `GET`
- **Parámetros de ruta**:
  - `id` (entero): índice del inmueble en el dataset (0 a N-1)
- **Parámetros de query**:
  - `n` (entero, opcional, default = 5): número de inmuebles similares a retornar
- **Cuerpo de la solicitud**: no aplica
- **Ejemplo de respuesta (200)**:
```json
{
  "inmueble_referencia": {
    "id": "12345",
    "tipo": "Apartamento",
    "ciudad": "Bogotá",
    "precio": 400000000.0
  },
  "similares_encontrados": 5,
  "similares": [
    {
      "id": "67890",
      "tipo": "Apartamento",
      "ciudad": "Bogotá",
      "precio": 395000000.0
    }
  ]
}
```

- **Ejemplo de respuesta para `id` inválido (400)**:
```json
{
  "error": "ID de inmueble inválido"
}
```

### 9.5. `GET /inmueble/{id}` – Detalle de un inmueble

- **Método**: `GET`
- **Parámetros de ruta**:
  - `id` (string): identificador del inmueble en WASI
- **Cuerpo de la solicitud**: no aplica
- **Ejemplo de respuesta (200)**:
```json
{
  "id": "12345",
  "tipo": "Apartamento",
  "ciudad": "Bogotá",
  "habitaciones": 3,
  "banos": 2,
  "precio": 420000000.0,
  "area_total": 90.0
}
```

- **Ejemplo de respuesta cuando no se encuentra el inmueble (404)**:
```json
{
  "error": "Inmueble no encontrado"
}
```

### 9.6. `GET /tipos`, `GET /ciudades`, `GET /filtros-disponibles`

- **Método**: `GET`
- **Cuerpo de la solicitud**: no aplica

**Ejemplo `GET /tipos` (200)**:
```json
{
  "tipos": ["Apartamento", "Casa", "Oficina"],
  "conteo": {
    "Apartamento": 600,
    "Casa": 300,
    "Oficina": 100
  }
}
```

**Ejemplo `GET /ciudades` (200)**:
```json
{
  "ciudades": ["Bogotá", "Medellín", "Cali"],
  "conteo": {
    "Bogotá": 400,
    "Medellín": 300,
    "Cali": 300
  },
  "precio_promedio": {
    "Bogotá": 420000000.0,
    "Medellín": 350000000.0,
    "Cali": 300000000.0
  }
}
```

**Ejemplo `GET /filtros-disponibles` (200)**:
```json
{
  "tipos": ["Apartamento", "Casa"],
  "ciudades": ["Bogotá", "Medellín"],
  "zonas": ["Norte", "Sur"],
  "tipo_negocio": ["Arriendo", "Venta"],
  "habitaciones": [1, 2, 3, 4],
  "banos": [1, 2, 3],
  "caracteristicas_booleanas": [
    "tiene_piscina",
    "tiene_gimnasio",
    "tiene_parqueadero",
    "tiene_ascensor",
    "tiene_seguridad"
  ],
  "rangos_numericos": {
    "precio": {
      "min": 80000000.0,
      "max": 1200000000.0
    },
    "area_total": {
      "min": 30.0,
      "max": 500.0
    }
  }
}
```

### 9.7. `POST /sincronizar` – Forzar sincronización con WASI

- **Método**: `POST`
- **Cuerpo de la solicitud**: no aplica
- **Ejemplo de respuesta (200)**:
```json
{
  "mensaje": "Sincronización completada",
  "timestamp": "2024-01-01T12:34:56",
  "total_inmuebles": 1050
}
```

- **Ejemplo de respuesta de error (500)**:
```json
{
  "error": "mensaje de error"
}
```

Con esta guía y los ejemplos anteriores deberías poder ver claramente en Swagger:
- El **tipo de petición** de cada endpoint.
- El **cuerpo de la solicitud** que se puede enviar (cuando aplica).
- Las **respuestas** típicas que devuelve la API.

Esto facilita validar la API, hacer pruebas manuales y compartir ejemplos concretos con otros equipos.
