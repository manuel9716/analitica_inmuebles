# 📁 Estructura del Proyecto

## Árbol de Archivos

```
Modelo Local de IA/
│
├── 📄 README.md                    # Documentación completa del proyecto
├── 📄 INICIO_RAPIDO.md            # Guía de inicio rápido
├── 📄 ESTRUCTURA_PROYECTO.md      # Este archivo
├── 📄 requirements.txt            # Dependencias de Python
├── 📄 .gitignore                  # Archivos ignorados por Git
│
├── 🤖 modelo_inmuebles.py         # Clase principal del modelo de IA
├── 📊 generar_dataset.py          # Generador de dataset sintético
│
├── 💻 interfaz_consulta.py        # Interfaz CLI interactiva
├── 📝 ejemplo_uso.py              # Ejemplos básicos de uso
├── 🎯 ejemplos_avanzados.py       # Ejemplos avanzados y casos complejos
├── ⚡ prueba_rapida.py            # Script de verificación rápida
│
└── 🌐 api_ejemplo.py              # API REST con Flask (opcional)
```

## Descripción de Archivos

### 📚 Documentación

| Archivo | Descripción |
|---------|-------------|
| `README.md` | Documentación completa con guías de uso, ejemplos y referencia de API |
| `INICIO_RAPIDO.md` | Guía de inicio rápido en 3 pasos |
| `ESTRUCTURA_PROYECTO.md` | Este archivo - Estructura y organización del proyecto |

### 🔧 Configuración

| Archivo | Descripción |
|---------|-------------|
| `requirements.txt` | Lista de dependencias de Python necesarias |
| `.gitignore` | Archivos y carpetas ignorados por control de versiones |

### 🧠 Núcleo del Sistema

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `modelo_inmuebles.py` | ~400 | **Clase principal del modelo de IA**<br>- Carga y análisis de datasets<br>- Preprocesamiento de datos<br>- Entrenamiento de modelos (Random Forest, K-Means)<br>- Categorización y filtrado<br>- Búsqueda de similares<br>- Generación de reportes |
| `generar_dataset.py` | ~200 | **Generador de datos sintéticos**<br>- Crea datasets realistas de inmuebles<br>- Características numéricas y categóricas<br>- Cálculo de precios basado en factores reales |

### 💻 Interfaces de Usuario

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `interfaz_consulta.py` | ~500 | **Interfaz CLI interactiva**<br>- Menú de opciones<br>- Búsquedas guiadas<br>- Visualización de resultados<br>- Generación de reportes |
| `ejemplo_uso.py` | ~300 | **Ejemplos básicos**<br>- Flujo completo de uso<br>- Casos de uso comunes<br>- Demostraciones paso a paso |
| `ejemplos_avanzados.py` | ~500 | **Ejemplos avanzados**<br>- Análisis de mercado<br>- Filtros complejos<br>- Scoring personalizado<br>- Exportación múltiple |
| `prueba_rapida.py` | ~150 | **Script de verificación**<br>- Prueba todas las funcionalidades<br>- Verifica instalación correcta<br>- Genera archivos de prueba |

### 🌐 API (Opcional)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `api_ejemplo.py` | ~400 | **API REST con Flask**<br>- Endpoints RESTful<br>- Búsquedas vía HTTP<br>- Formato JSON<br>- CORS habilitado |

## Flujo de Trabajo

### 1️⃣ Instalación Inicial
```
requirements.txt → pip install → Dependencias instaladas
```

### 2️⃣ Verificación
```
prueba_rapida.py → Genera dataset → Entrena modelo → Verifica funcionamiento
```

### 3️⃣ Uso Normal

#### Opción A: Interfaz Interactiva
```
interfaz_consulta.py → Menú interactivo → Búsquedas → Reportes
```

#### Opción B: Programático
```
modelo_inmuebles.py → Importar clase → Usar métodos → Resultados
```

#### Opción C: API REST
```
api_ejemplo.py → Servidor Flask → Endpoints HTTP → Respuestas JSON
```

## Archivos Generados Durante el Uso

| Archivo | Descripción |
|---------|-------------|
| `dataset_inmuebles.csv` | Dataset generado con datos de inmuebles |
| `modelo_inmuebles.pkl` | Modelo entrenado guardado |
| `reporte_*.csv` | Reportes de búsquedas |
| `export_*.csv/xlsx/json/html` | Exportaciones en varios formatos |

## Dependencias

