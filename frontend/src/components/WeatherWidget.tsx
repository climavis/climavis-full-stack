import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { getWeatherData, CurrentWeather, ForecastDay } from '../services/weather';
import { Sun, Cloud, CloudRain, CloudSnow, Wind } from 'lucide-react';

interface WeatherWidgetProps {
  selectedState: string | null;
  stateCapital?: { lat: number; lng: number };
}

export function WeatherWidget({ selectedState, stateCapital }: WeatherWidgetProps) {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedState || !stateCapital) {
      setCurrentWeather(null);
      setForecast([]);
      setError(null);
      return;
    }

    // Obtener datos reales del clima usando Open-Meteo
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🌤️ Fetching weather for:', selectedState, stateCapital);
        const data = await getWeatherData(stateCapital.lat, stateCapital.lng);
        
        setCurrentWeather(data.current);
        setForecast(data.forecast);
        console.log('✅ Weather loaded successfully');
      } catch (err) {
        console.error('❌ Error loading weather:', err);
        setError('No se pudo cargar el clima en tiempo real');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [selectedState, stateCapital]);

  const getLucideWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sunny':
        return <Sun className="w-14 h-14 text-yellow-500 dark:text-yellow-400 drop-shadow-lg" strokeWidth={1.5} />;
      case 'cloudy':
        return <Cloud className="w-14 h-14 text-gray-500 dark:text-gray-400 drop-shadow-md" strokeWidth={2} />;
      case 'partly-cloudy':
        return <Cloud className="w-14 h-14 text-gray-400 dark:text-gray-300 drop-shadow-md" strokeWidth={1.5} />;
      case 'rainy':
        return <CloudRain className="w-14 h-14 text-blue-500 dark:text-blue-400 drop-shadow-md" strokeWidth={2} />;
      case 'snowy':
        return <CloudSnow className="w-14 h-14 text-cyan-400 dark:text-cyan-300 drop-shadow-md" strokeWidth={2} />;
      default:
        return <Cloud className="w-14 h-14 text-gray-500 dark:text-gray-400 drop-shadow-md" strokeWidth={2} />;
    }
  };

  const getSmallWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sunny':
        return <Sun className="w-7 h-7 text-yellow-500 dark:text-yellow-400" strokeWidth={1.5} />;
      case 'cloudy':
        return <Cloud className="w-7 h-7 text-gray-500 dark:text-gray-400" strokeWidth={2} />;
      case 'partly-cloudy':
        return <Cloud className="w-7 h-7 text-gray-400 dark:text-gray-300" strokeWidth={1.5} />;
      case 'rainy':
        return <CloudRain className="w-7 h-7 text-blue-500 dark:text-blue-400" strokeWidth={2} />;
      case 'snowy':
        return <CloudSnow className="w-7 h-7 text-cyan-400 dark:text-cyan-300" strokeWidth={2} />;
      default:
        return <Cloud className="w-7 h-7 text-gray-500 dark:text-gray-400" strokeWidth={2} />;
    }
  };

  const getSmallWeatherIconWhite = (icon: string) => {
    switch (icon) {
      case 'sunny':
        return <Sun className="w-7 h-7 text-white" strokeWidth={1.5} />;
      case 'cloudy':
        return <Cloud className="w-7 h-7 text-white" strokeWidth={2} />;
      case 'partly-cloudy':
        return <Cloud className="w-7 h-7 text-white/90" strokeWidth={1.5} />;
      case 'rainy':
        return <CloudRain className="w-7 h-7 text-white" strokeWidth={2} />;
      case 'snowy':
        return <CloudSnow className="w-7 h-7 text-white" strokeWidth={2} />;
      default:
        return <Cloud className="w-7 h-7 text-white" strokeWidth={2} />;
    }
  };

  if (!selectedState) {
    return null;
  }

  if (loading) {
    return (
      <Card className="mb-6 overflow-hidden border-0 shadow-sm">
        <div className="flex items-center justify-center bg-gradient-to-r from-gray-50 via-blue-50/50 to-gray-50 dark:from-gray-800/95 dark:via-gray-900/95 dark:to-gray-800/95 p-5">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent"></div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-200">Cargando clima...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6 overflow-hidden border-0 shadow-sm">
        <div className="flex items-center justify-center bg-gradient-to-r from-red-50 via-red-100/50 to-red-50 dark:from-gray-800/95 dark:via-gray-900/95 dark:to-gray-800/95 p-5">
          <div className="text-center">
            <div className="text-sm font-medium text-red-600 dark:text-red-300">⚠️ {error}</div>
          </div>
        </div>
      </Card>
    );
  }

  if (!currentWeather) {
    return null;
  }

  return (
    <Card className="mb-6 overflow-hidden border-0 shadow-sm">
      {/* Widget horizontal moderno */}
      <div className="relative bg-gradient-to-r from-gray-50 via-blue-50/50 to-gray-50 dark:from-gray-800/95 dark:via-gray-900/95 dark:to-gray-800/95 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 gap-6">
          {/* Clima actual - Compacto */}
          <div className="flex items-center space-x-4 min-w-fit">
            {/* Ícono grande */}
            <div className="flex-shrink-0">
              {getLucideWeatherIcon(currentWeather.icon)}
            </div>
            
            {/* Temperatura y condición */}
            <div>
              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-light tracking-tight text-gray-900 dark:text-white">
                  {currentWeather.temp}
                </span>
                <span className="text-2xl font-light text-gray-600 dark:text-gray-300">°</span>
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-200">
                {currentWeather.condition}
              </div>
            </div>

            {/* Detalles mini */}
            <div className="hidden sm:flex flex-col text-xs space-y-1 border-l border-gray-200 dark:border-gray-600 pl-4 ml-2">
              <div className="flex items-center space-x-1 text-gray-700 dark:text-gray-200">
                <span className="text-blue-500 dark:text-blue-400">📍</span>
                <span className="font-semibold">{selectedState}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <span className="flex items-center space-x-1">
                  <span>💧</span>
                  <span>{currentWeather.humidity}%</span>
                </span>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span className="flex items-center space-x-1">
                  <Wind className="w-3 h-3" />
                  <span>{currentWeather.windSpeed} km/h</span>
                </span>
              </div>
            </div>
          </div>

          {/* Pronóstico horizontal - 5 días moderno */}
          <div className="flex-1 flex items-center justify-end gap-2 overflow-x-auto">
            {forecast.map((day) => (
              <div
                key={day.date}
                className={`flex flex-col items-center px-3 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-md min-w-[75px] ${
                  day.dayName === 'Hoy'
                    ? 'bg-blue-500 dark:bg-blue-600 shadow-lg shadow-blue-500/30 dark:shadow-blue-600/30'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-600'
                }`}
                title={day.condition}
              >
                <div className={`text-xs font-semibold mb-1.5 ${
                  day.dayName === 'Hoy' 
                    ? 'text-white' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {day.dayName}
                </div>
                <div className="mb-1.5">
                  {day.dayName === 'Hoy' 
                    ? getSmallWeatherIconWhite(day.icon)
                    : getSmallWeatherIcon(day.icon)
                  }
                </div>
                <div className={`text-base font-bold ${
                  day.dayName === 'Hoy' 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {day.temp}°
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nota informativa elegante */}
        <div className="bg-gradient-to-r from-transparent via-blue-500/5 to-transparent dark:via-blue-500/10 px-3 py-1.5 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-500 dark:text-gray-300">
            <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></div>
            <span className="font-medium">Open-Meteo</span>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <span>Actualizado cada 15min</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
