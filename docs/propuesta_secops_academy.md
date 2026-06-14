# Propuesta de Proyecto: SecOps Academy

## Título del proyecto
**SecOps Academy: Plataforma web interactiva para aprendizaje guiado de ciberseguridad en desarrollo seguro**

## Descripción general
SecOps Academy es una aplicación web educativa orientada al aprendizaje de buenas prácticas de ciberseguridad en el desarrollo de software. La plataforma permitirá a los usuarios explorar vulnerabilidades del OWASP Top 10 mediante escenarios estáticos precargados, fragmentos de código vulnerables y laboratorios interactivos guiados, donde deberán identificar fallos y seleccionar o completar la solución correcta.

El sistema no ejecutará código en tiempo real ni utilizará entornos sandbox. En su lugar, se apoyará en plantillas definidas previamente y simulaciones visuales en el frontend. De esta forma, se reduce la complejidad técnica del proyecto sin perder el enfoque educativo e interactivo.

## Problema que resuelve
La formación en ciberseguridad para desarrolladores suele ser teórica, poco visual y difícil de relacionar con errores reales de programación. Como resultado, muchos estudiantes y equipos de desarrollo no logran comprender con claridad cómo prevenir vulnerabilidades comunes en aplicaciones web.

SecOps Academy busca resolver este problema mediante una experiencia visual, guiada e interactiva, en la que el usuario pueda observar código vulnerable, analizarlo, responder actividades concretas y recibir retroalimentación inmediata sobre el impacto de una mala o buena práctica de seguridad.

## Objetivo general
Desarrollar una plataforma web educativa e interactiva que permita a los usuarios aprender conceptos fundamentales de desarrollo seguro mediante laboratorios guiados basados en vulnerabilidades comunes del OWASP Top 10.

## Objetivos específicos
- Implementar un sistema de gestión de usuarios con registro e inicio de sesión.
- Diseñar un catálogo de laboratorios precargados sobre vulnerabilidades web.
- Permitir al usuario inspeccionar fragmentos de código vulnerables y responder actividades guiadas.
- Validar respuestas mediante opciones predefinidas, coincidencia exacta o patrones simples.
- Mostrar simulaciones visuales del ataque bloqueado o exitoso según la respuesta del usuario.
- Registrar progreso, intentos y puntajes por laboratorio.
- Documentar la API REST en formato Swagger/OpenAPI YAML.

## Alcance del proyecto
El proyecto incluirá una aplicación web con autenticación básica, visualización de laboratorios, resolución de actividades guiadas, retroalimentación visual, almacenamiento de progreso del usuario y documentación de servicios REST.

En esta fase, el sistema trabajará únicamente con escenarios predefinidos. No se implementará ejecución real de código, análisis estático automatizado, ataques en vivo ni entornos de prueba aislado.

## Funcionalidades principales
- Registro e inicio de sesión de usuarios.
- Visualización de laboratorios por categoría.
- Consulta del detalle de un laboratorio.
- Inspección de fragmentos de código vulnerables.
- Resolución de actividades interactivas.
- Validación de respuestas.
- Retroalimentación inmediata.
- Simulación visual del impacto del ataque.
- Consulta de progreso, historial e insignias.
- Gestión administrativa de laboratorios precargados.

## Gamificación propuesta
Para mantener el atractivo del proyecto sin aumentar demasiado la complejidad, se propone una gamificación básica:

- **Puntos de defensa:** se otorgan al resolver correctamente un laboratorio.
- **Insignias:** se desbloquean al completar categorías específicas de vulnerabilidades.
- **Progreso visual:** barra o porcentaje de avance por usuario.
- **Retroalimentación narrativa:** el sistema muestra si la aplicación resistió o fue comprometida según la decisión tomada.

## Consola visual propuesta
La consola visual no se plantea como una terminal real, sino como una interfaz web compuesta por paneles que faciliten la interacción del usuario.

### Estructura sugerida de la interfaz
- Panel de teoría breve sobre la vulnerabilidad.
- Panel con fragmento de código vulnerable.
- Panel de respuesta del usuario.
- Panel de resultado con retroalimentación y simulación visual.

### Tipos de interacción recomendados
- Preguntas de opción múltiple.
- Selección de líneas seguras o inseguras.
- Completar fragmentos cortos de código.
- Ordenar pasos de mitigación.
- Botón para ejecutar una simulación visual del resultado.

### Estrategia de validación
Para mantener la implementación simple y funcional, la validación no será letra por letra sobre texto libre. En su lugar, se utilizarán mecanismos como:

- Coincidencia exacta en respuestas cortas.
- Lista de respuestas válidas predefinidas.
- Validación por palabras clave o patrones simples.

## Arquitectura del sistema
La solución se plantea con una arquitectura web de tres capas:

