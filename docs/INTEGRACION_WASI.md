# Integración con WASI (Datos Reales)

Este documento explica cómo está integrada la API de **WASI.co** con el modelo de IA de inmuebles en este proyecto, usando datos reales y dejando todo listo para exponer servicios vía API.

## 1. Flujo general

1. **Conexión a WASI**
   - Endpoint principal para listar propiedades:
     - `GET https://api.wasi.co/v1/property/search`
   - Credenciales (configuradas en el código):
     - `id_company = 493728`
     - `wasi_token = 4kyL_tY1Q_e8yL_j0ju`
   - Paginación:
     - `skip` (offset)
     - `take` (limit, máx 100)

2. **Sincronización de datos**
   - Archivo principal: `integrations/wasi/wasi_connector.py`
   - Clase: `WasiConnector`
   - Métodos clave:
     - `obtener_inmuebles(limit, offset, tipo_negocio=None)`
       - Llama a `property/search` con `skip` y `take`.
       - Construye la lista de inmuebles a partir de las claves numéricas `"0"`, `"1"`, ..., en la respuesta.
     - `obtener_todos_los_inmuebles(max_inmuebles=1000)`
       - Hace varias llamadas paginadas a `obtener_inmuebles` hasta llegar al máximo indicado o hasta que no haya más datos.
     - `convertir_a_dataframe(inmuebles)`
       - Transforma el JSON de WASI en un `DataFrame` de pandas con columnas ya adaptadas al modelo.
     - `sincronizar_datos(archivo_salida='inmuebles_wasi_real.csv', max_inmuebles=1000)`
       - Descarga, procesa y guarda los datos en un CSV.
       - Muestra estadísticas básicas y calcula el precio promedio de forma segura.

3. **Entrenamiento / carga del modelo de IA**
   - Archivo: `api_wasi.py`
   - Clase de modelo: `ModeloInmuebles` (definida en `modelo_inmuebles.py`).
   - Flujo en `inicializar_sistema()`:
     1. Crea un `WasiConnector` con las credenciales.
     2. Verifica si existe `inmuebles_wasi_real.csv` reciente (menos de 24 horas).
        - Si **no existe** o está antiguo → llama a `wasi_connector.sincronizar_datos(...)`.
        - Si **existe y es reciente** → reutiliza el CSV.
     3. Inicializa `ModeloInmuebles` y carga el CSV:
        - `modelo.cargar_dataset('inmuebles_wasi_real.csv')`
        - `modelo.preprocesar_datos()`
     4. Carga o entrena el modelo:
        - Archivo de modelo: `modelo_wasi.pkl`.
        - Si existe y el dataset no se volvió a sincronizar → `modelo.cargar_modelo('modelo_wasi.pkl')`.
        - En caso contrario, entrena desde cero:
          - `modelo.crear_categorias_precio('precio')`
          - `modelo.entrenar_modelo_clasificacion('categoria_precio')`
          - `modelo.entrenar_clustering(n_clusters=5)`
          - `modelo.guardar_modelo('modelo_wasi.pkl')`

4. **Exposición de la API Flask con datos reales**
   - Archivo: `api_wasi.py`
   - Se levanta con:
     ```bash
     python3 api_wasi.py
     ```
   - Endpoints principales:
     - `GET  /` → Información general (fuente de datos WASI, total de inmuebles, última sincronización).
     - `GET  /estadisticas` → Estadísticas generales del dataset.
     - `POST /buscar` → Búsqueda avanzada por múltiples criterios.
     - `GET  /similares/<id>` → Inmuebles similares (usa el clustering).
     - `GET  /tipos` → Tipos de inmuebles.
     - `GET  /ciudades` → Ciudades disponibles.
     - `GET  /inmueble/<id>` → Detalle de un inmueble específico.
     - `GET  /filtros-disponibles` → Filtros útiles para construir interfaces.
     - `POST /sincronizar` → Forzar sincronización manual con WASI.

---

## 2. Archivos relevantes de la integración

### `integrations/wasi/wasi_connector.py`

Responsable de toda la comunicación con la API de WASI:

- **Base URL:** `https://api.wasi.co/v1`
- Usa `requests` para hacer llamadas `GET`/`POST`.
- Agrega `id_company` y `wasi_token` automáticamente en cada llamada.
- Convierte la estructura JSON de `property/search` (claves numéricas + `total` + `status`) en una lista de inmuebles y luego en un `DataFrame` preparado para el modelo.

### `integrations/wasi/test_wasi_api.py`

Script pequeño para probar la conexión con el endpoint `property/search`:

```bash
python3 integrations/wasi/test_wasi_api.py
```

Muestra:

- URL usada.
- Status code y headers.
- Primeros caracteres del JSON de respuesta.

Es útil para verificar credenciales y conectividad sin pasar por todo el pipeline.

### `api_wasi.py`

- Orquesta la sincronización con WASI y el entrenamiento/carga del modelo.
- Expone una API Flask pensada para ser consumida por un frontend (por ejemplo, una web de búsqueda de inmuebles).
- Logs clave que verás al arrancar:
  - "SINCRONIZACIÓN DE DATOS DESDE WASI"
  - "INICIALIZANDO SISTEMA CON DATOS REALES DE WASI"
  - "Sistema listo para recibir peticiones".

