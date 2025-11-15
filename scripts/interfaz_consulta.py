"""
Interfaz interactiva para consultas al modelo de IA de inmuebles
Permite realizar búsquedas personalizadas de forma interactiva
"""

from modelo_inmuebles import ModeloInmuebles
from generar_dataset import generar_dataset_inmuebles
import pandas as pd
import os


class InterfazConsulta:
    """
    Interfaz de línea de comandos para consultar el modelo
    """
    
    def __init__(self):
        self.modelo = ModeloInmuebles()
        self.modelo_cargado = False
    
    def inicializar(self):
        """
        Inicializa el modelo y carga datos
        """
        print("="*70)
        print("SISTEMA DE BÚSQUEDA Y CATEGORIZACIÓN DE INMUEBLES")
        print("="*70)
        
        # Verificar si existe dataset
        if not os.path.exists('dataset_inmuebles.csv'):
            print("\n⚠️  No se encontró dataset. Generando datos de ejemplo...")
            generar_dataset_inmuebles(n_inmuebles=1000, guardar=True)
        
        # Cargar dataset
        print("\n📂 Cargando dataset...")
        self.modelo.cargar_dataset('dataset_inmuebles.csv')
        self.modelo.preprocesar_datos()
        
        # Verificar si existe modelo entrenado
        if os.path.exists('modelo_inmuebles.pkl'):
            print("\n🤖 Cargando modelo entrenado...")
            self.modelo.cargar_modelo('modelo_inmuebles.pkl')
        else:
            print("\n🤖 Entrenando modelo...")
            self.modelo.crear_categorias_precio('precio')
            self.modelo.entrenar_modelo_clasificacion('categoria_precio')
            self.modelo.entrenar_clustering(n_clusters=5)
            self.modelo.guardar_modelo('modelo_inmuebles.pkl')
        
        self.modelo_cargado = True
        print("\n✓ Sistema listo para consultas")
    
    def mostrar_menu(self):
        """
        Muestra el menú principal
        """
        print("\n" + "="*70)
        print("MENÚ PRINCIPAL")
        print("="*70)
        print("1. Búsqueda por tipo de inmueble")
        print("2. Búsqueda por rango de precio")
        print("3. Búsqueda por ubicación")
        print("4. Búsqueda por características")
        print("5. Búsqueda avanzada (múltiples criterios)")
        print("6. Buscar inmuebles similares")
        print("7. Ver estadísticas del dataset")
        print("8. Generar reporte personalizado")
        print("9. Salir")
        print("="*70)
    
    def busqueda_por_tipo(self):
        """
        Búsqueda filtrada por tipo de inmueble
        """
        print("\n📋 Tipos disponibles:")
        tipos = self.modelo.df['tipo'].unique()
        for i, tipo in enumerate(tipos, 1):
            count = len(self.modelo.df[self.modelo.df['tipo'] == tipo])
            print(f"{i}. {tipo} ({count} disponibles)")
        
        seleccion = input("\nSeleccione el número del tipo: ")
        try:
            tipo_seleccionado = tipos[int(seleccion) - 1]
            criterios = {'tipo': tipo_seleccionado}
            resultado = self.modelo.categorizar_inmuebles(criterios)
            self.mostrar_resultados(resultado)
            return resultado
        except (ValueError, IndexError):
            print("❌ Selección inválida")
            return None
    
    def busqueda_por_precio(self):
        """
        Búsqueda filtrada por rango de precio
        """
        print("\n💰 Búsqueda por rango de precio")
        print(f"Precio mínimo en dataset: ${self.modelo.df['precio'].min():,.2f}")
        print(f"Precio máximo en dataset: ${self.modelo.df['precio'].max():,.2f}")
        
        try:
            precio_min = float(input("\nPrecio mínimo (Enter para omitir): ") or 0)
            precio_max = float(input("Precio máximo (Enter para omitir): ") or self.modelo.df['precio'].max())
            
            criterios = {
                'precio_min': precio_min,
                'precio_max': precio_max
            }
            resultado = self.modelo.categorizar_inmuebles(criterios)
            self.mostrar_resultados(resultado)
            return resultado
        except ValueError:
            print("❌ Valor inválido")
            return None
    
    def busqueda_por_ubicacion(self):
        """
        Búsqueda filtrada por ubicación
        """
        print("\n📍 Ubicaciones disponibles:")
        ubicaciones = self.modelo.df['ubicacion'].unique()
        for i, ubicacion in enumerate(ubicaciones, 1):
            count = len(self.modelo.df[self.modelo.df['ubicacion'] == ubicacion])
            precio_promedio = self.modelo.df[self.modelo.df['ubicacion'] == ubicacion]['precio'].mean()
            print(f"{i}. {ubicacion} ({count} disponibles, precio promedio: ${precio_promedio:,.2f})")
        
        seleccion = input("\nSeleccione el número de la ubicación: ")
        try:
            ubicacion_seleccionada = ubicaciones[int(seleccion) - 1]
            criterios = {'ubicacion': ubicacion_seleccionada}
            resultado = self.modelo.categorizar_inmuebles(criterios)
            self.mostrar_resultados(resultado)
            return resultado
        except (ValueError, IndexError):
            print("❌ Selección inválida")
            return None
    
    def busqueda_por_caracteristicas(self):
        """
        Búsqueda filtrada por características específicas
        """
        print("\n🏠 Búsqueda por características")
        criterios = {}
        
        # Habitaciones
        habitaciones = input("Número de habitaciones (Enter para omitir): ")
        if habitaciones:
            criterios['habitaciones'] = int(habitaciones)
        
        # Baños
        banos = input("Número de baños (Enter para omitir): ")
        if banos:
            criterios['banos'] = int(banos)
        
        # Estacionamientos
        estacionamientos = input("Número de estacionamientos (Enter para omitir): ")
        if estacionamientos:
            criterios['estacionamientos'] = int(estacionamientos)
        
        # Características booleanas
        if input("¿Con jardín? (s/n): ").lower() == 's':
            criterios['tiene_jardin'] = True
        
        if input("¿Con piscina? (s/n): ").lower() == 's':
            criterios['tiene_piscina'] = True
        
        if input("¿Con gimnasio? (s/n): ").lower() == 's':
            criterios['tiene_gimnasio'] = True
        
        if input("¿Con seguridad? (s/n): ").lower() == 's':
            criterios['tiene_seguridad'] = True
        
        if criterios:
            resultado = self.modelo.categorizar_inmuebles(criterios)
            self.mostrar_resultados(resultado)
            return resultado
        else:
            print("❌ No se especificaron criterios")
            return None
    
    def busqueda_avanzada(self):
        """
        Búsqueda con múltiples criterios combinados
        """
        print("\n🎯 Búsqueda avanzada - Combine múltiples criterios")
        criterios = {}
        
        # Tipo
        tipo = input("Tipo de inmueble (Casa/Apartamento/etc., Enter para omitir): ")
        if tipo:
            criterios['tipo'] = tipo
        
        # Ubicación
        ubicacion = input("Ubicación (Centro/Norte/Sur/etc., Enter para omitir): ")
        if ubicacion:
            criterios['ubicacion'] = ubicacion
        
        # Precio
        precio_min = input("Precio mínimo (Enter para omitir): ")
        if precio_min:
            criterios['precio_min'] = float(precio_min)
        
        precio_max = input("Precio máximo (Enter para omitir): ")
        if precio_max:
            criterios['precio_max'] = float(precio_max)
        
        # Habitaciones
        hab_min = input("Habitaciones mínimas (Enter para omitir): ")
        if hab_min:
            criterios['habitaciones_min'] = int(hab_min)
        
        # Baños
        banos_min = input("Baños mínimos (Enter para omitir): ")
        if banos_min:
            criterios['banos_min'] = int(banos_min)
        
        # Área
        area_min = input("Área mínima en m² (Enter para omitir): ")
        if area_min:
            criterios['area_m2_min'] = float(area_min)
        
        # Estado
        estado = input("Estado (Nuevo/Excelente/Bueno/etc., Enter para omitir): ")
        if estado:
            criterios['estado'] = estado
        
        if criterios:
            resultado = self.modelo.categorizar_inmuebles(criterios)
            self.mostrar_resultados(resultado)
            return resultado
        else:
            print("❌ No se especificaron criterios")
            return None
    
    def buscar_similares(self):
        """
        Busca inmuebles similares a uno de referencia
        """
        print("\n🔍 Búsqueda de inmuebles similares")
        
        try:
            inmueble_id = int(input(f"ID del inmueble de referencia (0-{len(self.modelo.df)-1}): "))
            
            if 0 <= inmueble_id < len(self.modelo.df):
                print("\n📋 Inmueble de referencia:")
                ref = self.modelo.df.iloc[inmueble_id]
                print(f"Tipo: {ref['tipo']}")
                print(f"Ubicación: {ref['ubicacion']}")
                print(f"Habitaciones: {ref['habitaciones']}")
                print(f"Baños: {ref['banos']}")
                print(f"Área: {ref['area_m2']} m²")
                print(f"Precio: ${ref['precio']:,.2f}")
                
                n_similares = int(input("\n¿Cuántos similares desea ver? (1-20): ") or 5)
                similares = self.modelo.buscar_similares(inmueble_id, n_similares)
                self.mostrar_resultados(similares)
                return similares
            else:
                print("❌ ID fuera de rango")
                return None
        except ValueError:
            print("❌ ID inválido")
            return None
    
    def ver_estadisticas(self):
        """
        Muestra estadísticas del dataset
        """
        print("\n📊 ESTADÍSTICAS DEL DATASET")
        print("="*70)
        
        print(f"\nTotal de inmuebles: {len(self.modelo.df)}")
        
        print("\n💰 Precios:")
        print(f"  Promedio: ${self.modelo.df['precio'].mean():,.2f}")
        print(f"  Mínimo: ${self.modelo.df['precio'].min():,.2f}")
        print(f"  Máximo: ${self.modelo.df['precio'].max():,.2f}")
        print(f"  Mediana: ${self.modelo.df['precio'].median():,.2f}")
        
        print("\n🏠 Distribución por tipo:")
        print(self.modelo.df['tipo'].value_counts())
        
        print("\n📍 Distribución por ubicación:")
        print(self.modelo.df['ubicacion'].value_counts())
        
        print("\n🛏️  Distribución por habitaciones:")
        print(self.modelo.df['habitaciones'].value_counts().sort_index())
        
        print("\n📊 Precio promedio por tipo:")
        print(self.modelo.df.groupby('tipo')['precio'].mean().sort_values(ascending=False))
    
    def generar_reporte(self, resultado):
        """
        Genera un reporte con los resultados
        """
        if resultado is None or len(resultado) == 0:
            print("❌ No hay resultados para generar reporte")
            return
        
        nombre = input("\nNombre del archivo de reporte (sin extensión): ")
        if nombre:
            nombre_archivo = f"{nombre}.csv"
            self.modelo.generar_reporte(resultado, nombre_archivo)
        else:
            print("❌ Nombre inválido")
    
    def mostrar_resultados(self, resultado):
        """
        Muestra los resultados de una búsqueda
        """
        if resultado is None or len(resultado) == 0:
            print("\n❌ No se encontraron inmuebles que cumplan los criterios")
            return
        
        print(f"\n✓ Encontrados {len(resultado)} inmuebles")
        
        # Mostrar primeros resultados
        n_mostrar = min(10, len(resultado))
        print(f"\nMostrando los primeros {n_mostrar} resultados:")
        print("="*70)
        
        columnas_mostrar = ['tipo', 'ubicacion', 'habitaciones', 'banos', 'area_m2', 'precio']
        print(resultado[columnas_mostrar].head(n_mostrar).to_string(index=False))
        
        # Estadísticas del resultado
        print("\n📊 Estadísticas de los resultados:")
        print(f"  Precio promedio: ${resultado['precio'].mean():,.2f}")
        print(f"  Precio mínimo: ${resultado['precio'].min():,.2f}")
        print(f"  Precio máximo: ${resultado['precio'].max():,.2f}")
        
        # Preguntar si desea generar reporte
        if input("\n¿Desea generar un reporte con estos resultados? (s/n): ").lower() == 's':
            self.generar_reporte(resultado)
    
    def ejecutar(self):
        """
        Ejecuta la interfaz interactiva
        """
        if not self.modelo_cargado:
            self.inicializar()
        
        while True:
            self.mostrar_menu()
            opcion = input("\nSeleccione una opción: ")
            
            if opcion == '1':
                self.busqueda_por_tipo()
            elif opcion == '2':
                self.busqueda_por_precio()
            elif opcion == '3':
                self.busqueda_por_ubicacion()
            elif opcion == '4':
                self.busqueda_por_caracteristicas()
            elif opcion == '5':
                self.busqueda_avanzada()
            elif opcion == '6':
                self.buscar_similares()
            elif opcion == '7':
                self.ver_estadisticas()
            elif opcion == '8':
                print("\n⚠️  Primero realice una búsqueda para generar un reporte")
            elif opcion == '9':
                print("\n👋 ¡Hasta luego!")
                break
            else:
                print("\n❌ Opción inválida")
            
            input("\nPresione Enter para continuar...")


if __name__ == "__main__":
    interfaz = InterfazConsulta()
    interfaz.ejecutar()
