import React, { useState, useEffect } from 'react';

type Role = 'student' | 'admin';
type View = 'auth' | 'dashboard' | 'lab' | 'create-lab' | 'view-labs' | 'admin-lab-detail' | 'review-lab';

interface Lab {
  id: string;
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
  const [errorMsg, setErrorMsg] = useState('');

  const [user, setUser] = useState<{ id: string; name: string; email: string; role: Role } | null>(() => {
    const saved = localStorage.getItem('secops_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [points, setPoints] = useState(0);
  const [completedLabs, setCompletedLabs] = useState(0);
  const [completedLabIds, setCompletedLabIds] = useState<string[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<{ totalUsers: number; totalLabs: number; successRate: number } | null>(null);

  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLabDetail, setSelectedLabDetail] = useState<any | null>(null);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [simulationState, setSimulationState] = useState<'idle' | 'attack_success' | 'attack_blocked'>('idle');

  // ── Lab seleccionado en vista admin ──
  const [adminSelectedLab, setAdminSelectedLab] = useState<any | null>(null);
  const [adminLabLoading, setAdminLabLoading] = useState(false);

  // ── Vista revisión de respuestas (estudiante) ──
  const [reviewLabData, setReviewLabData] = useState<any | null>(null);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // ── Formulario Crear Lab ──
  const [newLab, setNewLab] = useState({ titulo: '', descripcion: '', categoria: '', dificultad: 'Fácil', puntajeMaximo: 100 });
  const [createSuccess, setCreateSuccess] = useState(false);

  // Helper para mapear labs del backend al frontend
  const mapBackendLab = (b: any): Lab => ({
    id: b.id,
    titulo: b.title,
    descripcion: b.description,
    categoria: b.category === 'injection' ? 'SQL Injection' : b.category.toUpperCase(),
    dificultad: b.difficulty === 'beginner' ? 'Fácil' : (b.difficulty === 'intermediate' ? 'Medio' : 'Difícil'),
    puntajeMaximo: b.points
  });

  // Helper de llamadas API
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('secops_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error en la petición.');
    }
    return response.json();
  };

  const loadUserData = async (userId: string) => {
    try {
      const progressData = await apiCall(`/api/progress/${userId}`);
      setPoints(progressData.totalPoints);
      setCompletedLabs(progressData.completedLabs);

      const completed = progressData.labsProgress
        ? progressData.labsProgress.filter((p: any) => p.completed).map((p: any) => p.labId)
        : [];
      setCompletedLabIds(completed);

      const badgesData = await apiCall(`/api/badges/${userId}`);
      setUserBadges(badgesData.badges || []);
    } catch (err) {
      console.error('Error al cargar progreso de usuario:', err);
    }
  };

  const loadLabs = async () => {
    try {
      const data = await apiCall('/api/labs');
      setLabs(data.labs.map(mapBackendLab));
    } catch (err) {
      console.error('Error al cargar laboratorios:', err);
    }
  };

  const loadAdminMetrics = async () => {
    try {
      const data = await apiCall('/api/admin/metrics');
      setAdminMetrics(data);
    } catch (err) {
      console.error('Error al cargar métricas:', err);
    }
  };

  // Cargar datos si hay sesión activa al montar
  useEffect(() => {
    if (user) {
      setView('dashboard');
      loadUserData(user.id);
      loadLabs();
      if (user.role === 'admin') {
        loadAdminMetrics();
      }
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setErrorMsg('');

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { name: userName, email, password } : { email, password };

      const data = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      localStorage.setItem('secops_token', data.token);
      localStorage.setItem('secops_user', JSON.stringify(data.user));

      setUser(data.user);
      setView('dashboard');
      loadUserData(data.user.id);
      loadLabs();
      if (data.user.role === 'admin') {
        loadAdminMetrics();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en la autenticación.');
    }
  };

  const startLab = async (labId: string) => {
    try {
      const data = await apiCall(`/api/labs/${labId}`);
      setSelectedLabDetail(data);
      setCurrentActivityIndex(0);
      setSelectedAnswer(null);
      setFeedback(null);
      setCorrect(null);
      setSimulationState('idle');
      setView('lab');
    } catch (err: any) {
      alert(err.message || 'Error al iniciar laboratorio.');
    }
  };

  const handleVerifyLab = async () => {
    if (!selectedAnswer || !selectedLabDetail) return;
    const activity = selectedLabDetail.activities[currentActivityIndex];
    if (!activity) return;

    try {
      const result = await apiCall(`/api/labs/${selectedLabDetail.id}/activities/${activity.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.id,
          answer: selectedAnswer
        })
      });

      setCorrect(result.correct);
      setFeedback(result.explanation || (result.correct ? '¡Respuesta correcta!' : 'Respuesta incorrecta.'));

      if (result.correct) {
        setSimulationState('attack_blocked');
        if (result.pointsEarned > 0) {
          setPoints(prev => prev + result.pointsEarned);
        }
        if (result.labCompleted) {
          setCompletedLabs(prev => prev + 1);
          setCompletedLabIds(prev => {
            if (!prev.includes(selectedLabDetail.id)) {
              return [...prev, selectedLabDetail.id];
            }
            return prev;
          });
        }
        if (result.unlockedBadge) {
          setUserBadges(prev => [...prev, result.unlockedBadge]);
          alert(`🏆 ¡Felicidades! Has desbloqueado una nueva insignia: ${result.unlockedBadge.name}`);
        }
      } else {
        setSimulationState('attack_success');
      }
    } catch (err: any) {
      alert(err.message || 'Error al validar la respuesta.');
    }
  };

  const handleReviewLab = async (labId: string) => {
    setReviewLoading(true);
    try {
      // Cargar detalles del lab (actividades + respuestas correctas) e historial del usuario en paralelo
      const [labData, historyData] = await Promise.all([
        apiCall(`/api/labs/${labId}`),
        apiCall(`/api/history/${user?.id}?limit=50`)
      ]);
      // Filtrar solo los intentos de este lab
      const labAttempts = historyData.history.filter((h: any) => h.labId === labId);
      setReviewLabData(labData);
      setReviewHistory(labAttempts);
      setView('review-lab');
    } catch (err: any) {
      alert(err.message || 'Error al cargar la revisión.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAdminViewLab = async (labId: string) => {
    setAdminLabLoading(true);
    try {
      const data = await apiCall(`/api/labs/${labId}`);
      setAdminSelectedLab(data);
      setView('admin-lab-detail');
    } catch (err: any) {
      alert(err.message || 'Error al cargar el laboratorio.');
    } finally {
      setAdminLabLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('secops_token');
    localStorage.removeItem('secops_user');
    setUser(null);
    setView('auth');
    setEmail('');
    setPassword('');
    setSelectedAnswer(null);
    setFeedback(null);
    setCorrect(null);
    setSimulationState('idle');
    setLabs([]);
    setUserBadges([]);
    setAdminMetrics(null);
    setCompletedLabIds([]);
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLab.titulo || !newLab.descripcion || !newLab.categoria) return;

    try {
      const difficultyMapping: Record<string, string> = {
        'Fácil': 'beginner',
        'Medio': 'intermediate',
        'Difícil': 'advanced'
      };

      const body = {
        title: newLab.titulo,
        description: newLab.descripcion,
        category: newLab.categoria.toLowerCase(),
        owaspRef: 'A03:2021',
        difficulty: difficultyMapping[newLab.dificultad] || 'beginner',
        points: newLab.puntajeMaximo,
        theory: 'Las inyecciones de código ocurren cuando las entradas del usuario se concatenan directamente en sentencias que luego se ejecutan. En el caso de SQL, esto permite manipular la lógica de la consulta original.',
        vulnerableCode: 'const query = `SELECT * FROM users WHERE email = \'${email}\' AND password = \'${password}\'`;',
        vulnerabilityId: 'vuln-sqli',
        activities: [
          {
            type: 'multiple_choice',
            question: '¿Cuál es la mitigación correcta contra la inyección SQL?',
            options: [
              'Validar el formato del email en el cliente',
              'Usar consultas parametrizadas (Prepared Statements)',
              'Codificar el texto de entrada en base64'
            ],
            validationStrategy: 'predefined_list',
            correctAnswer: 'Usar consultas parametrizadas (Prepared Statements)',
            explanation: 'Las consultas parametrizadas envían la consulta y los parámetros de forma separada al motor SQL, previniendo que la entrada altere la estructura del comando.'
          }
        ]
      };

      await apiCall('/api/admin/labs', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setNewLab({ titulo: '', descripcion: '', categoria: '', dificultad: 'Fácil', puntajeMaximo: 100 });
      setCreateSuccess(true);
      setTimeout(() => setCreateSuccess(false), 3000);
      loadLabs();
      loadAdminMetrics();
    } catch (err: any) {
      alert(err.message || 'Error al crear laboratorio.');
    }
  };

  const handleDeleteLab = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este laboratorio de forma permanente?')) return;
    try {
      await apiCall(`/api/admin/labs/${id}`, {
        method: 'DELETE'
      });
      loadLabs();
      loadAdminMetrics();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar laboratorio.');
    }
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

            {errorMsg && (
              <div style={{ color: 'var(--color-danger)', background: 'rgba(255,74,90,0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(255,74,90,0.2)' }}>
                ⚠️ {errorMsg}
              </div>
            )}

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
                  Tip: escribe "admin@secops.com" o "estudiante@secops.com" (password: AdminPass123! o StudentPass123!) para usar las cuentas pre-creadas.
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
              <span style={{ color: 'var(--color-secondary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
              }}>
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
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>
                    {adminMetrics?.totalUsers ?? 0}
                  </p>
                </div>
                <div className="card" style={{ cursor: 'pointer' }} onClick={() => setView('view-labs')}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Laboratorios Activos</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {labs.length}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Click para ver →</p>
                </div>
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Tasa de Éxito Promedio</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {adminMetrics?.successRate ?? 0}%
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setView('create-lab')}>
                  + Crear Nuevo Laboratorio
                </button>
                <button className="btn btn-secondary" onClick={() => setView('view-labs')}>
                  Ver Laboratorios
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
                  <span className="badge-unlocked">🛡️ Rango: Defensor SecOps</span>
                </div>
                <div className="card">
                  <h3>Progreso de Laboratorios</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                    {completedLabs} / {labs.length || 1}
                  </p>
                  <div style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      background: 'var(--color-secondary)',
                      width: `${labs.length ? (completedLabs / labs.length) * 100 : 0}%`,
                      height: '100%',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
                <div className="card">
                  <h3>Insignias Obtenidas</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {userBadges.length > 0 ? (
                      userBadges.map(badge => (
                        <div key={badge.id} className="badge-unlocked" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }} title={badge.description}>
                          🥇 {badge.name}
                        </div>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Completa laboratorios para obtener insignias.
                      </span>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h2 style={{ marginBottom: '1.5rem' }}>Catálogo de Laboratorios</h2>
                {labs.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Cargando catálogo de laboratorios...</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {labs.map(lab => (
                      <div key={lab.id} className="card glow-blue" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 600 }}>
                              {lab.categoria}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              {completedLabIds.includes(lab.id) && (
                                <span style={{ fontSize: '0.75rem', background: 'rgba(0,245,160,0.15)', color: '#00f5a0', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                  ✓ Completado
                                </span>
                              )}
                              <span style={{
                                fontSize: '0.75rem',
                                background: 'rgba(0,210,255,0.1)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                color: difficultyColor(lab.dificultad)
                              }}>
                                {lab.dificultad}
                              </span>
                            </div>
                          </div>
                          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{lab.titulo}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            {lab.descripcion}
                          </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>+{lab.puntajeMaximo} Puntos</span>
                          {completedLabIds.includes(lab.id) ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }} onClick={() => handleReviewLab(lab.id)}>
                                📋 Ver Respuestas
                              </button>
                              <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }} onClick={() => startLab(lab.id)}>
                                🔁 Repasar
                              </button>
                            </div>
                          ) : (
                            <button className="btn btn-primary" onClick={() => startLab(lab.id)}>
                              Iniciar Laboratorio
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              Completa los campos para agregar un nuevo laboratorio de forma persistente.
            </p>

            {createSuccess && (
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(0,245,160,0.08)', border: '1px solid rgba(0,245,160,0.3)', borderRadius: 8, color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                ✅ Laboratorio creado exitosamente y persistido en la base de datos.
              </div>
            )}

            <form onSubmit={handleCreateLab} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                  placeholder="Describe el objetivo del laboratorio..."
                  value={newLab.descripcion}
                  onChange={e => setNewLab({ ...newLab, descripcion: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Categoría</label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Ej: Injection, XSS, Autenticación..."
                  value={newLab.categoria}
                  onChange={e => setNewLab({ ...newLab, categoria: e.target.value })}
                  required
                />
              </div>

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
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', padding: '1.25rem', cursor: 'pointer' }}
                    onClick={() => handleAdminViewLab(lab.id)}
                  >
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

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                        onClick={(e) => { e.stopPropagation(); handleAdminViewLab(lab.id); }}
                      >
                        🔍 Ver Detalle
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', background: 'rgba(255,74,90,0.08)', color: 'var(--color-danger)', border: '1px solid rgba(255,74,90,0.25)' }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteLab(lab.id); }}
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
      {view === 'lab' && selectedLabDetail && (
        <main className="animate-fade-in">
          <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => setView('dashboard')}>
            ← Volver al Dashboard
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-secondary)' }}>Teoría del Ataque</h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {selectedLabDetail.theory}
                </p>
              </div>

              <div className="card glow-blue">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                  Actividad {currentActivityIndex + 1} de {selectedLabDetail.activities.length}: Resolución
                </h3>
                <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
                  {selectedLabDetail.activities[currentActivityIndex]?.question}
                </p>

                {selectedLabDetail.activities[currentActivityIndex]?.type === 'multiple_choice' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {selectedLabDetail.activities[currentActivityIndex].options.map((opt: string, idx: number) => {
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <label key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <input
                            type="radio"
                            name="option"
                            checked={selectedAnswer === opt}
                            onChange={() => setSelectedAnswer(opt)}
                            style={{ marginTop: '3px' }}
                            disabled={correct === true}
                          />
                          <span><strong>{letter}.</strong> {opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {selectedLabDetail.activities[currentActivityIndex]?.type === 'fill_in' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="Escribe tu respuesta aquí y presiona validar..."
                      value={selectedAnswer || ''}
                      onChange={e => setSelectedAnswer(e.target.value)}
                      disabled={correct === true}
                    />
                  </div>
                )}

                {correct !== true && (
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleVerifyLab} disabled={!selectedAnswer}>
                    Ejecutar Simulación y Validar
                  </button>
                )}

                {feedback && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '4px', border: '1px solid', borderColor: correct ? 'var(--color-primary)' : 'var(--color-danger)', background: correct ? 'rgba(0,245,160,0.05)' : 'rgba(255,74,90,0.05)', color: correct ? 'var(--color-primary)' : '#ff6b7a', fontSize: '0.9rem' }}>
                    {feedback}
                  </div>
                )}

                {correct === true && (
                  currentActivityIndex < selectedLabDetail.activities.length - 1 ? (
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} onClick={() => {
                      setCurrentActivityIndex(prev => prev + 1);
                      setSelectedAnswer(null);
                      setFeedback(null);
                      setCorrect(null);
                      setSimulationState('idle');
                    }}>
                      Siguiente Actividad →
                    </button>
                  ) : (
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                      <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        🎉 ¡Laboratorio Completado con éxito!
                      </p>
                      <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
                        setView('dashboard');
                        loadUserData(user!.id);
                      }}>
                        Volver al Dashboard
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>servidor (Código Vulnerable)</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: '#ff5f56' }} />
                    <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: '#ffbd2e' }} />
                    <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: '#27c93f' }} />
                  </div>
                </div>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', overflowX: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  {selectedLabDetail.vulnerableCode}
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

      {/* ── ADMIN LAB DETAIL ── */}
      {view === 'admin-lab-detail' && (
        <main className="animate-fade-in">
          <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => { setAdminSelectedLab(null); setView('view-labs'); }}>
            ← Volver a Laboratorios
          </button>

          {adminLabLoading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</p>
              <p>Cargando información del laboratorio...</p>
            </div>
          )}

          {!adminLabLoading && adminSelectedLab && (() => {
            const lab = adminSelectedLab;
            const diffColor = (d: string) => d === 'beginner' ? '#00f5a0' : d === 'intermediate' ? '#ffb800' : '#ff4a5a';
            const diffLabel = (d: string) => d === 'beginner' ? 'Fácil' : d === 'intermediate' ? 'Medio' : 'Difícil';
            const typeLabel = (t: string) => t === 'multiple_choice' ? 'Opción Múltiple' : t === 'fill_in' ? 'Completar' : t;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Header del lab */}
                <div className="card" style={{ borderLeft: '4px solid var(--color-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-secondary)', letterSpacing: '0.08em' }}>
                          {lab.category?.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 10px', borderRadius: 9999, fontWeight: 600, background: `${diffColor(lab.difficulty)}18`, color: diffColor(lab.difficulty), border: `1px solid ${diffColor(lab.difficulty)}40` }}>
                          {diffLabel(lab.difficulty)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                          +{lab.points} pts
                        </span>
                        {lab.owaspRef && (
                          <span style={{ fontSize: '0.7rem', padding: '2px 10px', borderRadius: 9999, background: 'rgba(127,0,255,0.12)', color: 'var(--color-purple)', border: '1px solid rgba(127,0,255,0.3)', fontWeight: 600 }}>
                            {lab.owaspRef}
                          </span>
                        )}
                      </div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{lab.title}</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{lab.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
                      <button
                        className="btn"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', background: 'rgba(255,74,90,0.08)', color: 'var(--color-danger)', border: '1px solid rgba(255,74,90,0.25)' }}
                        onClick={() => { handleDeleteLab(lab.id); setView('view-labs'); }}
                      >
                        🗑️ Eliminar Lab
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vulnerabilidad */}
                {lab.vulnerability && (
                  <div className="card" style={{ borderLeft: '4px solid var(--color-purple)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-purple)', marginBottom: '1rem' }}>
                      🔎 Vulnerabilidad Asociada
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Nombre</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{lab.vulnerability.name}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Categoría OWASP</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{lab.vulnerability.owaspCategory}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Severidad</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: lab.vulnerability.severity === 'high' ? 'var(--color-danger)' : lab.vulnerability.severity === 'medium' ? 'var(--color-warning)' : 'var(--color-primary)' }}>
                          {lab.vulnerability.severity?.toUpperCase()}
                        </p>
                      </div>
                      {lab.vulnerability.cweId && (
                        <div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>CWE ID</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{lab.vulnerability.cweId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Badge de la categoría */}
                {(() => {
                  const badgeMap: Record<string, { name: string; description: string; icon: string }> = {
                    injection:        { name: 'Defensor contra Inyecciones', description: 'Se otorga al completar todos los laboratorios de la categoría Injection.', icon: '🛡️' },
                    xss:              { name: 'Guardián del Frontend',        description: 'Se otorga al completar todos los laboratorios de la categoría XSS.',       icon: '🔰' },
                    autenticacion:    { name: 'Maestro de Autenticación',     description: 'Se otorga al completar todos los laboratorios de Autenticación.',           icon: '🔑' },
                    authentication:   { name: 'Maestro de Autenticación',     description: 'Se otorga al completar todos los laboratorios de Autenticación.',           icon: '🔑' },
                  };
                  const key = lab.category?.toLowerCase();
                  const badge = badgeMap[key] ?? {
                    name: `Experto en ${lab.category}`,
                    description: `Se otorga al completar todos los laboratorios de la categoría ${lab.category}.`,
                    icon: '🏅'
                  };
                  return (
                    <div className="card" style={{ borderLeft: '4px solid var(--color-warning)', background: 'rgba(255,184,0,0.03)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '1rem' }}>
                        🏆 Insignia que se Desbloquea
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,184,0,0.12)', border: '2px solid rgba(255,184,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                          {badge.icon}
                        </div>
                        <div>
                          <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>{badge.name}</p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{badge.description}</p>
                          <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', padding: '2px 10px', borderRadius: 9999, background: 'rgba(255,184,0,0.1)', color: 'var(--color-warning)', border: '1px solid rgba(255,184,0,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Categoría: {lab.category}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Completa todos los labs de esta categoría para obtenerla
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Teoría + Código */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '1rem' }}>📖 Teoría del Ataque</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{lab.theory}</p>
                  </div>

                  <div className="card" style={{ background: '#05070f' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>vulnerableCode.js</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                        <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                        <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
                      </div>
                    </div>
                    <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', overflowX: 'auto', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {lab.vulnerableCode}
                    </pre>
                  </div>
                </div>

                {/* Actividades */}
                <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
                    🎯 Actividades del Laboratorio
                    <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.2)', color: 'var(--color-primary)', padding: '2px 10px', borderRadius: 9999, fontWeight: 500 }}>
                      {lab.activities?.length || 0} actividad{lab.activities?.length !== 1 ? 'es' : ''}
                    </span>
                  </h3>

                  {(!lab.activities || lab.activities.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Este laboratorio no tiene actividades registradas.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {lab.activities.map((activity: any, idx: number) => (
                        <div key={activity.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>

                          {/* Header actividad */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,210,255,0.12)', border: '1px solid rgba(0,210,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)', flexShrink: 0 }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontSize: '0.7rem', padding: '2px 10px', borderRadius: 9999, background: 'rgba(0,210,255,0.08)', color: 'var(--color-secondary)', border: '1px solid rgba(0,210,255,0.2)', fontWeight: 600 }}>
                              {typeLabel(activity.type)}
                            </span>
                            <span style={{ fontSize: '0.7rem', padding: '2px 10px', borderRadius: 9999, background: 'rgba(127,0,255,0.08)', color: 'var(--color-purple)', border: '1px solid rgba(127,0,255,0.2)', fontWeight: 600 }}>
                              {activity.validationStrategy}
                            </span>
                          </div>

                          {/* Pregunta */}
                          <p style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>
                            {activity.question}
                          </p>

                          {/* Opciones (si es multiple_choice) */}
                          {activity.type === 'multiple_choice' && activity.options && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                              {activity.options.map((opt: string, optIdx: number) => (
                                <div key={optIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: '18px' }}>
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* ID de la actividad */}
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              ID: {activity.id}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer con fecha */}
                {(lab.createdAt || lab.updatedAt) && (
                  <div style={{ display: 'flex', gap: '2rem', padding: '0.5rem 0', borderTop: '1px solid var(--border-color)' }}>
                    {lab.createdAt && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Creado: {new Date(lab.createdAt).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                    {lab.updatedAt && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Actualizado: {new Date(lab.updatedAt).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}

              </div>
            );
          })()}
        </main>
      )}

      {/* ── REVIEW LAB (estudiante) ── */}
      {view === 'review-lab' && (
        <main className="animate-fade-in">
          <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => { setReviewLabData(null); setReviewHistory([]); setView('dashboard'); }}>
            ← Volver al Dashboard
          </button>

          {reviewLoading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</p>
              <p>Cargando revisión...</p>
            </div>
          )}

          {!reviewLoading && reviewLabData && (() => {
            const lab = reviewLabData;
            const diffColor = (d: string) => d === 'beginner' ? '#00f5a0' : d === 'intermediate' ? '#ffb800' : '#ff4a5a';
            const diffLabel = (d: string) => d === 'beginner' ? 'Fácil' : d === 'intermediate' ? 'Medio' : 'Difícil';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Header */}
                <div className="card" style={{ borderLeft: '4px solid var(--color-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-secondary)', letterSpacing: '0.08em' }}>{lab.category?.toUpperCase()}</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 10px', borderRadius: 9999, fontWeight: 600, background: `${diffColor(lab.difficulty)}18`, color: diffColor(lab.difficulty), border: `1px solid ${diffColor(lab.difficulty)}40` }}>
                      {diffLabel(lab.difficulty)}
                    </span>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.2)', color: 'var(--color-primary)', padding: '2px 10px', borderRadius: 9999, fontWeight: 600 }}>
                      ✓ Completado
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>{lab.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Revisión de respuestas — compara tus respuestas con las correctas.</p>
                </div>

                {/* Actividades con comparación */}
                {lab.activities?.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay actividades para revisar.</p>
                ) : (
                  lab.activities.map((activity: any, idx: number) => {
                    // Buscar el último intento correcto del usuario para esta actividad
                    const correctAttempt = reviewHistory.find((h: any) => h.activityId === activity.id && h.correct);
                    // Buscar el último intento incorrecto si no hay correcto
                    const anyAttempt = correctAttempt || reviewHistory.find((h: any) => h.activityId === activity.id);
                    const userAnswer = anyAttempt?.answer ?? null;
                    const wasCorrect = anyAttempt?.correct ?? false;
                    const totalAttempts = reviewHistory.filter((h: any) => h.activityId === activity.id).length;

                    return (
                      <div key={activity.id} className="card">
                        {/* Cabecera actividad */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,210,255,0.12)', border: '1px solid rgba(0,210,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-secondary)', flexShrink: 0 }}>
                            {idx + 1}
                          </span>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, flex: 1 }}>{activity.question}</h3>
                          <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 9999, fontWeight: 600, background: wasCorrect ? 'rgba(0,245,160,0.1)' : 'rgba(255,74,90,0.1)', color: wasCorrect ? 'var(--color-primary)' : 'var(--color-danger)', border: `1px solid ${wasCorrect ? 'rgba(0,245,160,0.3)' : 'rgba(255,74,90,0.3)'}` }}>
                            {wasCorrect ? '✓ Correcto' : '✗ Incorrecto'}
                          </span>
                          {totalAttempts > 0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {totalAttempts} intento{totalAttempts !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Comparación de respuestas */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                          {/* Respuesta del usuario */}
                          <div style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: wasCorrect ? 'rgba(0,245,160,0.04)' : 'rgba(255,74,90,0.04)', border: `1px solid ${wasCorrect ? 'rgba(0,245,160,0.2)' : 'rgba(255,74,90,0.2)'}` }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: wasCorrect ? 'var(--color-primary)' : 'var(--color-danger)', marginBottom: '0.6rem' }}>
                              {wasCorrect ? '✓' : '✗'} Tu Respuesta
                            </p>
                            {userAnswer !== null ? (
                              activity.type === 'multiple_choice' && activity.options ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  {activity.options.map((opt: string, oIdx: number) => {
                                    const isSelected = typeof userAnswer === 'string'
                                      ? userAnswer === opt
                                      : JSON.stringify(userAnswer) === JSON.stringify(opt);
                                    return (
                                      <div key={oIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.5rem 0.75rem', borderRadius: '6px', background: isSelected ? (wasCorrect ? 'rgba(0,245,160,0.1)' : 'rgba(255,74,90,0.1)') : 'transparent', border: isSelected ? `1px solid ${wasCorrect ? 'rgba(0,245,160,0.3)' : 'rgba(255,74,90,0.3)'}` : '1px solid transparent' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: '16px' }}>{String.fromCharCode(65 + oIdx)}.</span>
                                        <span style={{ fontSize: '0.85rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isSelected ? 600 : 400 }}>{opt}</span>
                                        {isSelected && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>{wasCorrect ? '✓' : '✗'}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '4px' }}>
                                  {typeof userAnswer === 'string' ? userAnswer : JSON.stringify(userAnswer)}
                                </p>
                              )
                            ) : (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin respuesta registrada</p>
                            )}
                          </div>

                          {/* Respuesta correcta */}
                          <div style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,245,160,0.04)', border: '1px solid rgba(0,245,160,0.2)' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-primary)', marginBottom: '0.6rem' }}>
                              ✓ Respuesta Correcta
                            </p>
                            {activity.type === 'multiple_choice' && activity.options ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {activity.options.map((opt: string, oIdx: number) => {
                                  // La correctAnswer viene del lab pero no se expone al frontend por seguridad.
                                  // Usamos el intento correcto del historial como referencia.
                                  const isCorrectOpt = correctAttempt
                                    ? (typeof correctAttempt.answer === 'string' ? correctAttempt.answer === opt : JSON.stringify(correctAttempt.answer) === JSON.stringify(opt))
                                    : false;
                                  return (
                                    <div key={oIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.5rem 0.75rem', borderRadius: '6px', background: isCorrectOpt ? 'rgba(0,245,160,0.1)' : 'transparent', border: isCorrectOpt ? '1px solid rgba(0,245,160,0.3)' : '1px solid transparent' }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: '16px' }}>{String.fromCharCode(65 + oIdx)}.</span>
                                      <span style={{ fontSize: '0.85rem', color: isCorrectOpt ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: isCorrectOpt ? 600 : 400 }}>{opt}</span>
                                      {isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-primary)' }}>✓</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              correctAttempt ? (
                                <p style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '4px', color: 'var(--color-primary)' }}>
                                  {typeof correctAttempt.answer === 'string' ? correctAttempt.answer : JSON.stringify(correctAttempt.answer)}
                                </p>
                              ) : (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aún no has respondido correctamente esta actividad.</p>
                              )
                            )}
                          </div>
                        </div>

                        {/* Explicación */}
                        {activity.explanation && (
                          <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,210,255,0.04)', border: '1px solid rgba(0,210,255,0.15)' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>💡 Explicación</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{activity.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Resumen final */}
                <div className="card" style={{ borderLeft: '4px solid var(--color-primary)', background: 'rgba(0,245,160,0.02)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1rem' }}>📊 Resumen</h3>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Actividades</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{lab.activities?.length ?? 0}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Correctas</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {lab.activities?.filter((a: any) => reviewHistory.some((h: any) => h.activityId === a.id && h.correct)).length ?? 0}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Total Intentos</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{reviewHistory.length}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Puntos Ganados</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {reviewHistory.reduce((sum: number, h: any) => sum + (h.pointsEarned || 0), 0)} pts
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => { setReviewLabData(null); setReviewHistory([]); startLab(lab.id); }}>
                    🔁 Repasar Laboratorio
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setReviewLabData(null); setReviewHistory([]); setView('dashboard'); }}>
                    Volver al Dashboard
                  </button>
                </div>

              </div>
            );
          })()}
        </main>
      )}

    </div>
  );
}
