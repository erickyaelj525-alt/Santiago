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

- **Alertas inteligentes**: detecta inspecciones vencidas (> 14 días), varroa alto
  (nivel ≥ 4), riesgo de enjambrazón (celdas reales) y tratamientos sin cerrar.
- **Clima apícola** (API externa Open-Meteo): indica si las condiciones son *óptimas*,
  de *precaución* o *no recomendadas* para abrir la colmena, con pronóstico a 5 días.
- **Mapa de apiarios** con marcadores (Leaflet + OpenStreetMap).
- **Tablero analítico** con KPIs, producción mensual de miel y distribución por estado.

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

### Usuario de demostración

```
Correo:    demo@apiario.mx
Contraseña: demo1234
```

---

## API REST

Base: `http://localhost:4000/api` — Rutas protegidas requieren
`Authorization: Bearer <token>`.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registro de apicultor |
| POST | `/auth/login` | Inicio de sesión (devuelve JWT) |
| GET | `/auth/me` | Usuario autenticado |
| GET/POST | `/apiarios` | Listar / crear apiarios |
| GET/PUT/DELETE | `/apiarios/:id` | Detalle / editar / eliminar |
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

1. **Backend**: en un hosting con Node (Render, Railway, VPS) o cPanel con "Setup Node.js App".
   Configura las variables de `backend/.env` y un MySQL accesible.
2. **Frontend**: `npm run build` y publica la carpeta `dist/` en un hosting estático
   (Vercel, Netlify) apuntando `VITE_API_URL` a la URL pública del backend.
