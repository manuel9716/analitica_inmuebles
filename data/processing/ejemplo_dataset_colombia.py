"""
Ejemplo de uso del modelo con el dataset real de inmuebles de Colombia
Dataset: inmuebles_sintetico_colombia_plus.csv
"""

from modelo_inmuebles import ModeloInmuebles
import pandas as pd


def analizar_dataset_colombia():
    """
    Analiza el dataset real de inmuebles de Colombia
    """
    print("="*70)
    print("ANÁLISIS DE INMUEBLES DE COLOMBIA")
    print("="*70)
    
    # Cargar dataset
    print("\n📂 Cargando dataset de Colombia...")
    modelo = ModeloInmuebles()
    modelo.cargar_dataset('inmuebles_sintetico_colombia_plus.csv')
    
    # Análisis exploratorio
    print("\n📊 ESTADÍSTICAS GENERALES")
    print("="*70)
    print(f"Total de inmuebles: {len(modelo.df)}")
    print(f"\nCiudades disponibles:")
    print(modelo.df['ciudad'].value_counts())
    
    print(f"\nTipos de inmueble:")
    print(modelo.df['tipo_inmueble'].value_counts())
    
    print(f"\nTipo de negocio:")
    print(modelo.df['tipo_negocio'].value_counts())
    
    # Análisis de precios
    print("\n💰 ANÁLISIS DE PRECIOS")
    print("="*70)
    print(f"Precio promedio: ${modelo.df['precio_lista_cop'].mean():,.0f} COP")
    print(f"Precio mínimo: ${modelo.df['precio_lista_cop'].min():,.0f} COP")
    print(f"Precio máximo: ${modelo.df['precio_lista_cop'].max():,.0f} COP")
    print(f"Precio mediana: ${modelo.df['precio_lista_cop'].median():,.0f} COP")
    
    # Precio por ciudad
    print("\n📍 Precio promedio por ciudad:")
    precio_ciudad = modelo.df.groupby('ciudad')['precio_lista_cop'].mean().sort_values(ascending=False)
    for ciudad, precio in precio_ciudad.items():
        print(f"  {ciudad}: ${precio:,.0f} COP")
    
    # Análisis de áreas
    print("\n📐 ANÁLISIS DE ÁREAS")
    print("="*70)
    print(f"Área promedio: {modelo.df['area_total_m2'].mean():.2f} m²")
    print(f"Área mínima: {modelo.df['area_total_m2'].min():.2f} m²")
    print(f"Área máxima: {modelo.df['area_total_m2'].max():.2f} m²")
    
    return modelo


def busquedas_ejemplo_colombia(modelo):
    """
    Ejemplos de búsquedas con el dataset de Colombia
    """
    print("\n" + "="*70)
    print("EJEMPLOS DE BÚSQUEDA")
    print("="*70)
    
    # Preprocesar datos
    modelo.preprocesar_datos()
    
    # Ejemplo 1: Apartamentos en Bogotá
    print("\n🔍 Ejemplo 1: Apartamentos en Bogotá para venta")
    criterios_1 = {
        'ciudad': 'Bogotá',
        'tipo_inmueble': 'Apartamento',
        'tipo_negocio': 'Venta'
    }
    resultado_1 = modelo.categorizar_inmuebles(criterios_1)
    print(f"Encontrados: {len(resultado_1)} inmuebles")
    if len(resultado_1) > 0:
        print("\nTop 5 más económicos:")
        top_5 = resultado_1.nsmallest(5, 'precio_lista_cop')
        print(top_5[['ciudad', 'localidad', 'tipo_inmueble', 'alcobas', 'banos', 'area_total_m2', 'precio_lista_cop']])
    
    # Ejemplo 2: Casas en Medellín
    print("\n\n🔍 Ejemplo 2: Casas en Medellín con 3+ alcobas")
    criterios_2 = {
        'ciudad': 'Medellín',
        'tipo_inmueble': 'Casa',
        'alcobas_min': 3
    }
    resultado_2 = modelo.categorizar_inmuebles(criterios_2)
    print(f"Encontrados: {len(resultado_2)} inmuebles")
    if len(resultado_2) > 0:
        print("\nPrimeros 5 resultados:")
        print(resultado_2[['ciudad', 'localidad', 'alcobas', 'banos', 'area_total_m2', 'precio_lista_cop']].head())
    
    # Ejemplo 3: Propiedades con amenidades
    print("\n\n🔍 Ejemplo 3: Propiedades con piscina y gimnasio")
    criterios_3 = {
        'amenidad_piscina': True,
        'amenidad_gimnasio': True
    }
    resultado_3 = modelo.categorizar_inmuebles(criterios_3)
    print(f"Encontrados: {len(resultado_3)} inmuebles")
    if len(resultado_3) > 0:
        print("\nDistribución por ciudad:")
        print(resultado_3['ciudad'].value_counts())
    
    # Ejemplo 4: Arriendo en Cali
    print("\n\n🔍 Ejemplo 4: Propiedades en arriendo en Cali")
    criterios_4 = {
        'ciudad': 'Cali',
        'tipo_negocio': 'Arriendo'
    }
    resultado_4 = modelo.categorizar_inmuebles(criterios_4)
    print(f"Encontrados: {len(resultado_4)} inmuebles")
    if len(resultado_4) > 0:
        print("\nCanon mensual promedio: ${:,.0f} COP".format(
            resultado_4['canon_mensual_cop'].mean()
        ))
        print("\nTop 5 más económicos:")
        top_5 = resultado_4.nsmallest(5, 'canon_mensual_cop')
        print(top_5[['localidad', 'tipo_inmueble', 'alcobas', 'area_total_m2', 'canon_mensual_cop']])
    
    # Ejemplo 5: Propiedades nuevas en Cartagena
    print("\n\n🔍 Ejemplo 5: Propiedades nuevas en Cartagena")
    criterios_5 = {
        'ciudad': 'Cartagena',
        'estado_propiedad': 'Nueva'
    }
    resultado_5 = modelo.categorizar_inmuebles(criterios_5)
    print(f"Encontrados: {len(resultado_5)} inmuebles")
    if len(resultado_5) > 0:
        print("\nTipos de inmueble:")
        print(resultado_5['tipo_inmueble'].value_counts())


