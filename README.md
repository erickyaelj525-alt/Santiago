# Apiario Digital 🐝

Sistema web **FullStack** para la gestión de **apiarios y colmenas** dirigido a apicultores
de pequeña escala. Digitaliza el cuaderno de campo del apicultor: registro de apiarios,
inventario de colmenas, inspecciones sanitarias, cosechas de miel, tratamientos y
**alertas automáticas** de riesgo, con un indicador de **clima apícola** en tiempo real.

> Proyecto de la materia de desarrollo web (rúbrica de Proyecto Web FullStack).

---

## Problema y propuesta de valor

En México la apicultura de pequeña escala (traspatio y apiarios medianos) se documenta a
mano en cuadernos: se pierde el historial de cada colmena, no hay alertas de problemas
sanitarios (varroa, enjambrazón) ni recordatorios de inspección, y las decisiones dependen
del clima. **Apiario Digital** centraliza esa información y **convierte los datos en
alertas accionables**.

Funciones de valor agregado (van más allá del mínimo solicitado):

- **Página de inicio pública**: un panel informativo visible **antes de iniciar sesión**
  con estadísticas agregadas y anónimas de la plataforma (kg de miel, colmenas,
  inspecciones, producción mensual, tipos de miel). Consume `GET /api/publico/estadisticas`.
- **Registro del dueño con verificación por correo**: cualquier apicultor crea su
  cuenta de dueño; el sistema le envía un **código de 6 dígitos** al correo (vía Resend)
  y la cuenta queda inactiva hasta confirmarlo.
- **Roles de dueño y trabajador**: el dueño administra la operación completa y da de
  alta a sus trabajadores desde la sección **Equipo**; los trabajadores comparten la
  operación con permisos controlados (no pueden eliminar apiarios ni gestionar al equipo).
  Al dar de alta a un trabajador, se le envía **a su propio correo** un código de
  verificación para activar su cuenta.
- **Alertas inteligentes**: detecta inspecciones vencidas (> 14 días), varroa alto
  (nivel ≥ 4), riesgo de enjambrazón (celdas reales) y tratamientos sin cerrar.
- **Clima apícola** (API externa Open-Meteo): indica si las condiciones son *óptimas*,
  de *precaución* o *no recomendadas* para abrir la colmena, con pronóstico a 5 días.
- **Mapa de apiarios** con marcadores (Leaflet + OpenStreetMap).
- **Tablero analítico** con KPIs, producción mensual de miel, distribución por estado,
  actividad **por miembro del equipo**, próximas inspecciones pendientes y ranking de
  colmenas más productivas.

---

## Roles y permisos

El sistema distingue dos tipos de cuenta:

| Rol | Quién es | Puede hacer |
|-----|----------|-------------|
| **Dueño** | Propietario de la operación apícola | Todo: crear, editar y **eliminar** apiarios/colmenas, registrar inspecciones, cosechas y tratamientos, y **gestionar a sus trabajadores** |
| **Trabajador** | Cuenta que **crea el dueño** desde la sección "Equipo" | Permisos amplios: crear y editar apiarios/colmenas y registrar inspecciones, cosechas y tratamientos. **No** puede eliminar apiarios ni gestionar al equipo |

Cómo funciona por dentro:

- Cada cuenta de trabajador guarda `dueno_id` (a qué dueño pertenece). Los trabajadores
  **no tienen datos propios**: operan sobre los apiarios de su dueño.
- El backend resuelve el alcance con `propietarioId(req)` ([backend/src/utils/scope.js](backend/src/utils/scope.js)),
  de modo que todas las consultas filtran por el dueño correcto.
- Las rutas sensibles usan el middleware `requireRole('dueno')`.
- Cada inspección, cosecha y tratamiento guarda `creado_por` (autor), lo que permite
  mostrar la actividad por miembro del equipo en el dashboard.

### Verificación por correo

El **registro público crea siempre una cuenta de dueño**. Las cuentas de trabajadores
**no** se auto-registran: las da de alta el dueño desde la sección "Equipo".

**Ambos tipos de cuenta se verifican por correo** (el dueño al registrarse y el trabajador
al ser creado por el dueño). El código llega siempre al correo del **usuario dueño de la
cuenta**, nunca al del dueño que lo dio de alta:

