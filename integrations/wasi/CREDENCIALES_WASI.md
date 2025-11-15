# 🔐 Credenciales WASI - Información Completa

**⚠️ IMPORTANTE: Este archivo contiene información sensible. NO compartir públicamente.**

---

## 📡 Credenciales API WASI

Para uso programático (Python, API REST):

```
ID Company:  493728
WASI Token:  4kyL_tY1Q_e8yL_j0ju
```

**Documentación API:** https://api.wasi.co

**Uso en código:**
```python
from config_wasi import obtener_credenciales_api

creds = obtener_credenciales_api()
# {'id_company': '493728', 'wasi_token': '4kyL_tY1Q_e8yL_j0ju'}
```

---

## 🌐 Credenciales Acceso Web

Para acceso a la plataforma web de WASI:

```
URL:      https://wasi.co
Usuario:  Contacto@facilinmobiliaria.co
Clave:    5599441inmo
```

**Uso:** Acceso al panel de administración de WASI

---

## 🔗 URL Personalizada

URL base para inmuebles de Facil Inmobiliaria:

```
URL Base:     https://facilinmobiliaria.com
URL Pattern:  https://facilinmobiliaria.com/main-inmueble-info-[id].htm
```

**Ejemplo:**
```
Inmueble ID: 12345
URL: https://facilinmobiliaria.com/main-inmueble-info-12345.htm
```

**Uso en código:**
```python
from config_wasi import obtener_url_inmueble

url = obtener_url_inmueble('12345')
# 'https://facilinmobiliaria.com/main-inmueble-info-12345.htm'
```

---

## 📋 Resumen de Archivos

| Archivo | Descripción |
|---------|-------------|
| `config_wasi.py` | Configuración centralizada de credenciales |
| `wasi_connector.py` | Conector para obtener datos de WASI |
| `api_wasi.py` | API REST con datos reales de WASI |
| `INTEGRACION_WASI.md` | Guía de integración completa |

---

## 🚀 Inicio Rápido

### 1. Sincronizar Datos de WASI

```bash
python3 wasi_connector.py
```

Esto descargará los inmuebles reales usando las credenciales API.

### 2. Iniciar API con Datos Reales

```bash
python3 api_wasi.py
```

Servidor disponible en: `http://localhost:5000`

### 3. Verificar Configuración

```bash
python3 config_wasi.py
```

Muestra todas las credenciales y configuración actual.

---

## 🔒 Seguridad

### ⚠️ Advertencias Importantes

1. **NO subir este archivo a repositorios públicos**
2. **NO compartir las credenciales en chats/emails**
3. **Cambiar credenciales si se comprometen**
4. **Usar variables de entorno en producción**

### Buenas Prácticas

Para producción, considera usar variables de entorno:

```python
import os

WASI_ID_COMPANY = os.getenv('WASI_ID_COMPANY', '493728')
WASI_TOKEN = os.getenv('WASI_TOKEN', '4kyL_tY1Q_e8yL_j0ju')
```

Y configurarlas en tu servidor:

```bash
export WASI_ID_COMPANY="493728"
export WASI_TOKEN="4kyL_tY1Q_e8yL_j0ju"
```

---

## 📞 Contacto WASI

Si necesitas soporte o cambiar credenciales:

- **Soporte WASI:** https://wasi.co/soporte
- **Email:** (consultar en plataforma WASI)
- **Documentación:** https://api.wasi.co

---

## 🔄 Renovación de Credenciales

Si necesitas renovar o cambiar las credenciales:

1. Acceder a https://wasi.co con las credenciales web
2. Ir a Configuración > API
3. Generar nuevo token si es necesario
4. Actualizar `config_wasi.py` con las nuevas credenciales

---

## ✅ Verificación de Acceso

Para verificar que las credenciales funcionan:

```python
from wasi_connector import WasiConnector

connector = WasiConnector('493728', '4kyL_tY1Q_e8yL_j0ju')
inmuebles = connector.obtener_inmuebles(limit=10)

if inmuebles:
    print(f"✓ Credenciales válidas. Obtenidos {len(inmuebles)} inmuebles")
else:
    print("❌ Error: Verificar credenciales")
```

---

**Última actualización:** Noviembre 12, 2025

**Responsable:** Facil Inmobiliaria
**Email:** Contacto@facilinmobiliaria.co
