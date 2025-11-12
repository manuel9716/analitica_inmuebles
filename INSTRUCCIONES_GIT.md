# 📝 Instrucciones para Conectar con GitHub

## ✅ Estado Actual

El repositorio local ya está configurado y listo:
- ✅ Git inicializado
- ✅ Rama `main` creada
- ✅ Todos los archivos agregados y commiteados
- ✅ Remote `origin` configurado: `https://github.com/Busco-Facil/Analitica_Inmuebles.git`

## 🔧 Pasos para Completar la Conexión

### Opción 1: Si el repositorio NO existe en GitHub

1. **Crear el repositorio en GitHub:**
   - Ve a https://github.com/Busco-Facil
   - Haz clic en "New repository"
   - Nombre: `Analitica_Inmuebles`
   - **NO inicialices con README, .gitignore o licencia** (ya los tenemos localmente)
   - Haz clic en "Create repository"

2. **Hacer push del código:**
   ```bash
   cd "/Users/manuel97/Documents/Proyectos/Busco Facil/Modelo Local de IA"
   git push -u origin main
   ```

### Opción 2: Si el repositorio YA existe en GitHub

Si el repositorio ya tiene contenido, necesitas decidir cómo fusionar:

#### A. Sobrescribir el contenido remoto (CUIDADO: elimina lo que hay en GitHub)
```bash
cd "/Users/manuel97/Documents/Proyectos/Busco Facil/Modelo Local de IA"
git push -u origin main --force
```

#### B. Fusionar con el contenido existente
```bash
cd "/Users/manuel97/Documents/Proyectos/Busco Facil/Modelo Local de IA"
git pull origin main --allow-unrelated-histories
# Resolver conflictos si los hay
git push -u origin main
```

### Opción 3: Si necesitas autenticación

Si GitHub solicita autenticación, tienes dos opciones:

#### A. Usar Personal Access Token (Recomendado)
1. Ve a GitHub → Settings → Developer settings → Personal access tokens
2. Genera un nuevo token con permisos de `repo`
3. Usa el token como contraseña cuando Git lo solicite

#### B. Usar SSH
```bash
# Cambiar remote a SSH
git remote set-url origin git@github.com:Busco-Facil/Analitica_Inmuebles.git

# Hacer push
git push -u origin main
```

## 🔍 Verificar Estado Actual

```bash
cd "/Users/manuel97/Documents/Proyectos/Busco Facil/Modelo Local de IA"

# Ver estado del repositorio
git status

# Ver historial de commits
git log --oneline

# Ver configuración de remotes
git remote -v

# Ver ramas
git branch -a
```

## 📊 Información del Commit Actual

- **Rama**: main
- **Commit**: Initial commit con 12 archivos
- **Archivos incluidos**:
  - modelo_inmuebles.py
  - generar_dataset.py
  - interfaz_consulta.py
  - ejemplo_uso.py
  - ejemplos_avanzados.py
  - prueba_rapida.py
  - api_ejemplo.py
  - README.md
  - INICIO_RAPIDO.md
  - ESTRUCTURA_PROYECTO.md
  - requirements.txt
  - .gitignore

## 🚀 Comandos Útiles para Después del Push

### Ver el repositorio en GitHub
```bash
# Abrir en el navegador (macOS)
open https://github.com/Busco-Facil/Analitica_Inmuebles
```

### Clonar en otra máquina
```bash
git clone https://github.com/Busco-Facil/Analitica_Inmuebles.git
cd Analitica_Inmuebles
pip install -r requirements.txt
python prueba_rapida.py
```

### Hacer cambios futuros
```bash
# Hacer cambios en archivos...

# Ver qué cambió
git status
git diff

# Agregar cambios
git add .

# Hacer commit
git commit -m "Descripción de los cambios"

# Subir a GitHub
git push
```

## ⚠️ Notas Importantes

1. **El archivo .gitignore** ya está configurado para ignorar:
   - Archivos de Python (__pycache__, *.pyc)
   - Datasets generados (dataset_inmuebles.csv)
   - Modelos entrenados (*.pkl)
   - Reportes generados (reporte_*.csv)
   - Archivos del sistema (.DS_Store)

2. **Archivos que NO se subirán automáticamente**:
   - dataset_inmuebles.csv (se genera con el script)
   - modelo_inmuebles.pkl (se entrena localmente)
   - Reportes CSV generados

3. **Tamaño del repositorio**: ~90 KB (solo código y documentación)

## 🆘 Solución de Problemas

### Error: "Repository not found"
- Verifica que el repositorio existe en GitHub
- Verifica que tienes permisos de escritura
- Verifica que la URL es correcta

### Error: "Authentication failed"
- Usa un Personal Access Token en lugar de contraseña
- O configura SSH keys

### Error: "Updates were rejected"
- El repositorio remoto tiene cambios que no tienes localmente
- Usa `git pull` primero o `git push --force` (con cuidado)

### Error: "Permission denied"
- Verifica que eres miembro de la organización Busco-Facil
- Verifica que tienes permisos de escritura en el repositorio

## 📞 Siguiente Paso

**Ejecuta uno de estos comandos según tu situación:**

```bash
# Si el repositorio NO existe en GitHub (crear primero en la web)
git push -u origin main

# Si el repositorio existe y quieres sobrescribir
git push -u origin main --force

# Si el repositorio existe y quieres fusionar
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

**Estado**: ✅ Repositorio local listo para push
**Acción requerida**: Crear repositorio en GitHub y ejecutar `git push`
