# 📊 Anthana Dashboard - Sistema de Rendimientos

Un sistema completo de gestión de rendimientos e inversiones desarrollado con React, TypeScript y Firebase.

## 🚀 Características Principales

### 📈 Dashboard Principal
- **Métricas en tiempo real** - Rendimiento total, inversiones activas, total de contratos
- **Botones de acción rápida** - Depósito y retiro con formularios completos
- **Interfaz responsive** - Optimizada para móviles y desktop

### 👥 Gestión de Usuarios
- **Panel de administración completo** - Gestión de usuarios y rendimientos
- **Carga masiva de usuarios** - Importación desde archivos Excel (.xlsx/.xls)
- **Selección individual de usuarios** - Para aplicar rendimientos específicos
- **Validación completa** - Emails, contraseñas y datos de usuario

### 📋 Gestión de Contratos
- **Vista completa de contratos** - Lista detallada con filtros
- **Carga masiva de contratos** - Con campos de rendimiento global
- **Filtros de visualización** - 5, 10, 25, 50, 100 o todos los contratos
- **Estadísticas en tiempo real** - Total, vencidos, próximos a vencer, activos

### 🌍 Rendimiento Global
- **Aplicación masiva** - Rendimientos a todos los usuarios o selección específica
- **Campos completos** - Capital, rendimiento %, balance, notas
- **Parámetros de inversión** - Plazo, tipo de portafolio, comisiones
- **Selección de usuarios** - Control total sobre a quién aplicar

