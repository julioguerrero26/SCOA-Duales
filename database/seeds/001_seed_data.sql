-- ============================================================
-- SCOA - Datos iniciales de prueba (Seeds)
-- ============================================================
-- Contraseñas hasheadas con bcrypt: "password123"
-- En producción se usaría bcrypt real, aquí usamos un hash de ejemplo

-- ============================================================
-- USUARIOS
-- ============================================================

-- Directivos
INSERT INTO usuarios (id, email, password_hash, nombre, apellido_paterno, apellido_materno, perfil) VALUES
('d1000000-0000-0000-0000-000000000001', 'director@scoa.edu.mx', '$2b$10$placeholder_hash_director_001', 'Carlos', 'Hernández', 'López', 'directivo');

-- Maestros
INSERT INTO usuarios (id, email, password_hash, nombre, apellido_paterno, apellido_materno, perfil) VALUES
('m1000000-0000-0000-0000-000000000001', 'maestro1@scoa.edu.mx', '$2b$10$placeholder_hash_maestro_001', 'María', 'García', 'Ramírez', 'maestro'),
('m1000000-0000-0000-0000-000000000002', 'maestro2@scoa.edu.mx', '$2b$10$placeholder_hash_maestro_002', 'José', 'Martínez', 'Díaz', 'maestro');

-- Alumnos
INSERT INTO usuarios (id, email, password_hash, nombre, apellido_paterno, apellido_materno, perfil, numero_control, carrera, semestre) VALUES
('a1000000-0000-0000-0000-000000000001', 'alumno1@scoa.edu.mx', '$2b$10$placeholder_hash_alumno_001', 'Ana', 'López', 'Torres', 'alumno', '20230001', 'Ingeniería en Sistemas Computacionales', 5),
('a1000000-0000-0000-0000-000000000002', 'alumno2@scoa.edu.mx', '$2b$10$placeholder_hash_alumno_002', 'Pedro', 'Rodríguez', 'Sánchez', 'alumno', '20230002', 'Ingeniería en Sistemas Computacionales', 5),
('a1000000-0000-0000-0000-000000000003', 'alumno3@scoa.edu.mx', '$2b$10$placeholder_hash_alumno_003', 'Lucía', 'Fernández', 'Morales', 'alumno', '20230003', 'Ingeniería Industrial', 3);

-- ============================================================
-- GRUPOS
-- ============================================================
INSERT INTO grupos (id, nombre, materia, maestro_id, carrera, semestre, periodo) VALUES
('g1000000-0000-0000-0000-000000000001', 'ISC-501', 'Base de Datos', 'm1000000-0000-0000-0000-000000000001', 'Ingeniería en Sistemas Computacionales', 5, '2025-1'),
('g1000000-0000-0000-0000-000000000002', 'ISC-502', 'Redes de Computadoras', 'm1000000-0000-0000-0000-000000000001', 'Ingeniería en Sistemas Computacionales', 5, '2025-1'),
('g1000000-0000-0000-0000-000000000003', 'IND-301', 'Estadística', 'm1000000-0000-0000-0000-000000000002', 'Ingeniería Industrial', 3, '2025-1');

-- ============================================================
-- GRUPO_ALUMNOS
-- ============================================================
INSERT INTO grupo_alumnos (grupo_id, alumno_id) VALUES
('g1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001'),
('g1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002'),
('g1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001'),
('g1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003');

-- ============================================================
-- HORARIOS
-- ============================================================
INSERT INTO horarios (grupo_id, dia_semana, hora_inicio, hora_fin, aula) VALUES
('g1000000-0000-0000-0000-000000000001', 1, '08:00', '10:00', 'Lab. Cómputo 1'),
('g1000000-0000-0000-0000-000000000001', 3, '08:00', '10:00', 'Lab. Cómputo 1'),
('g1000000-0000-0000-0000-000000000001', 5, '08:00', '10:00', 'Lab. Cómputo 1'),
('g1000000-0000-0000-0000-000000000002', 2, '10:00', '12:00', 'Lab. Redes'),
('g1000000-0000-0000-0000-000000000002', 4, '10:00', '12:00', 'Lab. Redes'),
('g1000000-0000-0000-0000-000000000003', 1, '14:00', '16:00', 'Aula 301'),
('g1000000-0000-0000-0000-000000000003', 3, '14:00', '16:00', 'Aula 301');

-- ============================================================
-- EQUIPOS
-- ============================================================
INSERT INTO equipos (id, nombre, descripcion, categoria, marca, modelo, total, disponibles) VALUES
('e1000000-0000-0000-0000-000000000001', 'Laptop Dell Inspiron', 'Laptop para prácticas de programación', 'laptop', 'Dell', 'Inspiron 15 3520', 10, 8),
('e1000000-0000-0000-0000-000000000002', 'Proyector Epson', 'Proyector para presentaciones', 'proyector', 'Epson', 'PowerLite E20', 5, 4),
('e1000000-0000-0000-0000-000000000003', 'Arduino Uno R3', 'Placa de desarrollo Arduino', 'microcontrolador', 'Arduino', 'Uno R3', 20, 18),
('e1000000-0000-0000-0000-000000000004', 'Multímetro Digital', 'Multímetro para prácticas de electrónica', 'instrumento', 'Fluke', '117', 15, 15),
('e1000000-0000-0000-0000-000000000005', 'Cable HDMI 3m', 'Cable HDMI de alta velocidad', 'cable', 'Generic', 'HDMI 2.0', 30, 28);
