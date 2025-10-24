import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  yucatanHistoricalData, 
  yucatanAgriculturalData, 
  yucatanBiodiversityData, 
  yucatanTourismData 
} from '../data/yucatanData';
import { 
  Thermometer, 
  CloudRain, 
  Wind, 
  Sun, 
  Eye, 
  Gauge,
  Wheat,
  Bug,
  Camera,
  Waves,
  TreePine
} from 'lucide-react';

interface YucatanDataDisplayProps {
  selectedLocation: string | null;
  selectedYear: number;
  selectedMonth: number;
}

export function YucatanDataDisplay({ 
  selectedLocation, 
  selectedYear, 
  selectedMonth 
}: YucatanDataDisplayProps) {
  // Obtener datos del año y mes seleccionados
  const yearData = yucatanHistoricalData[selectedYear] || yucatanHistoricalData[2023];
  const monthlyData = yearData[selectedMonth];
  
  const agriculturalData = yucatanAgriculturalData[selectedMonth] || yucatanAgriculturalData[0];
  const biodiversityData = yucatanBiodiversityData[selectedMonth] || yucatanBiodiversityData[0];
  const tourismData = yucatanTourismData[selectedMonth] || yucatanTourismData[0];

  if (!monthlyData) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          No hay datos disponibles para {selectedYear}/{selectedMonth + 1}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          Datos Climáticos Detallados - Yucatán
        </h3>
        <Badge variant="outline">
          {new Date(selectedYear, selectedMonth).toLocaleDateString('es-ES', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </Badge>
      </div>

      {selectedLocation && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm">
            <span className="font-medium">Ubicación:</span> {selectedLocation}
          </p>
        </Card>
      )}

      {/* Datos climáticos principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Thermometer className="h-8 w-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm text-muted-foreground">Temperatura</p>
              <p className="text-xl font-medium">{monthlyData.temperature}°C</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <CloudRain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-muted-foreground">Precipitación</p>
              <p className="text-xl font-medium">{monthlyData.precipitation}mm</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Wind className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Humedad</p>
              <p className="text-xl font-medium">{monthlyData.humidity}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Sun className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm text-muted-foreground">Índice UV</p>
              <p className="text-xl font-medium">{monthlyData.uvIndex}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Datos climáticos adicionales */}
      <Card className="p-4">
        <h4 className="font-medium mb-4">Condiciones Atmosféricas Adicionales</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Wind className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-muted-foreground">Viento</p>
              <p className="font-medium">{monthlyData.windSpeed} km/h</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Gauge className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-muted-foreground">Presión</p>
              <p className="font-medium">{monthlyData.pressure} hPa</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-muted-foreground">Visibilidad</p>
              <p className="font-medium">{monthlyData.visibility} km</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Thermometer className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-muted-foreground">Punto de rocío</p>
              <p className="font-medium">{monthlyData.dewPoint}°C</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Datos agrícolas */}
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Wheat className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h4 className="font-medium">Estado Agrícola</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Henequén</span>
                <span>{agriculturalData.crops.henequen.health}%</span>
              </div>
              <Progress value={agriculturalData.crops.henequen.health} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Maíz</span>
                <span>{agriculturalData.crops.corn.health}%</span>
              </div>
              <Progress value={agriculturalData.crops.corn.health} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Cítricos</span>
                <span>{agriculturalData.crops.citrus.health}%</span>
              </div>
              <Progress value={agriculturalData.crops.citrus.health} className="h-2" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Humedad del suelo:</span>
              <p className="font-medium">{agriculturalData.soilMoisture}%</p>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground">Riesgo de plagas:</span>
              <p className="font-medium">{agriculturalData.pestRisk}%</p>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground">Producción de miel:</span>
              <p className="font-medium">{agriculturalData.crops.honey.production}%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Datos de biodiversidad */}
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Bug className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h4 className="font-medium">Biodiversidad</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Flamencos</p>
            <p className="text-xl font-medium">{biodiversityData.flamingos.population.toLocaleString()}</p>
            <Badge variant="outline" className="text-xs mt-1">
              {biodiversityData.flamingos.status}
            </Badge>
          </div>
          
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Avistamientos de jaguar</p>
            <p className="text-xl font-medium">{biodiversityData.jaguars.sightings}</p>
            <p className="text-xs text-muted-foreground">Hábitat: {biodiversityData.jaguars.habitat}%</p>
          </div>
          
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Especies de mariposas</p>
            <p className="text-xl font-medium">{biodiversityData.butterflies.species}</p>
            <Badge variant="outline" className="text-xs mt-1">
              {biodiversityData.butterflies.migration}
            </Badge>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Waves className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <div>
              <p className="text-sm text-muted-foreground">Cenotes - Nivel de agua</p>
              <p className="font-medium">{biodiversityData.cenotes.waterLevel}% - {biodiversityData.cenotes.quality}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TreePine className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Manglares</p>
              <p className="font-medium">{biodiversityData.mangroves.coverage}% cobertura - {biodiversityData.mangroves.health}% salud</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Datos de turismo */}
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-medium">Condiciones Turísticas</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Condiciones de playas</p>
            <p className="font-medium">{tourismData.beachConditions}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Visitantes sitios arqueológicos</p>
            <p className="font-medium">{tourismData.archeologicalSites.visitors.toLocaleString()}</p>
            <Badge variant="outline" className="text-xs mt-1">
              {tourismData.archeologicalSites.condition}
            </Badge>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Actividad ecoturística</p>
            <p className="font-medium">{tourismData.ecoTourism.activity}%</p>
            <p className="text-xs text-muted-foreground">Sustentabilidad: {tourismData.ecoTourism.sustainability}%</p>
          </div>
        </div>
        
        {tourismData.weatherAlerts.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
              Alertas meteorológicas:
            </p>
            <div className="flex flex-wrap gap-1">
              {tourismData.weatherAlerts.map((alert, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {alert}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}