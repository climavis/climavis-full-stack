// Servicio para Open-Meteo API (sin límite de llamadas, sin API key)
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

interface OpenMeteoCurrentWeather {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  is_day: number;
  precipitation: number;
}

interface OpenMeteoDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrentWeather;
  daily: OpenMeteoDaily;
}

export interface CurrentWeather {
  temp: number;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  feelsLike: number;
  icon: string;
  weatherCode: number;
  isDay: number;
  precipitation: number;
}

export interface ForecastDay {
  date: string;
  dayName: string;
  temp: number;
  maxTemp: number;
  minTemp: number;
  condition: string;
  icon: string;
  weatherCode: number;
}

// Mapeo de códigos de clima de Open-Meteo a descripciones y iconos
function getWeatherInfo(code: number): { condition: string; icon: string } {
  const weatherMap: Record<number, { condition: string; icon: string }> = {
    0: { condition: 'Despejado', icon: 'sunny' },
    1: { condition: 'Mayormente despejado', icon: 'sunny' },
    2: { condition: 'Parcialmente nublado', icon: 'partly-cloudy' },
    3: { condition: 'Nublado', icon: 'cloudy' },
    45: { condition: 'Neblina', icon: 'cloudy' },
    48: { condition: 'Neblina con escarcha', icon: 'cloudy' },
    51: { condition: 'Llovizna ligera', icon: 'rainy' },
    53: { condition: 'Llovizna moderada', icon: 'rainy' },
    55: { condition: 'Llovizna intensa', icon: 'rainy' },
    61: { condition: 'Lluvia ligera', icon: 'rainy' },
    63: { condition: 'Lluvia moderada', icon: 'rainy' },
    65: { condition: 'Lluvia intensa', icon: 'rainy' },
    71: { condition: 'Nevada ligera', icon: 'snowy' },
    73: { condition: 'Nevada moderada', icon: 'snowy' },
    75: { condition: 'Nevada intensa', icon: 'snowy' },
    77: { condition: 'Granizo', icon: 'snowy' },
    80: { condition: 'Chubascos ligeros', icon: 'rainy' },
    81: { condition: 'Chubascos moderados', icon: 'rainy' },
    82: { condition: 'Chubascos violentos', icon: 'rainy' },
    85: { condition: 'Chubascos de nieve ligeros', icon: 'snowy' },
    86: { condition: 'Chubascos de nieve intensos', icon: 'snowy' },
    95: { condition: 'Tormenta', icon: 'rainy' },
    96: { condition: 'Tormenta con granizo ligero', icon: 'rainy' },
    99: { condition: 'Tormenta con granizo intenso', icon: 'rainy' },
  };
  
  return weatherMap[code] || { condition: 'Desconocido', icon: 'cloudy' };
}

// Obtener nombre del día en español
function getDayName(dateStr: string, isToday: boolean): string {
  if (isToday) return 'Hoy';
  
  const date = new Date(dateStr);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[date.getDay()];
}

/**
 * Obtiene el clima actual y pronóstico de 5 días para una ubicación
 * @param lat Latitud
 * @param lng Longitud
 * @returns Clima actual y pronóstico de 5 días (2 antes, hoy, 2 después)
 */
export async function getWeatherData(lat: number, lng: number): Promise<{
  current: CurrentWeather;
  forecast: ForecastDay[];
}> {
  try {
    const url = `${OPEN_METEO_BASE_URL}/forecast?` +
      `latitude=${lat}&` +
      `longitude=${lng}&` +
      `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day,precipitation&` +
      `daily=weather_code,temperature_2m_max,temperature_2m_min&` +
      `timezone=auto&` +
      `forecast_days=7`;

    console.log('🌤️ Fetching weather from Open-Meteo:', { lat, lng });

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data: OpenMeteoResponse = await response.json();

    console.log('✅ Weather data received:', data);

    // Procesar clima actual
    const weatherInfo = getWeatherInfo(data.current.weather_code);
    const current: CurrentWeather = {
      temp: Math.round(data.current.temperature_2m),
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      windDirection: Math.round(data.current.wind_direction_10m || 0),
      condition: weatherInfo.condition,
      icon: weatherInfo.icon,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day || 1,
      precipitation: data.current.precipitation || 0,
    };

    // Procesar pronóstico de 5 días (índices 2-6: 2 días antes, hoy, 2 días después)
    const today = new Date().toISOString().split('T')[0];
    const forecast: ForecastDay[] = data.daily.time.slice(2, 7).map((date, index) => {
      const actualIndex = index + 2;
      const weatherCode = data.daily.weather_code[actualIndex];
      const weatherInfo = getWeatherInfo(weatherCode);
      const isToday = date === today;
      const maxTemp = data.daily.temperature_2m_max[actualIndex];
      const minTemp = data.daily.temperature_2m_min[actualIndex];
      
      console.log(`📅 ${date}: Code=${weatherCode}, Icon=${weatherInfo.icon}, Condition=${weatherInfo.condition}`);
      
      return {
        date,
        dayName: getDayName(date, isToday),
        temp: Math.round(maxTemp),
        maxTemp: Math.round(maxTemp),
        minTemp: Math.round(minTemp),
        condition: weatherInfo.condition,
        icon: weatherInfo.icon,
        weatherCode,
      };
    });

    return { current, forecast };
  } catch (error) {
    console.error('❌ Error fetching weather data:', error);
    throw error;
  }
}

/**
 * Obtiene solo el clima actual (útil para actualizaciones más frecuentes)
 */
export async function getCurrentWeatherOnly(lat: number, lng: number): Promise<CurrentWeather> {
  try {
    const url = `${OPEN_METEO_BASE_URL}/forecast?` +
      `latitude=${lat}&` +
      `longitude=${lng}&` +
      `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day,precipitation&` +
      `timezone=auto`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data: OpenMeteoResponse = await response.json();
    const weatherInfo = getWeatherInfo(data.current.weather_code);

    return {
      temp: Math.round(data.current.temperature_2m),
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      windDirection: Math.round(data.current.wind_direction_10m || 0),
      condition: weatherInfo.condition,
      icon: weatherInfo.icon,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day || 1,
      precipitation: data.current.precipitation || 0,
    };
  } catch (error) {
    console.error('❌ Error fetching current weather:', error);
    throw error;
  }
}
