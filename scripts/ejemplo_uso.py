"""
Ejemplo de uso del modelo de IA para análisis de inmuebles
Demuestra todas las funcionalidades principales del sistema
"""

from modelo_inmuebles import ModeloInmuebles
from generar_dataset import generar_dataset_inmuebles
import pandas as pd


def ejemplo_completo():
    """
    Ejemplo completo de uso del modelo de IA
    """
    
    print("="*70)
    print("MODELO DE IA PARA ANÁLISIS Y CATEGORIZACIÓN DE INMUEBLES")
    print("="*70)
    
    # Paso 1: Generar dataset de ejemplo
    print("\n" + "="*70)
    print("PASO 1: GENERACIÓN DE DATASET")
    print("="*70)
    df = generar_dataset_inmuebles(n_inmuebles=1000, guardar=True)
    
    # Paso 2: Inicializar modelo
    print("\n" + "="*70)
    print("PASO 2: INICIALIZACIÓN DEL MODELO")
    print("="*70)
    modelo = ModeloInmuebles()
    
    # Paso 3: Cargar dataset
    print("\n" + "="*70)
    print("PASO 3: CARGA DE DATOS")
    print("="*70)
    modelo.cargar_dataset('dataset_inmuebles.csv')
    
    # Paso 4: Analizar dataset
    print("\n" + "="*70)
    print("PASO 4: ANÁLISIS DEL DATASET")
    print("="*70)
    modelo.analizar_dataset()
    
    # Paso 5: Preprocesar datos
    print("\n" + "="*70)
    print("PASO 5: PREPROCESAMIENTO")
    print("="*70)
    modelo.preprocesar_datos()
    
    # Paso 6: Crear categorías de precio
    print("\n" + "="*70)
    print("PASO 6: CATEGORIZACIÓN POR PRECIO")
    print("="*70)
    modelo.crear_categorias_precio('precio')
    
    # Paso 7: Entrenar modelo de clasificación
    print("\n" + "="*70)
    print("PASO 7: ENTRENAMIENTO DEL MODELO DE CLASIFICACIÓN")
    print("="*70)
    accuracy = modelo.entrenar_modelo_clasificacion('categoria_precio')
    
    # Paso 8: Entrenar clustering
    print("\n" + "="*70)
    print("PASO 8: ENTRENAMIENTO DE CLUSTERING")
    print("="*70)
    modelo.entrenar_clustering(n_clusters=5)
    
    # Paso 9: Categorizar inmuebles con criterios específicos
    print("\n" + "="*70)
    print("PASO 9: BÚSQUEDA Y CATEGORIZACIÓN")
    print("="*70)
    
    # Ejemplo 1: Buscar casas de 3 habitaciones en rango de precio
    print("\n🔍 Ejemplo 1: Casas de 3 habitaciones entre $150,000 y $300,000")
    criterios_1 = {
        'tipo': 'Casa',
        'habitaciones': 3,
        'precio_min': 150000,
        'precio_max': 300000
    }
    resultado_1 = modelo.categorizar_inmuebles(criterios_1)
    print(f"\nResultado: {len(resultado_1)} inmuebles encontrados")
    if len(resultado_1) > 0:
        print("\nPrimeros 5 resultados:")
        print(resultado_1[['tipo', 'ubicacion', 'habitaciones', 'banos', 'area_m2', 'precio']].head())
    
    # Ejemplo 2: Apartamentos nuevos con piscina
    print("\n\n🔍 Ejemplo 2: Apartamentos nuevos con piscina")
    criterios_2 = {
        'tipo': 'Apartamento',
        'estado': 'Nuevo',
        'tiene_piscina': True
    }
    resultado_2 = modelo.categorizar_inmuebles(criterios_2)
    print(f"\nResultado: {len(resultado_2)} inmuebles encontrados")
    if len(resultado_2) > 0:
        print("\nPrimeros 5 resultados:")
        print(resultado_2[['tipo', 'ubicacion', 'habitaciones', 'estado', 'precio']].head())
    
    # Ejemplo 3: Inmuebles en el Centro con más de 2 baños
    print("\n\n🔍 Ejemplo 3: Inmuebles en el Centro con más de 2 baños")
    criterios_3 = {
        'ubicacion': 'Centro',
        'banos_min': 2
    }
    resultado_3 = modelo.categorizar_inmuebles(criterios_3)
    print(f"\nResultado: {len(resultado_3)} inmuebles encontrados")
    if len(resultado_3) > 0:
        print("\nPrimeros 5 resultados:")
        print(resultado_3[['tipo', 'ubicacion', 'habitaciones', 'banos', 'precio']].head())
    
    # Ejemplo 4: Inmuebles premium con características especiales
    print("\n\n🔍 Ejemplo 4: Inmuebles premium (>$400,000) con gimnasio y seguridad")
    criterios_4 = {
        'precio_min': 400000,
        'tiene_gimnasio': True,
        'tiene_seguridad': True
    }
    resultado_4 = modelo.categorizar_inmuebles(criterios_4)
    print(f"\nResultado: {len(resultado_4)} inmuebles encontrados")
    if len(resultado_4) > 0:
        print("\nPrimeros 5 resultados:")
        print(resultado_4[['tipo', 'ubicacion', 'habitaciones', 'precio', 'tiene_gimnasio', 'tiene_seguridad']].head())
    
    # Paso 10: Buscar inmuebles similares
    print("\n" + "="*70)
    print("PASO 10: BÚSQUEDA DE INMUEBLES SIMILARES")
    print("="*70)
    inmueble_referencia = 0
    print(f"\nInmueble de referencia (ID: {inmueble_referencia}):")
    print(modelo.df.iloc[inmueble_referencia][['tipo', 'ubicacion', 'habitaciones', 'banos', 'precio']])
    
    similares = modelo.buscar_similares(inmueble_referencia, n_similares=5)
    print(f"\n✓ Encontrados {len(similares)} inmuebles similares:")
    print(similares[['tipo', 'ubicacion', 'habitaciones', 'banos', 'precio']])
    
    # Paso 11: Generar reportes
    print("\n" + "="*70)
    print("PASO 11: GENERACIÓN DE REPORTES")
    print("="*70)
    modelo.generar_reporte(resultado_1, 'reporte_casas_3hab.csv')
    modelo.generar_reporte(resultado_4, 'reporte_premium.csv')
    
    # Paso 12: Guardar modelo
    print("\n" + "="*70)
    print("PASO 12: GUARDAR MODELO ENTRENADO")
    print("="*70)
    modelo.guardar_modelo('modelo_inmuebles.pkl')
    
    # Resumen final
    print("\n" + "="*70)
    print("RESUMEN FINAL")
    print("="*70)
    print(f"✓ Dataset procesado: {len(modelo.df)} inmuebles")
    print(f"✓ Modelo de clasificación entrenado con {accuracy:.2%} de precisión")
    print(f"✓ Clustering completado con 5 grupos")
    print(f"✓ Reportes generados")
    print(f"✓ Modelo guardado")
    print("\n🎉 ¡Proceso completado exitosamente!")