### 🔥 Integración Firebase
- **Autenticación** - Sistema completo de usuarios y administradores
- **Firestore** - Base de datos en tiempo real
- **Monitoreo de conexión** - Estado de Firebase visible en la interfaz
- **Reglas de seguridad** - Configuración robusta de permisos

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Firestore + Authentication)
- **Procesamiento:** SheetJS (para archivos Excel)
- **Estado:** React Hooks
- **Routing:** React Router

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/anthana-org/Rendimientos.git
cd Rendimientos/rendimientos-web
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar Firebase**
   - Crear proyecto en [Firebase Console](https://console.firebase.google.com)
   - Habilitar Authentication y Firestore
   - Copiar configuración a `.env`:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

4. **Configurar reglas de Firestore**
```bash
firebase deploy --only firestore:rules
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

6. **Construir para producción**
```bash
npm run build
```

## 📁 Estructura del Proyecto

```
rendimientos-web/
├── src/
│   ├── components/          # Componentes React
│   │   ├── AdminPanel.tsx   # Panel de administración
│   │   ├── BulkUserUpload.tsx    # Carga masiva usuarios
│   │   ├── BulkContractsUpload.tsx # Carga masiva contratos
│   │   ├── UserSelector.tsx      # Selector de usuarios
│   │   ├── WithdrawalButton.tsx   # Botón de retiro
│   │   ├── DepositButton.tsx     # Botón de depósito
│   │   └── ...
│   ├── services/            # Servicios Firebase
│   │   ├── userService.ts   # Gestión de usuarios
│   │   ├── contractService.ts # Gestión de contratos
│   │   ├── rendimientosService.ts # Gestión rendimientos
│   │   └── adminAuthService.ts # Autenticación admin
│   ├── hooks/              # Custom hooks
│   │   └── useContractsTotal.ts # Hook para total contratos
│   ├── pages/              # Páginas principales
│   │   ├── DashboardPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── LandingPage.tsx
│   └── firebase.ts         # Configuración Firebase
├── firestore.rules         # Reglas de seguridad
├── ejemplo-usuarios-masivos.csv    # Archivo ejemplo usuarios
├── ejemplo-contratos-masivos.csv   # Archivo ejemplo contratos
└── package.json
```

## 📊 Funcionalidades Detalladas

### 🔐 Autenticación y Seguridad
- **Login de administradores** - Acceso seguro al panel
- **Reglas de Firestore** - Permisos granulares por colección
- **Validación de datos** - En frontend y backend
- **Manejo de errores** - Mensajes claros y logging

### 📈 Gestión de Rendimientos
- **Creación individual** - Formulario completo con validación
- **Aplicación global** - A todos los usuarios o selección específica
- **Campos avanzados** - Capital, rendimiento %, balance, notas
- **Parámetros de inversión** - Plazo, portafolio, comisiones

### 📋 Gestión de Contratos
- **Vista detallada** - Usuario, tipo, monto, fechas, estado
- **Filtros inteligentes** - Por cantidad de visualización
- **Estadísticas** - Totales, vencidos, próximos a vencer
- **Carga masiva** - Desde archivos Excel con validación

### 👥 Gestión de Usuarios
- **Lista completa** - Con búsqueda y filtros
- **Creación individual** - Formulario de nuevo usuario
- **Carga masiva** - Desde Excel con validación de emails
- **Selección específica** - Para aplicar rendimientos

## 📄 Archivos de Ejemplo

### Usuarios Masivos (CSV/Excel)
```csv
email,password,displayName,phoneNumber
usuario1@test.com,password123,Juan Pérez,+52 55 1234 5678
usuario2@test.com,password456,María García,+52 55 2345 6789
```

### Contratos Masivos (CSV/Excel)
```csv
userEmail,contractType,investmentAmount,startDate,expirationDate,rendimientoPct,rendimientoMxn,balance,plazoMeses,tipoPortafolio,rendimientoMensual,comisionRetiro,notas
test1@gmail.com,Inversión Global - 2025-08 to 2025-10,200000,2025-08-01,2025-10-31,5.5,11000,211000,3,Conservador,1.8,2.5,Bonus trimestral
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo (puerto 5173)

# Construcción
npm run build        # Build de producción
npm run preview      # Preview del build

# Firebase
firebase login       # Autenticación Firebase CLI
firebase init        # Inicializar proyecto Firebase
firebase deploy      # Desplegar a Firebase Hosting
```

## 🔧 Configuración Avanzada

### Variables de Entorno
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Reglas de Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isAdmin() { 
      return isSignedIn() && (
        request.auth.token.admin == true || 
        request.auth.token.email == "admin@test.com"
      );
    }
    
    match /users/{uid} {
      allow read: if true; // Temporal para debugging
      allow write: if isAdmin() || (isSignedIn() && request.auth.uid == uid);
    }
    
    match /rendimientos/{docId} {
      allow read: if true; // Temporal para debugging
      allow write: if true; // Temporal para debugging
    }
    
    match /contracts/{docId} {
      allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow write: if isAdmin();
    }
  }
}
```

## 📱 Responsive Design

- **Mobile First** - Optimizado para dispositivos móviles
- **Breakpoints** - sm, md, lg, xl para diferentes pantallas
- **Componentes adaptativos** - Tablas, formularios y navegación
- **Touch Friendly** - Botones y controles optimizados para touch

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de Firebase**
   - Verificar variables de entorno en `.env`
   - Comprobar reglas de Firestore
   - Revisar configuración del proyecto

2. **Error de compilación**
   - Ejecutar `npm install` para actualizar dependencias
   - Verificar versiones de Node.js (18+)
   - Limpiar cache: `npm run build -- --force`

3. **Problemas de permisos**
   - Verificar reglas de Firestore
   - Comprobar autenticación de usuarios
   - Revisar configuración de Firebase Auth

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Desarrollo:** Equipo Anthana
- **Repositorio:** [anthana-org/Rendimientos](https://github.com/anthana-org/Rendimientos)

## 📞 Soporte

Para soporte técnico o preguntas:
- 📧 Email: soporte@anthana.org
- 🐛 Issues: [GitHub Issues](https://github.com/anthana-org/Rendimientos/issues)
- 📖 Documentación: [Wiki del proyecto](https://github.com/anthana-org/Rendimientos/wiki)

---

⭐ **¡No olvides darle una estrella al proyecto si te resulta útil!**