> **Nota:** El servidor Flask usa por defecto el puerto `5000`. Si ves el mensaje `Address already in use`, significa que ya hay otro proceso escuchando en `5000` (otro `api_wasi.py` o AirPlay en macOS). Debes detenerlo o cambiar de puerto.

---

## 3. Modelo de inferencia conectado a WASI

Además del flujo Flask, el proyecto incluye un modelo de inferencia genérico pensado para FastAPI u otros servicios.

### `app/models/inference.py`

Clase principal:

```python
class InmueblesInferenceModel:
    def __init__(self, model_path: str = "modelo_wasi.pkl") -> None:
        ...
```

- Por defecto carga el archivo `modelo_wasi.pkl` en la raíz del proyecto.
- Ese artefacto es exactamente el que genera `ModeloInmuebles.guardar_modelo` después de entrenar con datos de WASI.

La clase:

1. Carga `modelo_wasi.pkl` con `joblib.load`.
2. Recupera `scaler`, `label_encoders`, `modelo_clasificacion`, `caracteristicas_numericas` y `caracteristicas_categoricas`.
3. Expone `predict_category(features: Dict[str, Any]) -> str` que:
   - Valida que `features` tenga todas las columnas requeridas.
   - Codifica las categóricas usando los mismos `LabelEncoder`.
   - Escala las features con el `StandardScaler` entrenado.
   - Ejecuta la predicción del modelo de clasificación.
   - Decodifica la categoría usando el encoder del objetivo (si existe) para devolver un valor legible (`Económico`, `Medio`, `Alto`, `Premium`).

### Integración con FastAPI

Archivo: `app/api/v1/routes_predict.py`

- Importa la instancia global `inference_model` definida en `app/models/inference.py`.
- Define el endpoint:

```python
@router.post("/predict", response_model=PredictionResponse)
async def predict_inmueble(inmueble: InmuebleInput) -> PredictionResponse:
    features = inmueble.model_dump()
    categoria = inference_model.predict_category(features)
    return PredictionResponse(categoria_precio=categoria)
```

Donde `InmuebleInput` está definido en `app/models/schemas.py`.

> **Importante:** Para evitar errores de "faltan columnas requeridas", los campos de `InmuebleInput` deben alinearse con las columnas que el modelo espera. Es recomendable revisar `inmuebles_wasi_real.csv` y las listas `caracteristicas_numericas` / `caracteristicas_categoricas` dentro de `ModeloInmuebles`.

---

## 4. Pasos prácticos de uso

### 4.1. Sincronizar datos y entrenar modelo

Desde la raíz del proyecto:

```bash
python3 api_wasi.py
```

Esto:

1. Sincroniza datos desde WASI si el CSV no existe o está viejo.
2. Genera/actualiza `inmuebles_wasi_real.csv`.
3. Entrena (o carga) el modelo y guarda `modelo_wasi.pkl`.
4. Levanta la API Flask en `http://localhost:5000`.

### 4.2. Probar la API Flask con datos reales

En otra terminal:

- Información general:

  ```bash
  curl http://localhost:5000/
  ```

- Estadísticas del dataset:

  ```bash
  curl http://localhost:5000/estadisticas
  ```

- Búsqueda de inmuebles:

  ```bash
  curl -X POST http://localhost:5000/buscar \
    -H "Content-Type: application/json" \
    -d '{"tipo": "Apartamento", "ciudad": "Bogotá", "habitaciones_min": 2}'
  ```

### 4.3. Usar el modelo de inferencia (FastAPI u otro servicio)

Suponiendo que tienes una app FastAPI que importa `inference_model`:

1. Asegúrate de haber ejecutado al menos una vez:

   ```bash
   python3 api_wasi.py
   ```

   para generar `modelo_wasi.pkl`.

2. Levanta tu API FastAPI (ejemplo):

   ```bash
   uvicorn app.main:app --reload
   ```

3. Haz una petición de predicción:

   ```bash
   curl -X POST http://localhost:8000/v1/predict \
     -H "Content-Type: application/json" \
     -d '{
       "tipo": "Apartamento",
       "ubicacion": "Bogotá",
       "habitaciones": 3,
       "banos": 2,
       "area_m2": 70,
       "precio": 350000000
     }'
   ```

   La respuesta será algo como:

   ```json
   { "categoria_precio": "Medio" }
   ```

---

## 5. Notas y buenas prácticas

- **No ejecutar múltiples veces `api_wasi.py` al mismo tiempo**: si el puerto 5000 está ocupado, detén el proceso anterior (Ctrl+C) antes de lanzar uno nuevo.
- **Mantener seguras las credenciales de WASI**: están en el código para desarrollo, pero en producción deberían moverse a variables de entorno o un gestor de secretos.
- **Reentrenar periódicamente**: gracias a `inmuebles_wasi_real.csv` y `modelo_wasi.pkl`, puedes reentrenar de forma controlada cada cierto tiempo (por ejemplo, 1 vez al día) ejecutando `python3 api_wasi.py`.
- **Verificación rápida**: si algo falla en la conexión con WASI, primero prueba `python3 integrations/wasi/test_wasi_api.py` para aislar el problema.