1. La cuenta se crea **sin verificar** (`email_verificado = 0`) con un `codigo_verificacion`
   de 6 dígitos válido por 15 minutos.
2. Se envía el código mediante la API HTTP de **Resend** (`backend/src/utils/mailer.js`).
3. El usuario lo confirma en `POST /auth/verificar`; solo entonces puede iniciar sesión.

> **Desarrollo local**: si no se configuran `RESEND_API_KEY` y `RESEND_FROM`, el código
> se imprime en la consola del servidor y se devuelve como `codigo_demo`. En producción,
> el backend requiere ambas variables y falla explícitamente si faltan. Ver
> `backend/.env.example`.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite, React Router, Hooks, Fetch API, CSS (Grid/Flexbox), Recharts, Leaflet |
| Backend | Node.js + Express (API REST), JWT, Zod (validación), Helmet, CORS, rate-limit |
| Base de datos | MySQL / MariaDB (XAMPP) con `mysql2` y consultas preparadas |
| APIs externas | Open-Meteo (clima), OpenStreetMap (mapas) |
| Pruebas | Vitest + Supertest |
| CI/CD | GitHub Actions |

---

## Estructura del proyecto

```
proyecto.mx/
├── backend/
│   ├── src/
│   │   ├── config/         # env y pool de MySQL
│   │   ├── middleware/     # auth (JWT), validación (Zod), manejo de errores
│   │   ├── controllers/    # lógica de cada recurso
│   │   ├── routes/         # definición de la API REST
│   │   ├── validators/     # esquemas Zod
│   │   ├── utils/          # JWT, errores HTTP, cliente de clima
│   │   ├── app.js          # configuración de Express
│   │   └── server.js       # punto de entrada
│   ├── sql/                # schema.sql, setup.js, seed.js
│   └── tests/              # pruebas unitarias e integración
├── frontend/
│   └── src/
│       ├── api/            # cliente fetch
│       ├── context/        # AuthContext, ToastContext
│       ├── hooks/          # useAuth, useFetch
│       ├── components/     # UI reutilizable (Modal, KpiCard, WeatherWidget, mapa…)
│       ├── pages/          # vistas de la SPA
│       └── styles/         # sistema de diseño (global.css)
└── .github/workflows/      # CI
```

---

## Puesta en marcha (desarrollo)

Requisitos: **XAMPP** (MySQL/MariaDB activo), **Node.js 18+**.

### 1. Base de datos

Con MySQL de XAMPP encendido (usuario `root`, sin contraseña por defecto):

```bash
cd backend
npm install
cp .env.example .env      # ajusta credenciales si hace falta
npm run db:setup          # crea la base de datos y las tablas
npm run db:seed           # carga datos de demostración
```

### 2. Backend (API en http://localhost:4000)

```bash
cd backend
npm run dev
```

### 3. Frontend (SPA en http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

### Usuarios de demostración

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Dueño | `demo@apiario.mx` | `demo1234` |
| Trabajador | `luis@apiario.mx` | `trabajador1234` |
| Trabajador | `ana@apiario.mx` | `trabajador1234` |

---

## API REST

