"""
Modelo de IA para análisis y categorización de inmuebles
Utiliza Machine Learning para clasificar y filtrar propiedades según características
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import json
from typing import Dict, List, Any, Optional
import warnings
warnings.filterwarnings('ignore')


class ModeloInmuebles:
    """
    Modelo de IA para análisis y categorización de inmuebles
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.modelo_clasificacion = None
        self.modelo_clustering = None
        self.caracteristicas_numericas = []
        self.caracteristicas_categoricas = []
        self.df = None
        self.categorias_precio = None
        
    def cargar_dataset(self, ruta_archivo: str = None, dataframe: pd.DataFrame = None):
        """
        Carga el dataset de inmuebles desde archivo o DataFrame
        """
        if dataframe is not None:
            self.df = dataframe.copy()
        elif ruta_archivo:
            if ruta_archivo.endswith('.csv'):
                self.df = pd.read_csv(ruta_archivo)
            elif ruta_archivo.endswith('.xlsx') or ruta_archivo.endswith('.xls'):
                self.df = pd.read_excel(ruta_archivo)
            elif ruta_archivo.endswith('.json'):
                self.df = pd.read_json(ruta_archivo)
            else:
                raise ValueError("Formato de archivo no soportado. Use CSV, Excel o JSON")
        else:
            raise ValueError("Debe proporcionar una ruta de archivo o un DataFrame")
        
        print(f"✓ Dataset cargado: {len(self.df)} inmuebles")
        print(f"✓ Columnas: {list(self.df.columns)}")
        return self.df
    
    def analizar_dataset(self):
        """
        Analiza el dataset y muestra estadísticas descriptivas
        """
        if self.df is None:
            raise ValueError("Primero debe cargar un dataset")
        
        print("\n" + "="*60)
        print("ANÁLISIS DEL DATASET DE INMUEBLES")
        print("="*60)
        
        print(f"\n📊 Total de inmuebles: {len(self.df)}")
        print(f"📊 Características: {len(self.df.columns)}")
        
        print("\n🔍 Información general:")
        print(self.df.info())
        
        print("\n📈 Estadísticas descriptivas:")
        print(self.df.describe())
        
        # Identificar valores faltantes
        valores_faltantes = self.df.isnull().sum()
        if valores_faltantes.sum() > 0:
            print("\n⚠️  Valores faltantes:")
            print(valores_faltantes[valores_faltantes > 0])
        else:
            print("\n✓ No hay valores faltantes")
        
        return self.df.describe()
    
    def preprocesar_datos(self, columna_objetivo: str = None):
        """
        Preprocesa los datos para el entrenamiento del modelo
        """
        if self.df is None:
            raise ValueError("Primero debe cargar un dataset")
        
        print("\n🔧 Preprocesando datos...")
        
        # Limpiar valores faltantes
        self.df = self.df.fillna(self.df.mean(numeric_only=True))
        self.df = self.df.fillna(self.df.mode().iloc[0])
        
        # Identificar características numéricas y categóricas
        self.caracteristicas_numericas = self.df.select_dtypes(include=[np.number]).columns.tolist()
        self.caracteristicas_categoricas = self.df.select_dtypes(include=['object']).columns.tolist()
        
        # Remover columna objetivo de las características si existe
        if columna_objetivo and columna_objetivo in self.caracteristicas_numericas:
            self.caracteristicas_numericas.remove(columna_objetivo)
        if columna_objetivo and columna_objetivo in self.caracteristicas_categoricas:
            self.caracteristicas_categoricas.remove(columna_objetivo)
        
        # Codificar variables categóricas
        for col in self.caracteristicas_categoricas:
            le = LabelEncoder()
            self.df[col + '_encoded'] = le.fit_transform(self.df[col].astype(str))
            self.label_encoders[col] = le
        
        print(f"✓ Características numéricas: {len(self.caracteristicas_numericas)}")
        print(f"✓ Características categóricas: {len(self.caracteristicas_categoricas)}")
        
        return self.df
    
    def crear_categorias_precio(self, columna_precio: str = 'precio'):
        """
        Crea categorías de precio basadas en cuartiles
        """
        if columna_precio not in self.df.columns:
            raise ValueError(f"La columna '{columna_precio}' no existe en el dataset")
        
        # Crear categorías basadas en cuartiles
        self.df['categoria_precio'] = pd.qcut(
            self.df[columna_precio], 
            q=4, 
            labels=['Económico', 'Medio', 'Alto', 'Premium']
        )
        
        self.categorias_precio = {
            'Económico': self.df[self.df['categoria_precio'] == 'Económico'][columna_precio].max(),
            'Medio': self.df[self.df['categoria_precio'] == 'Medio'][columna_precio].max(),
            'Alto': self.df[self.df['categoria_precio'] == 'Alto'][columna_precio].max(),
            'Premium': self.df[self.df['categoria_precio'] == 'Premium'][columna_precio].max()
        }
        
        print("\n💰 Categorías de precio creadas:")
        for cat, max_precio in self.categorias_precio.items():
            print(f"  {cat}: hasta ${max_precio:,.2f}")
        
        return self.categorias_precio
    
    def entrenar_modelo_clasificacion(self, columna_objetivo: str = 'categoria_precio'):
        """
        Entrena un modelo de clasificación para categorizar inmuebles
        """
        if self.df is None:
            raise ValueError("Primero debe cargar y preprocesar un dataset")
        
        if columna_objetivo not in self.df.columns:
            raise ValueError(f"La columna objetivo '{columna_objetivo}' no existe")
        
        print(f"\n🤖 Entrenando modelo de clasificación...")
        
        # Preparar características
        caracteristicas_encoded = [col + '_encoded' for col in self.caracteristicas_categoricas]
        X_cols = self.caracteristicas_numericas + caracteristicas_encoded
        
        # Remover columna objetivo si está en las características
        X_cols = [col for col in X_cols if col != columna_objetivo]
        
        X = self.df[X_cols]
        y = self.df[columna_objetivo]
        
        # Codificar objetivo si es categórico
        if y.dtype == 'object' or isinstance(y.dtype, pd.CategoricalDtype):
            le_objetivo = LabelEncoder()
            y = le_objetivo.fit_transform(y)
            self.label_encoders['objetivo'] = le_objetivo
        
        # Dividir datos
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Escalar características
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Entrenar modelo
        self.modelo_clasificacion = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.modelo_clasificacion.fit(X_train_scaled, y_train)
        
        # Evaluar modelo
        y_pred = self.modelo_clasificacion.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"✓ Modelo entrenado con precisión: {accuracy:.2%}")
        
        # Importancia de características
        importancias = pd.DataFrame({
            'caracteristica': X_cols,
            'importancia': self.modelo_clasificacion.feature_importances_
        }).sort_values('importancia', ascending=False)
        
        print("\n📊 Top 5 características más importantes:")
        print(importancias.head())
        
        return accuracy
    
    def entrenar_clustering(self, n_clusters: int = 5):
        """
        Entrena un modelo de clustering para agrupar inmuebles similares
        """
        if self.df is None:
            raise ValueError("Primero debe cargar y preprocesar un dataset")
        
        print(f"\n🔮 Entrenando modelo de clustering con {n_clusters} grupos...")
        
        # Preparar características
        caracteristicas_encoded = [col + '_encoded' for col in self.caracteristicas_categoricas]
        X_cols = self.caracteristicas_numericas + caracteristicas_encoded
        X = self.df[X_cols].copy()

        # Asegurar que no haya NaN ni infinitos antes de escalar
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.mean(numeric_only=True)).fillna(0)

        # Escalar características
        X_scaled = self.scaler.fit_transform(X)
        
        # Entrenar clustering
        self.modelo_clustering = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        self.df['cluster'] = self.modelo_clustering.fit_predict(X_scaled)
        
        print(f"✓ Clustering completado")
        print("\n📊 Distribución de inmuebles por cluster:")
        print(self.df['cluster'].value_counts().sort_index())
        
        return self.df['cluster']
    
    def categorizar_inmuebles(self, criterios: Dict[str, Any]) -> pd.DataFrame:
        """
        Categoriza y filtra inmuebles según criterios específicos
        
        Args:
            criterios: Diccionario con criterios de filtrado
                Ejemplo: {
                    'precio_min': 100000,
                    'precio_max': 500000,
                    'habitaciones': 3,
                    'tipo': 'Casa'
                }
        """
        if self.df is None:
            raise ValueError("Primero debe cargar un dataset")
        
        print("\n🔍 Categorizando inmuebles según criterios...")
        print(f"Criterios aplicados: {criterios}")
        
        resultado = self.df.copy()
        criterios_aplicados = 0
        
        for columna, valor in criterios.items():
            if valor is None or valor == "":
                continue

            if columna.endswith('_min') or columna.endswith('_max'):
                col_base = columna.replace('_min', '').replace('_max', '')

                if col_base == 'area':
                    if 'area_total' in resultado.columns:
                        col_real = 'area_total'
                    elif 'area_construida' in resultado.columns:
                        col_real = 'area_construida'
                    else:
                        continue
                else:
                    col_real = col_base

                if col_real not in resultado.columns:
                    continue

                resultado[col_real] = pd.to_numeric(resultado[col_real], errors='coerce')

                if columna.endswith('_min'):
                    resultado = resultado[resultado[col_real] >= float(valor)]
                else:
                    resultado = resultado[resultado[col_real] <= float(valor)]
                criterios_aplicados += 1

            elif columna in resultado.columns:
                if isinstance(valor, list):
                    resultado = resultado[resultado[columna].isin(valor)]
                else:
                    resultado = resultado[resultado[columna] == valor]
                criterios_aplicados += 1
        
        print(f"✓ Criterios efectivamente aplicados: {criterios_aplicados}")
        print(f"✓ Encontrados {len(resultado)} inmuebles que cumplen los criterios")
        
        return resultado
    
    def buscar_similares(self, inmueble_id: int, n_similares: int = 5) -> pd.DataFrame:
        """
        Encuentra inmuebles similares basándose en clustering
        """
        if self.modelo_clustering is None:
            raise ValueError("Primero debe entrenar el modelo de clustering")
        
        if inmueble_id >= len(self.df):
            raise ValueError(f"ID de inmueble inválido: {inmueble_id}")
        
        cluster_objetivo = self.df.iloc[inmueble_id]['cluster']
        similares = self.df[self.df['cluster'] == cluster_objetivo]
        similares = similares[similares.index != inmueble_id]
        
        return similares.head(n_similares)
    
    def guardar_modelo(self, ruta: str = 'modelo_inmuebles.pkl'):
        """
        Guarda el modelo entrenado
        """
        modelo_data = {
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'modelo_clasificacion': self.modelo_clasificacion,
            'modelo_clustering': self.modelo_clustering,
            'caracteristicas_numericas': self.caracteristicas_numericas,
            'caracteristicas_categoricas': self.caracteristicas_categoricas,
            'categorias_precio': self.categorias_precio
        }
        joblib.dump(modelo_data, ruta)
        print(f"✓ Modelo guardado en: {ruta}")
    
    def cargar_modelo(self, ruta: str = 'modelo_inmuebles.pkl'):
        """
        Carga un modelo previamente entrenado
        """
        modelo_data = joblib.load(ruta)
        self.scaler = modelo_data['scaler']
        self.label_encoders = modelo_data['label_encoders']
        self.modelo_clasificacion = modelo_data['modelo_clasificacion']
        self.modelo_clustering = modelo_data['modelo_clustering']
        self.caracteristicas_numericas = modelo_data['caracteristicas_numericas']
        self.caracteristicas_categoricas = modelo_data['caracteristicas_categoricas']
        self.categorias_precio = modelo_data.get('categorias_precio')
        print(f"✓ Modelo cargado desde: {ruta}")

        # Si ya hay un DataFrame cargado y no existe la columna 'cluster',
        # la reconstruimos utilizando el modelo de clustering previamente
        # entrenado. Esto es importante para que funciones como
        # buscar_similares funcionen correctamente incluso cuando sólo se
        # carga el modelo desde disco.
        if self.df is not None and self.modelo_clustering is not None:
            if 'cluster' not in self.df.columns:
                print("🔁 Reconstruyendo columna 'cluster' para inmuebles cargados...")

                # Volvemos a armar la matriz de características con la misma
                # lógica usada en entrenar_clustering.
                caracteristicas_encoded = [col + '_encoded' for col in self.caracteristicas_categoricas]
                X_cols = self.caracteristicas_numericas + caracteristicas_encoded
                X = self.df[X_cols].copy()

                # Asegurar que no haya NaN ni infinitos antes de escalar
                X = X.replace([np.inf, -np.inf], np.nan)
                X = X.fillna(X.mean(numeric_only=True)).fillna(0)

                X_scaled = self.scaler.transform(X)
                self.df['cluster'] = self.modelo_clustering.predict(X_scaled)
                print("✓ Columna 'cluster' reconstruida correctamente")
    
    def generar_reporte(self, resultado: pd.DataFrame, nombre_archivo: str = 'reporte_inmuebles.csv'):
        """
        Genera un reporte con los resultados
        """
        resultado.to_csv(nombre_archivo, index=False)
        print(f"✓ Reporte generado: {nombre_archivo}")
        
        # Resumen estadístico
        print("\n📊 RESUMEN DEL REPORTE")
        print("="*60)
        print(f"Total de inmuebles: {len(resultado)}")
        
        if 'precio' in resultado.columns:
            print(f"Precio promedio: ${resultado['precio'].mean():,.2f}")
            print(f"Precio mínimo: ${resultado['precio'].min():,.2f}")
            print(f"Precio máximo: ${resultado['precio'].max():,.2f}")
        
        return nombre_archivo
