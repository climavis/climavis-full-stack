import { useState, lazy, Suspense, useEffect } from 'react';
import { StateSelector } from './components/StateSelector';
import { TimeControls } from './components/TimeControls';
import { ClimateDataDisplay } from './components/ClimateDataDisplay';
import { PredictionPanel } from './components/PredictionPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { WeatherWidget } from './components/WeatherWidget';
import { MapView } from './components/MapView';
import NewsTicker from './components/NewsTicker';
import { Button } from './components/ui/button';
import { Github } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load AppYucatan para reducir el bundle inicial
const AppYucatan = lazy(() => import('./AppYucatan'));

export default function App() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  // Debug log when state changes
  useEffect(() => {
    console.debug('[App] Selected state changed:', selectedState);
  }, [selectedState]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'yucatan'>('main');
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  // Contraer/ocultar header al desplazarse y mostrarlo al hacer scroll hacia arriba
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      // Compactar cuando se ha desplazado un poco
      setIsHeaderCompact(y > 24);
      // Ocultar al desplazarse hacia abajo; mostrar al subir
      if (Math.abs(delta) > 5) {
        setIsHeaderHidden(delta > 0 && y > 80);
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Renderizar vista de Yucatán si está seleccionada
  if (currentView === 'yucatan') {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
          </div>
        </div>
      }>
        <AppYucatan onBackToMain={() => setCurrentView('main')} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10" />
      
      {/* Header */}
      <header className={`glass-header sticky top-0 z-50 backdrop-blur-lg transition-all duration-300 ease-out will-change-transform ${isHeaderHidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between ${isHeaderCompact ? 'h-12' : 'h-16'}`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl glass-button">
                <img 
                  src={isDarkMode ? '/logo/white.svg' : '/logo/black.svg'} 
                  alt="ClimaVis Logo" 
                  className={`${isHeaderCompact ? 'h-5 w-5' : 'h-6 w-6'}`}
                />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className={`font-medium text-gray-900 dark:text-white ${isHeaderCompact ? 'text-base' : 'text-lg'}`}>climavis</h1>
                  <span className={`alpha-badge ${isHeaderCompact ? 'text-[10px]' : 'text-xs'}`}>alpha</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Visualización y Predicción del Cambio Climático</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://github.com/climavis/full-stack', '_blank')}
                className="glass-button flex items-center space-x-2 border-0"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">GitHub</span>
              </Button>
              <ThemeToggle onThemeChange={setIsDarkMode} />
            </div>
          </div>
        </div>
      </header>

      {/* News Ticker - Cinta de eventos climáticos */}
      <NewsTicker />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Map View */}
        <div className="mb-8">
          <MapView 
            selectedState={selectedState} 
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onStateSelect={setSelectedState}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Columna izquierda: Selector de estado y controles */}
          <div className="xl:col-span-1 space-y-6">
            <StateSelector
              selectedState={selectedState}
              onStateSelect={setSelectedState}
            />
            
            <TimeControls
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
            />

            <WeatherWidget selectedState={selectedState} />
          </div>

          {/* Columna central: Datos climáticos */}
          <div className="xl:col-span-2">
            <ErrorBoundary>
              <ClimateDataDisplay
                selectedState={selectedState}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
              />
            </ErrorBoundary>
          </div>

          {/* Columna derecha: Predicciones */}
          <div className="xl:col-span-1">
            <ErrorBoundary>
              <PredictionPanel
                selectedState={selectedState}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            De <span className="font-bold">Yucatán</span>, para <span className="font-bold">México</span> 🫶
          </div>
        </div>
      </footer>
    </div>
  );
}