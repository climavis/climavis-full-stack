import { useEffect, useState } from 'react';
import { getWeatherData, CurrentWeather, ForecastDay } from '../services/weather';
import { getWeatherIcon, getForecastIcon, getWeatherDescription } from '../services/weatherIcons';

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

  if (!selectedState) {
    return null;
  }

  if (loading) {
    return (
      <div className="glass-panel">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel">
        <div className="text-center py-8">
          <p className="text-caption text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentWeather) {
    return null;
  }

  const currentIcon = getWeatherIcon(currentWeather.weatherCode, currentWeather.isDay);
  const weatherDesc = getWeatherDescription(currentWeather.weatherCode);

  // Get days of week in Spanish
  const getDayName = (dateStr: string, index: number): string => {
    if (index === 0) return 'Hoy';
    if (index === 1) return 'Mañana';
    
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  return (
    <div className="glass-panel animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-heading">climavis</h3>
          <p className="text-caption opacity-60 mt-1">Actualizado cada 15 minutos</p>
        </div>
        <div className="current-weather-icon">
          <img 
            src={currentIcon.path} 
            alt={currentIcon.alt}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Current Weather Display */}
      <div className="current-weather-display mb-6">
        <div className="flex-1">
          <div className="current-weather-temp">
            {Math.round(currentWeather.temperature)}°
          </div>
          <p className="text-subheading mt-1">{weatherDesc}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* Humidity */}
          <div className="metric-card">
            <div className="metric-label">Humedad</div>
            <div className="metric-value">{currentWeather.humidity}%</div>
          </div>
          
          {/* Wind Speed */}
          <div className="metric-card">
            <div className="metric-label">Viento</div>
            <div className="metric-value">{Math.round(currentWeather.windSpeed)} km/h</div>
          </div>
        </div>
      </div>

      {/* State Info */}
      <div className="mb-6">
        <h4 className="text-heading mb-2">Mapa de México - Estados</h4>
        <p className="text-caption opacity-70">
          Selecciona un estado para ver su ubicación y datos climáticos
        </p>
        <div className="mt-3">
          <div className="text-subheading">{selectedState}</div>
          <p className="text-caption opacity-60 mt-1">
            Estado seleccionado: {selectedState}
          </p>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div>
        <h4 className="text-body font-medium mb-4">Pronóstico 5 días</h4>
        <div className="grid grid-cols-5 gap-3">
          {forecast.slice(0, 5).map((day, index) => {
            const forecastIcon = getForecastIcon(day.weatherCode);
            const isToday = index === 0;
            
            return (
              <div 
                key={day.date}
                className={`forecast-card ${isToday ? 'ring-2 ring-white/20' : ''}`}
              >
                <div className="forecast-day">
                  {getDayName(day.date, index)}
                </div>
                
                <div className="forecast-icon">
                  <img 
                    src={forecastIcon} 
                    alt={getWeatherDescription(day.weatherCode)}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="forecast-temp">
                  {Math.round(day.maxTemp)}°
                </div>
                
                <div className="text-caption opacity-60 mt-1">
                  {Math.round(day.minTemp)}°
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4">
          {/* Precipitation */}
          <div className="metric-card">
            <div className="metric-label">Precipitación</div>
            <div className="metric-value">
              {currentWeather.precipitation || 0} mm
            </div>
          </div>
          
          {/* Wind Direction */}
          <div className="metric-card">
            <div className="metric-label">Dirección del viento</div>
            <div className="metric-value text-base">
              {currentWeather.windDirection}°
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Attribution */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-caption opacity-50 text-center">
          Datos proporcionados por Open-Meteo API
        </p>
      </div>
    </div>
  );
}
