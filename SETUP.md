# 🚀 Setup para Nuevos Desarrolladores

Esta guía te ayudará a configurar el proyecto desde cero.

## 📋 Prerrequisitos

- **Node.js** >= 16.0.0
- **PostgreSQL** >= 12.0 (con Postgres.app o instalación local)
- **Git**

## 🔧 Pasos de Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd Transactions-test
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar PostgreSQL

#### Opción A: Con Postgres.app (macOS)
1. Descargar e instalar [Postgres.app](https://postgresapp.com/)
2. Iniciar PostgreSQL
3. Crear una base de datos llamada `transactions_db`

#### Opción B: Con instalación local
```bash
# Crear base de datos
createdb transactions_db
```

### 4. Configurar variables de entorno
```bash
cp env.example .env
```

Editar el archivo `.env` con tus credenciales:
```env
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=transactions_db
DB_PASSWORD=tu_password_aqui
DB_PORT=5432
```

### 5. Setup completo de la base de datos
```bash
npm run setup
```

Este comando:
- ✅ Crea la base de datos si no existe
- ✅ Crea todas las tablas necesarias
- ✅ Configura índices para performance
- ✅ Crea triggers para updated_at
- ✅ Verifica que todo esté funcionando

### 6. Iniciar el servidor
```bash
npm run dev
```

### 7. Probar la API
```bash
# Health check
curl http://localhost:3000/ping

# Crear usuario
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "balance": 100000}'
```

## 🆘 Solución de Problemas

### Error: "database does not exist"
```bash
# Crear la base de datos manualmente
createdb transactions_db
# O usar el comando completo de PostgreSQL
/Applications/Postgres.app/Contents/Versions/17/bin/psql -U postgres -c "CREATE DATABASE transactions_db;"
```

### Error: "connection refused"
- Verificar que PostgreSQL esté corriendo
- Verificar las credenciales en `.env`
- Verificar que el puerto 5432 esté disponible

### Error: "permission denied"
- Verificar que el usuario `postgres` tenga permisos
- Verificar la contraseña en `.env`

## 📚 Scripts Disponibles

- `npm run setup` - **Setup completo** (recomendado para nuevos devs)
- `npm run migrate` - Solo migraciones existentes
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm start` - Servidor de producción

## ✅ Verificación

Si todo está configurado correctamente, deberías ver:
```
🚀 Server running on port 3000
📊 Health check: http://localhost:3000/ping
👥 Users API: http://localhost:3000/api/v1/users
💳 Transactions API: http://localhost:3000/api/v1/transactions
✅ Connected to PostgreSQL database
```

¡Listo! 🎉 Ya puedes empezar a desarrollar.