def ejemplo_busqueda_personalizada():
    """
    Ejemplo de búsqueda personalizada con múltiples criterios
    """
    print("\n" + "="*70)
    print("EJEMPLO DE BÚSQUEDA PERSONALIZADA")
    print("="*70)
    
    # Cargar modelo previamente entrenado
    modelo = ModeloInmuebles()
    modelo.cargar_dataset('dataset_inmuebles.csv')
    modelo.preprocesar_datos()
    
    # Definir criterios personalizados
    print("\n🎯 Búsqueda: Casa familiar ideal")
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
    
    if len(resultado) > 0:
        print(f"\n✓ Encontrados {len(resultado)} inmuebles que cumplen los criterios")
        print("\n📋 Mejores opciones (ordenadas por precio):")
        resultado_ordenado = resultado.sort_values('precio')
        print(resultado_ordenado[['tipo', 'ubicacion', 'habitaciones', 'banos', 
                                   'area_m2', 'precio', 'tiene_jardin']].head(10))
        
        # Generar reporte
        modelo.generar_reporte(resultado_ordenado, 'casas_familiares.csv')
    else:
        print("❌ No se encontraron inmuebles que cumplan todos los criterios")


def ejemplo_analisis_por_categoria():
    """
    Ejemplo de análisis estadístico por categorías
    """
    print("\n" + "="*70)
    print("ANÁLISIS ESTADÍSTICO POR CATEGORÍAS")
    print("="*70)
    
    modelo = ModeloInmuebles()
    modelo.cargar_dataset('dataset_inmuebles.csv')
    
    # Análisis por tipo de inmueble
    print("\n📊 Análisis por tipo de inmueble:")
    analisis_tipo = modelo.df.groupby('tipo').agg({
        'precio': ['count', 'mean', 'min', 'max'],
        'area_m2': 'mean',
        'habitaciones': 'mean'
    }).round(2)
    print(analisis_tipo)
    
    # Análisis por ubicación
    print("\n📊 Análisis por ubicación:")
    analisis_ubicacion = modelo.df.groupby('ubicacion').agg({
        'precio': ['count', 'mean'],
        'area_m2': 'mean'
    }).round(2)
    print(analisis_ubicacion)
    
    # Análisis por estado
    print("\n📊 Análisis por estado:")
    analisis_estado = modelo.df.groupby('estado').agg({
        'precio': ['count', 'mean'],
    }).round(2)
    print(analisis_estado)


if __name__ == "__main__":
    # Ejecutar ejemplo completo
    ejemplo_completo()
    
    # Descomentar para ejecutar ejemplos adicionales
    # ejemplo_busqueda_personalizada()
    # ejemplo_analisis_por_categoria()
