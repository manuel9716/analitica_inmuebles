"""
Generador de dataset de ejemplo para inmuebles
Crea datos sintéticos realistas para pruebas del modelo
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random


def generar_dataset_inmuebles(n_inmuebles: int = 1000, guardar: bool = True) -> pd.DataFrame:
    """
    Genera un dataset sintético de inmuebles con características realistas
    
    Args:
        n_inmuebles: Número de inmuebles a generar
        guardar: Si True, guarda el dataset en un archivo CSV
    
    Returns:
        DataFrame con los datos generados
    """
    
    print(f"🏠 Generando dataset con {n_inmuebles} inmuebles...")
    
    np.random.seed(42)
    random.seed(42)
    
    # Definir opciones para características categóricas
    tipos_inmueble = ['Casa', 'Apartamento', 'Duplex', 'Penthouse', 'Estudio', 'Villa']
    ubicaciones = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste', 'Suburbio', 'Zona Residencial']
    estados = ['Nuevo', 'Excelente', 'Bueno', 'Regular', 'A Remodelar']
    orientaciones = ['Norte', 'Sur', 'Este', 'Oeste', 'Noreste', 'Noroeste', 'Sureste', 'Suroeste']
    
    # Generar datos
    data = {
        'id': range(1, n_inmuebles + 1),
        'tipo': np.random.choice(tipos_inmueble, n_inmuebles, p=[0.25, 0.30, 0.15, 0.10, 0.15, 0.05]),
        'ubicacion': np.random.choice(ubicaciones, n_inmuebles),
        'habitaciones': np.random.choice([1, 2, 3, 4, 5, 6], n_inmuebles, p=[0.10, 0.25, 0.30, 0.20, 0.10, 0.05]),
        'banos': np.random.choice([1, 2, 3, 4], n_inmuebles, p=[0.20, 0.45, 0.25, 0.10]),
        'area_m2': np.random.normal(120, 50, n_inmuebles).clip(30, 500),
        'area_terreno_m2': np.random.normal(200, 100, n_inmuebles).clip(0, 1000),
        'antiguedad_anos': np.random.exponential(10, n_inmuebles).clip(0, 50),
        'pisos': np.random.choice([1, 2, 3, 4], n_inmuebles, p=[0.40, 0.35, 0.20, 0.05]),
        'estacionamientos': np.random.choice([0, 1, 2, 3], n_inmuebles, p=[0.15, 0.40, 0.35, 0.10]),
        'estado': np.random.choice(estados, n_inmuebles, p=[0.15, 0.25, 0.35, 0.20, 0.05]),
        'orientacion': np.random.choice(orientaciones, n_inmuebles),
        'tiene_jardin': np.random.choice([True, False], n_inmuebles, p=[0.35, 0.65]),
        'tiene_terraza': np.random.choice([True, False], n_inmuebles, p=[0.40, 0.60]),
        'tiene_balcon': np.random.choice([True, False], n_inmuebles, p=[0.50, 0.50]),
        'tiene_piscina': np.random.choice([True, False], n_inmuebles, p=[0.15, 0.85]),
        'tiene_gimnasio': np.random.choice([True, False], n_inmuebles, p=[0.25, 0.75]),
        'tiene_seguridad': np.random.choice([True, False], n_inmuebles, p=[0.60, 0.40]),
        'cerca_transporte': np.random.choice([True, False], n_inmuebles, p=[0.70, 0.30]),
        'cerca_escuelas': np.random.choice([True, False], n_inmuebles, p=[0.65, 0.35]),
        'cerca_comercios': np.random.choice([True, False], n_inmuebles, p=[0.75, 0.25]),
    }
    
    df = pd.DataFrame(data)
    
    # Redondear valores numéricos
    df['area_m2'] = df['area_m2'].round(1)
    df['area_terreno_m2'] = df['area_terreno_m2'].round(1)
    df['antiguedad_anos'] = df['antiguedad_anos'].round(1)
    
    # Ajustar área de terreno según tipo
    df.loc[df['tipo'].isin(['Apartamento', 'Estudio', 'Penthouse']), 'area_terreno_m2'] = 0
    
    # Calcular precio basado en características
    precio_base = 50000
    
    # Factores de precio
    factor_tipo = df['tipo'].map({
        'Estudio': 0.6,
        'Apartamento': 0.8,
        'Casa': 1.0,
        'Duplex': 1.2,
        'Villa': 1.5,
        'Penthouse': 1.8
    })
    
    factor_ubicacion = df['ubicacion'].map({
        'Suburbio': 0.7,
        'Oeste': 0.8,
        'Este': 0.85,
        'Sur': 0.9,
        'Norte': 1.0,
        'Zona Residencial': 1.1,
        'Centro': 1.3
    })
    
    factor_estado = df['estado'].map({
        'A Remodelar': 0.7,
        'Regular': 0.85,
        'Bueno': 1.0,
        'Excelente': 1.15,
        'Nuevo': 1.3
    })
    
    # Calcular precio
    df['precio'] = (
        precio_base +
        df['area_m2'] * 1000 * factor_tipo +
        df['habitaciones'] * 15000 +
        df['banos'] * 10000 +
        df['estacionamientos'] * 8000 +
        df['area_terreno_m2'] * 200 +
        df['tiene_piscina'] * 30000 +
        df['tiene_gimnasio'] * 15000 +
        df['tiene_jardin'] * 10000 +
        df['tiene_terraza'] * 8000 +
        df['tiene_seguridad'] * 5000
    ) * factor_ubicacion * factor_estado
    
    # Ajustar por antigüedad
    df['precio'] = df['precio'] * (1 - df['antiguedad_anos'] * 0.01)
    
    # Añadir variación aleatoria
    df['precio'] = df['precio'] * np.random.normal(1, 0.1, n_inmuebles)
    df['precio'] = df['precio'].clip(30000, 5000000).round(-3)  # Redondear a miles
    
    # Añadir fecha de publicación
    fecha_inicio = datetime.now() - timedelta(days=365)
    df['fecha_publicacion'] = [
        fecha_inicio + timedelta(days=random.randint(0, 365))
        for _ in range(n_inmuebles)
    ]
    
    # Añadir disponibilidad
    df['disponible'] = np.random.choice([True, False], n_inmuebles, p=[0.85, 0.15])
    
    print(f"✓ Dataset generado con {len(df)} inmuebles")
    print(f"✓ Columnas: {len(df.columns)}")
    print(f"\n📊 Resumen del dataset:")
    print(f"  - Precio promedio: ${df['precio'].mean():,.2f}")
    print(f"  - Precio mínimo: ${df['precio'].min():,.2f}")
    print(f"  - Precio máximo: ${df['precio'].max():,.2f}")
    print(f"  - Área promedio: {df['area_m2'].mean():.1f} m²")
    
    if guardar:
        nombre_archivo = 'dataset_inmuebles.csv'
        df.to_csv(nombre_archivo, index=False)
        print(f"\n✓ Dataset guardado en: {nombre_archivo}")
    
    return df


if __name__ == "__main__":
    # Generar dataset de ejemplo
    df = generar_dataset_inmuebles(n_inmuebles=1000, guardar=True)
    
    # Mostrar primeras filas
    print("\n📋 Primeras 5 filas del dataset:")
    print(df.head())
    
    # Mostrar estadísticas por tipo
    print("\n📊 Estadísticas por tipo de inmueble:")
    print(df.groupby('tipo')['precio'].agg(['count', 'mean', 'min', 'max']))
