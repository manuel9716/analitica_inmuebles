"""
Script de prueba rápida del modelo de IA
Verifica que todas las funcionalidades básicas funcionan correctamente
"""

from modelo_inmuebles import ModeloInmuebles
from generar_dataset import generar_dataset_inmuebles
import os


def prueba_rapida():
    """
    Ejecuta una prueba rápida de todas las funcionalidades
    """
    print("="*70)
    print("PRUEBA RÁPIDA DEL MODELO DE IA PARA INMUEBLES")
    print("="*70)
    
    try:
        # 1. Generar dataset pequeño para prueba
        print("\n[1/8] Generando dataset de prueba...")
        df = generar_dataset_inmuebles(n_inmuebles=200, guardar=True)
        print("✓ Dataset generado correctamente")
        
        # 2. Inicializar modelo
        print("\n[2/8] Inicializando modelo...")
        modelo = ModeloInmuebles()
        print("✓ Modelo inicializado")
        
        # 3. Cargar dataset
        print("\n[3/8] Cargando dataset...")
        modelo.cargar_dataset('dataset_inmuebles.csv')
        print("✓ Dataset cargado")
        
        # 4. Preprocesar
        print("\n[4/8] Preprocesando datos...")
        modelo.preprocesar_datos()
        print("✓ Datos preprocesados")
        
        # 5. Crear categorías
        print("\n[5/8] Creando categorías de precio...")
        modelo.crear_categorias_precio('precio')
        print("✓ Categorías creadas")
        
        # 6. Entrenar clasificación
        print("\n[6/8] Entrenando modelo de clasificación...")
        accuracy = modelo.entrenar_modelo_clasificacion('categoria_precio')
        print(f"✓ Modelo entrenado (precisión: {accuracy:.2%})")
        
        # 7. Entrenar clustering
        print("\n[7/8] Entrenando clustering...")
        modelo.entrenar_clustering(n_clusters=3)
        print("✓ Clustering completado")
        
        # 8. Prueba de búsqueda
        print("\n[8/8] Probando búsqueda...")
        criterios = {
            'tipo': 'Casa',
            'habitaciones': 3
        }
        resultado = modelo.categorizar_inmuebles(criterios)
        print(f"✓ Búsqueda exitosa: {len(resultado)} resultados")
        
        # Guardar modelo
        print("\n[Extra] Guardando modelo...")
        modelo.guardar_modelo('modelo_inmuebles.pkl')
        print("✓ Modelo guardado")
        
        # Resumen
        print("\n" + "="*70)
        print("RESULTADO DE LA PRUEBA")
        print("="*70)
        print("✅ Todas las funcionalidades están operativas")
        print(f"✅ Dataset: {len(df)} inmuebles")
        print(f"✅ Precisión del modelo: {accuracy:.2%}")
        print(f"✅ Archivos generados:")
        print("   - dataset_inmuebles.csv")
        print("   - modelo_inmuebles.pkl")
        print("\n🎉 ¡Sistema listo para usar!")
        print("\nPróximos pasos:")
        print("  1. Ejecuta 'python interfaz_consulta.py' para usar la interfaz interactiva")
        print("  2. Ejecuta 'python ejemplo_uso.py' para ver ejemplos completos")
        print("  3. Lee README.md para documentación detallada")
        
        return True
        
    except Exception as e:
        print("\n" + "="*70)
        print("❌ ERROR EN LA PRUEBA")
        print("="*70)
        print(f"Error: {str(e)}")
        print("\nVerifica que:")
        print("  1. Todas las dependencias estén instaladas: pip install -r requirements.txt")
        print("  2. Tienes permisos de escritura en el directorio")
        print("  3. Python 3.8 o superior está instalado")
        return False


if __name__ == "__main__":
    exito = prueba_rapida()
    exit(0 if exito else 1)
