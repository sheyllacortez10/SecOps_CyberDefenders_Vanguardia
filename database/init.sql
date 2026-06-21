-- SecOps Academy - Database Schema & Seeds

-- Habilitar extensión
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla vulnerabilidades
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owasp_category VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    cwe_id VARCHAR(20)
);

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla labs 
CREATE TABLE IF NOT EXISTS labs (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    owasp_ref VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    points INTEGER NOT NULL DEFAULT 100,
    theory TEXT NOT NULL,
    vulnerable_code TEXT NOT NULL,
    vulnerability_id VARCHAR(50) REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla actividades
CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(50) PRIMARY KEY,
    lab_id VARCHAR(50) REFERENCES labs(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('multiple_choice', 'line_selection', 'fill_in', 'order_steps')),
    question TEXT NOT NULL,
    options JSONB, 
    validation_strategy VARCHAR(30) NOT NULL CHECK (validation_strategy IN ('exact_match', 'keyword_match', 'predefined_list')),
    correct_answer JSONB NOT NULL, 
    explanation TEXT
);

-- Tabla attempts
CREATE TABLE IF NOT EXISTS attempts (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    lab_id VARCHAR(50) REFERENCES labs(id) ON DELETE CASCADE,
    activity_id VARCHAR(50) REFERENCES activities(id) ON DELETE CASCADE,
    answer JSONB NOT NULL,
    correct BOOLEAN NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla progreso
CREATE TABLE IF NOT EXISTS user_progress (
    user_id VARCHAR(100) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    completed_labs INTEGER NOT NULL DEFAULT 0
);

-- Tabla badges
CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon_url VARCHAR(255)
);

-- Tabla user_badges
CREATE TABLE IF NOT EXISTS user_badges (
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) REFERENCES badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);

-- Seeds
-- Admin: admin@secops.com / Contraseña: AdminPass123!
-- Estudiante: estudiante@secops.com / Contraseña: StudentPass123!
INSERT INTO users (id, name, email, password_hash, role)
VALUES 
('user-admin-1', 'Administrador SecOps', 'admin@secops.com', '$2b$10$r99y4b0oGZ.G26f25nE3Se6rTfB0j9L1q6T0xO1sA1N6sB1i6f1O2', 'admin'),
('user-student-1', 'Estudiante de Prueba', 'estudiante@secops.com', '$2b$10$v7g9H6sO2rT6xO1sA1N6sB1i6f1O2r99y4b0oGZ.G26f25nE3Se', 'student')
ON CONFLICT (id) DO NOTHING;

-- Progreso del estudiante de prueba
INSERT INTO user_progress (user_id, total_points, completed_labs)
VALUES ('user-student-1', 0, 0)
ON CONFLICT (user_id) DO NOTHING;

-- Vulnerabilidades
INSERT INTO vulnerabilities (id, name, owasp_category, severity, cwe_id)
VALUES 
('vuln-sqli', 'SQL Injection', 'A03:2021-Injection', 'critical', 'CWE-89'),
('vuln-xss', 'Cross-Site Scripting (XSS)', 'A03:2021-Injection', 'high', 'CWE-79'),
('vuln-broken-auth', 'Broken Authentication', 'A01:2021-Broken Access Control', 'high', 'CWE-287')
ON CONFLICT (id) DO NOTHING;

-- Insignias
INSERT INTO badges (id, name, description, category, icon_url)
VALUES 
('badge-injection', 'Defensor contra Inyecciones', 'Completaste todos los laboratorios de la categoría Injection.', 'injection', '/assets/badges/injection.png'),
('badge-xss', 'Guardián del Frontend', 'Completaste todos los laboratorios de la categoría XSS.', 'xss', '/assets/badges/xss.png'),
('badge-auth', 'Maestro de Autenticación', 'Completaste todos los laboratorios de la categoría Autenticación.', 'auth', '/assets/badges/auth.png'),
('badge-authentication', 'Maestro de Autenticación', 'Completaste todos los laboratorios de la categoría Autenticación.', 'authentication', '/assets/badges/auth.png')
ON CONFLICT (id) DO NOTHING;

-- Laboratorios
INSERT INTO labs (id, title, description, category, owasp_ref, difficulty, points, theory, vulnerable_code, vulnerability_id)
VALUES (
    'lab-001',
    'SQL Injection en formulario de login',
    'Aprende a identificar y prevenir inyecciones SQL en consultas dinámicas de login.',
    'injection',
    'A03:2021',
    'beginner',
    100,
    'La inyección SQL ocurre cuando datos proporcionados por el usuario se concatenan directamente en la consulta SQL, permitiendo a un atacante alterar la estructura de la consulta original y ejecutar comandos arbitrarios en la base de datos.',
    'const query = `SELECT * FROM users WHERE email = ''${email}'' AND password = ''${password}''`;',
    'vuln-sqli'
)
ON CONFLICT (id) DO NOTHING;

-- Actividades
INSERT INTO activities (id, lab_id, type, question, options, validation_strategy, correct_answer, explanation)
VALUES 
(
    'act-001',
    'lab-001',
    'multiple_choice',
    '¿Cuál es la vulnerabilidad principal en el código vulnerable del login?',
    '["Falta de HTTPS en el formulario", "Concatenación directa de variables en la consulta SQL", "Uso de cookies inseguras para la sesión"]'::jsonb,
    'predefined_list',
    '"Concatenación directa de variables en la consulta SQL"'::jsonb,
    'Concatenar variables de entrada de usuario directamente en la cadena SQL cambia la estructura de la consulta si la entrada contiene caracteres especiales como comillas simples ('''').'
),
(
    'act-002',
    'lab-001',
    'fill_in',
    'Completa el fragmento seguro utilizando el parámetro posicional para consultas parametrizadas en Node pg: SELECT * FROM users WHERE email = ______',
    NULL,
    'exact_match',
    '"$1"'::jsonb,
    'En el driver pg de Node.js, los marcadores de posición parametrizados se escriben como $1, $2, etc., indicando que el valor se enviará de forma segura y separada de la consulta SQL.'
)
ON CONFLICT (id) DO NOTHING;
