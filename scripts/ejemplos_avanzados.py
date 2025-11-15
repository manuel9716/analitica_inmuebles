"""
Ejemplos avanzados de uso del modelo de IA
Casos de uso complejos y técnicas avanzadas
"""

from modelo_inmuebles import ModeloInmuebles
from generar_dataset import generar_dataset_inmuebles
import pandas as pd
import numpy as np


def ejemplo_analisis_mercado():
    """
    Análisis completo del mercado inmobiliario
    """
    print("="*70)
    print("ANÁLISIS DE MERCADO INMOBILIARIO")
    print("="*70)
    
    modelo = ModeloInmuebles()
    modelo.cargar_dataset('dataset_inmuebles.csv')
    
    # Análisis por segmento de precio
    print("\n📊 Segmentación por precio:")
    modelo.df['segmento_precio'] = pd.cut(
        modelo.df['precio'],
        bins=[0, 150000, 300000, 500000, float('inf')],
        labels=['Económico', 'Medio', 'Alto', 'Lujo']
    )
    
    segmentacion = modelo.df.groupby('segmento_precio').agg({
        'precio': ['count', 'mean', 'min', 'max'],
        'area_m2': 'mean',
        'habitaciones': 'mean'
    }).round(2)
    print(segmentacion)
    
    # Análisis de correlaciones
    print("\n📈 Correlación entre características y precio:")
    correlaciones = modelo.df[[
        'precio', 'habitaciones', 'banos', 'area_m2', 
        'estacionamientos', 'antiguedad_anos'
    ]].corr()['precio'].sort_values(ascending=False)
    print(correlaciones)
    
    # Mejores ubicaciones por relación precio/área
    print("\n🏆 Mejores ubicaciones (precio por m²):")
    modelo.df['precio_m2'] = modelo.df['precio'] / modelo.df['area_m2']
    precio_m2_ubicacion = modelo.df.groupby('ubicacion')['precio_m2'].mean().sort_values()
    print(precio_m2_ubicacion)


def ejemplo_comparacion_propiedades():
    """
    Comparación detallada entre propiedades
    """
    print("\n" + "="*70)
    print("COMPARACIÓN DE PROPIEDADES")
    print("="*70)
    
    modelo = ModeloInmuebles()
    modelo.cargar_dataset('dataset_inmuebles.csv')
    modelo.preprocesar_datos()
    modelo.entrenar_clustering(n_clusters=5)
    
    # Seleccionar propiedades para comparar
    ids_comparar = [0, 50, 100]
    
    print("\n🔍 Comparando propiedades:")
    comparacion = modelo.df.iloc[ids_comparar][[
        'tipo', 'ubicacion', 'habitaciones', 'banos', 
        'area_m2', 'precio', 'estado', 'cluster'
    ]]
    print(comparacion.to_string())
    
    # Encontrar similares para cada una
    print("\n📋 Propiedades similares a cada una:")
    for id_prop in ids_comparar:
        print(f"\nSimilares a propiedad {id_prop}:")
        similares = modelo.buscar_similares(id_prop, n_similares=3)
        print(similares[['tipo', 'ubicacion', 'precio']].to_string())


def ejemplo_filtros_complejos():
    """
    Búsquedas con filtros complejos y múltiples condiciones
    """
    print("\n" + "="*70)
    print("FILTROS COMPLEJOS")
    print("="*70)
    
    modelo = ModeloInmuebles()
    modelo.cargar_dataset('dataset_inmuebles.csv')
    modelo.preprocesar_datos()
    
    # Filtro 1: Casa familiar ideal
    print("\n🏡 Búsqueda 1: Casa familiar ideal")
    criterios_1 = {
        'tipo': 'Casa',
        'habitaciones_min': 3,
        'banos_min': 2,
        'tiene_jardin': True,
        'tiene_seguridad': True,
        'cerca_escuelas': True,
        'cerca_comercios': True,
        'precio_max': 400000,
        'area_m2_min': 100
    }
    resultado_1 = modelo.categorizar_inmuebles(criterios_1)
    print(f"Encontrados: {len(resultado_1)} inmuebles")
    if len(resultado_1) > 0:
        print("\nTop 3 por mejor relación precio/área:")
        resultado_1['precio_m2'] = resultado_1['precio'] / resultado_1['area_m2']
        top_3 = resultado_1.nsmallest(3, 'precio_m2')
        print(top_3[['ubicacion', 'habitaciones', 'area_m2', 'precio', 'precio_m2']])
    
    # Filtro 2: Inversión en propiedades nuevas
    print("\n\n💎 Búsqueda 2: Inversión en propiedades nuevas")
    criterios_2 = {
        'estado': 'Nuevo',
        'ubicacion': ['Centro', 'Norte', 'Zona Residencial'],
        'precio_min': 200000,
        'precio_max': 600000,
        'tiene_gimnasio': True,
        'tiene_seguridad': True
    }
    resultado_2 = modelo.categorizar_inmuebles(criterios_2)
    print(f"Encontrados: {len(resultado_2)} inmuebles")
    if len(resultado_2) > 0:
        print("\nDistribución por tipo:")
        print(resultado_2['tipo'].value_counts())
    
    # Filtro 3: Propiedades con máximo potencial
    print("\n\n🌟 Búsqueda 3: Propiedades con máximo potencial")
    # Calcular score de amenidades
    amenidades = ['tiene_jardin', 'tiene_terraza', 'tiene_balcon', 
                  'tiene_piscina', 'tiene_gimnasio', 'tiene_seguridad']
    modelo.df['score_amenidades'] = modelo.df[amenidades].sum(axis=1)
    
    # Buscar propiedades con alto score
    alto_score = modelo.df[modelo.df['score_amenidades'] >= 4]
    print(f"Propiedades con 4+ amenidades: {len(alto_score)}")
    print("\nTop 5 con más amenidades:")
    top_amenidades = alto_score.nlargest(5, 'score_amenidades')
    print(top_amenidades[['tipo', 'ubicacion', 'precio', 'score_amenidades']])


