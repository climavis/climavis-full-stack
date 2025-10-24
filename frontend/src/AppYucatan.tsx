import { useState } from 'react';
import { YucatanMapComponent } from './components/YucatanMapComponent';
import { TimeControls } from './components/TimeControls';
import { YucatanDataDisplay } from './components/YucatanDataDisplay';
import { DisasterPanel } from './components/DisasterPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Button } from './components/ui/button';
import { CloudSun, MapPin, AlertTriangle, BarChart3, ArrowLeft } from 'lucide-react';

interface AppYucatanProps {
  onBackToMain?: () => void;
}

export default function AppYucatan({ onBackToMain }: AppYucatanProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isDarkMode, setIsDarkMode] = useState(false);

  const currentYear = new Date().getFullYear();
  const isHistorical = selectedYear <= currentYear;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b shadow-sm dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {onBackToMain && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBackToMain}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CloudSun className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h1 className="font-medium text-gray-900 dark:text-white">ClimaVis Yucatán</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Análisis Climático Detallado del Estado</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>9 Ubicaciones</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3" />
                <span>Evaluación de Riesgos</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <BarChart3 className="h-3 w-3" />
                <span>Datos Detallados</span>
              </Badge>
              <ThemeToggle onThemeChange={setIsDarkMode} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel de información específico de Yucatán */}
        <Card className="mb-8 p-6 bg-gradient-to-r from-emerald-500 to-blue-500 dark:from-emerald-600 dark:to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium mb-2">
                ClimaVis Yucatán - Análisis Especializado
              </h2>
              <p className="text-emerald-100 dark:text-emerald-200">
                Monitoreo detallado del clima, biodiversidad, agricultura y riesgos de desastres naturales 
                para el estado de Yucatán. Incluye datos de cenotes, sitios arqueológicos y ecosistemas únicos.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-medium">
                2023
              </div>
              <div className="text-sm text-emerald-100 dark:text-emerald-200">Año base de datos</div>
            </div>
          </div>
          
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-lg font-medium">31°C</div>
              <div className="text-xs text-emerald-200">Temp. Promedio</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium">985mm</div>
              <div className="text-xs text-emerald-200">Precipitación Anual</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium">18,500</div>
              <div className="text-xs text-emerald-200">Flamencos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium">2,500+</div>
              <div className="text-xs text-emerald-200">Cenotes</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Columna izquierda: Mapa y controles */}
          <div className="xl:col-span-1 space-y-6">
            <YucatanMapComponent
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
            />
            
            <TimeControls
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
            />
          </div>

          {/* Columna central: Datos climáticos detallados */}
          <div className="xl:col-span-2">
            <YucatanDataDisplay
              selectedLocation={selectedLocation}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          </div>

          {/* Columna derecha: Evaluación de riesgos y desastres */}
          <div className="xl:col-span-1">
            <DisasterPanel
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </div>
        </div>

        <Separator className="my-8" />

        {/* Footer con información específica de Yucatán */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Cenotes Monitoreados</h4>
            <p className="text-sm text-muted-foreground">
              Sistema de seguimiento del nivel de agua y calidad de los cenotes 
              más importantes del estado.
            </p>
          </Card>
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Biodiversidad Maya</h4>
            <p className="text-sm text-muted-foreground">
              Monitoreo de especies endémicas como flamencos, jaguares y 
              mariposas en la Reserva de la Biosfera.
            </p>
          </Card>
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Agricultura Tradicional</h4>
            <p className="text-sm text-muted-foreground">
              Seguimiento de cultivos tradicionales como henequén, maíz 
              y la apicultura yucateca.
            </p>
          </Card>
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Patrimonio UNESCO</h4>
            <p className="text-sm text-muted-foreground">
              Condiciones climáticas para la preservación de sitios como 
              Chichen Itzá y Uxmal.
            </p>
          </Card>
        </div>

        {/* Información adicional sobre el estado */}
        <Card className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <h3 className="font-medium mb-3">Características Únicas de Yucatán</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">Geografía</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Península calcárea plana sin ríos superficiales</li>
                <li>• Sistema de cenotes como fuente de agua dulce</li>
                <li>• Costa norte con extensas zonas de manglares</li>
                <li>• Selva baja caducifolia en el interior</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">Clima</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Clima tropical seco con temporada de lluvias</li>
                <li>• Influencia de huracanes del Atlántico</li>
                <li>• Vientos alisios del noreste</li>
                <li>• Temperaturas estables todo el año</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}