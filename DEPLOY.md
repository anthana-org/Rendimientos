# 🚀 Guía de Despliegue en Vercel

## ✅ Pre-requisitos

- Cuenta de Vercel (https://vercel.com)
- Repositorio Git actualizado
- Variables de entorno de Firebase

## 📋 Pasos para Desplegar

### 1. Preparar el Proyecto

```bash
# Asegurarse de que el build funciona localmente
npm run build

# Verificar que no hay errores
npm run lint
```

### 2. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, agrega estas variables de entorno:

```
VITE_FIREBASE_API_KEY=AIzaSyDO145OJwq50bO9kNhkEs23rTb8pi2l1Ks
VITE_FIREBASE_AUTH_DOMAIN=anthana-rendimientos-193b9.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=anthana-rendimientos-193b9
VITE_FIREBASE_STORAGE_BUCKET=anthana-rendimientos-193b9.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=570628284647
VITE_FIREBASE_APP_ID=1:570628284647:web:9eca76eb54f71f50370242
```

### 3. Configuración de Vercel

El proyecto ya tiene un `vercel.json` configurado:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4. Desplegar

#### Opción A: Desde la Terminal (Recomendado)

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login a Vercel
vercel login

# Desplegar
vercel --prod
```

#### Opción B: Desde GitHub

1. Conecta tu repositorio a Vercel
2. Vercel detectará automáticamente que es un proyecto Vite
3. Agrega las variables de entorno en el dashboard
4. Haz push a tu rama principal

### 5. Verificar el Despliegue

Una vez desplegado, verifica:

- ✅ La página de login carga correctamente
- ✅ Puedes iniciar sesión
- ✅ El dashboard muestra datos de Firebase
- ✅ El panel de admin funciona

## 🐛 Solución de Problemas Comunes

### Error: "Module not found"
- Asegúrate de que todas las dependencias estén en `package.json`
- Ejecuta `npm install` localmente

### Error: "Firebase not configured"
- Verifica que todas las variables de entorno estén configuradas en Vercel
- Los nombres deben empezar con `VITE_`

### Error: "Build failed"
- Ejecuta `npm run build` localmente para ver el error específico
- Revisa los logs de Vercel para más detalles

### Error: "404 on refresh"
- El `vercel.json` ya tiene la configuración de rewrites
- Si persiste, verifica que el archivo esté en el directorio correcto

## 📝 Notas Importantes

1. **Variables de Entorno**: Deben configurarse en Vercel antes del despliegue
2. **Firebase Rules**: Asegúrate de que las reglas de Firestore permitan acceso desde el dominio de Vercel
3. **Dominio**: Vercel te dará un dominio `.vercel.app` automáticamente
4. **Actualizaciones**: Cada push a la rama principal desplegará automáticamente

## 🔗 Enlaces Útiles

- Dashboard de Vercel: https://vercel.com/dashboard
- Documentación de Vite: https://vitejs.dev/guide/
- Firebase Console: https://console.firebase.google.com/

---

**¿Necesitas ayuda?** Revisa los logs de Vercel o contacta al equipo de desarrollo.

