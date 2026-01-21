import os
import logging
from typing import Dict, Any, Optional, Tuple, List

# Configuración de logging
logger = logging.getLogger(__name__)

class GeocodingError(Exception):
    """Excepción para errores de geocodificación"""
    pass

# Mapeo de ubicaciones conocidas que no son bien detectadas
UBICACIONES_CONOCIDAS = {
    "pance": "Pance",
    "ciudad jardin": "Ciudad Jardín",
    "ciudad jardín": "Ciudad Jardín",
    "la flora": "La Flora",
    "jamundi": "Jamundí",
    "jamundí": "Jamundí",
    "palmira": "Palmira",
    "yumbo": "Yumbo",
    "valle del cauca": "Valle del Cauca",
    "valle": "Valle del Cauca",
    "cauca": "Valle del Cauca",
    "cali": "Cali",
    "buenaventura": "Buenaventura"
}

def normalizar_ubicacion(texto_ubicacion: str) -> Dict[str, Any]:
    """
    Normaliza una ubicación textual a componentes estructurados.
    
    Args:
        texto_ubicacion: Texto que describe una ubicación (dirección, barrio, ciudad, etc.)
        
    Returns:
        Diccionario con componentes normalizados (ciudad, departamento, país, coordenadas)
    """
    # Esta es una versión simplificada que utiliza el mapeo de ubicaciones conocidas
    # En producción, se integraría con Google Maps API
    
    texto_ubicacion_lower = texto_ubicacion.lower()
    
    # Verificar primero en nuestro mapeo de ubicaciones conocidas
    for clave, valor in UBICACIONES_CONOCIDAS.items():
        if clave in texto_ubicacion_lower:
            return {
                "ciudad": valor,
                "departamento": "Valle del Cauca" if valor != "Valle del Cauca" else None,
                "pais": "Colombia",
                "coordenadas": None,
                "texto_original": texto_ubicacion,
                "confianza": 0.8
            }
    
    # Si no encontramos coincidencia, devolver valores por defecto
    return {
        "ciudad": None,
        "departamento": None,
        "pais": "Colombia",
        "coordenadas": None,
        "texto_original": texto_ubicacion,
        "confianza": 0.0
    }

def obtener_ciudad_desde_coordenadas(lat: float, lng: float) -> Optional[str]:
    """
    Obtiene el nombre de la ciudad/municipio a partir de coordenadas.
    
    Args:
        lat: Latitud
        lng: Longitud
        
    Returns:
        Nombre de la ciudad/municipio o None si no se pudo determinar
    """
    # Implementación simplificada
    # En producción, se integraría con Google Maps API para geocodificación inversa
    
    # Simplemente devolvemos None por ahora
    return None

def mejorar_deteccion_ciudad(texto: str) -> Optional[str]:
    """
    Mejora la detección de ciudades conocidas en el texto
    
    Args:
        texto: Texto de búsqueda del usuario
        
    Returns:
        Nombre de la ciudad detectada o None si no se detectó ninguna
    """
    texto_lower = texto.lower()
    
    for clave, valor in UBICACIONES_CONOCIDAS.items():
        if clave in texto_lower:
            return valor
            
    return None

def extraer_ciudad_desde_direccion(direccion: str) -> Optional[str]:
    """
    Extrae el nombre de la ciudad desde un texto de dirección
    
    Args:
        direccion: Texto de dirección
        
    Returns:
        Nombre de la ciudad o None si no se pudo extraer
    """
    # Esta es una implementación simplificada
    # En producción, se integraría con Google Maps API
    
    for clave, valor in UBICACIONES_CONOCIDAS.items():
        if clave in direccion.lower():
            return valor
            
    return None

def normalizar_ciudad_en_propiedad(propiedad: Dict[str, Any]) -> Optional[str]:
    """
    Normaliza el campo ciudad en una propiedad
    
    Args:
        propiedad: Diccionario con datos de la propiedad
        
    Returns:
        Ciudad normalizada o None si no se pudo normalizar
    """
    # Intento 1: Campo ciudad
    if "ciudad" in propiedad and propiedad["ciudad"]:
        ciudad = extraer_ciudad_desde_direccion(str(propiedad["ciudad"]))
        if ciudad:
            return ciudad
    
    # Intento 2: Campo dirección
    if "direccion" in propiedad and propiedad["direccion"]:
        ciudad = extraer_ciudad_desde_direccion(str(propiedad["direccion"]))
        if ciudad:
            return ciudad
            
    # Intento 3: Campo título
    if "titulo" in propiedad and propiedad["titulo"]:
        ciudad = extraer_ciudad_desde_direccion(str(propiedad["titulo"]))
        if ciudad:
            return ciudad
    
    # Si no se pudo normalizar, devolver None
    return None
