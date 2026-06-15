import React, { useState } from 'react';

type Role = 'student' | 'admin';
type View = 'auth' | 'dashboard' | 'lab' | 'create-lab' | 'view-labs';

interface Lab {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  dificultad: string;
  puntajeMaximo: number;
}

export default function App() {
  const [view, setView] = useState<View>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [userName, setUserName] = useState('');

  const [user, setUser] = useState<{ name: string; email: string; role: Role } | null>(null);
  const [points, setPoints] = useState(0);
  const [completedLabs, setCompletedLabs] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [simulationState, setSimulationState] = useState<'idle' | 'attack_success' | 'attack_blocked'>('idle');

  // ── Laboratorios (estado simulado) ──
  const [labs, setLabs] = useState<Lab[]>([
    { id: 1, titulo: 'SQL Injection en Formulario de Login', descripcion: 'Aprende cómo funciona la concatenación directa de parámetros y cómo mitigar ataques usando consultas parametrizadas.', categoria: 'SQL Injection', dificultad: 'Fácil', puntajeMaximo: 100 },
    { id: 2, titulo: 'Cross-Site Scripting (XSS) Reflejado', descripcion: 'Identifica y mitiga ataques XSS reflejados en formularios de búsqueda.', categoria: 'XSS', dificultad: 'Medio', puntajeMaximo: 150 },
    { id: 3, titulo: 'Broken Authentication con JWT', descripcion: 'Analiza tokens JWT mal configurados y aprende a validarlos correctamente.', categoria: 'Autenticación', dificultad: 'Difícil', puntajeMaximo: 200 },
  ]);

  // ── Formulario Crear Lab ──
  const [newLab, setNewLab] = useState({ titulo: '', descripcion: '', categoria: '', dificultad: 'Fácil', puntajeMaximo: 100 });
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const detectedRole: Role = email.includes('admin') ? 'admin' : 'student';
    const name = isRegister ? userName : (detectedRole === 'admin' ? 'Administrador SecOps' : 'Estudiante de Prueba');
    setUser({ name, email, role: detectedRole });
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

  const handleCreateLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLab.titulo || !newLab.descripcion || !newLab.categoria) return;
    const created: Lab = { id: labs.length + 1, ...newLab };
    setLabs(prev => [...prev, created]);
    setNewLab({ titulo: '', descripcion: '', categoria: '', dificultad: 'Fácil', puntajeMaximo: 100 });
    setCreateSuccess(true);
    setTimeout(() => setCreateSuccess(false), 3000);
  };

  const handleDeleteLab = (id: number) => {
    setLabs(prev => prev.filter(l => l.id !== id));
  };

  // ── Shared styles ──
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'border 0.2s, box-shadow 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  };

  const difficultyColor = (d: string) => {
    if (d === 'Fácil') return '#00f5a0';
    if (d === 'Medio') return '#ffb800';
    return '#ff4a5a';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }} className="animate-fade-in">

      {/* ── HEADER ── */}
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

      {/* ── AUTH ── */}
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
                  <input type="text" className="form-input" placeholder="Ana Gómez" value={userName} onChange={e => setUserName(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input type="email" className="form-input" placeholder="ejemplo@secops.com" value={email} onChange={e => setEmail(e.target.value)} required />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Tip: escribe "admin@secops.com" para iniciar como administrador.
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input type="password" className="form-input" placeholder="********" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                {isRegister ? 'Registrarse' : 'Ingresar'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}&nbsp;
              <span style={{ color: 'var(--color-secondary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsRegister(!isRegister)}>
                {isRegister ? 'Inicia Sesión' : 'Regístrate aquí'}
              </span>
            </p>
          </div>
        </main>
      )}

      {/* ── DASHBOARD ── */}
      {view === 'dashboard' && user && (
        <main>
          {user.role === 'admin' ? (

            /* ── ADMIN DASHBOARD ── */
            <div className="card animate-fade-in" style={{ borderLeft: '4px solid var(--color-danger)' }}>
              <h2 style={{ marginBottom: '1rem', color: 'var(--color-danger)' }}>Panel de Administración de Laboratorios</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Como administrador, puedes gestionar el catálogo de laboratorios interactivos y monitorear las métricas de la academia.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'rgba(255,74,90,0.05)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Total Usuarios</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>320</p>
                </div>
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Laboratorios Activos</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{labs.length}</p>
                </div>
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Tasa de Éxito Promedio</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>63.6%</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setView('create-lab')}>
                  + Crear Nuevo Laboratorio
                </button>
                <button className="btn btn-secondary" onClick={() => setView('view-labs')}>
                  Ver Laboratorios
                </button>
                <button className="btn btn-secondary" onClick={() => alert('Ver Reportes de Estudiantes')}>
                  Ver Reporte Completo
                </button>
              </div>
            </div>

          ) : (

            /* ── STUDENT DASHBOARD ── */
            <div className="animate-fade-in">
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card glow-green">
                  <h3>Puntos de Defensa</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)', margin: '0.5rem 0' }}>{points} pts</p>
                  <span className="badge-unlocked">🛡️ Rango: Recluta SecOps</span>
                </div>
                <div className="card">
                  <h3>Progreso de Laboratorios</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{completedLabs} / 1</p>
                  <div style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--color-secondary)', width: completedLabs > 0 ? '100%' : '0%', height: '100%', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <div className="card">
                  <h3>Insignias Obtenidas</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    {completedLabs > 0 ? (
                      <div className="badge-unlocked" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>🥇 Defensor de Inyecciones</div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Completa tu primer laboratorio para obtener insignias.</span>
                    )}
                  </div>
                </div>
              </section>
              <section>
                <h2 style={{ marginBottom: '1.5rem' }}>Catálogo de Laboratorios</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  <div className="card glow-blue" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 600 }}>SQL INJECTION</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(0,210,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Fácil</span>
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

      {/* ── CREAR LABORATORIO ── */}
      {view === 'create-lab' && (
        <main className="animate-fade-in">
          <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => setView('dashboard')}>
            ← Volver al Panel
          </button>

          <div className="card" style={{ maxWidth: 680, borderLeft: '4px solid var(--color-primary)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
              Crear Nuevo Laboratorio
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Completa los campos para agregar un nuevo laboratorio al catálogo de SecOps Academy.
            </p>

            {createSuccess && (
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(0,245,160,0.08)', border: '1px solid rgba(0,245,160,0.3)', borderRadius: 8, color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                ✅ Laboratorio creado exitosamente y agregado al catálogo.
              </div>
            )}

            <form onSubmit={handleCreateLab} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Título */}
              <div>
                <label style={labelStyle}>Título del Laboratorio</label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Ej: XSS Reflejado en Buscador"
                  value={newLab.titulo}
                  onChange={e => setNewLab({ ...newLab, titulo: e.target.value })}
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                  placeholder="Describe el objetivo del laboratorio y qué aprenderá el estudiante..."
                  value={newLab.descripcion}
                  onChange={e => setNewLab({ ...newLab, descripcion: e.target.value })}
                  required
                />
              </div>

              {/* Categoría */}
              <div>
                <label style={labelStyle}>Categoría (Vulnerabilidad OWASP)</label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Ej: XSS, SQL Injection, Autenticación..."
                  value={newLab.categoria}
                  onChange={e => setNewLab({ ...newLab, categoria: e.target.value })}
                  required
                />
              </div>

              {/* Dificultad y Puntaje en fila */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Dificultad</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={newLab.dificultad}
                    onChange={e => setNewLab({ ...newLab, dificultad: e.target.value })}
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Medio">Medio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Puntaje Máximo</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={50}
                    max={500}
                    step={50}
                    value={newLab.puntajeMaximo}
                    onChange={e => setNewLab({ ...newLab, puntajeMaximo: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  + Crear Laboratorio
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setView('dashboard')}>
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </main>
      )}

      {/* ── VER LABORATORIOS ── */}
      {view === 'view-labs' && (
        <main className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setView('dashboard')}>
              ← Volver al Panel
            </button>
            <button className="btn btn-primary" onClick={() => setView('create-lab')}>
              + Crear Nuevo Laboratorio
            </button>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--color-secondary)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>
              Laboratorios Registrados
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              {labs.length} laboratorio{labs.length !== 1 ? 's' : ''} en el catálogo.
            </p>

            {labs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📂</p>
                <p>No hay laboratorios registrados aún.</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setView('create-lab')}>
                  Crear el primero
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {labs.map(lab => (
                  <div
                    key={lab.id}
                    className="card"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', padding: '1.25rem' }}
                  >
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-secondary)', letterSpacing: '0.07em' }}>
                          {lab.categoria}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 10px',
                          borderRadius: 9999,
                          fontWeight: 600,
                          background: `${difficultyColor(lab.dificultad)}18`,
                          color: difficultyColor(lab.dificultad),
                          border: `1px solid ${difficultyColor(lab.dificultad)}40`,
                        }}>
                          {lab.dificultad}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                          +{lab.puntajeMaximo} pts
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem' }}>{lab.titulo}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{lab.descripcion}</p>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                        onClick={() => alert(`Editar laboratorio: ${lab.titulo}`)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', background: 'rgba(255,74,90,0.08)', color: 'var(--color-danger)', border: '1px solid rgba(255,74,90,0.25)' }}
                        onClick={() => handleDeleteLab(lab.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── LAB CONSOLE ── */}
      {view === 'lab' && (
        <main className="animate-fade-in">
          <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => setView('dashboard')}>
            ← Volver al Dashboard
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-secondary)' }}>Teoría del Ataque</h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  Las vulnerabilidades de inyección de código (como SQL Injection) ocurren cuando un desarrollador concatena directamente variables que contienen inputs de usuarios en comandos dinámicos.
                  El motor de base de datos interpreta las comillas simples u operadores booleanos (como <code>' OR '1'='1</code>) como comandos de control del sistema, no como texto simple.
                </p>
              </div>
              <div className="card glow-blue">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Actividad 1: Resolución</h3>
                <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
                  Revisa el código vulnerable a la derecha. ¿Cuál es la opción correcta para mitigar la inyección SQL en este endpoint de login?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {[
                    { key: 'A', text: 'Validar la longitud máxima de la contraseña en el cliente.' },
                    { key: 'B', text: 'Modificar la consulta para utilizar marcadores de posición posicionales (como $1 y $2) y pasar los valores separados en un arreglo de parámetros (Consultas Parametrizadas).' },
                    { key: 'C', text: 'Encriptar el valor del email en el frontend antes de enviarlo.' },
                  ].map(opt => (
                    <label key={opt.key} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <input type="radio" name="option" checked={selectedAnswer === opt.key} onChange={() => setSelectedAnswer(opt.key)} style={{ marginTop: '3px' }} />
                      <span><strong>{opt.key}.</strong> {opt.text}</span>
                    </label>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleVerifyLab} disabled={!selectedAnswer}>
                  Ejecutar Simulación y Validar
                </button>
                {feedback && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '4px', border: '1px solid', borderColor: correct ? 'var(--color-primary)' : 'var(--color-danger)', background: correct ? 'rgba(0,245,160,0.05)' : 'rgba(255,74,90,0.05)', color: correct ? 'var(--color-primary)' : '#ff6b7a', fontSize: '0.9rem' }}>
                    {feedback}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>server.ts (Vulnerable Code)</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: '#ff5f56' }} />
                    <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: '#ffbd2e' }} />
                    <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: '#27c93f' }} />
                  </div>
                </div>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', overflowX: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  {`app.post('/api/auth/login', async (req, res) => {
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
              <div className="card" style={{ background: '#05070f', border: '1px dashed var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Pantalla de Simulación de Ataque</h3>
                {simulationState === 'idle' && (
                  <div style={{ height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: '2.5rem' }}>🖥️</span>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Listo para ejecutar el script de ataque...</p>
                  </div>
                )}
                {simulationState === 'attack_success' && (
                  <div style={{ height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,74,90,0.03)', border: '1px solid rgba(255,74,90,0.2)', borderRadius: '6px', padding: '1rem' }} className="animate-fade-in">
                    <span style={{ fontSize: '2rem' }}>🚨 ACCESO CONCEDIDO (HACKED)</span>
                    <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>Payload: ' OR '1'='1</p>
                    <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>El atacante logró iniciar sesión sin conocer ninguna credencial.</p>
                  </div>
                )}
                {simulationState === 'attack_blocked' && (
                  <div style={{ height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,245,160,0.03)', border: '1px solid rgba(0,245,160,0.2)', borderRadius: '6px', padding: '1rem' }} className="animate-fade-in">
                    <span style={{ fontSize: '2rem' }}>🛡️ ATAQUE BLOQUEADO (SAFE)</span>
                    <p style={{ color: 'var(--color-primary)', fontSize: '0.85rem', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>Parámetro tratado como literal string.</p>
                    <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>La consulta parametrizada neutralizó el payload.</p>
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
