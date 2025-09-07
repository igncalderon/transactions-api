# Transactions API

API REST para manejo de transacciones entre usuarios con Node.js, Express y TypeScript.

## ⚠️ IMPORTANTE

**Estado actual**: La aplicación está configurada para usar una base de datos en memoria por limitaciones de tiempo. Sin embargo, **la migración completa a PostgreSQL ya está implementada** y lista para usar.

**Migración disponible**: Puedes ver la implementación completa de la base de datos PostgreSQL en el [PR #4](https://github.com/igncalderon/transactions-api/pull/4), que incluye:

- ✅ Configuración completa de PostgreSQL
- ✅ Scripts de setup de base de datos
- ✅ Migración de todos los servicios a queries SQL
- ✅ Tests actualizados para la nueva implementación
- ✅ Transacciones de base de datos para consistencia de datos
- ✅ Índices y triggers para optimización

Para activar la versión con base de datos, simplemente cambia a la rama `feature/migrate-to-postgresql` y sigue las instrucciones de setup.

## 🚀 Características

- **Transacciones automáticas**: Montos ≤ $50,000 se confirman automáticamente
- **Transacciones pendientes**: Montos > $50,000 requieren aprobación manual
- **Congelamiento de fondos**: El dinero se congela inmediatamente al crear la transacción
- **Validación de saldos**: Verificación de fondos suficientes antes de procesar
- **API RESTful**: Endpoints bien estructurados con respuestas consistentes

## 📋 Requisitos

- Node.js >= 16.0.0
- npm

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd Transactions-test

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build
npm start
```

## 🔧 Scripts disponibles

- `npm run dev` - Ejecutar en modo desarrollo con hot reload
- `npm run build` - Compilar TypeScript a JavaScript
- `npm start` - Ejecutar la aplicación compilada

## 📚 Documentación de la API

### Base URL
```
http://localhost:3000
```

### Endpoints

#### **Ping**
- **GET** `/ping` - Verificar estado del servidor

#### **Usuarios**
- **POST** `/api/v1/users` - Crear usuario
- **GET** `/api/v1/users` - Listar todos los usuarios
- **GET** `/api/v1/users/:id` - Obtener usuario por ID

#### **Transacciones**
- **POST** `/api/v1/transactions` - Crear transacción
- **GET** `/api/v1/transactions` - Listar todas las transacciones
- **GET** `/api/v1/transactions?userId=:id` - Listar transacciones de un usuario
- **GET** `/api/v1/transactions/:id` - Obtener transacción por ID
- **PATCH** `/api/v1/transactions/:id/approve` - Aprobar transacción pendiente
- **PATCH** `/api/v1/transactions/:id/reject` - Rechazar transacción pendiente

## 📖 Swagger Documentation

### **POST /api/v1/users**
Crear un nuevo usuario.

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "balance": 100000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc123def",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "balance": 100000,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "User created successfully"
}
```

### **POST /api/v1/transactions**
Crear una nueva transacción.

**Request Body:**
```json
{
  "fromUserId": "abc123def",
  "toUserId": "xyz789ghi",
  "amount": 25000
}
```

**Response (Transacción confirmada automáticamente):**
```json
{
  "success": true,
  "data": {
    "id": "txn456",
    "fromUserId": "abc123def",
    "toUserId": "xyz789ghi",
    "amount": 25000,
    "status": "confirmed",
    "date": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Transaction created successfully"
}
```

**Response (Transacción pendiente):**
```json
{
  "success": true,
  "data": {
    "id": "txn789",
    "fromUserId": "abc123def",
    "toUserId": "xyz789ghi",
    "amount": 75000,
    "status": "pending",
    "date": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Transaction created successfully"
}
```

### **GET /api/v1/transactions**
Listar todas las transacciones o filtrar por usuario.

**Query Parameters:**
- `userId` (opcional): ID del usuario para filtrar transacciones

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "txn456",
      "fromUserId": "abc123def",
      "toUserId": "xyz789ghi",
      "amount": 25000,
      "status": "confirmed",
      "date": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### **PATCH /api/v1/transactions/:id/approve**
Aprobar una transacción pendiente.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "txn789",
    "fromUserId": "abc123def",
    "toUserId": "xyz789ghi",
    "amount": 75000,
    "status": "confirmed",
    "date": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  },
  "message": "Transaction approved and processed successfully"
}
```

### **PATCH /api/v1/transactions/:id/reject**
Rechazar una transacción pendiente.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "txn789",
    "fromUserId": "abc123def",
    "toUserId": "xyz789ghi",
    "amount": 75000,
    "status": "rejected",
    "date": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  },
  "message": "Transaction rejected successfully"
}
```

