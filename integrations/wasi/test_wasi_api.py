"""
Script de prueba para verificar la conexión con la API de WASI
Prueba diferentes endpoints y métodos según la documentación de WASI
"""

import requests
import json

# Credenciales
ID_COMPANY = "493728"
WASI_TOKEN = "4kyL_tY1Q_e8yL_j0ju"

print("="*70)
print("PRUEBA DE CONEXIÓN CON API DE WASI - property/search")
print("="*70)

url = "https://api.wasi.co/v1/property/search"
params = {
    "id_company": ID_COMPANY,
    "wasi_token": WASI_TOKEN,
    "skip": 0,
    "take": 10,
}

print(f"URL: {url}")
print(f"Parámetros: {params}")

try:
    response = requests.get(url, params=params, timeout=20)
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")

    try:
        data = response.json()
        print("Respuesta JSON (primeros 1000 caracteres):")
        print(json.dumps(data, indent=2)[:1000])

        if isinstance(data, dict) and "data" in data:
            print(f"\nNúmero de inmuebles en 'data': {len(data['data'])}")
    except Exception as e:
        print("No se pudo decodificar JSON, respuesta de texto:")
        print(response.text[:1000])

except Exception as e:
    print(f"❌ Excepción realizando la petición: {e}")

print(f"\n{'='*70}")
print("FIN DE PRUEBA property/search")
print(f"{'='*70}")
