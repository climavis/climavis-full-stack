import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Gauge } from 'lucide-react';
import { Badge } from './ui/badge';
import { getWeatherData, CurrentWeather, ForecastDay } from '../services/weather';

interface WeatherWidgetProps {
  selectedState: string | null;
}

// Coordenadas de las capitales de cada estado
const stateCoordinates: Record<string, { lat: number; lng: number }> = {
  'AGUASCALIENTES': { lat: 21.8853, lng: -102.2916 },
  'BAJA CALIFORNIA': { lat: 32.6245, lng: -115.4523 },
  'BAJA CALIFORNIA SUR': { lat: 24.1426, lng: -110.3128 },
  'CAMPECHE': { lat: 19.8301, lng: -90.5349 },
  'CHIAPAS': { lat: 16.7516, lng: -93.1029 },
  'CHIHUAHUA': { lat: 28.6353, lng: -106.0889 },
  'CDMX': { lat: 19.4326, lng: -99.1332 },
  'COAHUILA': { lat: 25.4232, lng: -100.9946 },
  'COLIMA': { lat: 19.2452, lng: -103.7241 },
  'DURANGO': { lat: 24.0277, lng: -104.6532 },
  'ESTADO DE MEXICO': { lat: 19.2826, lng: -99.6557 },
  'GUANAJUATO': { lat: 21.0190, lng: -101.2574 },
  'GUERRERO': { lat: 17.5506, lng: -99.5024 },
  'HIDALGO': { lat: 20.1220, lng: -98.7325 },
  'JALISCO': { lat: 20.6597, lng: -103.3496 },
  'MICHOACAN': { lat: 19.7060, lng: -101.1948 },
  'MORELOS': { lat: 18.9261, lng: -99.2336 },
  'NAYARIT': { lat: 21.5088, lng: -104.8941 },
  'NUEVO LEON': { lat: 25.6866, lng: -100.3161 },
  'OAXACA': { lat: 17.0732, lng: -96.7266 },
  'PUEBLA': { lat: 19.0414, lng: -98.2063 },
  'QUERETARO': { lat: 20.5888, lng: -100.3899 },
  'QUINTANA ROO': { lat: 18.5036, lng: -88.3059 },
  'SAN LUIS POTOSI': { lat: 22.1565, lng: -100.9855 },
  'SINALOA': { lat: 24.8091, lng: -107.3940 },
  'SONORA': { lat: 29.0729, lng: -110.9559 },
  'TABASCO': { lat: 17.9892, lng: -92.9475 },
  'TAMAULIPAS': { lat: 23.7369, lng: -99.1411 },
  'TLAXCALA': { lat: 19.3139, lng: -98.2404 },
  'VERACRUZ': { lat: 19.5438, lng: -96.9102 },
  'YUCATAN': { lat: 20.9674, lng: -89.5926 },
  'ZACATECAS': { lat: 22.7709, lng: -102.5832 },
};

export function WeatherWidget({ selectedState }: WeatherWidgetProps) {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedState) {
      setCurrentWeather(null);
      setForecast([]);
      return;
    }

    const coordinates = stateCoordinates[selectedState];
    if (!coordinates) {
      setError(`No se encontraron coordenadas para ${selectedState}`);
      return;
    }

    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`🌤️ Fetching weather for ${selectedState}...`, coordinates);
        
        const data = await getWeatherData(coordinates.lat, coordinates.lng);
        setCurrentWeather(data.current);
        setForecast(data.forecast);
        
        console.log('✅ Weather data loaded:', data);
      } catch (err) {
        console.error('❌ Error loading weather:', err);
        setError('Error al cargar datos del clima');
      } finally {
        setLoading(false);
      }
    };

    // Fetch inicial
    fetchWeather();

    // Actualizar cada 15 minutos (900000 ms)
    const interval = setInterval(fetchWeather, 900000);

    return () => clearInterval(interval);
  }, [selectedState]);

  const getWeatherIcon = (icon: string, size: string = 'h-8 w-8') => {
    switch (icon) {
      case 'sunny':
        return <Sun className={`${size} text-yellow-500`} />;
      case 'cloudy':
        return <Cloud className={`${size} text-gray-400 dark:text-gray-300`} />;
      case 'partly-cloudy':
        // Usar solo el icono de nube para parcialmente nublado
        return <Cloud className={`${size} text-gray-400 dark:text-gray-300`} />;
      case 'rainy':
        return <CloudRain className={`${size} text-blue-500`} />;
      case 'snowy':
        return <Cloud className={`${size} text-blue-300`} />;
      default:
        return <Cloud className={`${size} text-gray-400`} />;
    }
  };

  if (!selectedState) {
    return (
      <div className="p-8 rounded-3xl glass-card">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selecciona un estado para ver el clima actual</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 rounded-3xl glass-card">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Cargando datos del clima...</p>
        </div>
      </div>
    );
  }

  if (error || !currentWeather) {
    return (
      <div className="p-8 rounded-3xl glass-card">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{error || 'No se pudieron cargar los datos del clima'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clima actual */}
      <div className="p-6 rounded-3xl glass-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-600/10" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">{selectedState}</h3>
              <Badge variant="secondary" className="glass-button border-0">
                Clima Actual
              </Badge>
            </div>
            {getWeatherIcon(currentWeather.icon, 'h-16 w-16')}
          </div>

          <div className="mb-4">
            <div className="text-5xl font-light text-gray-900 dark:text-white mb-1">
              {currentWeather.temp > 0 ? '+' : ''}{currentWeather.temp}°C
            </div>
            <div className="text-base text-gray-600 dark:text-gray-300">
              {currentWeather.condition}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex flex-col items-start">
              <div className="flex items-center space-x-1 mb-1">
                <Wind className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Viento</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentWeather.windSpeed} m/s
              </span>
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center space-x-1 mb-1">
                <Droplets className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Humedad</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentWeather.humidity}%
              </span>
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center space-x-1 mb-1">
                <Gauge className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Sensación</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentWeather.feelsLike}°C
              </span>
            </div>
          </div>

          {/* Información adicional */}
          <div className="border-t border-gray-200 dark:border-white/10 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Precipitación</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentWeather.precipitation} mm
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dirección viento</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentWeather.windDirection}°
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pronóstico semanal */}
      <div className="p-6 rounded-3xl glass-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10" />
        
        <div className="relative z-10">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Pronóstico de 7 días
          </h4>
          {forecast.length > 0 ? (
            <div className="space-y-3">
              {forecast.map((day, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl glass-card"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                    {day.dayName}
                  </span>
                  <div className="flex-1 flex justify-center">
                    {getWeatherIcon(day.icon, 'h-6 w-6')}
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {day.maxTemp > 0 ? '+' : ''}{day.maxTemp}°C
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {day.minTemp > 0 ? '+' : ''}{day.minTemp}°C
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-300 py-4">
              <p className="text-sm">No hay pronóstico disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
