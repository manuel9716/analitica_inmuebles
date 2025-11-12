"""
Ejemplo de API REST para el modelo de inmuebles
Este archivo muestra cómo crear una API web para el modelo
Requiere: pip install flask flask-cors
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from modelo_inmuebles import ModeloInmuebles
import pandas as pd
import os

app = Flask(__name__)
CORS(app)  # Permitir CORS para desarrollo

# Inicializar modelo global
modelo = None


def inicializar_modelo():
    """
    Inicializa el modelo al arrancar la aplicación
    """
    global modelo
    modelo = ModeloInmuebles()
    
    # Verificar si existe dataset
    if not os.path.exists('dataset_inmuebles.csv'):
        from generar_dataset import generar_dataset_inmuebles
        print("Generando dataset de ejemplo...")
        generar_dataset_inmuebles(n_inmuebles=1000, guardar=True)
    
    # Cargar dataset
    modelo.cargar_dataset('dataset_inmuebles.csv')
    modelo.preprocesar_datos()
    
    # Cargar o entrenar modelo
    if os.path.exists('modelo_inmuebles.pkl'):
        print("Cargando modelo existente...")
        modelo.cargar_modelo('modelo_inmuebles.pkl')
    else:
        print("Entrenando nuevo modelo...")
        modelo.crear_categorias_precio('precio')
        modelo.entrenar_modelo_clasificacion('categoria_precio')
        modelo.entrenar_clustering(n_clusters=5)
        modelo.guardar_modelo('modelo_inmuebles.pkl')
    
    print("✓ Modelo listo para recibir peticiones")


@app.route('/')
def home():
    """
    Endpoint raíz con información de la API
    """
    return jsonify({
        'nombre': 'API de Análisis de Inmuebles',
        'version': '1.0',
        'endpoints': {
            '/': 'Información de la API',
            '/estadisticas': 'Estadísticas del dataset',
            '/buscar': 'Buscar inmuebles (POST)',
            '/similares/<id>': 'Inmuebles similares',
            '/tipos': 'Tipos de inmuebles disponibles',
            '/ubicaciones': 'Ubicaciones disponibles'
        }
    })


@app.route('/estadisticas', methods=['GET'])
def estadisticas():
    """
    Retorna estadísticas generales del dataset
    GET /estadisticas
    """
    try:
        stats = {
            'total_inmuebles': len(modelo.df),
            'precio_promedio': float(modelo.df['precio'].mean()),
            'precio_minimo': float(modelo.df['precio'].min()),
            'precio_maximo': float(modelo.df['precio'].max()),
            'precio_mediana': float(modelo.df['precio'].median()),
            'distribucion_tipos': modelo.df['tipo'].value_counts().to_dict(),
            'distribucion_ubicaciones': modelo.df['ubicacion'].value_counts().to_dict(),
            'habitaciones_promedio': float(modelo.df['habitaciones'].mean()),
            'area_promedio': float(modelo.df['area_m2'].mean())
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/tipos', methods=['GET'])
def tipos():
    """
    Retorna los tipos de inmuebles disponibles
    GET /tipos
    """
    try:
        tipos_disponibles = modelo.df['tipo'].unique().tolist()
        conteo = modelo.df['tipo'].value_counts().to_dict()
        
        return jsonify({
            'tipos': tipos_disponibles,
            'conteo': conteo
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/ubicaciones', methods=['GET'])
def ubicaciones():
    """
    Retorna las ubicaciones disponibles
    GET /ubicaciones
    """
    try:
        ubicaciones_disponibles = modelo.df['ubicacion'].unique().tolist()
        conteo = modelo.df['ubicacion'].value_counts().to_dict()
        precio_promedio = modelo.df.groupby('ubicacion')['precio'].mean().to_dict()
        
        return jsonify({
            'ubicaciones': ubicaciones_disponibles,
            'conteo': conteo,
            'precio_promedio': precio_promedio
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/buscar', methods=['POST'])
def buscar():
    """
    Busca inmuebles según criterios
    POST /buscar
    Body (JSON):
    {
        "tipo": "Casa",
        "habitaciones": 3,
        "precio_min": 150000,
        "precio_max": 300000,
        "ubicacion": "Centro",
        "tiene_jardin": true
    }
    """
    try:
        criterios = request.get_json()
        
        if not criterios:
            return jsonify({'error': 'No se proporcionaron criterios de búsqueda'}), 400
        
        # Realizar búsqueda
        resultado = modelo.categorizar_inmuebles(criterios)
        
        # Convertir resultado a formato JSON
        if len(resultado) > 0:
            # Limitar a 100 resultados
            resultado_limitado = resultado.head(100)
            
            return jsonify({
                'total_encontrados': len(resultado),
                'total_retornados': len(resultado_limitado),
                'criterios': criterios,
                'resultados': resultado_limitado.to_dict('records')
            })
        else:
            return jsonify({
                'total_encontrados': 0,
                'total_retornados': 0,
                'criterios': criterios,
                'resultados': []
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/similares/<int:inmueble_id>', methods=['GET'])
def similares(inmueble_id):
    """
    Encuentra inmuebles similares
    GET /similares/<id>?n=5
    """
    try:
        n_similares = request.args.get('n', default=5, type=int)
        
        if inmueble_id < 0 or inmueble_id >= len(modelo.df):
            return jsonify({'error': 'ID de inmueble inválido'}), 400
        
        # Obtener inmueble de referencia
        inmueble_ref = modelo.df.iloc[inmueble_id].to_dict()
        
        # Buscar similares
        similares_df = modelo.buscar_similares(inmueble_id, n_similares)
        
        return jsonify({
            'inmueble_referencia': inmueble_ref,
            'similares_encontrados': len(similares_df),
            'similares': similares_df.to_dict('records')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/inmueble/<int:inmueble_id>', methods=['GET'])
def obtener_inmueble(inmueble_id):
    """
    Obtiene detalles de un inmueble específico
    GET /inmueble/<id>
    """
    try:
        if inmueble_id < 0 or inmueble_id >= len(modelo.df):
            return jsonify({'error': 'ID de inmueble inválido'}), 400
        
        inmueble = modelo.df.iloc[inmueble_id].to_dict()
        return jsonify(inmueble)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/rango-precios', methods=['GET'])
def rango_precios():
    """
    Obtiene el rango de precios disponible
    GET /rango-precios
    """
    try:
        return jsonify({
            'minimo': float(modelo.df['precio'].min()),
            'maximo': float(modelo.df['precio'].max()),
            'promedio': float(modelo.df['precio'].mean()),
            'mediana': float(modelo.df['precio'].median()),
            'cuartiles': {
                'q1': float(modelo.df['precio'].quantile(0.25)),
                'q2': float(modelo.df['precio'].quantile(0.50)),
                'q3': float(modelo.df['precio'].quantile(0.75))
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/filtros-disponibles', methods=['GET'])
def filtros_disponibles():
    """
    Retorna todos los filtros disponibles para búsqueda
    GET /filtros-disponibles
    """
    try:
        filtros = {
            'tipos': modelo.df['tipo'].unique().tolist(),
            'ubicaciones': modelo.df['ubicacion'].unique().tolist(),
            'estados': modelo.df['estado'].unique().tolist(),
            'habitaciones': sorted(modelo.df['habitaciones'].unique().tolist()),
            'banos': sorted(modelo.df['banos'].unique().tolist()),
            'estacionamientos': sorted(modelo.df['estacionamientos'].unique().tolist()),
            'caracteristicas_booleanas': [
                'tiene_jardin',
                'tiene_terraza',
                'tiene_balcon',
                'tiene_piscina',
                'tiene_gimnasio',
                'tiene_seguridad',
                'cerca_transporte',
                'cerca_escuelas',
                'cerca_comercios'
            ],
            'rangos_numericos': {
                'precio': {
                    'min': float(modelo.df['precio'].min()),
                    'max': float(modelo.df['precio'].max())
                },
                'area_m2': {
                    'min': float(modelo.df['area_m2'].min()),
                    'max': float(modelo.df['area_m2'].max())
                },
                'antiguedad_anos': {
                    'min': float(modelo.df['antiguedad_anos'].min()),
                    'max': float(modelo.df['antiguedad_anos'].max())
                }
            }
        }
        return jsonify(filtros)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("="*70)
    print("API DE ANÁLISIS DE INMUEBLES")
    print("="*70)
    print("\nInicializando modelo...")
    inicializar_modelo()
    
    print("\n" + "="*70)
    print("SERVIDOR INICIADO")
    print("="*70)
    print("\nEndpoints disponibles:")
    print("  GET  http://localhost:5000/")
    print("  GET  http://localhost:5000/estadisticas")
    print("  POST http://localhost:5000/buscar")
    print("  GET  http://localhost:5000/similares/<id>")
    print("  GET  http://localhost:5000/tipos")
    print("  GET  http://localhost:5000/ubicaciones")
    print("  GET  http://localhost:5000/inmueble/<id>")
    print("  GET  http://localhost:5000/rango-precios")
    print("  GET  http://localhost:5000/filtros-disponibles")
    print("\nEjemplo de búsqueda con curl:")
    print('  curl -X POST http://localhost:5000/buscar \\')
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"tipo": "Casa", "habitaciones": 3, "precio_max": 300000}\'')
    print("\n" + "="*70)
    
    # Iniciar servidor
    app.run(debug=True, host='0.0.0.0', port=5000)