| Capa | Tecnología propuesta | Función |
|---|---|---|
| Frontend | React | Interfaz visual, laboratorios, consola y simulaciones |
| Backend | Node.js + Express | Lógica de negocio, autenticación, validación y progreso |
| Base de datos | PostgreSQL | Almacenamiento de usuarios, laboratorios, intentos y puntajes |

La comunicación entre frontend y backend se realizará mediante servicios REST documentados con OpenAPI/Swagger en formato YAML, el cual define una estructura estándar para describir endpoints, parámetros, métodos y respuestas de una API.

## Módulos del sistema
Los módulos propuestos para el sistema son los siguientes:

1. **Módulo de autenticación:** registro, inicio de sesión y control básico de acceso.
2. **Módulo de laboratorios:** listado, clasificación y detalle de actividades.
3. **Módulo de resolución:** envío y validación de respuestas.
4. **Módulo de simulación visual:** representación gráfica del resultado del laboratorio.
5. **Módulo de progreso:** puntajes, historial e insignias.
6. **Módulo administrativo:** creación y edición de laboratorios precargados.

## API REST propuesta
A continuación se presenta un conjunto inicial de endpoints que pueden ser desarrollados y documentados en Swagger/OpenAPI YAML.

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/labs` | Listar laboratorios disponibles |
| GET | `/api/labs/{id}` | Obtener detalle de un laboratorio |
| POST | `/api/labs/{id}/submit` | Enviar respuesta del laboratorio |
| GET | `/api/progress/{userId}` | Consultar progreso del usuario |
| GET | `/api/history/{userId}` | Consultar historial de intentos |
| GET | `/api/badges/{userId}` | Consultar insignias obtenidas |
| POST | `/api/admin/labs` | Crear laboratorio precargado |
| PUT | `/api/admin/labs/{id}` | Editar laboratorio precargado |

## Diagramas solicitados para el avance
De acuerdo con los entregables requeridos, la propuesta permite desarrollar los siguientes diagramas UML de manera clara y coherente.

### Diagrama de componentes
Permitirá representar la organización general del sistema mediante sus bloques principales: frontend, API REST, servicio de autenticación, servicio de validación, servicio de progreso y base de datos.

### Diagrama de secuencia
Puede modelar el flujo “resolver laboratorio”, desde que el usuario selecciona una actividad hasta que el backend valida la respuesta, guarda el intento y devuelve la retroalimentación al frontend.

### Diagrama de actividad
Puede representar el proceso completo de uso de un laboratorio: iniciar sesión, seleccionar actividad, inspeccionar código, responder, validar, mostrar resultado y actualizar progreso.

### Diagrama de clases
Permitirá definir las entidades principales del sistema y sus relaciones, como Usuario, Laboratorio, Actividad, Respuesta, Intento, Puntaje, Insignia y Administrador.

### Diagrama de casos de uso
Mostrará la interacción entre los actores principales, como Estudiante y Administrador, y las funciones esenciales del sistema: registrarse, iniciar sesión, resolver laboratorios, consultar progreso y administrar contenido.

## Clases sugeridas
Las clases principales del sistema pueden ser:

- Usuario
- Administrador
- Laboratorio
- Actividad
- Vulnerabilidad
- Respuesta
- Intento
- Puntaje
- Insignia
- Historial

## Casos de uso sugeridos
### Actor: Estudiante
- Registrarse.
- Iniciar sesión.
- Ver laboratorios.
- Consultar detalle de laboratorio.
- Resolver actividad.
- Ver retroalimentación.
- Consultar progreso.
- Ver historial.
- Obtener insignias.

### Actor: Administrador
- Iniciar sesión.
- Crear laboratorio.
- Editar laboratorio.
- Gestionar contenido.
- Consultar métricas básicas.

## Tecnologías propuestas
- **Frontend:** React
- **Backend:** Node.js con Express
- **Base de datos:** PostgreSQL
- **Documentación API:** Swagger / OpenAPI YAML
- **Control de versiones:** Git y GitHub

## Entregables del avance
Con base en los requerimientos indicados, los entregables del proyecto serán:

- Diagrama de componentes.
- Diagrama de secuencia.
- Diagrama de actividad.
- Diagrama de clases.
- Diagrama de casos de uso.
- Archivo Swagger/OpenAPI en formato YAML.
- Repositorio público en GitHub.

## Conclusión
SecOps Academy representa una reformulación más realista, clara y defendible del proyecto inicial. La nueva propuesta conserva el enfoque en ciberseguridad, mantiene un componente interactivo y visual, y al mismo tiempo reduce significativamente la complejidad técnica para ajustarse a un periodo corto de desarrollo.

Además, este alcance simplificado facilita la elaboración de los diagramas UML solicitados, permite definir una API REST concreta y documentable, y hace posible construir un prototipo funcional e interesante dentro del tiempo disponible.
