
  # climavis - Interactive Climate Change Dashboard

Dashboard web interactivo para visualizar datos climáticos históricos y predicciones para los estados de México, con mapa interactivo usando OpenStreetMap.

## 📁 Estructura del Proyecto

```
/climate-app-root
│
├── /frontend              # Frontend React/TypeScript
│   ├── src/
│   │   ├── components/    # Componentes de React
│   │   ├── data/          # Datos estáticos
│   │   └── styles/        # Estilos CSS
│   ├── public/            # Archivos estáticos
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── /backend               # API Backend (FastAPI)
│   ├── app/
│   │   ├── models/        # Modelos de datos (SQLAlchemy)
│   │   ├── routes/        # Rutas/Endpoints de la API
│   │   ├── utils/         # Utilidades y procesamiento
│   │   └── main.py        # App principal FastAPI
│   ├── requirements.txt   # Dependencias Python
│   └── .env.example       # Configuración de ejemplo
│
├── /database             # Base de datos SQLite
│   ├── clima_historico.sqlite
│   └── scripts/          # Scripts de DB
│       ├── create_database.py
│       └── populate_data.py
│
├── /public               # Archivos estáticos
├── package.json          # Dependencias frontend
├── vite.config.ts        # Configuración Vite
└── README.md            # Este archivo
```

## 🚀 Puesta en marcha

La forma más rápida para desarrollo es usar el script único que levanta backend y frontend:

```powershell
# En Windows PowerShell, desde la raíz del proyecto
python .\start.py
```

# climavis

An interactive web application for exploring historical climate data and basic projections for the Mexican states. The frontend is implemented with React/TypeScript and Vite; the backend is a FastAPI service backed by SQLite. The map is rendered with OpenStreetMap via Leaflet.

## Architecture

```
root
├── backend/                 # FastAPI application and dependencies
│   ├── app/
│   │   ├── main.py          # FastAPI entrypoint
│   │   ├── models/          # Data models (if any)
│   │   ├── routes/          # API routes (if any)
│   │   └── utils/           # Utilities / processing
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Example configuration
│
├── frontend/                # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/      # UI components and map integration
│   │   ├── data/            # Static reference data
│   │   └── styles/          # CSS
# climavis — Interactive Climate Change Dashboard

climavis is an interactive web application for exploring historical climate observations and basic projections for the Mexican states. The frontend is implemented with React and TypeScript (Vite), and the backend is a FastAPI application backed by SQLite. Map rendering uses Leaflet with OpenStreetMap tiles.

## Project structure

```
root
├── backend/                 # FastAPI application and dependency manifest
│   ├── app/
│   │   ├── main.py          # FastAPI entrypoint
│   │   ├── models/          # Data models (SQLAlchemy or Pydantic)
│   │   ├── routes/          # API routes
│   │   └── utils/           # Utilities and data processing
│   └── requirements.txt     # Python dependencies
│
├── frontend/                # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/      # UI components and map integration
│   │   ├── data/            # Static reference data
│   │   └── styles/          # CSS
│   ├── public/
│   ├── index.html
│   └── package.json
│
├── database/                # SQLite database files and import scripts
│   └── scripts/
│
├── docker-compose.yml       # Single-container development compose
├── start.py                 # Local launcher: installs deps and starts backend + frontend
├── README.md
└── LICENSE
```

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer and npm
- Optional: Docker and Docker Compose (for single-container development)

## Quick start (single command)

The repository includes a launcher script that installs missing dependencies and starts both backend and frontend for development. From the repository root, run:

```powershell
python .\start.py
```

This command will:

- Install backend Python dependencies (from `backend/requirements.txt`) if missing.
- Install frontend Node dependencies (from `frontend/package.json`) if missing.
- Start the FastAPI backend on http://localhost:8000 (binds to 0.0.0.0).
- Start the Vite development server on http://localhost:5173 (binds to 0.0.0.0) and open the browser.

## 🖥️ Ejecutar como aplicación de escritorio (Electron)

Se incluye una configuración básica de Electron para empaquetar el frontend junto con un intento de inicializar el backend localmente.

### Desarrollo con Electron

1. Arranca primero el backend (si necesitas datos reales):
  ```powershell
  python .\start.py  # o solo backend si personalizas el script
  ```
2. En otra terminal inicia el servidor de Vite:
  ```powershell
  cd frontend
  npm run dev
  ```
3. Lanza la app de escritorio:
  ```powershell
  cd frontend
  npm run electron:dev
  ```

La variable `ELECTRON_DEV` activa la carga desde el servidor de desarrollo en `http://localhost:5173`.

