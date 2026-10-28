# 🏫 Sistema Centralizado de Operaciones Académicas (SCOA)

![Estado](https://img.shields.io/badge/estado-Backend%20Completado%20100%25-brightgreen)
![Node.js](https://img.shields.io/badge/backend-Node.js%20v20%2B-339933)
![Express](https://img.shields.io/badge/framework-Express%204.19-black)
![Base de datos](https://img.shields.io/badge/database-PostgreSQL%2016-336791)
![Seguridad](https://img.shields.io/badge/auth-JWT%20%2B%20Bcrypt-blue)
![Tiempo Real](https://img.shields.io/badge/realtime-Server--Sent%20Events%20(SSE)-purple)
![Cron](https://img.shields.io/badge/background-node--cron-orange)
![Frontend](https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite-61DAFB)

> **SCOA** <Es una plataforma web integral diseñada para digitalizar, centralizar y optimizar procesos académicos y operativos en instituciones educativas: préstamos de laboratorio con control de concurrencia pesimista, seguimiento de incidencias mediante máquinas de estado, distribución segmentada de comunicados, consulta de horarios, eventos en tiempo real (SSE) y analítica administrativa mediante indicadores clave de rendimiento (KPIs).

---

## 📑 Tabla de Contenidos

1. [📊 Resumen Ejecutivo del Avance Desarrollado](#-resumen-ejecutivo-del-avance-desarrollado)
2. [🏗️ Arquitectura Técnica del Sistema](#-arquitectura-técnica-del-sistema)
3. [📂 Estructura Detallada del Repositorio](#-estructura-detallada-del-repositorio)
4. [⚙️ Funcionalidades y Módulos Desarrollados](#️-funcionalidades-y-módulos-desarrollados)
   - [4.1. Base de Datos y Persistencia](#41-base-de-datos-y-persistencia-postgresql-16)
   - [4.2. Autenticación, Sesiones y Seguridad](#42-autenticación-sesiones-y-seguridad-jwt--bcrypt)
   - [4.3. Gestión de Préstamos y Control de Concurrencia](#43-gestión-de-préstamos-y-control-de-concurrencia-fsm)
   - [4.4. Gestión de Incidencias de Infraestructura](#44-gestión-de-incidencias-de-infraestructura-fsm)
   - [4.5. Eventos en Tiempo Real (SSE)](#45-eventos-en-tiempo-real-server-sent-events)
   - [4.6. Proceso Programado de Vencimientos](#46-proceso-programado-de-vencimientos-node-cron)
   - [4.7. Indicadores Administrativos](#47-indicadores-administrativos-kpis)
   - [4.8. Comunicados y Notificaciones](#48-comunicados-y-notificaciones)
   - [4.9. Horarios y Gestión de Usuarios](#49-horarios-y-gestión-de-usuarios)
5. [📡 Catálogo Completo de Endpoints (API REST)](#-catálogo-completo-de-endpoints-api-rest)
6. [👥 Roles y Matriz de Permisos](#-roles-y-matriz-de-permisos)
7. [🚀 Guía de Instalación y Puesta en Marcha](#-guía-de-instalación-y-puesta-en-marcha)
8. [🧪 Datos Semilla y Credenciales de Prueba](#-datos-semilla-y-credenciales-de-prueba)
9. [🔮 Próximos Pasos (Frontend y PWA)](#-próximos-pasos-frontend-y-pwa)
10. [👨‍💻 Equipo de Desarrollo](#-equipo-de-desarrollo)

---

## 📊 Resumen Ejecutivo del Avance Desarrollado

En esta fase de desarrollo se ha completado **satisfactoriamente el 100% de la arquitectura central, capa de persistencia y lógica de negocio del Backend**, implementando todas las especificaciones y reglas operativas requeridas por el proyecto:

| Componente | Estado | Descripción del Avance |
| :--- | :---: | :--- |
| **Diseño y Migración de Base de Datos** | ✅ 100% | Esquema normalizado en PostgreSQL 16 con 10 tablas, claves foráneas, restricciones `CHECK`, índices y tipos UUID (`pgcrypto`). |
| **Semillas de Datos (Seeds)** | ✅ 100% | Dataset inicial con usuarios directivos, maestros, alumnos, grupos, asignaciones, horarios e inventario de equipo. |
| **Capa de Conexión a Base de Datos** | ✅ 100% | Pool de conexiones `pg.Pool` centralizado y resiliente ante caídas de conexión. |
| **Módulo de Autenticación & Seguridad** | ✅ 100% | Login con JWT (expiración configurable), hasheo de contraseñas con Bcrypt (10 rounds) y middleware de autorización RBAC estricto. |
| **FSM de Préstamos & Concurrencia** | ✅ 100% | Máquina de estados finita completa con bloqueos transaccionales pesimistas (`SELECT ... FOR UPDATE`) para evitar doble reserva. |
| **FSM de Incidencias** | ✅ 100% | Flujo de estados para ciclo de vida de fallas de infraestructura, asignación a personal y vinculación de recurrencias. |
| **Eventos en Tiempo Real (SSE)** | ✅ 100% | Canal unidireccional HTTP con Server-Sent Events, gestión por usuario, reconexión y keep-alive. |
| **Tareas Programadas (Cron Jobs)** | ✅ 100% | Cron cada hora para marcar préstamos vencidos y enviar alertas preventivas idempotentes a 24h y 12h. |
| **Indicadores Administrativos (KPIs)** | ✅ 100% | Consultas analíticas SQL con cálculo de mediana de resolución, antigüedad de tickets, mora y tasa de uso de inventario. |
| **Servicios Auxiliares (Horario, Avisos)** | ✅ 100% | Visualización contextual de horarios por rol, comunicados segmentados con JSONB y buzón de notificaciones. |
| **Frontend Base (App Shell)** | ⏳ 20% | Estructura inicial en Vite + React 18 configurada y lista para integración con la API. |

---

## 🏗️ Arquitectura Técnica del Sistema

SCOA utiliza una arquitectura en tres capas desacopladas, priorizando la integridad de datos, el aislamiento de lógica de negocio y la consistencia transaccional:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENTE WEB (FRONTEND)                          │
│          React 18 + Vite · Gestión de Estado · Conexión SSE            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Peticiones HTTP REST / Cookies JWT
                                    │ EventStream SSE (/api/eventos)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVIDOR (BACKEND API)                          │
│                               Node.js                                  │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 Middlewares (Auth, CORS, Cookie)               │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │               Controladores & Rutas REST (/api/*)              │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │         Servicios de Dominio & Máquinas de Estados (FSM)       │   │
│   │      (Préstamos, Incidencias, Indicadores, Comunicados)        │   │
│   └──────────────────────┬─────────────────────────┬───────────────┘   │
│                          │                         │                   │
│             ┌────────────▼───────────┐ ┌───────────▼───────────────┐   │
│             │  Canal SSE (En Tiempo  │ │  Cron Job (Vencimientos   │   │
│             │         Real)          │ │      e Idempotencia)      │   │
│             └────────────────────────┘ └───────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Pool de conexiones (pg) / Transacciones
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BASE DE DATOS (POSTGRESQL 16)                      │
│     10 Tablas · UUIDs · Foráneas · Checks · Índices · Locks Pesimistas │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Estructura Detallada del Repositorio

El proyecto mantiene una estructura modular y organizada por responsabilidades:

```text
SCOA/
├── backend/                              # Servidor de aplicación Node.js + Express
│   ├── src/
│   │   ├── controllers/                  # Controladores de petición y respuesta HTTP
│   │   │   ├── authController.js         # Login, logout y perfil de usuario
│   │   │   ├── comunicadoController.js   # Creación y consulta de comunicados
│   │   │   ├── equipoController.js       # Catálogo e inventario de equipo
│   │   │   ├── horarioController.js      # Consulta contextual de horarios
│   │   │   ├── incidenciaController.js   # Reporte y ciclo de incidencias
│   │   │   ├── indicadorController.js    # KPIs administrativos para directivos
│   │   │   ├── notificacionController.js # Lectura y conteo de notificaciones
│   │   │   ├── prestamoController.js     # Solicitud, aprobación, devolución de préstamos
│   │   │   └── usuarioController.js      # CRUD administrativo de usuarios
│   │   ├── database/
│   │   │   └── pool.js                   # Configuración del Pool de PostgreSQL
│   │   ├── events/
│   │   │   └── sse.js                    # Gestor de conexiones y emisión de Server-Sent Events
│   │   ├── jobs/
│   │   │   └── vencimientos.js           # Cron job para detección de mora y avisos preventivos
│   │   ├── middleware/
│   │   │   └── auth.js                   # Middleware JWT y control de acceso basado en roles (RBAC)
│   │   ├── routes/                       # Definición de rutas y mapeo de endpoints
│   │   │   ├── auth.js
│   │   │   ├── comunicados.js
│   │   │   ├── equipos.js
│   │   │   ├── eventos.js
│   │   │   ├── horario.js
│   │   │   ├── incidencias.js
│   │   │   ├── indicadores.js
│   │   │   ├── notificaciones.js
│   │   │   ├── prestamos.js
│   │   │   └── usuarios.js
│   │   ├── services/                     # Capa de lógica de negocio pura y consultas SQL
│   │   │   ├── authService.js
│   │   │   ├── comunicadoService.js
│   │   │   ├── equipoService.js
│   │   │   ├── horarioService.js
│   │   │   ├── incidenciaService.js
│   │   │   ├── indicadorService.js
│   │   │   ├── notificacionService.js
│   │   │   ├── prestamoService.js
│   │   │   └── usuarioService.js
│   │   └── app.js                        # Punto de entrada Express y registro de rutas/cron
│   ├── .env.example                      # Plantilla de variables de entorno del backend
│   └── package.json                      # Dependencias (express, pg, bcryptjs, jsonwebtoken, etc.)
│
├── database/                             # Persistencia y base de datos relacional
│   ├── migrations/
│   │   └── 001_initial_schema.sql        # Esquema DDL completo (10 tablas, restricciones e índices)
│   └── seeds/
│       └── 001_seed_data.sql             # Inserción de datos iniciales de prueba y demostración
│
├── frontend/                             # Cliente Web SPA
│   ├── src/
│   │   ├── App.jsx                       # Componente raíz
│   │   ├── main.jsx                      # Entrada Vite
│   │   ├── components/                   # Componentes de UI reutilizables
│   │   ├── context/                      # Contextos de autenticación y notificaciones
│   │   ├── hooks/                        # Custom hooks (e.g. useSSE, useAuth)
│   │   ├── pages/                        # Vistas por perfil
│   │   ├── services/                     # Cliente de API Axios/Fetch
│   │   └── utils/                        # Funciones utilitarias
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── docs/                                 # Documentación y especificaciones técnicas
    ├── ESPECIFICACIONES.md               # Documento original de especificaciones de SCOA
    ├── api/                              # Esquemas de API
    ├── architecture/                     # Diagramas arquitectónicos
    └── diagrams/                         # Flujos y diagramas de estado
```

---

## ⚙️ Funcionalidades y Módulos Desarrollados

### 4.1. Base de Datos y Persistencia (PostgreSQL 16)
Se diseñó un esquema relacional estricto en [`database/migrations/001_initial_schema.sql`](file:///home/juju/Proyectos/SCOA/database/migrations/001_initial_schema.sql) que garantiza integridad referencial y previene inconsistencias:
- **`usuarios`**: Almacena credenciales, perfiles (`alumno`, `maestro`, `directivo`), matrícula/número de control, carrera y semestre.
- **`grupos`** y **`grupo_alumnos`**: Modelado de grupos escolares asignados a un maestro y tabla puente para la relación muchos a muchos con los alumnos matriculados.
- **`horarios`**: Registro de sesiones de clase con validación `hora_fin > hora_inicio` y días de la semana (1-7).
- **`equipos`**: Inventario de activos con campos `total` y `disponibles`, resguardado por la regla `CHECK (disponibles <= total AND disponibles >= 0)`.
- **`prestamos`**: Ciclo de vida completo del préstamo con campos de auditoría, aprobador, receptor y banderas de avisos preventivos.
- **`incidencias`**: Registro de fallas con clasificación de severidad (`baja`, `media`, `alta`, `critica`), referencia recursiva a incidencias previas para tracking de recurrencia y marcas temporales de reporte, resolución y cierre.
- **`comunicados`**: Emisión institucional con almacenamiento de filtros de destinatarios en formato `JSONB` e índice especializado GIN.
- **`notificaciones`**: Bandeja de entrada interna vinculable a entidades (`prestamo`, `incidencia`, `comunicado`).
- **`bitacora`**: Registro de trazabilidad y auditoría de eventos críticos.

---

### 4.2. Autenticación, Sesiones y Seguridad (JWT + Bcrypt)
Implementado en [`backend/src/services/authService.js`](file:///home/juju/Proyectos/SCOA/backend/src/services/authService.js) y [`backend/src/middleware/auth.js`](file:///home/juju/Proyectos/SCOA/backend/src/middleware/auth.js):
- Generación de token JWT firmado con claims mínimos (`id`, `email`, `nombre`, `perfil`).
- Soporte dual para autenticación: lectura del encabezado estándar `Authorization: Bearer <token>` o extracción automática de la cookie HttpOnly `token`.
- Encriptación unidireccional de contraseñas mediante **Bcrypt** con factor de costo de 10 rondas.
- Middleware de autorización por perfil (`autorizar('directivo')`, `autorizar('maestro', 'directivo')`).
- Validación de usuarios inactivos o suspendidos con bloqueo inmediato de peticiones.

---

### 4.3. Gestión de Préstamos y Control de Concurrencia (FSM)
Implementado en [`backend/src/services/prestamoService.js`](file:///home/juju/Proyectos/SCOA/backend/src/services/prestamoService.js):
- **Máquina de Estados Finita (FSM)**:
  ```text
  [solicitado] ──► [aprobado] ──► [activo] ──► [devuelto]
       │               │             │
       ▼               ▼             ▼
  [rechazado]     [cancelado]    [vencido] ──► [extraviado]
  [cancelado]                        │
                                     ▼
                                 [devuelto]
  ```
- **Control de Concurrencia Pesimista (`SELECT ... FOR UPDATE`)**:
  Al momento de aprobar una solicitud, el backend abre una transacción (`BEGIN`), bloquea la fila del préstamo y la fila del equipo en PostgreSQL, valida que existan unidades disponibles (`disponibles > 0`) y descuenta el stock de manera atómica (`disponibles = disponibles - 1`). Si dos maestros intentan aprobar simultáneamente para la última unidad disponible, una transacción espera a la otra y la segunda recibe un rechazo limpio con código HTTP 409 (Conflicto), impidiendo la sobreasignación de equipo.
- **Devoluciones Atómicas**:
  Al registrar la devolución (`devuelto`), se reingresa la unidad al inventario disponible (`disponibles = disponibles + 1`) dentro de la misma transacción.

---

### 4.4. Gestión de Incidencias de Infraestructura (FSM)
Implementado en [`backend/src/services/incidenciaService.js`](file:///home/juju/Proyectos/SCOA/backend/src/services/incidenciaService.js):
- Flujo estricto de transiciones:
  `reportada` ➔ `en_revision` ➔ `asignada` ➔ `resuelta` ➔ `cerrada` (o `rechazada` con motivo documentado).
- Posibilidad de reabrir una incidencia si el problema persiste tras el intento de resolución (`resuelta` ➔ `asignada`).
- Vinculación histórica: Si un desperfecto es recurrente, se asocia `incidencia_previa_id` para trazabilidad de mantenimiento.
- Privacidad de consulta: Los alumnos y maestros consultan sus reportes; los directivos gestionan y asignan cualquier incidencia.

---

### 4.5. Eventos en Tiempo Real (Server-Sent Events)
Implementado en [`backend/src/events/sse.js`](file:///home/juju/Proyectos/SCOA/backend/src/events/sse.js) y [`backend/src/routes/eventos.js`](file:///home/juju/Proyectos/SCOA/backend/src/routes/eventos.js):
- Endpoint persistente `GET /api/eventos` bajo el estándar SSE (`Content-Type: text/event-stream`).
- Mecanismo de **Heartbeat** cada 30 segundos (`:keepalive\n\n`) para mantener el canal abierto a través de proxies y cortafuegos.
- Mapeo de conexiones por usuario (`Map<userId, Set<Response>>`), lo que permite múltiples pestañas abiertas por un mismo usuario.
- Limpieza automática de recursos ante el evento `close` del cliente.
- Disparo de eventos en vivo para:
  - `prestamo_solicitado` (alerta al maestro del grupo)
  - `prestamo_aprobado` / `prestamo_rechazado` (alerta al alumno solicitante)
  - `prestamo_vencido` (alerta al alumno y monitores)
  - `comunicado` (alerta instantánea a la población objetivo)

---

### 4.6. Proceso Programado de Vencimientos (Node-Cron)
Implementado en [`backend/src/jobs/vencimientos.js`](file:///home/juju/Proyectos/SCOA/backend/src/jobs/vencimientos.js):
- Tarea programada en segundo plano con expresión cron `0 * * * *` (se ejecuta al minuto 0 de cada hora).
- **Marcado automático de mora**: Transiciona automáticamente préstamos en estado `activo` a `vencido` cuando `fecha_devolucion_comprometida < NOW()`.
- **Avisos Preventivos con Idempotencia**:
  - Alerta de 24 horas (`fecha_devolucion_comprometida <= NOW() + INTERVAL '24 hours'`).
  - Alerta de 12 horas urgente (`fecha_devolucion_comprometida <= NOW() + INTERVAL '12 hours'`).
  - Uso de campos booleanos (`aviso_24h_enviado`, `aviso_12h_enviado`) en la base de datos para garantizar que el alumno **reciba exactamente un aviso**, sin importar cuántas veces corra el proceso.

---

### 4.7. Indicadores Administrativos (KPIs)
Implementado en [`backend/src/services/indicadorService.js`](file:///home/juju/Proyectos/SCOA/backend/src/services/indicadorService.js):
Exclusivo para el perfil directivo mediante `GET /api/indicadores`:
1. **Tiempo mediano de resolución de incidencias**:
   Calculado con precisión estadística mediante la función PostgreSQL `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ...)`.
2. **Distribución de incidencias abiertas por antigüedad**:
   Segmentadas en `< 24 horas`, `1 a 3 días` y `más de 3 días` para alertar sobre estancamientos operativos.
3. **Equipos en mora**:
   Total de unidades no devueltas en la fecha establecida, listando el alumno responsable y las horas de retraso acumuladas.
4. **Tasa de uso de inventario**:
   Porcentaje de activos en préstamo contra el stock total del laboratorio.

---

### 4.8. Comunicados y Notificaciones
- **Comunicados** ([`backend/src/services/comunicadoService.js`](file:///home/juju/Proyectos/SCOA/backend/src/services/comunicadoService.js)):
  Permite al cuerpo directivo emitir avisos globales o segmentados por `perfil` (e.g. solo maestros), `carrera`, `semestre` o `grupo_id`. El servicio resuelve dinámicamente la lista de usuarios y crea notificaciones individuales e impulsos SSE.
- **Notificaciones** ([`backend/src/services/notificacionService.js`](file:///home/juju/Proyectos/SCOA/backend/src/services/notificacionService.js)):
  Buzón con soporte para marcar lecturas individuales o globales (`PUT /api/notificaciones/marcar-todas`) y badge de no leídas (`GET /api/notificaciones/no-leidas/conteo`).

---

### 4.9. Horarios y Gestión de Usuarios
- **Horarios** ([`backend/src/services/horarioService.js`](file:///home/juju/Proyectos/SCOA/backend/src/services/horarioService.js)):
  El endpoint `GET /api/horario` filtra automáticamente el contexto: el alumno solo ve sus asignaturas matriculadas; el maestro ve los horarios de sus grupos a cargo; el directivo puede visualizar la totalidad de la carga horaria.
- **Usuarios** ([`backend/src/services/usuarioService.js`](file:///home/juju/Proyectos/SCOA/backend/src/services/usuarioService.js)):
  Panel directivo para listar usuarios con paginación, registrar nuevos miembros con contraseñas hasheadas y suspender cuentas mediante baja lógica (`activo = false`).

---

## 📡 Catálogo Completo de Endpoints (API REST)

Todas las rutas están prefijadas por `/api`. La mayoría de los endpoints requieren autenticación (indicada en la columna de roles).

### Autenticación (`/api/auth`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Público | Autentica credenciales y emite token JWT y cookie |
| `POST` | `/api/auth/logout` | Autenticado | Limpia la cookie de sesión |
| `GET` | `/api/auth/perfil` | Autenticado | Devuelve datos del usuario actualmente autenticado |

### Préstamos (`/api/prestamos`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/prestamos` | Todos (Filtrado) | Lista préstamos según el rol y grupo del usuario |
| `POST` | `/api/prestamos` | Alumno | Crea una nueva solicitud de préstamo |
| `PUT` | `/api/prestamos/:id/aprobar` | Maestro | Aprueba solicitud y reserva inventario (`FOR UPDATE`) |
| `PUT` | `/api/prestamos/:id/rechazar` | Maestro | Rechaza solicitud indicando motivo obligatorio |
| `PUT` | `/api/prestamos/:id/devolucion` | Maestro, Directivo | Registra la entrega y restituye stock disponible |
| `PUT` | `/api/prestamos/:id/cancelar` | Alumno | Cancela solicitud previa a la entrega |

### Incidencias (`/api/incidencias`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/incidencias` | Todos (Filtrado) | Lista incidencias (propias para alumnos/maestros; todas para directivo) |
| `POST` | `/api/incidencias` | Todos | Reporta una nueva anomalía o falla técnica |
| `PUT` | `/api/incidencias/:id/estado` | Directivo | Cambia estado (`en_revision`, `asignada`, `resuelta`, `cerrada`, `rechazada`) |

### Catálogo de Equipos (`/api/equipos`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/equipos` | Todos | Consulta equipos activos y unidades disponibles |
| `GET` | `/api/equipos/:id` | Todos | Obtiene la ficha técnica de un equipo |
| `POST` | `/api/equipos` | Directivo | Da de alta un nuevo tipo de equipo en inventario |
| `PUT` | `/api/equipos/:id` | Directivo | Actualiza especificaciones o cantidad de unidades |
| `DELETE` | `/api/equipos/:id` | Directivo | Baja lógica del equipo (`activo = false`) |

### Comunicados (`/api/comunicados`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/comunicados` | Todos | Lista comunicados vigentes aplicables al usuario |
| `POST` | `/api/comunicados` | Directivo | Emite un nuevo comunicado con segmentación |

### Horarios (`/api/horario`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/horario` | Autenticado | Devuelve la parrilla de horarios según el rol del usuario |

### Indicadores Administrativos (`/api/indicadores`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/indicadores` | Directivo | Métricas de resolución, antigüedad, mora y uso de inventario |

### Gestión de Usuarios (`/api/usuarios`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/usuarios` | Directivo | Directorio paginado de usuarios con filtros |
| `POST` | `/api/usuarios` | Directivo | Registra un nuevo alumno, maestro o directivo |
| `PUT` | `/api/usuarios/:id` | Directivo | Modifica información o estado de una cuenta |

### Notificaciones y Eventos (`/api/notificaciones` & `/api/eventos`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/notificaciones` | Autenticado | Obtiene notificaciones personales |
| `GET` | `/api/notificaciones/no-leidas/conteo` | Autenticado | Contador para insignias de la barra de navegación |
| `PUT` | `/api/notificaciones/:id/leer` | Autenticado | Marca notificación como leída |
| `PUT` | `/api/notificaciones/marcar-todas` | Autenticado | Marca todas las notificaciones como leídas |
| `GET` | `/api/eventos` | Autenticado | Canal SSE para recepción de eventos en vivo |
| `GET` | `/api/health` | Público | Comprobación de estado operativo del servidor |

---

## 👥 Roles y Matriz de Permisos

| Recurso / Acción | Alumno | Maestro | Directivo |
| :--- | :---: | :---: | :---: |
| **Consultar Horarios** | Solo el propio | Solo de sus grupos | Catálogo institucional completo |
| **Catálogo de Equipos** | Solo lectura | Solo lectura | Crear, editar y dar de baja |
| **Solicitud de Préstamo** | Solicitar y cancelar | — | — |
| **Aprobar / Rechazar Préstamos** | — | Aprobar / rechazar de sus grupos | — |
| **Registrar Devolución** | — | Permitido | Permitido |
| **Reportar Incidencias** | Permitido | Permitido | Permitido |
| **Gestionar y Asignar Incidencias** | — | — | Control total |
| **Publicar Comunicados** | — | — | Permitido |
| **Panel de Indicadores (KPIs)** | — | — | Acceso exclusivo |
| **Administración de Usuarios** | — | — | Control total |

---

## 🚀 Guía de Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js** v20.x o superior
- **PostgreSQL** 16.x en ejecución
- Gestor de paquetes **npm**

### 1. Clonar el repositorio y configurar variables de entorno
```bash
git clone https://github.com/julioguerrero26/SCOA.git
cd SCOA/backend
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales locales de PostgreSQL:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/scoa
JWT_SECRET=clave_secreta_para_firmar_tokens_scoa_2026
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
```

### 2. Preparar la Base de Datos
Crea la base de datos en PostgreSQL:
```bash
createdb -U postgres scoa
```

Aplica la migración de tablas y carga los datos de prueba iniciales:
```bash
# 1. Crear tablas, índices y restricciones
psql -U postgres -d scoa -f ../database/migrations/001_initial_schema.sql

# 2. Cargar datos semilla
psql -U postgres -d scoa -f ../database/seeds/001_seed_data.sql
```

### 3. Instalar Dependencias y Arrancar el Backend
```bash
cd backend
npm install
npm run dev
```

El servidor quedará disponible en:
```text
🏫 SCOA Backend ejecutándose en puerto 3000
📡 API disponible en http://localhost:3000/api
⏰ Cron de vencimientos configurado (cada hora)
```

Puedes verificar el estado con:
```bash
curl http://localhost:3000/api/health
# {"status":"ok","service":"SCOA Backend","timestamp":"..."}
```

---

## 🧪 Datos Semilla y Credenciales de Prueba

La base de datos incluye cuentas precargadas en [`database/seeds/001_seed_data.sql`](file:///home/juju/Proyectos/SCOA/database/seeds/001_seed_data.sql) para realizar pruebas inmediatas de cada perfil:

| Perfil | Nombre | Correo Electrónico | Contraseña por Defecto |
| :--- | :--- | :--- | :--- |
| **Directivo** | Carlos Hernández López | `director@scoa.edu.mx` | `password123` |
| **Maestro** | María García Ramírez | `maestro1@scoa.edu.mx` | `password123` |
| **Maestro** | José Martínez Díaz | `maestro2@scoa.edu.mx` | `password123` |
| **Alumno** | Ana López Torres | `alumno1@scoa.edu.mx` | `password123` |
| **Alumno** | Pedro Rodríguez Sánchez | `alumno2@scoa.edu.mx` | `password123` |
| **Alumno** | Lucía Fernández Morales | `alumno3@scoa.edu.mx` | `password123` |

> *Nota: Al registrar nuevos usuarios mediante `POST /api/usuarios`, las contraseñas se hashean automáticamente con bcrypt.*

---

## 🔮 Próximos Pasos (Frontend y PWA)

Con la base de datos, lógica de negocio y API REST completadas al 100%, las siguientes actividades en el plan de trabajo comprenden:
1. **Conexión de Vistas en React 18**:
   - Implementación de páginas de Login, Panel de Alumno (solicitud de préstamo y horario), Panel de Maestro (aprobación/rechazo de solicitudes) y Dashboard de Directivo (KPIs e inventario).
2. **Consumo del Stream de Eventos SSE**:
   - Creación del custom hook `useSSE` en frontend para refrescar el estado de solicitudes y mostrar notificaciones "toast" en tiempo real sin recargar la página.
3. **App Shell y Service Worker (PWA)**:
   - Configuración de cacheo de recursos estáticos y visualización offline del último horario descargado.

---

## 👨‍💻 Equipo de Desarrollo

**Ingeniería en Sistemas Computacionales**  
**Instituto Tecnológico Superior de Poza Rica (ITSPR)**  
*Quinto Semestre*

- **Julio César Nochebuena Guerrero**
- **Annia Gisselle Velázquez Pablo**
- **Joana Naire Vera Rivera**
- **Omar Ali Ramos Ramos**
- **Sara Ramírez Hernández**

---

## ⚖️ Licencia

Proyecto desarrollado con fines académicos bajo los lineamientos institucionales del ITSPR. Consulta el archivo [LICENSE](file:///home/juju/Proyectos/SCOA/LICENSE) para más detalles.
