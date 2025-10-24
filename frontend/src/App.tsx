import { useState } from 'react';
import { MapComponent } from './components/MapComponent';
import { MapErrorBoundary } from './components/MapErrorBoundary';
import { StateSelector } from './components/StateSelector';
import { TimeControls } from './components/TimeControls';
import { ClimateDataDisplay } from './components/ClimateDataDisplay';
import { PredictionPanel } from './components/PredictionPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { Database, TrendingUp, MapPin, CloudSun } from 'lucide-react';
import AppYucatan from './AppYucatan';

export default function App() {
  // Preseleccionamos un estado con datos para que la vista central no aparezca vacía
  const [selectedState, setSelectedState] = useState<string | null>('Aguascalientes');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'yucatan'>('main');

  // Renderizar vista de Yucatán si está seleccionada
  if (currentView === 'yucatan') {
    return <AppYucatan onBackToMain={() => setCurrentView('main')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b shadow-sm dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img
                src={isDarkMode ? "/assets/white.svg" : "/assets/black.svg"}
                alt="ClimaVis Logo"
                className="h-8 w-8"
              />
              <div>
                <h1
                  className="text-gray-900 dark:text-white"
                  style={{
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontWeight: 300,
                    textTransform: 'lowercase',
                  }}
                >
                  climavis
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Visualización y Predicción del Cambio Climático</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <TooltipProvider>
                {/* Botón OpenStreetMap */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                      onClick={() => window.open('https://www.openstreetmap.org/', '_blank')}
                    >
                      <MapPin className="h-3 w-3" />
                      <span className="hidden sm:inline">OpenStreetMap</span>
                      <span className="sm:hidden">OSM</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium mb-1">Mapa Base</p>
                    <p className="text-xs text-muted-foreground">
                      Usamos los servidores de OpenStreetMap para renderizar el mapa interactivo de México. 
                      Haz clic para visitar su sitio web.
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Botón Open-Meteo */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                      onClick={() => window.open('https://open-meteo.com/', '_blank')}
                    >
                      <CloudSun className="h-3 w-3" />
                      <span className="hidden sm:inline">Open-Meteo</span>
                      <span className="sm:hidden">Meteo</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium mb-1">Datos Meteorológicos</p>
                    <p className="text-xs text-muted-foreground">
                      Utilizamos la API de Open-Meteo para obtener datos climáticos históricos (2000-2025) y pronósticos en tiempo real. 
                      Haz clic para visitar su sitio web.
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Badge de Predicciones IA */}
                <Badge variant="outline" className="hidden md:flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Predicciones IA</span>
                </Badge>
              </TooltipProvider>
              
              <ThemeToggle onThemeChange={setIsDarkMode} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel de información */}
        <Card className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-green-500 dark:from-blue-600 dark:to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium mb-2">
                ClimaVis - Dashboard Interactivo de Cambio Climático
              </h2>
              <p className="text-blue-100 dark:text-blue-200">
                Explora datos históricos y predicciones climáticas para todos los estados de México. 
                Utiliza los controles temporales para navegar a través del tiempo y descubrir tendencias climáticas.
              </p>
            </div>
            <div className="text-right hidden lg:block">
              <div className="text-2xl font-medium">
                30+
              </div>
              <div className="text-sm text-blue-100 dark:text-blue-200">Estados disponibles</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Columna izquierda: Selector, Mapa y Controles */}
          <div className="xl:col-span-1 space-y-6">
            <StateSelector
              selectedState={selectedState}
              onStateSelect={setSelectedState}
            />
            <MapErrorBoundary>
              <MapComponent
                selectedState={selectedState}
                onStateSelect={setSelectedState}
              />
            </MapErrorBoundary>
            
            <TimeControls
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
            />
          </div>

          {/* Columna central: Datos climáticos */}
          <div className="xl:col-span-2">
            <ClimateDataDisplay
              selectedState={selectedState}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          </div>

          {/* Columna derecha: Predicciones */}
          <div className="xl:col-span-1">
            <PredictionPanel
              selectedState={selectedState}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          </div>
        </div>

        <div className="h-8"></div>

        {/* Footer con información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Datos Históricos</h4>
            <p className="text-sm text-muted-foreground">
              Los datos históricos abarcan desde el año 2000 hasta 2025, 
              basados en registros meteorológicos oficiales.
            </p>
          </Card>
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Predicciones Climáticas</h4>
            <p className="text-sm text-muted-foreground">
              Las predicciones utilizan modelos de inteligencia artificial 
              para proyectar cambios hasta el año 2030.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}