-- ============================================================
-- SCOA - Sistema Centralizado de Operaciones Académicas
-- Migración inicial: Esquema completo de la base de datos
-- PostgreSQL 16
-- ============================================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: usuarios
-- Almacena los tres perfiles: alumno, maestro, directivo
-- ============================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_control VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('alumno', 'maestro', 'directivo')),
    carrera VARCHAR(100),
    semestre INTEGER CHECK (semestre BETWEEN 1 AND 13),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- ============================================================
-- TABLA: grupos
-- Grupos académicos asignados a un maestro
-- ============================================================
CREATE TABLE grupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL,
    materia VARCHAR(150) NOT NULL,
    maestro_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    carrera VARCHAR(100),
    semestre INTEGER CHECK (semestre BETWEEN 1 AND 13),
    periodo VARCHAR(20) NOT NULL, -- Ej: "2025-1"
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grupos_maestro ON grupos(maestro_id);
CREATE INDEX idx_grupos_periodo ON grupos(periodo);

-- ============================================================
-- TABLA: grupo_alumnos
-- Relación muchos a muchos entre grupos y alumnos
-- ============================================================
CREATE TABLE grupo_alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE RESTRICT,
    alumno_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    UNIQUE(grupo_id, alumno_id)
);

CREATE INDEX idx_grupo_alumnos_grupo ON grupo_alumnos(grupo_id);
CREATE INDEX idx_grupo_alumnos_alumno ON grupo_alumnos(alumno_id);

-- ============================================================
-- TABLA: horarios
-- Horarios de clase por grupo
-- ============================================================
CREATE TABLE horarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE RESTRICT,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    aula VARCHAR(50),
    CHECK (hora_fin > hora_inicio)
);

CREATE INDEX idx_horarios_grupo ON horarios(grupo_id);

-- ============================================================
-- TABLA: equipos
-- Catálogo de tipos de equipo con control de inventario
-- ============================================================
CREATE TABLE equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
    disponibles INTEGER NOT NULL DEFAULT 0 CHECK (disponibles >= 0),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (disponibles <= total)
);

CREATE INDEX idx_equipos_categoria ON equipos(categoria);
CREATE INDEX idx_equipos_activo ON equipos(activo);

-- ============================================================
-- TABLA: prestamos
-- Solicitudes y ciclo de vida de préstamos con FSM
-- ============================================================
CREATE TABLE prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT,
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE RESTRICT,
    estado VARCHAR(20) NOT NULL DEFAULT 'solicitado' 
        CHECK (estado IN ('solicitado', 'aprobado', 'rechazado', 'cancelado', 'activo', 'vencido', 'devuelto', 'extraviado')),
    motivo_solicitud TEXT,
    motivo_rechazo TEXT,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    fecha_devolucion_comprometida TIMESTAMP WITH TIME ZONE,
    fecha_devolucion_real TIMESTAMP WITH TIME ZONE,
    aprobado_por UUID REFERENCES usuarios(id),
    devuelto_a UUID REFERENCES usuarios(id),
    aviso_24h_enviado BOOLEAN DEFAULT false,
    aviso_12h_enviado BOOLEAN DEFAULT false,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prestamos_alumno ON prestamos(alumno_id);
CREATE INDEX idx_prestamos_equipo ON prestamos(equipo_id);
CREATE INDEX idx_prestamos_grupo ON prestamos(grupo_id);
CREATE INDEX idx_prestamos_estado ON prestamos(estado);

-- ============================================================
-- TABLA: incidencias
-- Reporte y seguimiento de incidencias de infraestructura
-- ============================================================
CREATE TABLE incidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    ubicacion VARCHAR(200),
    categoria VARCHAR(50),
    prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
    estado VARCHAR(20) NOT NULL DEFAULT 'reportada'
        CHECK (estado IN ('reportada', 'en_revision', 'asignada', 'resuelta', 'cerrada', 'rechazada')),
    reportada_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    asignada_a UUID REFERENCES usuarios(id),
    motivo_rechazo TEXT,
    incidencia_previa_id UUID REFERENCES incidencias(id),
    fecha_reporte TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_incidencias_estado ON incidencias(estado);
CREATE INDEX idx_incidencias_reportada_por ON incidencias(reportada_por);
CREATE INDEX idx_incidencias_asignada_a ON incidencias(asignada_a);

-- ============================================================
-- TABLA: comunicados
-- Comunicados emitidos por directivos
-- ============================================================
CREATE TABLE comunicados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    creado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    -- Filtros de destinatarios almacenados como JSONB
    filtro_destinatarios JSONB DEFAULT '{}',
    publicado BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comunicados_creado_por ON comunicados(creado_por);
CREATE INDEX idx_comunicados_filtro ON comunicados USING GIN (filtro_destinatarios);

-- ============================================================
-- TABLA: notificaciones
-- Notificaciones internas para usuarios
-- ============================================================
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT,
    referencia_tipo VARCHAR(50),  -- 'prestamo', 'incidencia', 'comunicado'
    referencia_id UUID,
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(usuario_id, leida);

-- ============================================================
-- TABLA: bitacora
-- Registro de trazabilidad de operaciones
-- ============================================================
CREATE TABLE bitacora (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id UUID,
    detalles JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bitacora_usuario ON bitacora(usuario_id);
CREATE INDEX idx_bitacora_entidad ON bitacora(entidad, entidad_id);
CREATE INDEX idx_bitacora_created ON bitacora(created_at);