def entrenar_modelo_colombia(modelo):
    """
    Entrena el modelo con el dataset de Colombia
    """
    print("\n" + "="*70)
    print("ENTRENAMIENTO DEL MODELO")
    print("="*70)
    
    # Crear categorías de precio
    print("\n💰 Creando categorías de precio...")
    modelo.crear_categorias_precio('precio_lista_cop')
    
    # Entrenar clasificación
    print("\n🤖 Entrenando modelo de clasificación...")
    accuracy = modelo.entrenar_modelo_clasificacion('categoria_precio')
    print(f"✓ Precisión del modelo: {accuracy:.2%}")
    
    # Entrenar clustering
    print("\n🔮 Entrenando clustering...")
    modelo.entrenar_clustering(n_clusters=5)
    
    # Guardar modelo
    print("\n💾 Guardando modelo entrenado...")
    modelo.guardar_modelo('modelo_inmuebles_colombia.pkl')
    print("✓ Modelo guardado en: modelo_inmuebles_colombia.pkl")


def analisis_avanzado_colombia(modelo):
    """
    Análisis avanzado del dataset de Colombia
    """
    print("\n" + "="*70)
    print("ANÁLISIS AVANZADO")
    print("="*70)
    
    # Análisis por estrato
    print("\n📊 Análisis por estrato:")
    estrato_stats = modelo.df.groupby('estrato').agg({
        'precio_lista_cop': ['count', 'mean'],
        'area_total_m2': 'mean'
    }).round(0)
    print(estrato_stats)
    
    # Análisis de amenidades
    print("\n🏊 Propiedades con amenidades:")
    amenidades = ['amenidad_piscina', 'amenidad_gimnasio', 'amenidad_bbq', 'amenidad_zonas_verdes']
    for amenidad in amenidades:
        count = modelo.df[amenidad].sum()
        porcentaje = (count / len(modelo.df)) * 100
        print(f"  {amenidad}: {count} ({porcentaje:.1f}%)")
    
    # Análisis de seguridad
    print("\n🔒 Tipos de seguridad:")
    seguridad_counts = modelo.df['seguridad'].value_counts()
    print(seguridad_counts)
    
    # Precio por m²
    print("\n💵 Precio por m² por ciudad:")
    modelo.df['precio_m2_calc'] = modelo.df['precio_lista_cop'] / modelo.df['area_total_m2']
    precio_m2_ciudad = modelo.df.groupby('ciudad')['precio_m2_calc'].mean().sort_values(ascending=False)
    for ciudad, precio in precio_m2_ciudad.items():
        print(f"  {ciudad}: ${precio:,.0f} COP/m²")


if __name__ == "__main__":
    # Análisis del dataset
    modelo = analizar_dataset_colombia()
    
    # Búsquedas de ejemplo
    busquedas_ejemplo_colombia(modelo)
    
    # Entrenar modelo
    entrenar_modelo_colombia(modelo)
    
    # Análisis avanzado
    analisis_avanzado_colombia(modelo)
    
    print("\n" + "="*70)
    print("✅ ANÁLISIS COMPLETADO")
    print("="*70)
    print("\n📁 Archivos generados:")
    print("  - modelo_inmuebles_colombia.pkl (modelo entrenado)")
    print("\n🎉 ¡Listo para usar con datos reales de Colombia!")
