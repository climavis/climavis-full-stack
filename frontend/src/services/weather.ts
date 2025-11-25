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

interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
}

// Mapear códigos de clima de Open-Meteo a descripciones y iconos
function getWeatherInfo(code: number, isDay: number): { condition: string; icon: string } {
  const weatherMap: Record<number, { day: string; night: string; icon: string }> = {
    0: { day: 'Despejado', night: 'Despejado', icon: 'sunny' },
    1: { day: 'Mayormente despejado', night: 'Mayormente despejado', icon: 'sunny' },
    2: { day: 'Parcialmente nublado', night: 'Parcialmente nublado', icon: 'partly-cloudy' },
    3: { day: 'Nublado', night: 'Nublado', icon: 'cloudy' },
    45: { day: 'Niebla', night: 'Niebla', icon: 'cloudy' },
    48: { day: 'Niebla con escarcha', night: 'Niebla con escarcha', icon: 'cloudy' },
    51: { day: 'Llovizna ligera', night: 'Llovizna ligera', icon: 'rainy' },
    53: { day: 'Llovizna moderada', night: 'Llovizna moderada', icon: 'rainy' },
    55: { day: 'Llovizna densa', night: 'Llovizna densa', icon: 'rainy' },
    61: { day: 'Lluvia ligera', night: 'Lluvia ligera', icon: 'rainy' },
    63: { day: 'Lluvia moderada', night: 'Lluvia moderada', icon: 'rainy' },
    65: { day: 'Lluvia fuerte', night: 'Lluvia fuerte', icon: 'rainy' },
    71: { day: 'Nevada ligera', night: 'Nevada ligera', icon: 'snowy' },
    73: { day: 'Nevada moderada', night: 'Nevada moderada', icon: 'snowy' },
    75: { day: 'Nevada fuerte', night: 'Nevada fuerte', icon: 'snowy' },
    77: { day: 'Granizo', night: 'Granizo', icon: 'snowy' },
    80: { day: 'Chubascos ligeros', night: 'Chubascos ligeros', icon: 'rainy' },
    81: { day: 'Chubascos moderados', night: 'Chubascos moderados', icon: 'rainy' },
    82: { day: 'Chubascos violentos', night: 'Chubascos violentos', icon: 'rainy' },
    85: { day: 'Chubascos de nieve ligeros', night: 'Chubascos de nieve ligeros', icon: 'snowy' },
    86: { day: 'Chubascos de nieve fuertes', night: 'Chubascos de nieve fuertes', icon: 'snowy' },
    95: { day: 'Tormenta', night: 'Tormenta', icon: 'rainy' },
    96: { day: 'Tormenta con granizo ligero', night: 'Tormenta con granizo ligero', icon: 'rainy' },
    99: { day: 'Tormenta con granizo fuerte', night: 'Tormenta con granizo fuerte', icon: 'rainy' },
  };

  const info = weatherMap[code] || { day: 'Desconocido', night: 'Desconocido', icon: 'cloudy' };
  const condition = isDay ? info.day : info.night;
  
  return { condition, icon: info.icon };
}

// Obtener nombre del día en español
function getDayName(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[date.getDay()];
}

export async function getWeatherData(lat: number, lng: number): Promise<WeatherData> {
  try {
    const url = `${OPEN_METEO_BASE_URL}/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
    
    console.log('🌤️ Fetching weather from Open-Meteo:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: OpenMeteoResponse = await response.json();
    console.log('✅ Weather data received:', data);
    
    // Procesar datos actuales
    const weatherInfo = getWeatherInfo(data.current.weather_code, data.current.is_day);
    const current: CurrentWeather = {
      temp: Math.round(data.current.temperature_2m),
      temperature: data.current.temperature_2m,
      condition: weatherInfo.condition,
      humidity: Math.round(data.current.relative_humidity_2m),
      windSpeed: Math.round(data.current.wind_speed_10m * 10) / 10,
      windDirection: data.current.wind_direction_10m,
      feelsLike: Math.round(data.current.apparent_temperature),
      icon: weatherInfo.icon,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day,
      precipitation: data.current.precipitation,
    };
    
    // Procesar pronóstico (5 días, excluyendo hoy)
    const forecast: ForecastDay[] = [];
    for (let i = 1; i < Math.min(6, data.daily.time.length); i++) {
      const weatherInfo = getWeatherInfo(data.daily.weather_code[i], 1);
      const avgTemp = Math.round((data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2);
      
      forecast.push({
        date: data.daily.time[i],
        dayName: getDayName(data.daily.time[i]),
        temp: avgTemp,
        maxTemp: Math.round(data.daily.temperature_2m_max[i]),
        minTemp: Math.round(data.daily.temperature_2m_min[i]),
        condition: weatherInfo.condition,
        icon: weatherInfo.icon,
        weatherCode: data.daily.weather_code[i],
      });
    }
    
    return { current, forecast };
  } catch (error) {
    console.error('❌ Error fetching weather data:', error);
    throw error;
  }
}