def ejemplo_analisis_temporal():
    """
    Análisis temporal de publicaciones
    """
    print("\n" + "="*70)
    print("ANÁLISIS TEMPORAL")
    print("="*70)
    
    modelo = ModeloInmuebles()
    modelo.cargar_dataset('dataset_inmuebles.csv')
    
    # Convertir fecha a datetime
    modelo.df['fecha_publicacion'] = pd.to_datetime(modelo.df['fecha_publicacion'])
    modelo.df['mes_publicacion'] = modelo.df['fecha_publicacion'].dt.month
    modelo.df['dias_publicado'] = (pd.Timestamp.now() - modelo.df['fecha_publicacion']).dt.days
    
    # Análisis por mes
    print("\n📅 Publicaciones por mes:")
    publicaciones_mes = modelo.df.groupby('mes_publicacion').agg({
        'precio': ['count', 'mean']
    }).round(2)
    print(publicaciones_mes)
    
    # Propiedades más recientes
    print("\n🆕 Propiedades publicadas en los últimos 30 días:")
    recientes = modelo.df[modelo.df['dias_publicado'] <= 30]
    print(f"Total: {len(recientes)} propiedades")
    if len(recientes) > 0:
        print("\nTop 5 más recientes:")
        print(recientes.nsmallest(5, 'dias_publicado')[[
            'tipo', 'ubicacion', 'precio', 'dias_publicado'
        ]])


def ejemplo_optimizacion_busqueda():
    """
    Optimización de búsqueda con scoring personalizado
    """
    print("\n" + "="*70)
    print("OPTIMIZACIÓN DE BÚSQUEDA CON SCORING")
    print("="*70)
    
    modelo = ModeloInmuebles()
    modelo.cargar_dataset('dataset_inmuebles.csv')
    
    # Definir preferencias del usuario
    preferencias = {
        'presupuesto_max': 350000,
        'habitaciones_ideal': 3,
        'ubicacion_preferida': 'Centro',
        'importancia_amenidades': 0.3,
        'importancia_ubicacion': 0.4,
        'importancia_precio': 0.3
    }
    
    print("\n🎯 Preferencias del usuario:")
    for key, value in preferencias.items():
        print(f"  {key}: {value}")
    
    # Filtrar por presupuesto
    candidatos = modelo.df[modelo.df['precio'] <= preferencias['presupuesto_max']].copy()
    
    # Calcular scores
    # Score de precio (mejor = más barato)
    candidatos['score_precio'] = 1 - (candidatos['precio'] / preferencias['presupuesto_max'])
    
    # Score de ubicación
    candidatos['score_ubicacion'] = candidatos['ubicacion'].apply(
        lambda x: 1.0 if x == preferencias['ubicacion_preferida'] else 0.5
    )
    
    # Score de amenidades
    amenidades = ['tiene_jardin', 'tiene_piscina', 'tiene_gimnasio', 'tiene_seguridad']
    candidatos['score_amenidades'] = candidatos[amenidades].sum(axis=1) / len(amenidades)
    
    # Score total ponderado
    candidatos['score_total'] = (
        candidatos['score_precio'] * preferencias['importancia_precio'] +
        candidatos['score_ubicacion'] * preferencias['importancia_ubicacion'] +
        candidatos['score_amenidades'] * preferencias['importancia_amenidades']
    )
    
    # Mejores opciones
    print("\n🏆 Top 10 mejores opciones según preferencias:")
    mejores = candidatos.nlargest(10, 'score_total')
    print(mejores[[
        'tipo', 'ubicacion', 'habitaciones', 'precio', 
        'score_total'
    ]].to_string())


