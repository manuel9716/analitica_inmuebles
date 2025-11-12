# 🚀 Cómo Subir el Proyecto a GitHub

## ✅ Todo está Listo

Tu proyecto ya está configurado localmente:
- ✅ 13 archivos commiteados
- ✅ Git configurado correctamente
- ✅ Remote apuntando a: `https://github.com/Busco-Facil/Analitica_Inmuebles.git`

## 📋 Pasos Simples para Subir

### 1️⃣ Crear el Repositorio en GitHub

El repositorio **NO existe todavía** en GitHub. Necesitas crearlo:

1. **Abre tu navegador** y ve a: https://github.com/Busco-Facil

2. **Click en "New repository"** (botón verde)

3. **Configura el repositorio**:
   ```
   Repository name: Analitica_Inmuebles
   Description: Modelo de IA para análisis y categorización de inmuebles
   Visibilidad: Pública ✓ (o Privada si prefieres)
   
   ⚠️ IMPORTANTE: NO marques nada más
   ❌ NO marques "Add a README file"
   ❌ NO marques "Add .gitignore"  
   ❌ NO marques "Choose a license"
   ```

4. **Click en "Create repository"**

### 2️⃣ Subir el Código

Después de crear el repositorio, ejecuta este comando en tu terminal:

```bash
cd "/Users/manuel97/Documents/Proyectos/Busco Facil/Modelo Local de IA"
git push -u origin main
```

**¡Eso es todo!** Tu código estará en GitHub.

## 🔐 Si Pide Autenticación

GitHub puede pedirte usuario y contraseña:

### Opción A: Personal Access Token (Recomendado)

1. Ve a: https://github.com/settings/tokens
2. Click en "Generate new token" → "Generate new token (classic)"
3. Dale un nombre: "Analitica_Inmuebles"
4. Marca el scope: `repo` (acceso completo a repositorios)
5. Click en "Generate token"
6. **Copia el token** (solo se muestra una vez)
7. Cuando Git pida contraseña, pega el token

### Opción B: SSH (Alternativa)

Si prefieres usar SSH:

```bash
# Cambiar a SSH
cd "/Users/manuel97/Documents/Proyectos/Busco Facil/Modelo Local de IA"
git remote set-url origin git@github.com:Busco-Facil/Analitica_Inmuebles.git

# Hacer push
git push -u origin main
```

## 🎯 Verificar que Funcionó

Después del push, abre en tu navegador:
```
https://github.com/Busco-Facil/Analitica_Inmuebles
```

Deberías ver todos tus archivos:
- ✅ README.md
- ✅ modelo_inmuebles.py
- ✅ interfaz_consulta.py
- ✅ Y todos los demás archivos

## ❓ Problemas Comunes

### "Repository not found"
→ El repositorio no existe. Sigue el **Paso 1** arriba.

### "Permission denied"
→ No tienes permisos en la organización Busco-Facil. Pide acceso al administrador.

### "Authentication failed"
→ Usa un Personal Access Token en lugar de tu contraseña de GitHub.

### "Updates were rejected"
→ El repositorio tiene contenido. Usa:
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## 📞 Comando Completo (Copia y Pega)

```bash
# Ir al directorio
cd "/Users/manuel97/Documents/Proyectos/Busco Facil/Modelo Local de IA"

# Ver estado
git status

# Hacer push
git push -u origin main
```

## 🎉 Después del Push

Una vez subido, puedes:

1. **Ver el código en GitHub**: https://github.com/Busco-Facil/Analitica_Inmuebles
2. **Clonar en otra máquina**: `git clone https://github.com/Busco-Facil/Analitica_Inmuebles.git`
3. **Compartir el enlace** con tu equipo
4. **Configurar GitHub Actions** para CI/CD
5. **Agregar colaboradores** desde Settings → Collaborators

## 📊 Resumen

**Estado actual**: ✅ Listo para push
**Acción requerida**: Crear repositorio en GitHub
**Comando para subir**: `git push -u origin main`
**Tiempo estimado**: 2 minutos

---

**¿Necesitas ayuda?** Lee el archivo `INSTRUCCIONES_GIT.md` para más detalles.
