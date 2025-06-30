# 🏟️ Backend CanchaYa

Sistema completo de gestión de reservas de canchas deportivas.

Este backend provee:
- Registro e inicio de sesión de usuarios (con JWT)
- Administración de clubes, canchas y horarios
- Gestión de reservas
- Valoraciones de canchas
- Deudas y control de pagos
- Reportes estadísticos (reservas, deudas, uso de canchas)
- Documentación Swagger

## 🛠️ Tecnologías

- Node.js
- TypeScript
- Express
- PostgreSQL + TypeORM
- JWT para autenticación
- Jest + Supertest (tests automáticos)
- Swagger (OpenAPI)

---

## 🚀 Instalación y configuración

1. **Clonar el repositorio**
   ```bash
   git clone <URL_DEL_REPO>
   cd backend-cancha-ya

## Instalar dependencias
npm install

## Configurar variables de entorno

Crear un archivo .env en la raíz con este contenido:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=cancha_ya
JWT_SECRET=un_super_secreto

## Correr en desarrollo
npm run dev

Servidor disponible en:
http://localhost:3000/api

## Documentación
La documentación de los endpoints está disponible en:
http://localhost:3000/api/docs

Si se hacen cambios en los archivos de Swagger, se puede regenerar el JSON final con:
npm run generate-swagger

## Reportes disponibles

- Reservas por cancha
- Reservas por usuario
- Deudas pendientes
- Canchas más reservadas
- Ingresos por cancha

Puedes consultarlos en los endpoints /api/reportes/*

## Estructura del proyecto
.
├── src/
│   ├── app.ts                # Configuración Express
│   ├── server.ts             # Punto de entrada
│   ├── controllers/          # Lógica de rutas
│   ├── routes/               # Definición de rutas
│   ├── entities/             # Modelos TypeORM
│   ├── middlewares/          # Middlewares de autenticación y errores
│   ├── services/             # Lógica de negocio
│   ├── database/             # Configuración TypeORM
│   └── docs/                 # Documentación Swagger modular
├── tests/                    # Tests Jest/Supertest
├── scripts/                  # Scripts para generación de Swagger
└── README.md                 # Esta documentación
