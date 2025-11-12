# 🚀 Inicio Rápido

## Instalación en 3 Pasos

### 1. Instalar Dependencias
```bash
pip install -r requirements.txt
```

### 2. Ejecutar Prueba Rápida
```bash
python prueba_rapida.py
```

Este script:
- ✅ Genera un dataset de ejemplo
- ✅ Entrena el modelo de IA
- ✅ Verifica que todo funciona correctamente

### 3. Usar el Sistema

#### Opción A: Interfaz Interactiva (Recomendado)
```bash
python interfaz_consulta.py
```

#### Opción B: Ver Ejemplos Completos
```bash
python ejemplo_uso.py
```

#### Opción C: API REST (Requiere Flask)
```bash
pip install flask flask-cors
python api_ejemplo.py
```

## 📝 Ejemplo de Código

```python
from modelo_inmuebles import ModeloInmuebles

# Inicializar modelo
modelo = ModeloInmuebles()
modelo.cargar_dataset('dataset_inmuebles.csv')
modelo.preprocesar_datos()

# Buscar inmuebles
criterios = {
    'tipo': 'Casa',
    'habitaciones': 3,
    'precio_max': 300000
}
resultado = modelo.categorizar_inmuebles(criterios)

print(f"Encontrados: {len(resultado)} inmuebles")
```

## 🎯 Casos de Uso Rápidos

### Buscar Casa Familiar
```python
criterios = {
    'tipo': 'Casa',
    'habitaciones_min': 3,
    'banos_min': 2,
    'tiene_jardin': True,
    'precio_max': 350000
}
```

### Buscar Apartamento Premium
```python
criterios = {
    'tipo': 'Apartamento',
    'ubicacion': 'Centro',
    'precio_min': 400000,
    'tiene_gimnasio': True
}
```

### Buscar Inversión
```python
criterios = {
    'estado': 'Nuevo',
    'ubicacion': 'Centro',
    'tiene_seguridad': True
}
```

## 📚 Más Información

Lee el archivo `README.md` para documentación completa.

## ❓ Problemas Comunes

**Error: No module named 'sklearn'**
```bash
pip install scikit-learn
```

**Error: No se encuentra el dataset**
```bash
python generar_dataset.py
```

## 🎉 ¡Listo!

Tu modelo de IA está funcionando. Comienza a buscar inmuebles.
