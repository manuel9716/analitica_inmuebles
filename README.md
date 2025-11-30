# Modelo de IA para Análisis y Categorización de Inmuebles

Sistema inteligente de análisis y categorización de inmuebles utilizando Machine Learning. Permite analizar datasets de propiedades, clasificar automáticamente por características, realizar búsquedas avanzadas y generar recomendaciones basadas en similitud.

## Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Instalación](#-instalación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Uso Rápido](#-uso-rápido)
- [Arquitectura del Sistema](#️-arquitectura-del-sistema)
  - [Componentes Principales](#componentes-principales)
  - [Pipeline de Preprocesamiento](#2-pipeline-de-preprocesamiento)
  - [Modelos de Machine Learning](#3-modelos-de-machine-learning)
  - [Diagrama de Arquitectura](#diagrama-de-arquitectura)
  - [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Funcionalidades Detalladas](#-funcionalidades-detalladas)
- [Casos de Uso](#-casos-de-uso)
- [Personalización](#️-personalización)
- [Características del Dataset](#-características-del-dataset-generado)
- [Algoritmos Utilizados](#-algoritmos-utilizados)
- [Ejemplos de Salida](#-ejemplos-de-salida)
- [Solución de Problemas](#-solución-de-problemas)
- [Referencia Completa de API](#-referencia-completa-de-api)
- [Manuales de Uso Completos](#-manuales-de-uso-completos)
  - [Manual 1: Inicio Rápido](#manual-1-inicio-rápido-5-minutos)
  - [Manual 2: Búsqueda Avanzada](#manual-2-búsqueda-avanzada-de-inmuebles)
  - [Manual 3: Sistema de Recomendaciones](#manual-3-sistema-de-recomendaciones)
  - [Manual 4: Análisis de Mercado](#manual-4-análisis-de-mercado)
  - [Manual 5: Integración con API REST](#manual-5-integración-con-api-rest)
  - [Manual 6: Dataset Personalizado](#manual-6-uso-con-dataset-personalizado)
  - [Manual 7: Interfaz CLI](#manual-7-interfaz-de-línea-de-comandos)
  - [Manual 8: Prueba Rápida](#manual-8-prueba-rápida-del-sistema)
- [Mejores Prácticas y Optimización](#-mejores-prácticas-y-optimización)
- [Consideraciones de Seguridad](#-consideraciones-de-seguridad)
- [Métricas y Monitoreo](#-métricas-y-monitoreo)
- [Próximos Pasos](#-próximos-pasos)
- [Licencia](#-licencia)
- [Contribuciones](#-contribuciones)
- [Soporte](#-soporte)

## Características Principales

- **Análisis de Dataset**: Estadísticas descriptivas y exploración completa de datos
- **Categorización Inteligente**: Clasificación automática de inmuebles por precio y características usando Random Forest
- **Clustering**: Agrupación de inmuebles similares mediante K-Means
- **Búsqueda Avanzada**: Filtrado por múltiples criterios con operadores de rango
- **Sistema de Recomendaciones**: Encuentra inmuebles similares basándose en clustering
- **Reportes Personalizados**: Generación de reportes en CSV con estadísticas
- **Persistencia de Modelos**: Guarda y carga modelos entrenados para reutilización
- **Interfaz Interactiva**: CLI para búsquedas sin programar
- **API REST**: Endpoints listos para integración web

## Instalación

### Requisitos Previos
- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Pasos de Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

## API REST unificada (FastAPI)

Este proyecto incluye una API REST unificada basada en **FastAPI** que expone el modelo de inmuebles con datos reales de WASI, un módulo de proveedores y el buscador inteligente por texto libre.

### Levantar la API

```bash
python3 -m uvicorn app.main:app --reload
```

Por defecto expone la documentación interactiva en:

- Swagger UI: http://127.0.0.1:8000/docs
- OpenAPI JSON: http://127.0.0.1:8000/openapi.json

### Endpoints principales

- **Salud**
  - `GET /health` → estado básico del servicio.

- **Inmuebles (WASI)** – prefijo `/v1`
  - `GET /v1/` → información general de la API y conteo de inmuebles.
  - `GET /v1/estadisticas` → estadísticas globales del dataset WASI.
  - `POST /v1/buscar` → búsqueda por criterios estructurados (JSON).
  - `GET /v1/similares/{id}` → inmuebles similares a un ID de referencia.
  - `GET /v1/inmueble/{id}` → detalle de un inmueble por ID WASI.
  - `GET /v1/tipos` → tipos de inmuebles disponibles.
  - `GET /v1/ciudades` → ciudades disponibles (limpiadas, sin direcciones).
  - `GET /v1/filtros-disponibles` → lista de filtros (tipos, ciudades, rangos numéricos, etc.).
  - `POST /v1/sincronizar` → fuerza sincronización con WASI y reentrena/carga el modelo.

- **Proveedores unificados** – prefijo `/v1/providers`
  - `GET /v1/providers` → lista de proveedores registrados (por ahora: `"wasi"`).
  - `GET /v1/providers/properties` → propiedades normalizadas (`UnifiedProperty`) para un proveedor.

- **Buscador inteligente (NLP)** – prefijo `/v1/nlp`
  - `POST /v1/nlp/buscar` → búsqueda a partir de texto libre, combinando reglas + modelo NLP.
  - `POST /v1/nlp/chat` → versión conversacional con `session_id` y acumulación de criterios.

### Ejemplos rápidos de uso (Swagger)

- Para probar filtros y estadísticas:
  - `GET /v1/`
  - `GET /v1/estadisticas`
  - `GET /v1/filtros-disponibles`

- Para buscar inmuebles por criterios:

```json
POST /v1/buscar
{
  "tipo": "Apartamento",
  "ciudad": "Cali",
  "precio_min": 200000000,
  "precio_max": 800000000
}
```

- Para búsqueda inteligente por texto:

```json
POST /v1/nlp/buscar
{
  "texto": "Quiero un apartamento en Cali, 3 habitaciones, con parqueadero, hasta 500 millones"
}
```

La documentación completa y ejemplos adicionales se pueden explorar directamente en Swagger (`/docs`).

## Estructura del Proyecto

```
Modelo Local de IA/
├── modelo_inmuebles.py           # Clase principal del modelo de IA
├── generar_dataset.py            # Generador de dataset sintético
├── ejemplo_uso.py                # Ejemplos de uso completos
├── ejemplo_dataset_colombia.py   # Ejemplos con dataset real de Colombia
├── ejemplos_avanzados.py         # Casos de uso avanzados
├── interfaz_consulta.py          # Interfaz interactiva CLI
├── api_ejemplo.py                # API REST con Flask
├── prueba_rapida.py              # Script de verificación rápida
├── requirements.txt              # Dependencias del proyecto
├── inmuebles_sintetico_colombia_plus.csv  # Dataset real de Colombia
├── README.md                     # Documentación principal
├── ESTRUCTURA_PROYECTO.md        # Documentación de arquitectura
├── INICIO_RAPIDO.md              # Guía de inicio rápido
└── INSTRUCCIONES_GIT.md          # Guía de control de versiones
```

## 🎯 Uso Rápido

### Dataset Incluido

El proyecto incluye un dataset real de inmuebles de Colombia (`inmuebles_sintetico_colombia_plus.csv`) con datos de:
- 🏙️ Ciudades: Bogotá, Medellín, Cali, Cartagena, Barranquilla, Bucaramanga, Pereira, Manizales
- 🏢 Tipos: Apartamentos, Casas, Oficinas, Bodegas, Lotes, Fincas
- 💰 Precios reales en COP
- 📍 Ubicaciones con coordenadas GPS
- 🏊 Amenidades: piscina, gimnasio, BBQ, zonas verdes, seguridad

### Opción 1: Usar Dataset Real de Colombia

```bash
python ejemplo_dataset_colombia.py
```

Este script analiza el dataset real y muestra ejemplos de búsquedas específicas para Colombia.

### Opción 2: Interfaz Interactiva

Ejecuta la interfaz de línea de comandos:

```bash
python interfaz_consulta.py
```

La interfaz te guiará a través de:
- Búsqueda por tipo de inmueble
- Búsqueda por rango de precio
- Búsqueda por ubicación
- Búsqueda por características
- Búsqueda avanzada con múltiples criterios
- Búsqueda de inmuebles similares
- Visualización de estadísticas
- Generación de reportes

### Opción 2: Ejemplo Completo

Ejecuta el ejemplo completo que demuestra todas las funcionalidades:

```bash
python ejemplo_uso.py
```

Este script:
1. Genera un dataset de 1000 inmuebles
2. Carga y analiza los datos
3. Entrena el modelo de clasificación
4. Realiza clustering
5. Ejecuta búsquedas de ejemplo
6. Genera reportes

### Opción 3: Uso Programático

```python
from modelo_inmuebles import ModeloInmuebles
from generar_dataset import generar_dataset_inmuebles

# Generar dataset de ejemplo
df = generar_dataset_inmuebles(n_inmuebles=1000, guardar=True)

# Inicializar modelo
modelo = ModeloInmuebles()

# Cargar y preprocesar datos
modelo.cargar_dataset('dataset_inmuebles.csv')
modelo.preprocesar_datos()

# Crear categorías de precio
modelo.crear_categorias_precio('precio')

# Entrenar modelos
modelo.entrenar_modelo_clasificacion('categoria_precio')
modelo.entrenar_clustering(n_clusters=5)

# Buscar inmuebles con criterios específicos
criterios = {
    'tipo': 'Casa',
    'habitaciones': 3,
    'precio_min': 150000,
    'precio_max': 300000,
    'tiene_jardin': True
}
resultado = modelo.categorizar_inmuebles(criterios)

# Generar reporte
modelo.generar_reporte(resultado, 'mi_busqueda.csv')

# Guardar modelo entrenado
modelo.guardar_modelo('modelo_inmuebles.pkl')
```

## 🏗️ Arquitectura del Sistema

### Componentes Principales

#### 1. **ModeloInmuebles** (Clase Principal)
La clase central que gestiona todo el flujo de trabajo del análisis de inmuebles.

**Atributos:**
- `scaler`: StandardScaler de scikit-learn para normalización
- `label_encoders`: Diccionario de LabelEncoders para variables categóricas
- `modelo_clasificacion`: RandomForestClassifier entrenado
- `modelo_clustering`: KMeans para agrupación de inmuebles
- `caracteristicas_numericas`: Lista de columnas numéricas
- `caracteristicas_categoricas`: Lista de columnas categóricas
- `df`: DataFrame de pandas con los datos
- `categorias_precio`: Diccionario con rangos de precios

**Flujo de Trabajo:**
```
1. Carga de Datos → 2. Preprocesamiento → 3. Entrenamiento → 4. Predicción/Búsqueda
```

#### 2. **Pipeline de Preprocesamiento**

```python
# Limpieza de datos
- Manejo de valores faltantes (media para numéricos, moda para categóricos)
- Identificación automática de tipos de datos

# Codificación
- LabelEncoder para variables categóricas
- StandardScaler para normalización de características numéricas

# Ingeniería de características
- Creación de columnas _encoded para variables categóricas
- Categorización de precios en cuartiles
```

#### 3. **Modelos de Machine Learning**

**Random Forest Classifier:**
- **Propósito**: Clasificación de inmuebles por categoría de precio
- **Parámetros**: 100 estimadores, profundidad máxima 10
- **Salida**: Categorías (Económico, Medio, Alto, Premium)
- **Métricas**: Accuracy, importancia de características

**K-Means Clustering:**
- **Propósito**: Agrupación de inmuebles similares
- **Parámetros**: Configurable (default: 5 clusters)
- **Salida**: Asignación de cluster por inmueble
- **Uso**: Sistema de recomendaciones

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTRADA DE DATOS                          │
│  (CSV, Excel, JSON, DataFrame)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              PREPROCESAMIENTO                                │
│  • Limpieza de valores faltantes                            │
│  • Identificación de tipos de datos                         │
│  • Codificación de variables categóricas                    │
│  • Normalización de características numéricas               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              ENTRENAMIENTO DE MODELOS                        │
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │ Random Forest        │    │ K-Means Clustering   │      │
│  │ Classifier           │    │                      │      │
│  │ • Clasificación      │    │ • Agrupación         │      │
│  │ • Categorías precio  │    │ • Similitud          │      │
│  └──────────────────────┘    └──────────────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              APLICACIONES                                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Búsqueda y   │  │ Sistema de   │  │ Generación   │     │
│  │ Filtrado     │  │ Recomendación│  │ de Reportes  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Interfaz CLI │  │ API REST     │  │ Análisis     │     │
│  │              │  │              │  │ Estadístico  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Tecnologías Utilizadas

| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| Análisis de Datos | pandas | ≥2.0.0 | Manipulación de datasets |
| Cálculo Numérico | numpy | ≥1.24.0 | Operaciones matemáticas |
| Machine Learning | scikit-learn | ≥1.3.0 | Modelos de ML |
| Persistencia | joblib | ≥1.3.0 | Guardar/cargar modelos |
| Datos Excel | openpyxl | ≥3.1.0 | Lectura de archivos Excel |
| API REST | Flask | - | Servidor web (opcional) |
| CORS | flask-cors | - | Manejo de CORS (opcional) |

## 🔍 Funcionalidades Detalladas

### 1. Generación de Dataset

El sistema incluye un generador de datos sintéticos realistas:

```python
from generar_dataset import generar_dataset_inmuebles

# Generar 1000 inmuebles con características realistas
df = generar_dataset_inmuebles(n_inmuebles=1000, guardar=True)
```

**Características incluidas:**
- Tipo de inmueble (Casa, Apartamento, Duplex, etc.)
- Ubicación
- Habitaciones, baños, estacionamientos
- Área construida y terreno
- Antigüedad
- Estado (Nuevo, Excelente, Bueno, etc.)
- Amenidades (jardín, piscina, gimnasio, seguridad, etc.)
- Proximidad a servicios
- Precio calculado con factores realistas

### 2. Análisis de Dataset

```python
# Cargar dataset
modelo.cargar_dataset('dataset_inmuebles.csv')

# Analizar estadísticas
modelo.analizar_dataset()
```

Proporciona:
- Información general del dataset
- Estadísticas descriptivas
- Detección de valores faltantes
- Distribución de características

### 3. Categorización y Clasificación

```python
# Crear categorías de precio
modelo.crear_categorias_precio('precio')
# Categorías: Económico, Medio, Alto, Premium

# Entrenar modelo de clasificación
accuracy = modelo.entrenar_modelo_clasificacion('categoria_precio')
```

El modelo utiliza **Random Forest** para clasificar inmuebles y proporciona:
- Precisión del modelo
- Importancia de características
- Predicciones automáticas

### 4. Clustering de Inmuebles

```python
# Agrupar inmuebles similares
modelo.entrenar_clustering(n_clusters=5)
```

Utiliza **K-Means** para:
- Agrupar inmuebles con características similares
- Facilitar búsqueda de propiedades comparables
- Identificar patrones en el mercado

### 5. Búsqueda y Filtrado

#### Búsqueda Simple
```python
criterios = {
    'tipo': 'Casa',
    'habitaciones': 3
}
resultado = modelo.categorizar_inmuebles(criterios)
```

#### Búsqueda con Rangos
```python
criterios = {
    'precio_min': 150000,
    'precio_max': 300000,
    'habitaciones_min': 2,
    'banos_min': 2
}
resultado = modelo.categorizar_inmuebles(criterios)
```

#### Búsqueda Avanzada
```python
criterios = {
    'tipo': 'Casa',
    'ubicacion': 'Centro',
    'precio_max': 400000,
    'habitaciones_min': 3,
    'tiene_jardin': True,
    'tiene_piscina': True,
    'cerca_escuelas': True
}
resultado = modelo.categorizar_inmuebles(criterios)
```

### 6. Recomendaciones de Inmuebles Similares

```python
# Encontrar inmuebles similares al inmueble con ID 0
similares = modelo.buscar_similares(inmueble_id=0, n_similares=5)
```

### 7. Generación de Reportes

```python
# Generar reporte CSV con resultados
modelo.generar_reporte(resultado, 'reporte_busqueda.csv')
```

El reporte incluye:
- Todas las características de los inmuebles encontrados
- Estadísticas resumidas
- Formato CSV para análisis posterior

### 8. Persistencia del Modelo

```python
# Guardar modelo entrenado
modelo.guardar_modelo('modelo_inmuebles.pkl')

# Cargar modelo previamente entrenado
modelo_nuevo = ModeloInmuebles()
modelo_nuevo.cargar_modelo('modelo_inmuebles.pkl')
```

## 📈 Casos de Uso

### Caso 1: Búsqueda de Casa Familiar
```python
criterios = {
    'tipo': 'Casa',
    'habitaciones_min': 3,
    'banos_min': 2,
    'tiene_jardin': True,
    'estacionamientos_min': 1,
    'cerca_escuelas': True,
    'precio_max': 350000
}
resultado = modelo.categorizar_inmuebles(criterios)
```

### Caso 2: Inversión en Apartamentos Premium
```python
criterios = {
    'tipo': 'Apartamento',
    'ubicacion': 'Centro',
    'precio_min': 400000,
    'estado': 'Nuevo',
    'tiene_gimnasio': True,
    'tiene_seguridad': True
}
resultado = modelo.categorizar_inmuebles(criterios)
```

### Caso 3: Propiedades Económicas para Estudiantes
```python
criterios = {
    'tipo': ['Estudio', 'Apartamento'],
    'precio_max': 100000,
    'cerca_transporte': True,
    'cerca_comercios': True
}
resultado = modelo.categorizar_inmuebles(criterios)
```

## 🛠️ Personalización

### Usar tu Propio Dataset

El modelo acepta datasets en formato CSV, Excel o JSON:

```python
# Desde CSV
modelo.cargar_dataset('mi_dataset.csv')

# Desde Excel
modelo.cargar_dataset('mi_dataset.xlsx')

# Desde DataFrame de pandas
import pandas as pd
df = pd.read_csv('mi_dataset.csv')
modelo.cargar_dataset(dataframe=df)
```

**Requisitos del dataset:**
- Debe incluir características numéricas y/o categóricas
- Se recomienda incluir una columna de precio
- El modelo maneja automáticamente valores faltantes

### Ajustar Parámetros del Modelo

```python
# Cambiar número de clusters
modelo.entrenar_clustering(n_clusters=10)

# Modificar categorías de precio personalizadas
# (El modelo usa cuartiles por defecto)
```

## 📊 Características del Dataset Generado

El dataset de ejemplo incluye:

- **Características Numéricas:**
  - Precio
  - Habitaciones (1-6)
  - Baños (1-4)
  - Área construida (30-500 m²)
  - Área de terreno (0-1000 m²)
  - Antigüedad (0-50 años)
  - Pisos (1-4)
  - Estacionamientos (0-3)

- **Características Categóricas:**
  - Tipo (Casa, Apartamento, Duplex, Penthouse, Estudio, Villa)
  - Ubicación (Centro, Norte, Sur, Este, Oeste, Suburbio, Zona Residencial)
  - Estado (Nuevo, Excelente, Bueno, Regular, A Remodelar)
  - Orientación (Norte, Sur, Este, Oeste, etc.)

- **Características Booleanas:**
  - Tiene jardín
  - Tiene terraza
  - Tiene balcón
  - Tiene piscina
  - Tiene gimnasio
  - Tiene seguridad
  - Cerca de transporte
  - Cerca de escuelas
  - Cerca de comercios

## 🤖 Algoritmos Utilizados

1. **Random Forest Classifier**
   - Clasificación de inmuebles por categoría de precio
   - Identificación de características más importantes
   - Alta precisión y robustez

2. **K-Means Clustering**
   - Agrupación de inmuebles similares
   - Recomendaciones basadas en similitud
   - Análisis de segmentos de mercado

3. **StandardScaler**
   - Normalización de características numéricas
   - Mejora el rendimiento de los algoritmos

4. **LabelEncoder**
   - Codificación de variables categóricas
   - Permite usar características no numéricas

## 📝 Ejemplos de Salida

### Análisis del Dataset
```
✓ Dataset cargado: 1000 inmuebles
✓ Columnas: ['id', 'tipo', 'ubicacion', 'habitaciones', ...]

📊 Total de inmuebles: 1000
📊 Características: 25

💰 Precios:
  Promedio: $234,567.00
  Mínimo: $45,000.00
  Máximo: $1,250,000.00
```

### Resultados de Búsqueda
```
✓ Encontrados 47 inmuebles que cumplen los criterios

tipo          ubicacion  habitaciones  banos  area_m2    precio
Casa          Norte      3             2      125.5      $245,000
Casa          Centro     3             2      135.2      $289,000
Casa          Este       3             2      118.7      $232,000
...
```

## 🔧 Solución de Problemas

### Error: "No module named 'sklearn'"
```bash
pip install scikit-learn
```

### Error: "No se encontró el archivo dataset_inmuebles.csv"
Ejecuta primero:
```bash
python generar_dataset.py
```

### El modelo tarda mucho en entrenar
Reduce el tamaño del dataset o ajusta los parámetros:
```python
modelo.entrenar_modelo_clasificacion(n_estimators=50)  # Menos árboles
modelo.entrenar_clustering(n_clusters=3)  # Menos clusters
```

## 📚 Referencia Completa de API

### Clase `ModeloInmuebles`

#### Constructor

```python
modelo = ModeloInmuebles()
```
Inicializa una nueva instancia del modelo con todos los componentes necesarios.

---

#### `cargar_dataset(ruta_archivo=None, dataframe=None)`

Carga el dataset de inmuebles desde un archivo o DataFrame.

**Parámetros:**
- `ruta_archivo` (str, opcional): Ruta al archivo CSV, Excel o JSON
- `dataframe` (pd.DataFrame, opcional): DataFrame de pandas

**Retorna:**
- `pd.DataFrame`: Dataset cargado

**Ejemplo:**
```python
# Desde archivo CSV
modelo.cargar_dataset('inmuebles.csv')

# Desde Excel
modelo.cargar_dataset('inmuebles.xlsx')

# Desde DataFrame
import pandas as pd
df = pd.read_csv('datos.csv')
modelo.cargar_dataset(dataframe=df)
```

**Excepciones:**
- `ValueError`: Si no se proporciona archivo ni DataFrame
- `ValueError`: Si el formato de archivo no es soportado

---

#### `analizar_dataset()`

Analiza el dataset y muestra estadísticas descriptivas completas.

**Retorna:**
- `pd.DataFrame`: Estadísticas descriptivas

**Salida:**
- Información general del dataset
- Estadísticas descriptivas (media, mediana, desviación estándar, etc.)
- Detección de valores faltantes
- Distribución de características

**Ejemplo:**
```python
stats = modelo.analizar_dataset()
```

---

#### `preprocesar_datos(columna_objetivo=None)`

Preprocesa los datos para el entrenamiento del modelo.

**Parámetros:**
- `columna_objetivo` (str, opcional): Nombre de la columna objetivo a excluir del preprocesamiento

**Retorna:**
- `pd.DataFrame`: Dataset preprocesado

**Operaciones realizadas:**
1. Limpieza de valores faltantes (media para numéricos, moda para categóricos)
2. Identificación automática de características numéricas y categóricas
3. Codificación de variables categóricas con LabelEncoder
4. Creación de columnas `_encoded` para cada variable categórica

**Ejemplo:**
```python
modelo.preprocesar_datos()
# O especificando columna objetivo
modelo.preprocesar_datos(columna_objetivo='precio')
```

---

#### `crear_categorias_precio(columna_precio='precio')`

Crea categorías de precio basadas en cuartiles del dataset.

**Parámetros:**
- `columna_precio` (str): Nombre de la columna de precio (default: 'precio')

**Retorna:**
- `dict`: Diccionario con categorías y sus valores máximos

**Categorías creadas:**
- **Económico**: Primer cuartil (25%)
- **Medio**: Segundo cuartil (50%)
- **Alto**: Tercer cuartil (75%)
- **Premium**: Cuarto cuartil (100%)

**Ejemplo:**
```python
categorias = modelo.crear_categorias_precio('precio')
# Salida: {'Económico': 150000, 'Medio': 250000, 'Alto': 400000, 'Premium': 800000}
```

---

#### `entrenar_modelo_clasificacion(columna_objetivo='categoria_precio')`

Entrena un modelo Random Forest para clasificar inmuebles.

**Parámetros:**
- `columna_objetivo` (str): Columna objetivo para la clasificación

**Retorna:**
- `float`: Accuracy del modelo (0.0 a 1.0)

**Configuración del modelo:**
- Algoritmo: Random Forest Classifier
- Número de estimadores: 100
- Profundidad máxima: 10
- División train/test: 80/20
- Random state: 42

**Salida:**
- Precisión del modelo
- Top 5 características más importantes

**Ejemplo:**
```python
accuracy = modelo.entrenar_modelo_clasificacion('categoria_precio')
print(f"Precisión: {accuracy:.2%}")
```

---

#### `entrenar_clustering(n_clusters=5)`

Entrena un modelo K-Means para agrupar inmuebles similares.

**Parámetros:**
- `n_clusters` (int): Número de clusters a crear (default: 5)

**Retorna:**
- `pd.Series`: Serie con la asignación de cluster para cada inmueble

**Configuración del modelo:**
- Algoritmo: K-Means
- Random state: 42
- Inicializaciones: 10

**Salida:**
- Distribución de inmuebles por cluster

**Ejemplo:**
```python
clusters = modelo.entrenar_clustering(n_clusters=5)
```

---

#### `categorizar_inmuebles(criterios)`

Filtra y categoriza inmuebles según criterios específicos.

**Parámetros:**
- `criterios` (dict): Diccionario con criterios de filtrado

**Retorna:**
- `pd.DataFrame`: DataFrame con inmuebles que cumplen los criterios

**Criterios soportados:**
- **Valores exactos**: `{'tipo': 'Casa', 'habitaciones': 3}`
- **Rangos mínimos**: `{'precio_min': 100000, 'habitaciones_min': 2}`
- **Rangos máximos**: `{'precio_max': 500000, 'area_m2_max': 200}`
- **Listas de valores**: `{'tipo': ['Casa', 'Apartamento']}`
- **Booleanos**: `{'tiene_jardin': True, 'tiene_piscina': True}`

**Ejemplo:**
```python
criterios = {
    'tipo': 'Casa',
    'precio_min': 150000,
    'precio_max': 300000,
    'habitaciones_min': 3,
    'tiene_jardin': True,
    'cerca_escuelas': True
}
resultado = modelo.categorizar_inmuebles(criterios)
```

---

#### `buscar_similares(inmueble_id, n_similares=5)`

Encuentra inmuebles similares basándose en clustering.

**Parámetros:**
- `inmueble_id` (int): ID del inmueble de referencia
- `n_similares` (int): Número de similares a retornar (default: 5)

**Retorna:**
- `pd.DataFrame`: DataFrame con los inmuebles similares

**Funcionamiento:**
1. Identifica el cluster del inmueble de referencia
2. Busca otros inmuebles en el mismo cluster
3. Retorna los N más similares

**Ejemplo:**
```python
similares = modelo.buscar_similares(inmueble_id=42, n_similares=10)
```

---

#### `guardar_modelo(ruta='modelo_inmuebles.pkl')`

Guarda el modelo entrenado en disco.

**Parámetros:**
- `ruta` (str): Ruta donde guardar el modelo (default: 'modelo_inmuebles.pkl')

**Componentes guardados:**
- Scaler entrenado
- Label encoders
- Modelo de clasificación
- Modelo de clustering
- Características numéricas y categóricas
- Categorías de precio

**Ejemplo:**
```python
modelo.guardar_modelo('mi_modelo.pkl')
```

---

#### `cargar_modelo(ruta='modelo_inmuebles.pkl')`

Carga un modelo previamente entrenado desde disco.

**Parámetros:**
- `ruta` (str): Ruta del modelo a cargar (default: 'modelo_inmuebles.pkl')

**Ejemplo:**
```python
modelo_nuevo = ModeloInmuebles()
modelo_nuevo.cargar_modelo('mi_modelo.pkl')
# El modelo está listo para usar sin reentrenar
```

---

#### `generar_reporte(resultado, nombre_archivo='reporte_inmuebles.csv')`

Genera un reporte CSV con los resultados de una búsqueda.

**Parámetros:**
- `resultado` (pd.DataFrame): DataFrame con los inmuebles a reportar
- `nombre_archivo` (str): Nombre del archivo de salida

**Retorna:**
- `str`: Nombre del archivo generado

**Contenido del reporte:**
- Todas las características de los inmuebles
- Estadísticas resumidas (precio promedio, mínimo, máximo)

**Ejemplo:**
```python
resultado = modelo.categorizar_inmuebles(criterios)
modelo.generar_reporte(resultado, 'busqueda_casas.csv')
```

---

### Funciones Auxiliares

#### `generar_dataset_inmuebles(n_inmuebles=1000, guardar=True)`

Genera un dataset sintético de inmuebles con características realistas.

**Parámetros:**
- `n_inmuebles` (int): Número de inmuebles a generar
- `guardar` (bool): Si True, guarda el dataset en CSV

**Retorna:**
- `pd.DataFrame`: Dataset generado

**Ejemplo:**
```python
from generar_dataset import generar_dataset_inmuebles
df = generar_dataset_inmuebles(n_inmuebles=5000, guardar=True)
```

## 📖 Manuales de Uso Completos

### Manual 1: Inicio Rápido (5 minutos)

```python
# 1. Importar y crear modelo
from modelo_inmuebles import ModeloInmuebles
modelo = ModeloInmuebles()

# 2. Cargar dataset (usa el incluido o genera uno nuevo)
modelo.cargar_dataset('inmuebles_sintetico_colombia_plus.csv')

# 3. Preprocesar datos
modelo.preprocesar_datos()

# 4. Crear categorías y entrenar
modelo.crear_categorias_precio('precio')
modelo.entrenar_modelo_clasificacion('categoria_precio')
modelo.entrenar_clustering(n_clusters=5)

# 5. Buscar inmuebles
criterios = {'tipo': 'Casa', 'habitaciones': 3}
resultado = modelo.categorizar_inmuebles(criterios)
print(f"Encontrados: {len(resultado)} inmuebles")

# 6. Guardar modelo para reutilizar
modelo.guardar_modelo('mi_modelo.pkl')
```

---

### Manual 2: Búsqueda Avanzada de Inmuebles

```python
from modelo_inmuebles import ModeloInmuebles

# Inicializar y cargar modelo previamente entrenado
modelo = ModeloInmuebles()
modelo.cargar_dataset('inmuebles_sintetico_colombia_plus.csv')
modelo.preprocesar_datos()
modelo.cargar_modelo('modelo_inmuebles.pkl')

# Búsqueda 1: Casa familiar con jardín
print("=== Búsqueda: Casa Familiar ===")
criterios_familia = {
    'tipo': 'Casa',
    'habitaciones_min': 3,
    'banos_min': 2,
    'tiene_jardin': True,
    'estacionamientos_min': 1,
    'cerca_escuelas': True,
    'precio_max': 350000
}
casas_familia = modelo.categorizar_inmuebles(criterios_familia)
print(f"Encontradas: {len(casas_familia)} casas")
modelo.generar_reporte(casas_familia, 'casas_familiares.csv')

# Búsqueda 2: Apartamento de lujo en el centro
print("\n=== Búsqueda: Apartamento Premium ===")
criterios_premium = {
    'tipo': 'Apartamento',
    'ubicacion': 'Centro',
    'precio_min': 400000,
    'estado': 'Nuevo',
    'tiene_gimnasio': True,
    'tiene_seguridad': True,
    'tiene_piscina': True
}
apts_premium = modelo.categorizar_inmuebles(criterios_premium)
print(f"Encontrados: {len(apts_premium)} apartamentos")

# Búsqueda 3: Inversión económica
print("\n=== Búsqueda: Inversión Económica ===")
criterios_inversion = {
    'precio_max': 150000,
    'estado': ['Bueno', 'Excelente', 'Nuevo'],
    'cerca_transporte': True,
    'area_m2_min': 50
}
inversiones = modelo.categorizar_inmuebles(criterios_inversion)
print(f"Encontradas: {len(inversiones)} oportunidades")

# Análisis de resultados
if len(casas_familia) > 0:
    print("\n=== Estadísticas de Casas Familiares ===")
    print(f"Precio promedio: ${casas_familia['precio'].mean():,.2f}")
    print(f"Área promedio: {casas_familia['area_m2'].mean():.1f} m²")
    print(f"Habitaciones promedio: {casas_familia['habitaciones'].mean():.1f}")
```

---

### Manual 3: Sistema de Recomendaciones

```python
from modelo_inmuebles import ModeloInmuebles
import pandas as pd

# Cargar modelo entrenado
modelo = ModeloInmuebles()
modelo.cargar_dataset('inmuebles_sintetico_colombia_plus.csv')
modelo.preprocesar_datos()
modelo.cargar_modelo('modelo_inmuebles.pkl')

# Seleccionar un inmueble de referencia
inmueble_ref_id = 100
inmueble_ref = modelo.df.iloc[inmueble_ref_id]

print("=== INMUEBLE DE REFERENCIA ===")
print(f"ID: {inmueble_ref_id}")
print(f"Tipo: {inmueble_ref['tipo']}")
print(f"Ubicación: {inmueble_ref['ubicacion']}")
print(f"Habitaciones: {inmueble_ref['habitaciones']}")
print(f"Baños: {inmueble_ref['banos']}")
print(f"Área: {inmueble_ref['area_m2']} m²")
print(f"Precio: ${inmueble_ref['precio']:,.2f}")

# Buscar inmuebles similares
print("\n=== INMUEBLES SIMILARES ===")
similares = modelo.buscar_similares(inmueble_ref_id, n_similares=10)

for idx, inmueble in similares.iterrows():
    print(f"\nSimilar #{idx}")
    print(f"  Tipo: {inmueble['tipo']}")
    print(f"  Ubicación: {inmueble['ubicacion']}")
    print(f"  Habitaciones: {inmueble['habitaciones']}")
    print(f"  Precio: ${inmueble['precio']:,.2f}")
    print(f"  Diferencia de precio: ${abs(inmueble['precio'] - inmueble_ref['precio']):,.2f}")

# Generar reporte de similares
modelo.generar_reporte(similares, 'inmuebles_similares.csv')
```

---

### Manual 4: Análisis de Mercado

```python
from modelo_inmuebles import ModeloInmuebles
import pandas as pd

# Cargar datos
modelo = ModeloInmuebles()
modelo.cargar_dataset('inmuebles_sintetico_colombia_plus.csv')
modelo.preprocesar_datos()

# Análisis general del mercado
print("=== ANÁLISIS GENERAL DEL MERCADO ===")
modelo.analizar_dataset()

# Análisis por tipo de inmueble
print("\n=== ANÁLISIS POR TIPO ===")
tipos = modelo.df.groupby('tipo').agg({
    'precio': ['mean', 'min', 'max', 'count'],
    'area_m2': 'mean',
    'habitaciones': 'mean'
}).round(2)
print(tipos)

# Análisis por ubicación
print("\n=== ANÁLISIS POR UBICACIÓN ===")
ubicaciones = modelo.df.groupby('ubicacion').agg({
    'precio': ['mean', 'count'],
    'area_m2': 'mean'
}).round(2)
print(ubicaciones)

# Análisis de amenidades
print("\n=== IMPACTO DE AMENIDADES EN PRECIO ===")
amenidades = ['tiene_jardin', 'tiene_piscina', 'tiene_gimnasio', 'tiene_seguridad']
for amenidad in amenidades:
    con_amenidad = modelo.df[modelo.df[amenidad] == True]['precio'].mean()
    sin_amenidad = modelo.df[modelo.df[amenidad] == False]['precio'].mean()
    diferencia = con_amenidad - sin_amenidad
    porcentaje = (diferencia / sin_amenidad) * 100
    print(f"{amenidad}: +${diferencia:,.2f} ({porcentaje:.1f}%)")

# Crear categorías y analizar distribución
modelo.crear_categorias_precio('precio')
print("\n=== DISTRIBUCIÓN POR CATEGORÍA DE PRECIO ===")
print(modelo.df['categoria_precio'].value_counts())

# Entrenar clustering y analizar grupos
modelo.entrenar_clustering(n_clusters=5)
print("\n=== ANÁLISIS DE CLUSTERS ===")
for cluster in range(5):
    cluster_data = modelo.df[modelo.df['cluster'] == cluster]
    print(f"\nCluster {cluster}:")
    print(f"  Cantidad: {len(cluster_data)}")
    print(f"  Precio promedio: ${cluster_data['precio'].mean():,.2f}")
    print(f"  Tipo más común: {cluster_data['tipo'].mode()[0]}")
    print(f"  Ubicación más común: {cluster_data['ubicacion'].mode()[0]}")
```

---

### Manual 5: Integración con API REST

```python
# Iniciar el servidor API
# En terminal: python3 api_ejemplo.py

# Luego, desde otro script o aplicación:
import requests
import json

BASE_URL = 'http://localhost:5000'

# 1. Obtener estadísticas generales
response = requests.get(f'{BASE_URL}/estadisticas')
stats = response.json()
print("Estadísticas:", json.dumps(stats, indent=2))

# 2. Buscar inmuebles
criterios = {
    'tipo': 'Casa',
    'habitaciones': 3,
    'precio_max': 300000,
    'tiene_jardin': True
}
response = requests.post(
    f'{BASE_URL}/buscar',
    json=criterios,
    headers={'Content-Type': 'application/json'}
)
resultados = response.json()
print(f"\nEncontrados: {resultados['total_encontrados']} inmuebles")

# 3. Obtener inmuebles similares
inmueble_id = 50
response = requests.get(f'{BASE_URL}/similares/{inmueble_id}?n=5')
similares = response.json()
print(f"\nSimilares al inmueble {inmueble_id}:")
for similar in similares['similares']:
    print(f"  - {similar['tipo']} en {similar['ubicacion']}: ${similar['precio']:,.2f}")

# 4. Obtener filtros disponibles
response = requests.get(f'{BASE_URL}/filtros-disponibles')
filtros = response.json()
print("\nFiltros disponibles:", json.dumps(filtros, indent=2))
```

---

### Manual 6: Uso con Dataset Personalizado

```python
from modelo_inmuebles import ModeloInmuebles
import pandas as pd

# Crear tu propio dataset
datos_personalizados = {
    'id': range(1, 101),
    'tipo': ['Casa', 'Apartamento'] * 50,
    'ubicacion': ['Norte', 'Sur', 'Este', 'Oeste'] * 25,
    'habitaciones': [2, 3, 4] * 33 + [3],
    'banos': [1, 2, 3] * 33 + [2],
    'area_m2': [80 + i*2 for i in range(100)],
    'precio': [150000 + i*3000 for i in range(100)],
    'tiene_jardin': [True, False] * 50,
    'tiene_piscina': [True, False, False, False] * 25,
    'estado': ['Nuevo', 'Excelente', 'Bueno'] * 33 + ['Bueno']
}

df_personalizado = pd.DataFrame(datos_personalizados)

# Usar el modelo con tu dataset
modelo = ModeloInmuebles()
modelo.cargar_dataset(dataframe=df_personalizado)
modelo.preprocesar_datos()

# Entrenar modelos
modelo.crear_categorias_precio('precio')
accuracy = modelo.entrenar_modelo_clasificacion('categoria_precio')
print(f"Precisión del modelo: {accuracy:.2%}")

modelo.entrenar_clustering(n_clusters=3)

# Realizar búsquedas
criterios = {
    'tipo': 'Casa',
    'habitaciones': 3,
    'tiene_jardin': True
}
resultado = modelo.categorizar_inmuebles(criterios)
print(f"Encontrados: {len(resultado)} inmuebles")

# Guardar modelo entrenado
modelo.guardar_modelo('modelo_personalizado.pkl')
```

---

### Manual 7: Interfaz de Línea de Comandos

```bash
# Ejecutar la interfaz interactiva
python3 interfaz_consulta.py

# La interfaz te guiará a través de un menú:
# 1. Búsqueda por tipo de inmueble
# 2. Búsqueda por rango de precio
# 3. Búsqueda por ubicación
# 4. Búsqueda por características
# 5. Búsqueda avanzada (múltiples criterios)
# 6. Buscar inmuebles similares
# 7. Ver estadísticas del dataset
# 8. Generar reporte personalizado
# 9. Salir
```

**Ejemplo de sesión:**
```
Seleccione una opción: 5

🎯 Búsqueda avanzada - Combine múltiples criterios
Tipo de inmueble: Casa
Ubicación: Norte
Precio mínimo: 200000
Precio máximo: 400000
Habitaciones mínimas: 3
Baños mínimos: 2
Área mínima en m²: 100
Estado: Excelente

✓ Encontrados 15 inmuebles que cumplen los criterios

¿Desea generar un reporte con estos resultados? (s/n): s
Nombre del archivo de reporte: casas_norte_premium
✓ Reporte generado: casas_norte_premium.csv
```

---

### Manual 8: Prueba Rápida del Sistema

```bash
# Ejecutar script de verificación
python3 prueba_rapida.py

# Este script:
# 1. Genera un dataset de prueba (200 inmuebles)
# 2. Inicializa el modelo
# 3. Carga y preprocesa datos
# 4. Crea categorías de precio
# 5. Entrena modelo de clasificación
# 6. Entrena clustering
# 7. Realiza una búsqueda de prueba
# 8. Guarda el modelo entrenado

# Salida esperada:
# ✅ Todas las funcionalidades están operativas
# ✅ Dataset: 200 inmuebles
# ✅ Precisión del modelo: 100.00%
# ✅ Archivos generados:
#    - dataset_inmuebles.csv
#    - modelo_inmuebles.pkl
```

## 🎓 Próximos Pasos

1. **Integración con Base de Datos**: Conectar con PostgreSQL o MongoDB
2. **API REST**: Crear endpoints para consultas remotas
3. **Interfaz Web**: Desarrollar frontend con React o Vue.js
4. **Análisis de Imágenes**: Incorporar visión por computadora
5. **Predicción de Precios**: Modelo de regresión para estimar valores
6. **Sistema de Recomendaciones**: Algoritmos más avanzados
7. **Análisis de Tendencias**: Predicción de mercado inmobiliario

## ⚡ Mejores Prácticas y Optimización

### Rendimiento

**1. Reutilizar Modelos Entrenados**
```python
# ❌ Malo: Entrenar cada vez
modelo = ModeloInmuebles()
modelo.cargar_dataset('datos.csv')
modelo.preprocesar_datos()
modelo.entrenar_modelo_clasificacion()  # Lento

# ✅ Bueno: Cargar modelo pre-entrenado
modelo = ModeloInmuebles()
modelo.cargar_dataset('datos.csv')
modelo.preprocesar_datos()
modelo.cargar_modelo('modelo_entrenado.pkl')  # Rápido
```

**2. Optimizar Tamaño de Dataset**
```python
# Para desarrollo/pruebas: usar subset
df_prueba = df.sample(n=1000, random_state=42)
modelo.cargar_dataset(dataframe=df_prueba)

# Para producción: usar dataset completo
modelo.cargar_dataset('dataset_completo.csv')
```

**3. Ajustar Parámetros del Modelo**
```python
# Para datasets grandes (>10,000 inmuebles)
modelo.modelo_clasificacion = RandomForestClassifier(
    n_estimators=50,      # Menos árboles = más rápido
    max_depth=8,          # Menor profundidad = más rápido
    n_jobs=-1             # Usar todos los cores
)

# Para datasets pequeños (<1,000 inmuebles)
modelo.modelo_clasificacion = RandomForestClassifier(
    n_estimators=100,
    max_depth=10
)
```

### Manejo de Errores

```python
from modelo_inmuebles import ModeloInmuebles

try:
    modelo = ModeloInmuebles()
    modelo.cargar_dataset('datos.csv')
    modelo.preprocesar_datos()
    
    # Verificar que hay suficientes datos
    if len(modelo.df) < 100:
        print("⚠️ Dataset muy pequeño, resultados pueden no ser confiables")
    
    modelo.crear_categorias_precio('precio')
    accuracy = modelo.entrenar_modelo_clasificacion('categoria_precio')
    
    # Verificar precisión del modelo
    if accuracy < 0.7:
        print("⚠️ Precisión baja, considere mejorar el dataset")
    
except FileNotFoundError:
    print("❌ Error: Archivo no encontrado")
except ValueError as e:
    print(f"❌ Error de valor: {e}")
except Exception as e:
    print(f"❌ Error inesperado: {e}")
```

### Validación de Datos

```python
def validar_dataset(df):
    """Valida que el dataset tenga las columnas necesarias"""
    columnas_requeridas = ['tipo', 'precio', 'habitaciones', 'area_m2']
    
    for col in columnas_requeridas:
        if col not in df.columns:
            raise ValueError(f"Columna requerida '{col}' no encontrada")
    
    # Validar tipos de datos
    if not pd.api.types.is_numeric_dtype(df['precio']):
        raise ValueError("La columna 'precio' debe ser numérica")
    
    # Validar rangos
    if (df['precio'] < 0).any():
        raise ValueError("Precios negativos encontrados")
    
    print("✓ Dataset validado correctamente")
    return True

# Uso
df = pd.read_csv('datos.csv')
validar_dataset(df)
modelo.cargar_dataset(dataframe=df)
```

### Logging y Monitoreo

```python
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('modelo_inmuebles.log'),
        logging.StreamHandler()
    ]
)

# Usar en tu código
logging.info("Iniciando carga de dataset")
modelo.cargar_dataset('datos.csv')
logging.info(f"Dataset cargado: {len(modelo.df)} inmuebles")

logging.info("Iniciando entrenamiento")
accuracy = modelo.entrenar_modelo_clasificacion('categoria_precio')
logging.info(f"Modelo entrenado con accuracy: {accuracy:.2%}")
```

### Seguridad

**1. Validar Entrada de Usuario**
```python
def validar_criterios(criterios):
    """Valida criterios de búsqueda del usuario"""
    # Validar tipos
    if 'precio_min' in criterios:
        if not isinstance(criterios['precio_min'], (int, float)):
            raise ValueError("precio_min debe ser numérico")
        if criterios['precio_min'] < 0:
            raise ValueError("precio_min no puede ser negativo")
    
    # Validar rangos lógicos
    if 'precio_min' in criterios and 'precio_max' in criterios:
        if criterios['precio_min'] > criterios['precio_max']:
            raise ValueError("precio_min no puede ser mayor que precio_max")
    
    return True

# Uso
criterios = {'precio_min': 100000, 'precio_max': 500000}
validar_criterios(criterios)
resultado = modelo.categorizar_inmuebles(criterios)
```

**2. Sanitizar Nombres de Archivo**
```python
import re

def sanitizar_nombre_archivo(nombre):
    """Sanitiza nombres de archivo para evitar inyección de path"""
    # Remover caracteres peligrosos
    nombre = re.sub(r'[^\w\s-]', '', nombre)
    nombre = re.sub(r'[-\s]+', '_', nombre)
    return nombre + '.csv'

# Uso
nombre_usuario = input("Nombre del reporte: ")
nombre_seguro = sanitizar_nombre_archivo(nombre_usuario)
modelo.generar_reporte(resultado, nombre_seguro)
```

### Testing

```python
import unittest

class TestModeloInmuebles(unittest.TestCase):
    
    def setUp(self):
        """Configurar antes de cada test"""
        self.modelo = ModeloInmuebles()
        # Crear dataset de prueba pequeño
        self.df_test = pd.DataFrame({
            'tipo': ['Casa', 'Apartamento'] * 50,
            'precio': range(100000, 200000, 1000),
            'habitaciones': [2, 3, 4] * 33 + [3],
            'area_m2': range(50, 150)
        })
    
    def test_cargar_dataset(self):
        """Test de carga de dataset"""
        self.modelo.cargar_dataset(dataframe=self.df_test)
        self.assertEqual(len(self.modelo.df), 100)
    
    def test_preprocesar_datos(self):
        """Test de preprocesamiento"""
        self.modelo.cargar_dataset(dataframe=self.df_test)
        self.modelo.preprocesar_datos()
        self.assertIsNotNone(self.modelo.caracteristicas_numericas)
    
    def test_categorizar_inmuebles(self):
        """Test de búsqueda"""
        self.modelo.cargar_dataset(dataframe=self.df_test)
        self.modelo.preprocesar_datos()
        resultado = self.modelo.categorizar_inmuebles({'tipo': 'Casa'})
        self.assertGreater(len(resultado), 0)

if __name__ == '__main__':
    unittest.main()
```

### Documentación del Código

```python
def buscar_inmuebles_personalizados(
    modelo: ModeloInmuebles,
    tipo: str,
    precio_max: float,
    ubicacion: str = None,
    **kwargs
) -> pd.DataFrame:
    """
    Busca inmuebles con criterios personalizados.
    
    Args:
        modelo: Instancia de ModeloInmuebles ya entrenada
        tipo: Tipo de inmueble ('Casa', 'Apartamento', etc.)
        precio_max: Precio máximo en la moneda del dataset
        ubicacion: Ubicación específica (opcional)
        **kwargs: Criterios adicionales de búsqueda
    
    Returns:
        DataFrame con los inmuebles encontrados
    
    Raises:
        ValueError: Si el modelo no está entrenado
        ValueError: Si los parámetros son inválidos
    
    Example:
        >>> modelo = ModeloInmuebles()
        >>> modelo.cargar_dataset('datos.csv')
        >>> resultado = buscar_inmuebles_personalizados(
        ...     modelo, 
        ...     tipo='Casa',
        ...     precio_max=300000,
        ...     habitaciones_min=3
        ... )
    """
    if modelo.df is None:
        raise ValueError("Modelo no tiene dataset cargado")
    
    criterios = {
        'tipo': tipo,
        'precio_max': precio_max
    }
    
    if ubicacion:
        criterios['ubicacion'] = ubicacion
    
    criterios.update(kwargs)
    
    return modelo.categorizar_inmuebles(criterios)
```

## 🔒 Consideraciones de Seguridad

1. **Datos Sensibles**: No incluir información personal identificable en los datasets
2. **Validación de Entrada**: Siempre validar datos de usuario antes de procesarlos
3. **Permisos de Archivo**: Verificar permisos al guardar/cargar modelos
4. **API REST**: Implementar autenticación y rate limiting en producción
5. **Logs**: No registrar información sensible en los logs

## 📊 Métricas y Monitoreo

```python
def obtener_metricas_modelo(modelo):
    """Obtiene métricas del modelo para monitoreo"""
    metricas = {
        'timestamp': datetime.now().isoformat(),
        'total_inmuebles': len(modelo.df),
        'caracteristicas_numericas': len(modelo.caracteristicas_numericas),
        'caracteristicas_categoricas': len(modelo.caracteristicas_categoricas),
        'clusters': modelo.df['cluster'].nunique() if 'cluster' in modelo.df.columns else 0,
        'precio_promedio': float(modelo.df['precio'].mean()),
        'precio_mediana': float(modelo.df['precio'].median())
    }
    return metricas

# Uso
metricas = obtener_metricas_modelo(modelo)
print(json.dumps(metricas, indent=2))
```

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso educativo y comercial.

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📧 Soporte

Para preguntas o soporte, por favor abre un issue en el repositorio.

## 🙏 Agradecimientos

- **scikit-learn**: Por los algoritmos de Machine Learning
- **pandas**: Por el manejo eficiente de datos
- **Comunidad Python**: Por las herramientas y librerías

---

**¡Disfruta analizando y categorizando inmuebles con IA! 🏠🤖**

*Última actualización: Noviembre 2025*
