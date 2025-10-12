#!/bin/bash

echo "🔍 Verificando configuración para Vercel..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json"
    echo "   Asegúrate de estar en el directorio rendimientos-web"
    exit 1
fi

# Verificar build
echo "1️⃣ Verificando build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Build exitoso"
else
    echo "   ❌ Build falló"
    exit 1
fi

# Verificar que dist existe
if [ -d "dist" ]; then
    echo "   ✅ Directorio dist existe"
else
    echo "   ❌ Directorio dist no existe"
    exit 1
fi

# Verificar index.html
if [ -f "dist/index.html" ]; then
    echo "   ✅ index.html existe en dist"
else
    echo "   ❌ index.html no existe en dist"
    exit 1
fi

# Verificar assets
if [ -d "dist/assets" ]; then
    echo "   ✅ Directorio assets existe"
else
    echo "   ❌ Directorio assets no existe"
    exit 1
fi

# Verificar vercel.json en raíz
if [ -f "../vercel.json" ]; then
    echo "   ✅ vercel.json existe en raíz"
else
    echo "   ❌ vercel.json no existe en raíz"
    exit 1
fi

echo ""
echo "✅ Todo listo para desplegar en Vercel!"
echo ""
echo "📋 Siguiente paso:"
echo "   1. Asegúrate de que las variables de entorno estén configuradas en Vercel"
echo "   2. Ejecuta: vercel --prod"
echo "   3. O haz push a GitHub si tienes auto-deploy configurado"
echo ""
