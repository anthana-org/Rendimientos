# Configuración de Firebase

## 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

## 2. Iniciar sesión en Firebase

```bash
firebase login
```

## 3. Inicializar proyecto Firebase

```bash
firebase init
```

Selecciona:
- ✅ Firestore
- ✅ Hosting (opcional)

## 4. Configurar variables de entorno

Edita el archivo `.env` con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_APP_ID=tu_app_id
```

## 5. Desplegar reglas de Firestore

```bash
firebase deploy --only firestore:rules
```

## 5b. Desplegar reglas de Storage

```bash
firebase deploy --only storage
```

O desplegar ambas a la vez:

```bash
firebase deploy --only firestore:rules,storage
```

## 6. Configurar Authentication

En Firebase Console:
1. Ve a Authentication > Sign-in method
2. Habilita "Email/Password"
3. Opcional: Configura dominios autorizados

## 7. Configurar Custom Claims (para admin)

Para hacer que un usuario sea admin, ejecuta en Firebase Console > Functions:

```javascript
const admin = require('firebase-admin');

admin.auth().setCustomUserClaims('USER_UID', { admin: true });
```

O usa la función helper en el código:

```javascript
// En Firebase Functions
exports.addAdminRole = functions.https.onCall((data, context) => {
  return admin.auth().getUserByEmail(data.email).then(user => {
    return admin.auth().setCustomUserClaims(user.uid, {
      admin: true
    });
  }).then(() => {
    return {
      message: `Success! ${data.email} has been made an admin.`
    }
  }).catch(err => {
    return err;
  });
});
```

## Estructura de Firestore

### Colección: `users`
```
users/{uid}
├── email: string
├── displayName?: string
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Colección: `rendimientos`
```
rendimientos/{autoId}
├── uid: string (usuario propietario)
├── periodo: string (YYYY-MM)
├── capital?: number
├── rendimiento_pct?: number
├── rendimiento_mxn?: number
├── balance?: number
├── notas?: string
├── createdAt: timestamp
└── updatedAt?: timestamp
```

## Reglas de Seguridad

Las reglas implementadas aseguran que:

1. **Usuarios** solo pueden leer/escribir sus propios datos
2. **Rendimientos** solo pueden ser leídos por su propietario
3. **Admins** pueden hacer CRUD completo en todas las colecciones
4. **Autenticación** es requerida para todas las operaciones

## Testing

1. Crea usuarios de prueba
2. Asigna rol admin a uno de ellos
3. Prueba crear/leer rendimientos
4. Verifica que usuarios normales solo ven sus datos
5. Verifica que admins ven todo
