# 🏫 Sistema Centralizado de Operaciones Académicas (SCOA)

![Estado](https://img.shields.io/badge/estado-MVP-orange)
![Frontend](https://img.shields.io/badge/frontend-React-61DAFB)
![Backend](https://img.shields.io/badge/backend-Node.js-339933)
![Base de datos](https://img.shields.io/badge/database-PostgreSQL%2016-336791)
![API](https://img.shields.io/badge/API-REST-02569B)
![Eventos](https://img.shields.io/badge/eventos-SSE-purple)
![Autenticación](https://img.shields.io/badge/auth-JWT-black)

> Sistema web para centralizar y digitalizar procesos académicos y operativos relacionados con préstamos de equipo, incidencias de infraestructura y consulta de información académica.

---

## 📖 Descripción

El **Sistema Centralizado de Operaciones Académicas (SCOA)** es un Producto Mínimo Viable (MVP) desarrollado para digitalizar procesos que actualmente pueden realizarse mediante bitácoras físicas, comunicación verbal o mensajería.

El sistema centraliza principalmente:

* 💻 Gestión de préstamos de equipo de laboratorio.
* 🛠️ Reporte y seguimiento de incidencias de infraestructura.
* 📅 Consulta del horario del alumno.
* 📢 Distribución de comunicados.
* 📈 Consulta de indicadores administrativos.

SCOA utiliza una arquitectura **monolítica de tres capas**, compuesta por un cliente web desarrollado con React, un servidor de aplicación desarrollado con Node.js y una base de datos PostgreSQL.

El sistema está diseñado para mantener las reglas de negocio en el backend y garantizar que la autorización se valide en el servidor independientemente de lo que muestre u oculte la interfaz.

---

# 🎯 Objetivos

## Objetivo general

Digitalizar y centralizar procesos académicos y operativos mediante una aplicación web que permita administrar préstamos de equipo, incidencias, comunicados y consultas académicas.

## Objetivos específicos

* Digitalizar las solicitudes y devoluciones de equipo.
* Mantener el inventario disponible actualizado.
* Evitar asignaciones simultáneas de una misma unidad disponible.
* Registrar el ciclo de vida completo de los préstamos.
* Registrar y dar seguimiento a incidencias.
* Notificar cambios relevantes mediante eventos en tiempo real.
* Proporcionar diferentes niveles de acceso según el perfil del usuario.
* Mostrar indicadores administrativos sobre incidencias e inventario.
* Mantener trazabilidad de las operaciones realizadas.

---

# 📌 Alcance del MVP

SCOA define tres perfiles de usuario:

| Perfil        | Descripción                                                             |
| ------------- | ----------------------------------------------------------------------- |
| 👨‍🎓 Alumno  | Consulta información académica y solicita equipo                        |
| 👨‍🏫 Maestro | Gestiona solicitudes de préstamo de sus grupos                          |
| 👔 Directivo  | Administra inventario, incidencias, comunicados, usuarios e indicadores |

Los perfiles son **fijos** y sus permisos están definidos en código.

El MVP no contempla un sistema dinámico para crear nuevos roles o modificar permisos desde la interfaz.

---

# 👥 Roles y permisos

| Recurso               | Alumno                  | Maestro                              | Directivo                     |
| --------------------- | ----------------------- | ------------------------------------ | ----------------------------- |
| Horario               | Leer propio             | Leer sus grupos                      | Leer todos                    |
| Catálogo de equipo    | Leer disponibilidad     | Leer                                 | Alta, edición y baja          |
| Solicitud de préstamo | Crear / cancelar propia | —                                    | —                             |
| Préstamo              | Leer propios            | Leer sus grupos / aprobar / rechazar | Leer todos                    |
| Devolución            | —                       | Registrar                            | Registrar                     |
| Incidencias           | Crear / leer propias    | Crear / leer propias                 | Leer todas / asignar / cerrar |
| Comunicados           | Leer dirigidos          | Leer dirigidos                       | Crear / leer todos            |
| Cuentas de usuario    | —                       | —                                    | Alta / edición / baja         |
| Indicadores           | —                       | —                                    | Leer                          |

### 🔐 Regla de autorización

El perfil del usuario determina **qué tipo de operaciones puede realizar**, pero no determina por sí solo qué registros puede consultar.

Por ejemplo, un maestro puede consultar únicamente información perteneciente a los grupos que tiene asignados.

La autorización se valida en el backend en cada petición.

```text
Usuario autenticado
       │
       ▼
   Middleware
       │
       ├── ¿Es maestro?
       │
       ▼
Regla de pertenencia
       │
       ├── grupo.maestro_id = usuario.id
       │
       ▼
   Datos permitidos
```

---

# 🏗️ Arquitectura

SCOA utiliza una arquitectura **monolítica de tres capas**.

```mermaid
flowchart TD
    U[Usuario]

    subgraph CLIENTE["Capa de Presentación"]
        R[React]
        PWA[PWA]
        SW[Service Worker]
    end

    subgraph SERVIDOR["Capa de Negocio"]
        API[Node.js API REST]
        AUTH[Autenticación JWT]
        SERVICES[Servicios / Reglas de negocio]
        SSE[SSE - Server Sent Events]
        CRON[Cron Job]
    end

    subgraph DATOS["Capa de Persistencia"]
        DB[(PostgreSQL 16)]
    end

    U --> R
    R --> PWA
    PWA --> API
    API --> AUTH
    AUTH --> SERVICES
    SERVICES --> DB

    SERVICES --> SSE
    SSE --> R

    CRON --> SERVICES
    CRON --> DB
```

## ¿Por qué monolito?

Se descarta una arquitectura de microservicios porque las operaciones principales requieren trabajar con varias entidades dentro de una misma transacción.

Por ejemplo, aprobar un préstamo implica actualizar:

```text
Solicitud
    +
Equipo
    +
Inventario
```

Estas operaciones deben ser atómicas.

Separarlas en diferentes servicios introduciría complejidad innecesaria mediante transacciones distribuidas, Sagas o mecanismos equivalentes.

Además:

* Existe un único equipo de desarrollo.
* Existe un único ciclo de despliegue.
* La escala esperada es del orden de cientos de usuarios concurrentes.
* El problema que resuelve SCOA no requiere separación física de servicios.

---

# 🖥️ Frontend

El frontend está desarrollado con:

* ⚛️ React
* 🌐 SPA (Single Page Application)
* 📱 PWA (Progressive Web App)
* 🔐 Autenticación mediante sesión basada en JWT
* 📡 Consumo de API REST
* 📢 Recepción de eventos mediante SSE

## Comportamiento offline

El Service Worker se limita a almacenar el **App Shell**:

* HTML base.
* CSS.
* JavaScript.
* Tipografías.
* Iconos.

Los datos académicos y operativos **no se almacenan en caché**.

Si no existe conexión, la aplicación muestra un aviso indicando que no hay conexión.

Esto evita mostrar información potencialmente desactualizada, especialmente:

* Calificaciones.
* Disponibilidad de equipos.
* Estado de préstamos.
* Estado de incidencias.

---

# ⚙️ Backend

El backend está desarrollado con **Node.js**.

Su responsabilidad principal es:

* Exponer la API REST.
* Validar autenticación.
* Validar autorización.
* Ejecutar reglas de negocio.
* Gestionar transacciones.
* Controlar las máquinas de estados.
* Gestionar inventario.
* Generar eventos SSE.
* Ejecutar procesos programados.

### Principio fundamental

> La interfaz no es una barrera de seguridad.

Ocultar un botón en React no impide que un usuario llame directamente al endpoint.

Por esta razón, todas las operaciones sensibles deben validarse en Node.js.

---

# 🗄️ Base de datos

SCOA utiliza:

**PostgreSQL 16**

La elección se basa principalmente en:

* Soporte para `JSONB`.
* Índices GIN.
* Restricciones `CHECK`.
* Llaves foráneas.
* Transacciones.
* Bloqueos de fila.

## Normalización

El esquema se normaliza hasta **Tercera Forma Normal (3NF)** para reducir:

* Redundancia.
* Anomalías de actualización.
* Duplicación de información.

La integridad referencial se garantiza mediante llaves foráneas.

Para relaciones históricas se utiliza:

```sql
ON DELETE RESTRICT
```

Por ejemplo, un equipo que posee préstamos históricos no se elimina físicamente; se marca como dado de baja.

---

# 🧩 Modelo de datos conceptual

El documento identifica las principales entidades utilizadas por el sistema:

```mermaid
erDiagram
    USUARIO
    GRUPO
    HORARIO
    CALIFICACION
    EQUIPO
    PRESTAMO
    INCIDENCIA
    COMUNICADO
    NOTIFICACION

    USUARIO ||--o{ PRESTAMO : solicita
    USUARIO ||--o{ INCIDENCIA : reporta
    USUARIO ||--o{ NOTIFICACION : recibe

    GRUPO ||--o{ PRESTAMO : relaciona
    GRUPO ||--o{ HORARIO : contiene
    GRUPO ||--o{ CALIFICACION : relaciona

    EQUIPO ||--o{ PRESTAMO : participa

    PRESTAMO ||--o{ NOTIFICACION : genera

    INCIDENCIA ||--o{ NOTIFICACION : genera

    COMUNICADO ||--o{ NOTIFICACION : genera
```

> **Nota:** este es un modelo conceptual. El documento técnico no especifica todos los atributos, llaves y cardinalidades definitivas del esquema físico. Antes de utilizarlo como diagrama oficial de la base de datos, debe contrastarse con las migraciones/modelos reales del proyecto.

---

# 💻 Gestión de préstamos

El préstamo de equipo se modela como una **máquina de estados finitos (FSM)**.

Estados:

```text
Solicitado
Aprobado
Rechazado
Cancelado
Activo
Vencido
Devuelto
Extraviado
```

## Diagrama de estados

```mermaid
stateDiagram-v2
    [*] --> Solicitado

    Solicitado --> Cancelado: Alumno
    Solicitado --> Rechazado: Maestro
    Solicitado --> Aprobado: Maestro

    Aprobado --> Activo: Entrega física
    Aprobado --> Cancelado: No recogido

    Activo --> Devuelto: Devolución
    Activo --> Vencido: Fecha comprometida superada

    Vencido --> Devuelto: Devolución
    Vencido --> Extraviado: Decisión administrativa

    Rechazado --> [*]
    Cancelado --> [*]
    Devuelto --> [*]
    Extraviado --> [*]
```

## Estados finales

Todo préstamo debe terminar en uno de los siguientes estados:

* `Rechazado`
* `Cancelado`
* `Devuelto`
* `Extraviado`

---

# 🔄 Flujo de solicitud de préstamo

```mermaid
sequenceDiagram
    actor Alumno
    participant React
    participant API as Node.js
    participant DB as PostgreSQL
    actor Maestro

    Alumno->>React: Solicitar equipo
    React->>API: POST /api/prestamos
    API->>API: Validar sesión
    API->>API: Validar reglas de negocio
    API->>DB: Crear solicitud
    DB-->>API: Solicitud creada
    API-->>React: 201 Created

    Maestro->>React: Consultar solicitudes
    React->>API: GET solicitudes
    API->>DB: Consultar solicitudes del grupo
    DB-->>API: Solicitudes
    API-->>React: Datos

    Maestro->>React: Aprobar solicitud
    React->>API: POST /api/prestamos/{id}/aprobar

    API->>DB: BEGIN
    API->>DB: SELECT ... FOR UPDATE
    API->>DB: Validar disponibilidad
    API->>DB: Reservar unidad
    API->>DB: Actualizar préstamo
    API->>DB: COMMIT

    API-->>React: 200 OK
```

---

# 🔒 Control de concurrencia

La reserva del inventario ocurre durante:

```text
Solicitado → Aprobado
```

La validación y decremento del inventario se ejecutan dentro de una misma transacción.

Se utiliza:

```sql
SELECT ... FOR UPDATE
```

para bloquear la fila correspondiente al equipo.

### Problema que se evita

Supongamos que queda una sola laptop:

```text
Disponibles = 1
```

Dos maestros aprueban simultáneamente dos solicitudes.

Sin bloqueo:

```text
Maestro A → lee 1
Maestro B → lee 1

Maestro A → reserva
Maestro B → reserva

Resultado:
Disponibles = -1 ❌
```

Con bloqueo:

```text
Maestro A → bloquea fila
Maestro B → espera

Maestro A → reserva última unidad
Maestro A → COMMIT

Maestro B → obtiene fila actualizada
Maestro B → detecta disponibles = 0
Maestro B → rechaza operación
```

Además, PostgreSQL mantiene una restricción:

```sql
CHECK (disponibles >= 0)
```

Esto funciona como una segunda barrera contra datos inválidos.

---

# ⏰ Avisos de vencimiento

Un proceso programado se ejecuta **cada hora**.

El proceso revisa préstamos en estado:

```text
Activo
```

y genera avisos cuando:

* 🟡 Faltan 24 horas o menos.
* 🔴 Faltan 12 horas o menos.

## Flujo

```mermaid
flowchart TD
    CRON[Cron cada hora]
    CHECK[Buscar préstamos Activos]
    TIME{¿Próximo a vencer?}
    24H[¿<= 24 horas?]
    12H[¿<= 12 horas?]
    N24[Generar aviso 24h]
    N12[Generar aviso 12h]
    SSE[Publicar evento SSE]
    END[Finalizar]

    CRON --> CHECK
    CHECK --> TIME

    TIME -->|No| END
    TIME -->|Sí| 24H

    24H -->|Sí| N24
    24H -->|No| END

    N24 --> SSE
    N24 --> 12H

    12H -->|Sí| N12
    12H -->|No| END

    N12 --> SSE
    SSE --> END
```

## Idempotencia

Cada préstamo mantiene dos indicadores:

```text
aviso_24h_enviado
aviso_12h_enviado
```

El proceso únicamente genera el aviso si la bandera correspondiente está en `false`.

Esto evita que el mismo aviso se envíe cada hora.

---

# 🛠️ Gestión de incidencias

Las incidencias utilizan una máquina de estados.

Estados:

```text
Reportada
En revisión
Asignada
Resuelta
Cerrada
Rechazada
```

## Diagrama

```mermaid
stateDiagram-v2
    [*] --> Reportada

    Reportada --> EnRevision: Directivo
    Reportada --> Rechazada: Directivo + motivo

    EnRevision --> Asignada: Asignar responsable

    Asignada --> Resuelta: Responsable / Directivo

    Resuelta --> Cerrada: Reportante confirma
    Resuelta --> Cerrada: Automático después de 7 días
    Resuelta --> Asignada: Reportante indica persistencia

    Cerrada --> [*]
    Rechazada --> [*]
```

### Regla importante

Una incidencia cerrada que vuelva a presentarse **no se reabre**.

Se registra una nueva incidencia que referencia a la anterior.

Esto mantiene la trazabilidad histórica.

---

# 📢 Eventos en tiempo real

SCOA utiliza:

**Server-Sent Events (SSE)**

en lugar de WebSockets.

## ¿Por qué SSE?

Los eventos que necesita SCOA son unidireccionales:

```text
Servidor ───────────► Cliente
```

Los principales eventos son:

* Avisos de vencimiento.
* Cambios de estado de incidencias.
* Comunicados.

El cliente continúa utilizando HTTP normal para enviar operaciones.

```mermaid
sequenceDiagram
    participant Client as React
    participant Server as Node.js
    participant DB as PostgreSQL

    Client->>Server: GET /api/eventos
    Server-->>Client: Conexión SSE

    DB->>Server: Cambio de estado
    Server-->>Client: event: incidencia_actualizada

    Server-->>Client: data: {...}

    DB->>Server: Nuevo comunicado
    Server-->>Client: event: comunicado

    Client->>Server: POST /api/incidencias/{id}/estado
    Server->>DB: Actualizar estado
```

## Reconexión

El navegador utiliza `EventSource`, que permite reconectar automáticamente cuando la conexión se interrumpe.

También se utiliza:

```text
Last-Event-ID
```

para recuperar eventos perdidos.

## Segmentación

Cada cliente conectado se asocia con el identificador del usuario.

Los comunicados se resuelven en el servidor a una lista de destinatarios y se publican únicamente en los canales correspondientes.

---

# 📡 API REST

La API utiliza HTTP y JSON.

## Códigos HTTP

| Código | Uso                 |
| ------ | ------------------- |
| `200`  | Operación exitosa   |
| `201`  | Recurso creado      |
| `400`  | Datos inválidos     |
| `401`  | Sin sesión          |
| `403`  | Sin permisos        |
| `404`  | Recurso inexistente |
| `409`  | Conflicto de estado |

---

## Endpoints

### 📅 Horario

```http
GET /api/horario
```

Obtiene el horario correspondiente al alumno.

---

### 📊 Calificaciones

```http
GET /api/calificaciones
```

Obtiene las calificaciones publicadas del semestre.

---

### 💻 Equipos

```http
GET /api/equipos?categoria=
```

Obtiene el catálogo de equipos y su disponibilidad.

---

### 📥 Crear préstamo

```http
POST /api/prestamos
```

Crea una solicitud de préstamo.

**Perfil:** Alumno.

---

### ✅ Aprobar préstamo

```http
POST /api/prestamos/{id}/aprobar
```

Aprueba una solicitud y reserva una unidad disponible.

**Perfil:** Maestro.

---

### ❌ Rechazar préstamo

```http
POST /api/prestamos/{id}/rechazar
```

Rechaza una solicitud.

**Perfil:** Maestro.

El motivo es obligatorio.

---

### 🔙 Registrar devolución

```http
POST /api/prestamos/{id}/devolver
```

Registra la devolución del equipo.

**Perfiles:** Maestro / Directivo.

---

### 🛠️ Consultar incidencias

```http
GET /api/incidencias
```

Devuelve las incidencias permitidas según el perfil del usuario.

---

### 🚨 Crear incidencia

```http
POST /api/incidencias
```

Registra una nueva incidencia.

**Perfiles:** Alumno / Maestro / Directivo.

---

### 🔄 Cambiar estado de incidencia

```http
PATCH /api/incidencias/{id}/estado
```

Actualiza el estado de una incidencia.

**Perfil:** Directivo.

---

### 📢 Crear comunicado

```http
POST /api/comunicados
```

Crea y distribuye un comunicado.

**Perfil:** Directivo.

---

### 📈 Indicadores

```http
GET /api/indicadores
```

Obtiene los indicadores del semestre.

**Perfil:** Directivo.

---

### 📡 Eventos

```http
GET /api/eventos
```

Establece la conexión SSE del usuario.

---

# 📊 Indicadores administrativos

El perfil directivo dispone de cuatro indicadores.

## 1. Tiempo de resolución de incidencias

Se calcula mediante:

```text
Mediana(
    timestamp(Resuelta)
    -
    timestamp(Reportada)
)
```

Se consideran únicamente horas hábiles:

```text
Lunes a viernes
08:00 - 18:00
```

Se utiliza la **mediana** en lugar del promedio para evitar que una incidencia excepcionalmente retrasada distorsione el indicador.

---

## 2. Incidencias abiertas por antigüedad

Las incidencias abiertas se agrupan en:

```text
< 24 horas
1 - 3 días
> 3 días
```

Se consideran abiertas las incidencias que no estén:

```text
Cerrada
Rechazada
```

---

## 3. Equipos en mora

Se consideran equipos en mora aquellos préstamos que:

```text
estado = Vencido
```

y cuya fecha comprometida de devolución ya pasó sin que exista una devolución registrada.

---

## 4. Tasa de uso del inventario

La tasa se calcula como:

```text
Unidades con préstamo activo
──────────────────────────── × 100
Unidades totales dadas de alta
```

El indicador se desglosa por categoría de equipo.

---

# 🔐 Autenticación

SCOA utiliza **JWT** para la sesión de usuario.

El JWT se transporta mediante una cookie con:

```text
HttpOnly
Secure
SameSite=Strict
```

No se almacena en `localStorage`.

## Vigencia

La sesión tiene una duración de:

```text
8 horas
```

El MVP no contempla:

* Refresh tokens.
* Revocación anticipada de tokens.

Cuando el token expira, el usuario debe autenticarse nuevamente.

### Consecuencia conocida

Si una cuenta se da de baja, las sesiones que ya estaban abiertas pueden permanecer activas hasta que expire su JWT.

---

# 🔑 Flujo de autenticación

```mermaid
sequenceDiagram
    actor Usuario
    participant React
    participant Node as Node.js
    participant DB as PostgreSQL

    Usuario->>React: Introduce credenciales
    React->>Node: POST /api/auth/login
    Node->>DB: Buscar usuario
    DB-->>Node: Usuario
    Node->>Node: Validar credenciales
    Node->>Node: Generar JWT
    Node-->>React: Set-Cookie HttpOnly
    React-->>Usuario: Sesión iniciada

    React->>Node: Petición protegida
    Node->>Node: Validar JWT
    Node->>Node: Validar permisos
    Node->>DB: Ejecutar operación
    DB-->>Node: Resultado
    Node-->>React: JSON
```

---

# 👔 Comunicados

El directivo puede crear comunicados y seleccionar destinatarios mediante filtros combinables:

* Carrera.
* Semestre.
* Grupo.
* Perfil de usuario.

## Flujo

```mermaid
flowchart LR
    D[Directivo]
    R[React]
    API[Node.js]
    DB[(PostgreSQL)]
    SSE[SSE]
    U[Usuarios conectados]

    D --> R
    R --> API
    API --> DB

    API -->|Resolver destinatarios| API
    API --> SSE
    SSE --> U

    DB -->|Comunicado almacenado| API
```

Los usuarios conectados reciben el comunicado mediante SSE.

Los usuarios que no estén conectados pueden consultarlo cuando vuelvan a entrar a la aplicación.

---

# 📁 Estructura propuesta del proyecto

La estructura exacta debe mantenerse alineada con el repositorio, pero conceptualmente se recomienda:

```text
scoa/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── database/
│   │   ├── events/
│   │   ├── jobs/
│   │   └── app.js
│   ├── package.json
│   └── .env.example
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── docs/
│   ├── architecture/
│   ├── diagrams/
│   └── api/
│
├── .gitignore
├── README.md
└── LICENSE
```

> Esta estructura es una propuesta de organización para el repositorio. Los nombres y carpetas deben ajustarse al código real del proyecto.

---

# 🚀 Instalación

## Requisitos

Antes de iniciar el proyecto se requiere:

* Node.js
* npm
* PostgreSQL 16
* Git

Comprobar instalaciones:

```bash
node --version
npm --version
psql --version
git --version
```

---

# 📥 Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd scoa
```

---

# ⚛️ Configuración del Frontend

Entrar al directorio:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Crear las variables de entorno requeridas por el proyecto.

Ejemplo:

```env
VITE_API_URL=http://localhost:3000
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

---

# 🟢 Configuración del Backend

Entrar al backend:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Crear el archivo:

```text
.env
```

Ejemplo conceptual:

```env
PORT=3000

DATABASE_URL=postgresql://usuario:password@localhost:5432/scoa

JWT_SECRET=tu_secreto
```

> Los nombres definitivos de las variables deben coincidir con las utilizadas por el backend real.

Iniciar:

```bash
npm run dev
```

---

# 🐘 Configuración de PostgreSQL

Crear la base de datos:

```sql
CREATE DATABASE scoa;
```

Después ejecutar las migraciones correspondientes al proyecto.

Ejemplo:

```bash
npm run migrate
```

Y, si existen datos iniciales:

```bash
npm run seed
```

> Los comandos anteriores dependen de los scripts definidos en `package.json`.

---

# 🧪 Pruebas

El sistema debe validar principalmente los escenarios de mayor riesgo identificados durante el diseño.

## Pruebas de máquinas de estados

### Préstamos

Verificar:

* Solicitud válida.
* Cancelación.
* Rechazo.
* Aprobación.
* Activación.
* Devolución.
* Vencimiento.
* Extravio.
* Transiciones inválidas.

### Incidencias

Verificar:

* Reportada → En revisión.
* En revisión → Asignada.
* Asignada → Resuelta.
* Resuelta → Cerrada.
* Resuelta → Asignada.
* Reportada → Rechazada.
* Transiciones no autorizadas.

---

# 🔥 Prueba de concurrencia

Debe comprobarse el escenario:

> Dos maestros intentan aprobar simultáneamente solicitudes cuando queda una sola unidad disponible.

Resultado esperado:

```text
Solicitud A → Aprobada
Solicitud B → Rechazada por falta de disponibilidad
```

Nunca:

```text
disponibles = -1
```

---

# 🔐 Pruebas de autorización

Cada endpoint protegido debe probarse con los tres perfiles.

Ejemplo:

```text
Alumno → aprobar préstamo ❌
Maestro → aprobar préstamo ✅
Directivo → aprobar préstamo ❌
```

También debe comprobarse la pertenencia por fila.

Ejemplo:

```text
Maestro A
   │
   ├── Grupo 1 ✅
   └── Grupo 2 ❌

Maestro B
   └── Grupo 2
```

El Maestro A no debe poder obtener información del Grupo 2 modificando manualmente la URL o los parámetros de la petición.

---

# 🧪 Matriz de pruebas de seguridad

```mermaid
flowchart TD
    REQUEST[Petición HTTP]
    SESSION{¿JWT válido?}
    ROLE{¿Perfil autorizado?}
    OWNER{¿Registro pertenece al usuario?}
    ACTION{¿Regla de negocio válida?}
    OK[Ejecutar operación]
    E401[401 Unauthorized]
    E403[403 Forbidden]
    E409[409 Conflict]
    E400[400 Bad Request]

    REQUEST --> SESSION

    SESSION -->|No| E401
    SESSION -->|Sí| ROLE

    ROLE -->|No| E403
    ROLE -->|Sí| OWNER

    OWNER -->|No| E403
    OWNER -->|Sí| ACTION

    ACTION -->|No| E409
    ACTION -->|Datos inválidos| E400
    ACTION -->|Sí| OK
```

---

# 📈 Flujo general del sistema

```mermaid
flowchart TD
    USER[Usuario]

    LOGIN[Inicio de sesión]
    AUTH[Autenticación JWT]

    USER --> LOGIN
    LOGIN --> AUTH

    AUTH --> ROLE{Perfil}

    ROLE --> ALUMNO[Alumno]
    ROLE --> MAESTRO[Maestro]
    ROLE --> DIRECTIVO[Directivo]

    ALUMNO --> CONSULTA[Consultar horario y calificaciones]
    ALUMNO --> SOLICITUD[Solicitar préstamo]
    ALUMNO --> INC1[Reportar incidencia]

    MAESTRO --> PRESTAMO[Aprobar / rechazar préstamo]
    MAESTRO --> DEV[Registrar devolución]
    MAESTRO --> INC2[Consultar incidencias propias]

    DIRECTIVO --> INV[Administrar inventario]
    DIRECTIVO --> INC3[Gestionar incidencias]
    DIRECTIVO --> COM[Crear comunicados]
    DIRECTIVO --> IND[Consultar indicadores]
    DIRECTIVO --> USERS[Administrar usuarios]

    SOLICITUD --> BACKEND[Node.js]
    PRESTAMO --> BACKEND
    DEV --> BACKEND
    INC1 --> BACKEND
    INC2 --> BACKEND
    INV --> BACKEND
    INC3 --> BACKEND
    COM --> BACKEND
    IND --> BACKEND
    USERS --> BACKEND

    BACKEND --> DB[(PostgreSQL 16)]
    BACKEND --> EVENTS[SSE]
    EVENTS --> ALUMNO
    EVENTS --> MAESTRO
    EVENTS --> DIRECTIVO
```

---

# 🔄 Ciclo completo de un préstamo

```mermaid
flowchart LR
    A[Solicitado]
    B[Aprobado]
    C[Activo]
    D[Devuelto]
    E[Vencido]
    F[Extraviado]
    G[Rechazado]
    H[Cancelado]

    A -->|Aprobar + reservar| B
    A -->|Rechazar| G
    A -->|Cancelar| H

    B -->|Entrega física| C
    B -->|No recogido| H

    C -->|Devolución| D
    C -->|Fecha superada| E

    E -->|Devolución| D
    E -->|Decisión administrativa| F
```

---

# 🛠️ Ciclo completo de una incidencia

```mermaid
flowchart LR
    A[Reportada]
    B[En revisión]
    C[Asignada]
    D[Resuelta]
    E[Cerrada]
    F[Rechazada]

    A -->|Revisar| B
    A -->|Rechazar + motivo| F
    B -->|Asignar responsable| C
    C -->|Resolver| D
    D -->|Confirmación| E
    D -->|7 días sin objeción| E
    D -->|Problema persiste| C
```

---

# ⏱️ Procesos programados

SCOA utiliza un proceso ejecutado mediante **cron del sistema operativo**.

```mermaid
flowchart TD
    CRON[Cron]
    JOB[Proceso de vencimientos]
    DB[(PostgreSQL)]
    RULES[Reglas de negocio]
    NOTIF[Crear notificación]
    SSE[Publicar SSE]

    CRON -->|Cada hora| JOB
    JOB --> DB
    JOB --> RULES
    RULES -->|Cumple umbral| NOTIF
    NOTIF --> DB
    NOTIF --> SSE
    SSE --> CLIENT[Cliente React]
```

No se utiliza una cola de mensajes en el MVP debido a que el volumen esperado no justifica su incorporación.

---

# 📦 Tecnologías

| Tecnología     | Uso                           |
| -------------- | ----------------------------- |
| React          | Interfaz web                  |
| Node.js        | Servidor de aplicación        |
| PostgreSQL 16  | Persistencia                  |
| REST           | Comunicación cliente-servidor |
| JSON           | Formato de datos              |
| JWT            | Autenticación                 |
| SSE            | Eventos en tiempo real        |
| Service Worker | App Shell de la PWA           |
| Cron           | Avisos programados            |
| Mermaid        | Diagramas de documentación    |

---

# 🔒 Consideraciones de seguridad

SCOA considera las siguientes medidas:

* JWT almacenado en cookie `HttpOnly`.
* Cookie `Secure`.
* Cookie `SameSite=Strict`.
* Autorización en backend.
* Restricción de acceso por perfil.
* Restricción de acceso por pertenencia a registros.
* Validación de reglas de negocio.
* Restricciones de integridad en PostgreSQL.
* Control de concurrencia mediante bloqueo de filas.
* Conservación histórica de préstamos e incidencias.

---

# ⚠️ Limitaciones conocidas del MVP

Actualmente el diseño establece las siguientes limitaciones:

### Notificaciones

Los avisos se muestran dentro de la aplicación.

El MVP **no contempla notificaciones push del sistema operativo cuando la aplicación está cerrada**.

### SSE

SSE mantiene una conexión persistente por sesión.

Sobre HTTP/1.1 existe un límite habitual de conexiones simultáneas por dominio, pero SCOA mantiene una sola conexión SSE por sesión.

### Sesiones

La baja de una cuenta no invalida inmediatamente los JWT existentes.

La sesión permanece válida hasta su expiración.

### Datos offline

No se almacenan datos académicos u operativos en IndexedDB.

Por lo tanto, el sistema no muestra calificaciones o disponibilidad de equipos cuando no existe conexión.

### Origen de horarios y calificaciones

El documento técnico identifica como una decisión pendiente el origen de estos datos.

Las alternativas consideradas son:

1. Integración con el sistema escolar existente.
2. Carga manual mediante CSV/Excel.
3. Eliminar horarios y calificaciones del alcance del MVP.

Esta decisión debe definirse antes de considerar completa esta funcionalidad.

---

# 📋 Requisitos no funcionales pendientes

El documento identifica la necesidad de definir métricas concretas para:

* Usuarios registrados.
* Usuarios concurrentes.
* Tamaño esperado del inventario.
* Incidencias por semestre.
* Tiempo objetivo de respuesta.
* Infraestructura de despliegue.
* Política de respaldos.

Evitar afirmaciones como:

```text
"El sistema es altamente escalable"
```

sin una métrica que permita demostrarlo.

---

# 🚀 Flujo de despliegue conceptual

```mermaid
flowchart LR
    DEV[Desarrollador]
    GIT[Repositorio Git]
    BUILD[Build Frontend]
    SERVER[Servidor Node.js]
    DB[(PostgreSQL 16)]
    USERS[Usuarios]

    DEV --> GIT
    GIT --> BUILD
    GIT --> SERVER

    SERVER --> DB
    USERS --> BUILD
    USERS --> SERVER
```

La estrategia concreta de despliegue, infraestructura, respaldos y publicación de versiones debe definirse de acuerdo con el entorno donde se instalará SCOA.

---

# 📝 Variables de entorno

Las variables definitivas dependen de la implementación del backend.

Ejemplo conceptual:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://usuario:password@localhost:5432/scoa

JWT_SECRET=secret
JWT_EXPIRES_IN=8h
```

Para el frontend:

```env
VITE_API_URL=http://localhost:3000
```

> Nunca se deben subir secretos reales al repositorio.

---

# 📊 Arquitectura de una petición

```mermaid
flowchart TD
    CLIENT[React]
    HTTP[HTTP Request]
    ROUTER[Router Node.js]
    AUTH[Middleware Auth]
    AUTHZ[Middleware Authorization]
    SERVICE[Service]
    TRANSACTION[Transacción]
    DB[(PostgreSQL)]
    RESPONSE[JSON Response]

    CLIENT --> HTTP
    HTTP --> ROUTER
    ROUTER --> AUTH

    AUTH -->|JWT inválido| ERROR401[401]
    AUTH -->|JWT válido| AUTHZ

    AUTHZ -->|Sin permiso| ERROR403[403]
    AUTHZ -->|Autorizado| SERVICE

    SERVICE --> TRANSACTION
    TRANSACTION --> DB
    DB --> TRANSACTION
    TRANSACTION --> SERVICE
    SERVICE --> RESPONSE
    RESPONSE --> CLIENT
```

---

# 📚 Decisiones de arquitectura

| Decisión             | Elección            | Motivo                                         |
| -------------------- | ------------------- | ---------------------------------------------- |
| Arquitectura         | Monolito de 3 capas | Menor complejidad para el alcance              |
| Frontend             | React               | SPA y PWA                                      |
| Backend              | Node.js             | Servidor de aplicación                         |
| Base de datos        | PostgreSQL 16       | JSONB, CHECK, transacciones y bloqueo de filas |
| API                  | REST                | Operaciones HTTP convencionales                |
| Eventos              | SSE                 | Comunicación unidireccional                    |
| Autenticación        | JWT                 | Gestión de sesión                              |
| Almacenamiento JWT   | Cookie HttpOnly     | Reducir exposición ante XSS                    |
| Cache de datos       | No                  | Evitar información académica desactualizada    |
| Roles                | Fijos en código     | Solo existen tres perfiles                     |
| Cola de mensajes     | No                  | No justificada por el volumen del MVP          |
| Procesos programados | Cron                | Implementación simple para avisos horarios     |

---

# ❌ Tecnologías/decisiones descartadas

## Microservicios

Se descartan por complejidad innecesaria y por la necesidad de transacciones que involucran múltiples entidades.

## WebSockets

Se descartan porque los eventos requeridos por SCOA son unidireccionales.

## IndexedDB para datos

Se descarta porque obligaría a definir políticas de expiración y reconciliación para información que puede cambiar.

## Sistema configurable de roles

Se descarta porque el MVP tiene únicamente tres perfiles estables.

## Cola de mensajes

Se descarta porque el volumen esperado no justifica la complejidad adicional.

---

# 📌 Estado del proyecto

### Implementado / definido

* [x] Alcance como MVP
* [x] Tres perfiles de usuario
* [x] Arquitectura monolítica de tres capas
* [x] React como frontend
* [x] Node.js como backend
* [x] PostgreSQL 16
* [x] API REST
* [x] Autenticación JWT
* [x] Autorización en backend
* [x] Máquina de estados para préstamos
* [x] Máquina de estados para incidencias
* [x] Control de concurrencia
* [x] Avisos de vencimiento
* [x] SSE
* [x] Indicadores administrativos
* [x] PWA / App Shell

### Pendiente de definir

* [ ] Origen de horarios
* [ ] Creación inicial de cuentas
* [ ] Proceso de baja de usuarios
* [ ] Esquema físico definitivo de base de datos
* [ ] Infraestructura de despliegue
* [ ] Política de respaldos
* [ ] Requisitos de rendimiento cuantificados
* [ ] Plan completo de pruebas
* [ ] Aviso de privacidad y tratamiento de datos personales

---

# 👨‍💻 Equipo

**Ingeniería en Sistemas Computacionales**
**Instituto Tecnológico Superior de Poza Rica**

| Integrante                      |
| ------------------------------- |
| Julio César Nochebuena Guerrero |
| Annia Gisselle Velázquez Pablo  |
| Joana Naire Vera Rivera         |
| Omar Ali Ramos Ramos            |
| Sara Ramirez Hernadez           |

---

# 🎓 Contexto académico

Proyecto correspondiente a:

```text
Ingeniería en Sistemas Computacionales
Instituto Tecnológico Superior de Poza Rica
Quinto semestre
```

---

# 📄 Documentación relacionada

La documentación técnica del proyecto contiene:

* Arquitectura.
* Especificaciones técnicas.
* Reglas de negocio.
* Máquinas de estados.
* Decisiones de persistencia.
* Seguridad.
* API.
* Procesos programados.
* Indicadores administrativos.

---

# ⚖️ Licencia

Este proyecto fue desarrollado con fines académicos.

La licencia definitiva debe establecerse de acuerdo con las condiciones de distribución definidas por el equipo y la institución.

---

# ⭐ SCOA

**Sistema Centralizado de Operaciones Académicas**

> Digitalizar procesos. Centralizar información. Mejorar la trazabilidad.

```text
React
   │
   ▼
Node.js
   │
   ▼
PostgreSQL 16
```

---