def ejemplo_exportacion_avanzada():
    """
    Exportación de datos en múltiples formatos
    """
    print("\n" + "="*70)
    print("EXPORTACIÓN AVANZADA")
    print("="*70)
    
    modelo = ModeloInmuebles()
    modelo.cargar_dataset('dataset_inmuebles.csv')
    
    # Búsqueda de ejemplo
    criterios = {
        'tipo': 'Casa',
        'precio_max': 400000
    }
    resultado = modelo.categorizar_inmuebles(criterios)
    
    if len(resultado) > 0:
        # Exportar a CSV
        resultado.to_csv('export_casas.csv', index=False)
        print("✓ Exportado a CSV: export_casas.csv")
        
        # Exportar a Excel con formato
        with pd.ExcelWriter('export_casas.xlsx', engine='openpyxl') as writer:
            resultado.to_excel(writer, sheet_name='Propiedades', index=False)
            
            # Agregar hoja de resumen
            resumen = pd.DataFrame({
                'Métrica': ['Total', 'Precio Promedio', 'Precio Mínimo', 'Precio Máximo'],
                'Valor': [
                    len(resultado),
                    f"${resultado['precio'].mean():,.2f}",
                    f"${resultado['precio'].min():,.2f}",
                    f"${resultado['precio'].max():,.2f}"
                ]
            })
            resumen.to_excel(writer, sheet_name='Resumen', index=False)
        print("✓ Exportado a Excel: export_casas.xlsx")
        
        # Exportar a JSON
        resultado.to_json('export_casas.json', orient='records', indent=2)
        print("✓ Exportado a JSON: export_casas.json")
        
        # Crear reporte HTML simple
        html = f"""
        <html>
        <head>
            <title>Reporte de Propiedades</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #333; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #4CAF50; color: white; }}
            </style>
        </head>
        <body>
            <h1>Reporte de Propiedades</h1>
            <p>Total de propiedades: {len(resultado)}</p>
            <p>Precio promedio: ${resultado['precio'].mean():,.2f}</p>
            {resultado.to_html(index=False)}
        </body>
        </html>
        """
        with open('export_casas.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("✓ Exportado a HTML: export_casas.html")


def ejemplo_pipeline_completo():
    """
    Pipeline completo de análisis de principio a fin
    """
    print("\n" + "="*70)
    print("PIPELINE COMPLETO DE ANÁLISIS")
    print("="*70)
    
    # 1. Generar o cargar datos
    print("\n[1/6] Cargando datos...")
    modelo = ModeloInmuebles()
    modelo.cargar_dataset('dataset_inmuebles.csv')
    
    # 2. Análisis exploratorio
    print("\n[2/6] Análisis exploratorio...")
    print(f"  Total inmuebles: {len(modelo.df)}")
    print(f"  Rango de precios: ${modelo.df['precio'].min():,.0f} - ${modelo.df['precio'].max():,.0f}")
    
    # 3. Preprocesamiento
    print("\n[3/6] Preprocesamiento...")
    modelo.preprocesar_datos()
    
    # 4. Entrenamiento
    print("\n[4/6] Entrenamiento de modelos...")
    modelo.crear_categorias_precio('precio')
    modelo.entrenar_modelo_clasificacion('categoria_precio')
    modelo.entrenar_clustering(n_clusters=5)
    
    # 5. Análisis y búsqueda
    print("\n[5/6] Realizando búsquedas...")
    criterios = {
        'tipo': 'Casa',
        'habitaciones_min': 3,
        'precio_max': 350000
    }
    resultado = modelo.categorizar_inmuebles(criterios)
    print(f"  Encontrados: {len(resultado)} inmuebles")
    
    # 6. Exportación
    print("\n[6/6] Generando reportes...")
    if len(resultado) > 0:
        modelo.generar_reporte(resultado, 'pipeline_resultado.csv')
    
    print("\n✅ Pipeline completado exitosamente")


if __name__ == "__main__":
    print("EJEMPLOS AVANZADOS DEL MODELO DE IA")
    print("="*70)
    print("\nSeleccione un ejemplo para ejecutar:")
    print("1. Análisis de mercado")
    print("2. Comparación de propiedades")
    print("3. Filtros complejos")
    print("4. Análisis temporal")
    print("5. Optimización de búsqueda con scoring")
    print("6. Exportación avanzada")
    print("7. Pipeline completo")
    print("8. Ejecutar todos")
    
    opcion = input("\nOpción (1-8): ")
    
    ejemplos = {
        '1': ejemplo_analisis_mercado,
        '2': ejemplo_comparacion_propiedades,
        '3': ejemplo_filtros_complejos,
        '4': ejemplo_analisis_temporal,
        '5': ejemplo_optimizacion_busqueda,
        '6': ejemplo_exportacion_avanzada,
        '7': ejemplo_pipeline_completo
    }
    
    if opcion == '8':
        for func in ejemplos.values():
            func()
            input("\nPresione Enter para continuar...")
    elif opcion in ejemplos:
        ejemplos[opcion]()
    else:
        print("Opción inválida")
