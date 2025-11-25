

  # Interactive Climate Change Dashboard

  Dashboard interactivo para visualización y predicción del cambio climático en México.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Configuración de APIs Externas

  ### Google Air Quality API

  Para habilitar las funcionalidades de calidad del aire, necesitas configurar una API key de Google:

  1. Lee las instrucciones completas en [GOOGLE_AIR_QUALITY_SETUP.md](./GOOGLE_AIR_QUALITY_SETUP.md)
  2. Copia `.env.example` a `.env`
  3. Agrega tu API key en el archivo `.env`

  **Vistas disponibles con Google Air Quality API:**
  - 🗺️ **Calidad Aire (Heatmap)**: Mapa de calor de calidad del aire en tiempo real
  - 📍 **Calidad Aire (IMECA)**: Índice de calidad del aire por estado
  - 📊 **Pronóstico Aire**: Predicción de calidad del aire para 48 horas

  Sin la API key, estas vistas mostrarán datos de ejemplo o estarán deshabilitadas.
  
  