### Build de producción (instalador)

```powershell
cd frontend
npm install  # asegurar dependencias
npm run build        # construye el frontend (dist)
npm run electron:build  # genera instalador en dist_electron
```

Esto usa `electron-builder` con destino NSIS para Windows. Ajusta `electron-builder.json` para agregar íconos, firma de código, o targets adicionales (dmg, AppImage, etc.).

### Características clave

- GPU deshabilitada vía `app.disableHardwareAcceleration()` para evitar problemas gráficos.
- Preload mínimo con `contextIsolation` activado (seguridad).
- Carga dinámica de URL de backend (`VITE_API_URL` en `.env`). Por defecto: `http://localhost:8000`.
- Intento best-effort de iniciar `start.py` al arrancar la app Electron si existe Python en el PATH.

### Personalizar ícono y nombre

Edita `frontend/electron-builder.json`:
```jsonc
{
  "productName": "ClimaVis Dashboard",
  "win": { "target": ["nsis"], "icon": "build/icon.ico" }
}
```
Coloca tu ícono en `frontend/build/icon.ico`.

### Seguridad y empaquetado

- No se expone Node integration en el renderer.
- Si necesitas más APIs, expórtalas de forma controlada en `electron/preload.js` usando `contextBridge`.
- Para distribuir sin backend embebido, considera empaquetar un binario Python (PyInstaller) o mover el backend a un servicio remoto y apuntar `VITE_API_URL` a ese host.

### Solución de problemas

| Problema | Posible causa | Solución |
|----------|---------------|----------|
| Ventana en blanco | Servidor Vite no iniciado en modo dev | Ejecuta `npm run dev` antes de `electron:dev` |
| Datos vacíos | Backend no iniciado o puerto distinto | Verifica que FastAPI corre en `http://localhost:8000` o ajusta `.env` |
| Instalador sin datos | Python no disponible al inicio | Pre-inicia backend manualmente o empaqueta backend |
| Ícono genérico | Falta `icon.ico` en build resources | Añade ícono y actualiza `electron-builder.json` |

---

## Manual setup

### Frontend (development)

```bash
cd frontend
npm install
npm run dev
```

To produce a production build:

```bash
npm run build
```

### Backend (development)

```bash
cd backend
python -m venv venv

# Activate virtual environment (Windows PowerShell)
venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env    # Windows PowerShell
# or: cp .env.example .env  (macOS / Linux)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Database

Create the database and optionally populate it with sample data:

```bash
cd database/scripts
python create_database.py
python populate_data.py   # optional
```

## Docker (single-container development)

The project includes a root-level `Dockerfile` and a `docker-compose.yml` that create a single development container. The container runs `python start.py`, which launches both the backend and the frontend dev server.

Start with:

```powershell
docker compose up --build
```

Notes:

- The repository is mounted into the container to enable live reload.
- A named Docker volume stores `frontend/node_modules` so host files are not modified.
- File watching inside the container uses polling to improve reliability on Windows hosts.
- Configure mapped ports with `BACKEND_PORT` and `FRONTEND_PORT` environment variables.

## API endpoints

Base URL: `http://localhost:8000`

### GET `/`
Basic API information.

### GET `/api/estados`
Returns the list of available states.

### GET `/api/clima`
Returns historical climate observations. Query parameters:

- `estado` (required): state name as stored in the database
- `fecha` (optional): ISO date `YYYY-MM-DD`
- `mes` (optional): month (1–12)
- `anio` (optional): year
- `limit` (optional): number of records to return (default: 365)

### GET `/api/clima/stats`
Aggregated climate statistics per state. Query parameters:

- `estado` (required)
- `anio` (optional)

Refer to `backend/app/main.py` for the definitive list of routes and request/response shapes.

## Configuration

Environment variables and configuration are documented in `backend/.env.example`. Notable settings:

- `DATABASE_URL` — connection string for SQLite or another supported database
- `CORS_ORIGINS` — permitted origins for cross-origin requests

The frontend’s API base is derived from the current hostname and port (see `frontend/src/services/api.ts`). Adjust `BACKEND_URL` when deploying behind a proxy.

## Development notes

- Map rendering uses Leaflet with OpenStreetMap tiles as the primary source. Additional tile layers are configured as fallbacks.
- A native HTML `<select>` is used for state selection to avoid overlay and z-index issues in constrained layouts.
- When running via `start.py` or inside the provided Docker container, the frontend dev server is bound to `0.0.0.0` on port 5173.

## License

This project is released under the MIT License. See the `LICENSE` file for details.