## 🔄 Flujo de Transacciones

### Transacciones Pequeñas (≤ $50,000)
1. Se crea la transacción
2. Se congela el dinero del usuario origen
3. Se confirma automáticamente
4. Se acredita el dinero al usuario destino

### Transacciones Grandes (> $50,000)
1. Se crea la transacción
2. Se congela el dinero del usuario origen
3. Queda en estado `pending`
4. Requiere aprobación manual:
   - **Aprobar**: Se acredita al destino
   - **Rechazar**: Se devuelve al origen

## 📱 Colección de Postman

Para facilitar las pruebas de la API, hemos incluido una colección de Postman que puedes importar:

### **Descargar e importar:**

1. **Descarga** el archivo `Transactions_API.postman_collection.json` del repositorio
2. **Abre Postman**
3. **Click en "Import"** (botón en la esquina superior izquierda)
4. **Selecciona el archivo** descargado
5. **Click en "Import"**

### **Configuración:**

1. **Ejecuta el servidor:**
   ```bash
   npm run dev
   ```

2. **Actualiza las variables de la colección:**
   - `{{baseUrl}}` = http://localhost:3000
   - `{{userId1}}` = ID del primer usuario (obtener de la respuesta)
   - `{{userId2}}` = ID del segundo usuario (obtener de la respuesta)
   - `{{transactionId}}` = ID de la transacción (obtener de la respuesta)

### **Flujo de prueba recomendado:**

1. **Health Check** - Verificar que la API esté funcionando
2. **Create User** - Crear el primer usuario
3. **Create User 2** - Crear el segundo usuario
4. **Get All Users** - Obtener los IDs de los usuarios
5. **Create Small Transaction** - Transacción que se confirma automáticamente
6. **Create Large Transaction** - Transacción que queda pendiente
7. **Get All Transactions** - Ver todas las transacciones
8. **Approve Transaction** - Aprobar la transacción pendiente

## 🚨 Códigos de Error

| Código | Descripción |
|--------|-------------|
| `USER_NOT_FOUND` | Usuario no encontrado |
| `INSUFFICIENT_BALANCE` | Saldo insuficiente |
| `ONLY_PENDING_TRANSACTIONS_CAN_BE_APPROVED` | Solo se pueden aprobar transacciones pendientes |
| `ONLY_PENDING_TRANSACTIONS_CAN_BE_REJECTED` | Solo se pueden rechazar transacciones pendientes |
| `ONLY_PENDING_TRANSACTIONS_CAN_BE_UPDATED` | Solo se pueden actualizar transacciones pendientes |

## 🏗️ Estructura del Proyecto

```
src/
├── middleware/
│   ├── errorHandler.ts    # Manejo de errores
│   └── validation.ts      # Validación de datos
├── routes/
│   ├── transactions.ts    # Rutas de transacciones
│   └── users.ts          # Rutas de usuarios
├── services/
│   ├── transactionService.ts  # Lógica de transacciones
│   └── userService.ts         # Lógica de usuarios
├── types/
│   ├── index.ts          # Tipos principales
│   └── errors.ts         # Códigos de error
└── server.ts             # Servidor principal
```

## 🔧 Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **TypeScript** - Superset tipado de JavaScript
- **Nodemon** - Hot reload para desarrollo
- **ts-node** - Ejecutor de TypeScript

## 📝 Licencia

MIT