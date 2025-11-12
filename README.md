# 🏠 Modelo de IA para Análisis y Categorización de Inmuebles

Sistema inteligente de análisis y categorización de inmuebles utilizando Machine Learning. Permite analizar datasets de propiedades y categorizar resultados según características específicas.

## 📋 Características Principales

- **Análisis de Dataset**: Estadísticas descriptivas y exploración de datos
- **Categorización Inteligente**: Clasificación automática de inmuebles por precio y características
- **Clustering**: Agrupación de inmuebles similares
- **Búsqueda Avanzada**: Filtrado por múltiples criterios
- **Recomendaciones**: Encuentra inmuebles similares
- **Reportes**: Generación de reportes personalizados en CSV

## 🚀 Instalación

### Requisitos Previos
- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Pasos de Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

## 📊 Estructura del Proyecto

```
Modelo Local de IA/
├── modelo_inmuebles.py      # Clase principal del modelo de IA
├── generar_dataset.py        # Generador de dataset de ejemplo
├── ejemplo_uso.py            # Ejemplos de uso completos
├── interfaz_consulta.py      # Interfaz interactiva CLI
├── requirements.txt          # Dependencias del proyecto
└── README.md                 # Este archivo
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

## 📚 Documentación Adicional

### Métodos Principales de la Clase ModeloInmuebles

- `cargar_dataset(ruta_archivo)`: Carga datos desde archivo
- `analizar_dataset()`: Muestra estadísticas del dataset
- `preprocesar_datos()`: Prepara datos para entrenamiento
- `crear_categorias_precio(columna)`: Crea categorías de precio
- `entrenar_modelo_clasificacion(columna_objetivo)`: Entrena clasificador
- `entrenar_clustering(n_clusters)`: Entrena modelo de clustering
- `categorizar_inmuebles(criterios)`: Filtra inmuebles por criterios
- `buscar_similares(inmueble_id, n_similares)`: Encuentra similares
- `guardar_modelo(ruta)`: Guarda modelo entrenado
- `cargar_modelo(ruta)`: Carga modelo guardado
- `generar_reporte(resultado, nombre_archivo)`: Genera reporte CSV

## 🎓 Próximos Pasos

1. **Integración con Base de Datos**: Conectar con PostgreSQL o MongoDB
2. **API REST**: Crear endpoints para consultas remotas
3. **Interfaz Web**: Desarrollar frontend con React o Vue.js
4. **Análisis de Imágenes**: Incorporar visión por computadora
5. **Predicción de Precios**: Modelo de regresión para estimar valores
6. **Sistema de Recomendaciones**: Algoritmos más avanzados
7. **Análisis de Tendencias**: Predicción de mercado inmobiliario

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso educativo y comercial.

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📧 Soporte

Para preguntas o soporte, por favor abre un issue en el repositorio.

---

**¡Disfruta analizando y categorizando inmuebles con IA! 🏠🤖**