### Principales
- **pandas**: Manipulación de datos
- **numpy**: Operaciones numéricas
- **scikit-learn**: Algoritmos de Machine Learning
- **joblib**: Serialización de modelos

### Opcionales
- **flask**: API REST (solo para `api_ejemplo.py`)
- **flask-cors**: CORS para API (solo para `api_ejemplo.py`)
- **openpyxl**: Exportación a Excel

## Tamaño del Proyecto

| Categoría | Cantidad |
|-----------|----------|
| **Archivos Python** | 7 |
| **Archivos Markdown** | 3 |
| **Archivos Config** | 2 |
| **Total Líneas de Código** | ~2,500 |
| **Clases Principales** | 2 |
| **Funciones/Métodos** | ~50 |

## Módulos y Clases

### Clase: `ModeloInmuebles`
```python
modelo_inmuebles.py
└── ModeloInmuebles
    ├── __init__()
    ├── cargar_dataset()
    ├── analizar_dataset()
    ├── preprocesar_datos()
    ├── crear_categorias_precio()
    ├── entrenar_modelo_clasificacion()
    ├── entrenar_clustering()
    ├── categorizar_inmuebles()
    ├── buscar_similares()
    ├── guardar_modelo()
    ├── cargar_modelo()
    └── generar_reporte()
```

### Clase: `InterfazConsulta`
```python
interfaz_consulta.py
└── InterfazConsulta
    ├── __init__()
    ├── inicializar()
    ├── mostrar_menu()
    ├── busqueda_por_tipo()
    ├── busqueda_por_precio()
    ├── busqueda_por_ubicacion()
    ├── busqueda_por_caracteristicas()
    ├── busqueda_avanzada()
    ├── buscar_similares()
    ├── ver_estadisticas()
    ├── generar_reporte()
    └── ejecutar()
```

## Algoritmos Implementados

### Machine Learning
1. **Random Forest Classifier**
   - Archivo: `modelo_inmuebles.py`
   - Método: `entrenar_modelo_clasificacion()`
   - Uso: Clasificación de inmuebles por categoría

2. **K-Means Clustering**
   - Archivo: `modelo_inmuebles.py`
   - Método: `entrenar_clustering()`
   - Uso: Agrupación de inmuebles similares

### Preprocesamiento
1. **StandardScaler**
   - Normalización de características numéricas

2. **LabelEncoder**
   - Codificación de variables categóricas

## Características del Dataset

### Características Numéricas (8)
- Precio
- Habitaciones
- Baños
- Área construida (m²)
- Área de terreno (m²)
- Antigüedad (años)
- Pisos
- Estacionamientos

### Características Categóricas (4)
- Tipo de inmueble
- Ubicación
- Estado
- Orientación

### Características Booleanas (9)
- Tiene jardín
- Tiene terraza
- Tiene balcón
- Tiene piscina
- Tiene gimnasio
- Tiene seguridad
- Cerca de transporte
- Cerca de escuelas
- Cerca de comercios

## Puntos de Entrada

### Para Usuarios
1. **Inicio rápido**: `python prueba_rapida.py`
2. **Interfaz interactiva**: `python interfaz_consulta.py`
3. **Ver ejemplos**: `python ejemplo_uso.py`

### Para Desarrolladores
1. **Importar clase**: `from modelo_inmuebles import ModeloInmuebles`
2. **API REST**: `python api_ejemplo.py`
3. **Ejemplos avanzados**: `python ejemplos_avanzados.py`

## Extensibilidad

El proyecto está diseñado para ser fácilmente extensible:

### Agregar Nuevas Características
```python
# En generar_dataset.py
data['nueva_caracteristica'] = ...
```

### Agregar Nuevos Algoritmos
```python
# En modelo_inmuebles.py
def entrenar_nuevo_modelo(self):
    # Implementación
    pass
```

### Agregar Nuevos Endpoints
```python
# En api_ejemplo.py
@app.route('/nuevo-endpoint')
def nuevo_endpoint():
    # Implementación
    pass
```

## Próximas Mejoras Sugeridas

1. ✅ **Completado**: Sistema básico de IA
2. 🔄 **En progreso**: Documentación
3. 📋 **Planeado**:
   - Integración con base de datos
   - Frontend web con React
   - Análisis de imágenes con visión por computadora
   - Sistema de recomendaciones avanzado
   - Predicción de precios con regresión
   - Dashboard de visualización

## Licencia y Contribuciones

- Proyecto de código abierto
- Contribuciones bienvenidas
- Ver README.md para más detalles

---

**Última actualización**: Noviembre 2024
