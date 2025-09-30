-- Populate Colombian holidays for years 2024-2026
-- This script adds the official Colombian holidays including movable holidays

-- Delete existing holidays for these years to avoid duplicates
DELETE FROM festivos_colombia WHERE fecha >= '2024-01-01' AND fecha <= '2026-12-31';

-- 2024 Holidays
INSERT INTO festivos_colombia (fecha, nombre, tipo) VALUES
('2024-01-01', 'Año Nuevo', 'fijo'),
('2024-01-08', 'Día de los Reyes Magos', 'movil'),
('2024-03-25', 'Día de San José', 'movil'),
('2024-03-28', 'Jueves Santo', 'movil'),
('2024-03-29', 'Viernes Santo', 'movil'),
('2024-05-01', 'Día del Trabajo', 'fijo'),
('2024-05-13', 'Ascensión del Señor', 'movil'),
('2024-06-03', 'Corpus Christi', 'movil'),
('2024-06-10', 'Sagrado Corazón de Jesús', 'movil'),
('2024-07-01', 'San Pedro y San Pablo', 'movil'),
('2024-07-20', 'Día de la Independencia', 'fijo'),
('2024-08-07', 'Batalla de Boyacá', 'fijo'),
('2024-08-19', 'Asunción de la Virgen', 'movil'),
('2024-10-14', 'Día de la Raza', 'movil'),
('2024-11-04', 'Todos los Santos', 'movil'),
('2024-11-11', 'Independencia de Cartagena', 'movil'),
('2024-12-08', 'Inmaculada Concepción', 'fijo'),
('2024-12-25', 'Navidad', 'fijo');

-- 2025 Holidays (already added in previous script, but ensuring completeness)
INSERT INTO festivos_colombia (fecha, nombre, tipo) VALUES
('2025-01-01', 'Año Nuevo', 'fijo'),
('2025-01-06', 'Día de los Reyes Magos', 'movil'),
('2025-03-24', 'Día de San José', 'movil'),
('2025-04-17', 'Jueves Santo', 'movil'),
('2025-04-18', 'Viernes Santo', 'movil'),
('2025-05-01', 'Día del Trabajo', 'fijo'),
('2025-06-02', 'Ascensión del Señor', 'movil'),
('2025-06-23', 'Corpus Christi', 'movil'),
('2025-06-30', 'Sagrado Corazón de Jesús', 'movil'),
('2025-06-30', 'San Pedro y San Pablo', 'movil'),
('2025-07-20', 'Día de la Independencia', 'fijo'),
('2025-08-07', 'Batalla de Boyacá', 'fijo'),
('2025-08-18', 'Asunción de la Virgen', 'movil'),
('2025-10-13', 'Día de la Raza', 'movil'),
('2025-11-03', 'Todos los Santos', 'movil'),
('2025-11-17', 'Independencia de Cartagena', 'movil'),
('2025-12-08', 'Inmaculada Concepción', 'fijo'),
('2025-12-25', 'Navidad', 'fijo');

-- 2026 Holidays
INSERT INTO festivos_colombia (fecha, nombre, tipo) VALUES
('2026-01-01', 'Año Nuevo', 'fijo'),
('2026-01-12', 'Día de los Reyes Magos', 'movil'),
('2026-03-23', 'Día de San José', 'movil'),
('2026-04-02', 'Jueves Santo', 'movil'),
('2026-04-03', 'Viernes Santo', 'movil'),
('2026-05-01', 'Día del Trabajo', 'fijo'),
('2026-05-18', 'Ascensión del Señor', 'movil'),
('2026-06-08', 'Corpus Christi', 'movil'),
('2026-06-15', 'Sagrado Corazón de Jesús', 'movil'),
('2026-06-29', 'San Pedro y San Pablo', 'movil'),
('2026-07-20', 'Día de la Independencia', 'fijo'),
('2026-08-07', 'Batalla de Boyacá', 'fijo'),
('2026-08-17', 'Asunción de la Virgen', 'movil'),
('2026-10-12', 'Día de la Raza', 'movil'),
('2026-11-02', 'Todos los Santos', 'movil'),
('2026-11-16', 'Independencia de Cartagena', 'movil'),
('2026-12-08', 'Inmaculada Concepción', 'fijo'),
('2026-12-25', 'Navidad', 'fijo');