Base: `http://localhost:4000/api` — Rutas protegidas requieren
`Authorization: Bearer <token>`.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/publico/estadisticas` | **Público (sin token)**: estadísticas agregadas y anónimas para la página de inicio |
| POST | `/auth/register` | Registro de la cuenta del **dueño**. Crea la cuenta sin verificar y envía un código al correo |
| POST | `/auth/verificar` | Confirma el código de 6 dígitos del correo y devuelve el JWT |
| POST | `/auth/reenviar-codigo` | Reenvía un nuevo código de verificación |
| POST | `/auth/login` | Inicio de sesión (devuelve JWT). Rechaza con **403** si la cuenta no está verificada |
| GET | `/auth/me` | Usuario autenticado (incluye su rol) |
| GET/POST | `/trabajadores` | Listar / crear trabajadores (solo **dueño**). Al crear, envía un código de verificación al correo del trabajador |
| PATCH/DELETE | `/trabajadores/:id` | Cambiar contraseña / eliminar trabajador (solo **dueño**) |
| GET/POST | `/apiarios` | Listar / crear apiarios |
| GET/PUT/DELETE | `/apiarios/:id` | Detalle / editar / eliminar (eliminar solo **dueño**) |
| GET/POST | `/colmenas` | Listar (filtro `?apiario_id=`) / crear |
| GET/PUT/DELETE | `/colmenas/:id` | Detalle con historial / editar / eliminar |
| GET/POST | `/inspecciones` | Inspecciones por colmena |
| GET/POST | `/cosechas` | Cosechas de miel |
| GET/POST | `/tratamientos` | Tratamientos sanitarios |
| GET | `/dashboard` | KPIs, gráficas y alertas |
| GET | `/clima?lat=&lng=` | Clima actual y pronóstico (Open-Meteo) |

---

## Pruebas

```bash
cd backend
npm test
```

Incluye pruebas **unitarias** (esquemas de validación, JWT) y de **integración**
(registro, login, ruta protegida) con Vitest + Supertest.

---

## Mapa con los criterios de la rúbrica

| Tema del curso | Dónde se aplica |
|----------------|-----------------|
| HTML5 semántico + accesibilidad | `frontend/index.html`, componentes con `aria-*` y `alt` |
| CSS3 Grid / Flexbox + responsive | `frontend/src/styles/global.css` (mobile-first) |
| JS ES6+ (módulos, arrow, template strings) | Todo el frontend y backend |
| DOM y eventos | Formularios, modales, pestañas, toasts |
| Async / Promises / Fetch | `frontend/src/api/client.js`, `hooks/useFetch.js` |
| React: componentes y props | `frontend/src/components/*` |
| Hooks (`useState`, `useEffect`, `useContext`…) | `AuthContext`, `useFetch`, páginas |
| React Router (SPA) | `frontend/src/App.jsx` |
| Consumo de APIs externas | Clima (Open-Meteo) y mapas (Leaflet/OSM) |
| SEO y metadatos | `frontend/index.html` |
| Node.js / Express | `backend/src/*` |
| Formularios GET/POST | Rutas y validación con Zod |
| Base de datos MySQL | `backend/sql/schema.sql` |
| CRUD completo | Apiarios, colmenas, inspecciones, cosechas, tratamientos |
| API REST + JWT | `middleware/auth.js`, `utils/jwt.js` |
| Deploy / hosting | Guía de despliegue abajo |
| Git / GitHub | Repositorio versionado + commits |
| Testing automatizado | `backend/tests/*` |
| CI/CD | `.github/workflows/ci.yml` |
| Seguridad básica | bcrypt, Zod, Helmet, CORS, rate-limit, SQL parametrizado |

---

## Despliegue (resumen)

1. **Backend**: crea un **Web Service** en Render conectado al repositorio `Santiago`,
   con `backend` como Root Directory, `npm ci` como Build Command y `npm start`
   como Start Command. Configura las variables de `backend/.env` y un MySQL accesible.
   `CLIENT_URL` debe ser
   el origen público exacto del frontend (para esta publicación:
   `https://santiago-97cb.onrender.com`), sin
   ruta ni `/` final, para que CORS permita las peticiones del navegador.
2. **Correo en Render**: crea una API key en Resend y verifica el dominio del remitente.
   En el Web Service del backend agrega `RESEND_API_KEY` y `RESEND_FROM` (por ejemplo,
   `Apiario Digital <verificaciones@tu-dominio-verificado.mx>`). Los puertos SMTP no son
   necesarios; el backend envía por HTTPS a la API de Resend.
3. **Frontend**: en tu Static Site agrega `VITE_API_URL` con el prefijo `/api` y la URL
   pública que Render asigne al Web Service (por ejemplo,
   `https://mi-api.onrender.com/api`); no uses `localhost` en producción. Vite incorpora
   esta variable durante el build, así que vuelve a desplegar el frontend después de
   cambiarla. Usa `CLIENT_URL=https://santiago-97cb.onrender.com` en el backend, y vuelve
   a desplegar ambos servicios después de guardar las variables.
# Santiago
