import React, { useState } from 'react';

type Role = 'student' | 'admin';
type View = 'auth' | 'dashboard' | 'lab';

export default function App() {
  const [view, setView] = useState<View>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [userName, setUserName] = useState('');

  // Estado del estudiante logueado
  const [user, setUser] = useState<{ name: string; email: string; role: Role } | null>(null);
  const [points, setPoints] = useState(0);
  const [completedLabs, setCompletedLabs] = useState(0);

  // Estados del laboratorio
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [simulationState, setSimulationState] = useState<'idle' | 'attack_success' | 'attack_blocked'>('idle');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const detectedRole: Role = email.includes('admin') ? 'admin' : 'student';
    const name = isRegister ? userName : (detectedRole === 'admin' ? 'Administrador SecOps' : 'Estudiante de Prueba');

    setUser({
      name,
      email,
      role: detectedRole
    });
    setView('dashboard');
  };

  const handleVerifyLab = () => {
    if (!selectedAnswer) return;

    if (selectedAnswer === 'B') {
      setCorrect(true);
      setFeedback('¡Correcto! Las consultas parametrizadas separan completamente la lógica de la query de los datos de entrada del usuario.');
      setPoints(100);
      setCompletedLabs(1);
      setSimulationState('attack_blocked');
    } else {
      setCorrect(false);
      setFeedback('Error: El ataque tuvo éxito. Al concatenar directamente la entrada, el motor de base de datos interpretó los datos como código ejecutable.');
      setSimulationState('attack_success');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('auth');
    setEmail('');
    setPassword('');
    setSelectedAnswer(null);
    setFeedback(null);
    setCorrect(null);
    setSimulationState('idle');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }} className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 700 }}>🛡️ SecOps Academy</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Plataforma Educativa de Ciberseguridad</p>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: user.role === 'admin' ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                Rol: {user.role === 'admin' ? 'ADMINISTRADOR' : 'ESTUDIANTE'}
              </span>
            </div>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleLogout}>
              Salir
            </button>
          </div>
        )}
      </header>

      {/* Vista Autenticación */}
      {view === 'auth' && (
        <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div className="card glow-blue" style={{ width: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>
            <form onSubmit={handleAuth}>
              {isRegister && (
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ana Gómez"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="ejemplo@secops.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Tip: escribe "admin@secops.com" para iniciar como administrador.
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="********"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                {isRegister ? 'Registrarse' : 'Ingresar'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'} &nbsp;
              <span
                style={{ color: 'var(--color-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? 'Inicia Sesión' : 'Regístrate aquí'}
              </span>
            </p>
          </div>
        </main>
      )}

      {/* Vista Dashboard */}
      {view === 'dashboard' && user && (
        <main>
          {user.role === 'admin' ? (
            /* Vista de Administrador */
            <div className="card animate-fade-in" style={{ borderLeft: '4px solid var(--color-danger)' }}>
              <h2 style={{ marginBottom: '1rem', color: 'var(--color-danger)' }}>Panel de Administración de Laboratorios</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Como administrador, puedes gestionar el catálogo de laboratorios interactivos y monitorear las métricas de la academia.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'rgba(255, 74, 90, 0.05)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Total Usuarios</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>320</p>
                </div>
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Laboratorios Activos</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>12</p>
                </div>
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Tasa de Éxito Promedio</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>63.6%</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={() => alert('Creación de Laboratorio - Endpoint POST /api/admin/labs simulado')}>
                  + Crear Nuevo Laboratorio
                </button>
                <button className="btn btn-secondary" onClick={() => alert('Ver Reportes de Estudiantes')}>
                  Ver Reporte Completo
                </button>
              </div>
            </div>
          ) : (
            /* Vista de Estudiante */
            <div className="animate-fade-in">
              {/* Progreso del Estudiante */}
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card glow-green">
                  <h3>Puntos de Defensa</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)', margin: '0.5rem 0' }}>{points} pts</p>
                  <span className="badge-unlocked">🛡️ Rango: Recluta SecOps</span>
                </div>
                <div className="card">
                  <h3>Progreso de Laboratorios</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{completedLabs} / 1</p>
                  <div style={{ background: 'rgba(255, 255, 255, 0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--color-secondary)', width: completedLabs > 0 ? '100%' : '0%', height: '100%', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
                <div className="card">
                  <h3>Insignias Obtenidas</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    {completedLabs > 0 ? (
                      <div className="badge-unlocked" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
                        🥇 Defensor de Inyecciones
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Completa tu primer laboratorio para obtener insignias.</span>
                    )}
                  </div>
                </div>
              </section>

              {/* Vista de Laboratorios */}
              <section>
                <h2 style={{ marginBottom: '1.5rem' }}>Catálogo de Laboratorios</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>

                  {/* Lab 1 */}
                  <div className="card glow-blue" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 600 }}>SQL INJECTION</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(0, 210, 255, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>Fácil</span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>SQL Injection en Formulario de Login</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Aprende cómo funciona la concatenación directa de parámetros y cómo mitigar ataques usando consultas parametrizadas.
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>+100 Puntos</span>
                      <button className="btn btn-primary" onClick={() => setView('lab')}>
                        {completedLabs > 0 ? 'Repasar Lab' : 'Iniciar Laboratorio'}
                      </button>
                    </div>
                  </div>

                </div>
              </section>
            </div>
          )}
        </main>
      )}

      {/* Vista de Consola del Laboratorio */}
      {view === 'lab' && (
        <main className="animate-fade-in">
          <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => setView('dashboard')}>
            ← Volver al Dashboard
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>

            {/* Panel de Teoría y Ejercicio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Teoría */}
              <div className="card">
                <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-secondary)' }}>Teoría del Ataque</h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  Las vulnerabilidades de inyección de código (como SQL Injection) ocurren cuando un desarrollador concatena
                  directamente variables que contienen inputs de usuarios en comandos dinámicos.
                  El motor de base de datos interpreta las comillas simples u operadores booleanos (como <code>' OR '1'='1</code>)
                  como comandos de control del sistema, no como texto simple.
                </p>
              </div>

              {/* Ejercicio Interactivo */}
              <div className="card glow-blue">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Actividad 1: Resolución</h3>
                <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
                  Revisa el código vulnerable a la derecha. ¿Cuál es la opción correcta para mitigar la inyección SQL en este endpoint de login?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <input
                      type="radio"
                      name="option"
                      checked={selectedAnswer === 'A'}
                      onChange={() => setSelectedAnswer('A')}
                      style={{ marginTop: '3px' }}
                    />
                    <span><strong>A.</strong> Validar la longitud máxima de la contraseña en el cliente.</span>
                  </label>

                  <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <input
                      type="radio"
                      name="option"
                      checked={selectedAnswer === 'B'}
                      onChange={() => setSelectedAnswer('B')}
                      style={{ marginTop: '3px' }}
                    />
                    <span><strong>B.</strong> Modificar la consulta para utilizar marcadores de posición posicionales (como <code>$1</code> y <code>$2</code>) y pasar los valores separados en un arreglo de parámetros (Consultas Parametrizadas).</span>
                  </label>

                  <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <input
                      type="radio"
                      name="option"
                      checked={selectedAnswer === 'C'}
                      onChange={() => setSelectedAnswer('C')}
                      style={{ marginTop: '3px' }}
                    />
                    <span><strong>C.</strong> Encriptar el valor del email en el frontend antes de enviarlo.</span>
                  </label>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleVerifyLab} disabled={!selectedAnswer}>
                  Ejecutar Simulación y Validar
                </button>

                {feedback && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: correct ? 'var(--color-primary)' : 'var(--color-danger)',
                    background: correct ? 'rgba(0, 245, 160, 0.05)' : 'rgba(255, 74, 90, 0.05)',
                    color: correct ? 'var(--color-primary)' : '#ff6b7a',
                    fontSize: '0.9rem'
                  }}>
                    {feedback}
                  </div>
                )}
              </div>

            </div>

            {/* Panel de Código Vulnerable y Simulación de Ataque */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Código */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>server.ts (Vulnerable Code)</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: '#ff5f56' }}></span>
                    <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                    <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: '#27c93f' }}></span>
                  </div>
                </div>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', overflowX: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  {`// Endpoint de autenticación vulnerable
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // CONCATENACIÓN DIRECTA INSEGURA:
  const query = \`SELECT * FROM users WHERE 
                  email = '\${email}' 
                  AND password = '\${password}'\`;
                  
  const result = await pool.query(query);
  
  if (result.rows.length > 0) {
    res.json({ success: true, user: result.rows[0] });
  } else {
    res.status(401).json({ error: "No autorizado" });
  }
});`}
                </pre>
              </div>

              {/* Panel de Simulación de Ataque Visual */}
              <div className="card" style={{ background: '#05070f', border: '1px dashed var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Pantalla de Simulación de Ataque
                </h3>

                {simulationState === 'idle' && (
                  <div style={{ height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: '2.5rem' }}>🖥️</span>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Listo para ejecutar el script de ataque...</p>
                  </div>
                )}

                {simulationState === 'attack_success' && (
                  <div style={{ height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(255, 74, 90, 0.03)', border: '1px solid rgba(255,74,90,0.2)', borderRadius: '6px', padding: '1rem' }} className="animate-fade-in">
                    <span style={{ fontSize: '2.5rem', animation: 'pulse 1s infinite' }}>🚨 ACCESO CONCEDIDO (HACKED)</span>
                    <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                      Payload: ' OR '1'='1
                    </p>
                    <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                      El atacante logró iniciar sesión sin conocer ninguna credencial, evadiendo la lógica del login.
                    </p>
                  </div>
                )}

                {simulationState === 'attack_blocked' && (
                  <div style={{ height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(0, 245, 160, 0.03)', border: '1px solid rgba(0,245,160,0.2)', borderRadius: '6px', padding: '1rem' }} className="animate-fade-in">
                    <span style={{ fontSize: '2.5rem' }}>🛡️ ATAQUE BLOQUEADO (SAFE)</span>
                    <p style={{ color: 'var(--color-primary)', fontSize: '0.85rem', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                      Parámetro tratado como literal string.
                    </p>
                    <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                      La consulta parametrizada neutralizó el payload. La consulta buscó un usuario cuyo email fuera literalmente la cadena del ataque.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </main>
      )}
    </div>
  );
}
