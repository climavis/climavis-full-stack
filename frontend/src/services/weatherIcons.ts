/**
 * Weather Icon Mapper
 * Maps weather conditions to icons from "widget clima" folder
 */

export interface WeatherIconConfig {
  path: string;
  alt: string;
}

/**
 * Get weather icon based on weather code and time of day
 * @param weatherCode - WMO Weather code
 * @param isDay - Whether it's daytime (1) or nighttime (0)
 * @returns Icon configuration object
 */
export function getWeatherIcon(weatherCode: number, isDay: number = 1): WeatherIconConfig {
  const isDaytime = isDay === 1;
  
  // Clear sky
  if (weatherCode === 0) {
    return {
      path: isDaytime 
        ? '/weather-icons/Día - Soleado.svg'
        : '/weather-icons/Noche - Luna Llena.svg',
      alt: isDaytime ? 'Día soleado' : 'Noche despejada'
    };
  }
  
  // Mainly clear, partly cloudy
  if (weatherCode === 1 || weatherCode === 2) {
    return {
      path: isDaytime
        ? '/weather-icons/Día - Nube.svg'
        : '/weather-icons/Noche - Nube.svg',
      alt: 'Parcialmente nublado'
    };
  }
  
  // Overcast
  if (weatherCode === 3) {
    return {
      path: isDaytime
        ? '/weather-icons/Día - Nublado.svg'
        : '/weather-icons/Noche - Nublado.svg',
      alt: 'Nublado'
    };
  }
  
  // Fog
  if (weatherCode >= 45 && weatherCode <= 48) {
    return {
      path: isDaytime
        ? '/weather-icons/Día - Nublado.svg'
        : '/weather-icons/Noche - Nublado-1.svg',
      alt: 'Niebla'
    };
  }
  
  // Drizzle
  if (weatherCode >= 51 && weatherCode <= 57) {
    return {
      path: '/weather-icons/Día - Lluvia.svg',
      alt: 'Llovizna'
    };
  }
  
  // Rain
  if (weatherCode >= 61 && weatherCode <= 67) {
    return {
      path: '/weather-icons/Dia y Noche - Lluvia.svg',
      alt: 'Lluvia'
    };
  }
  
  // Snow
  if (weatherCode >= 71 && weatherCode <= 77) {
    return {
      path: '/weather-icons/Día - Frío.svg',
      alt: 'Nieve'
    };
  }
  
  // Rain showers
  if (weatherCode >= 80 && weatherCode <= 82) {
    return {
      path: '/weather-icons/Día - Lluvia.svg',
      alt: 'Chubascos'
    };
  }
  
  // Snow showers
  if (weatherCode === 85 || weatherCode === 86) {
    return {
      path: '/weather-icons/Día - Frío.svg',
      alt: 'Chubascos de nieve'
    };
  }
  
  // Thunderstorm
  if (weatherCode >= 95 && weatherCode <= 99) {
    return {
      path: '/weather-icons/Día y Noche - Lluvia con relámpagos.svg',
      alt: 'Tormenta eléctrica'
    };
  }
  
  // Default
  return {
    path: isDaytime
      ? '/weather-icons/Día - Nube.svg'
      : '/weather-icons/Noche - Nube.svg',
    alt: 'Clima'
  };
}

/**
 * Get weather description in Spanish
 */
export function getWeatherDescription(weatherCode: number): string {
  const descriptions: { [key: number]: string } = {
    0: 'Despejado',
    1: 'Mayormente despejado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Neblina',
    48: 'Niebla',
    51: 'Llovizna ligera',
    53: 'Llovizna moderada',
    55: 'Llovizna intensa',
    61: 'Lluvia ligera',
    63: 'Lluvia moderada',
    65: 'Lluvia intensa',
    71: 'Nevada ligera',
    73: 'Nevada moderada',
    75: 'Nevada intensa',
    80: 'Chubascos ligeros',
    81: 'Chubascos moderados',
    82: 'Chubascos intensos',
    85: 'Chubascos de nieve ligeros',
    86: 'Chubascos de nieve intensos',
    95: 'Tormenta eléctrica',
    96: 'Tormenta con granizo ligero',
    99: 'Tormenta con granizo intenso'
  };
  
  return descriptions[weatherCode] || 'Condiciones variables';
}

/**
 * Get icon for forecast card (simplified)
 */
export function getForecastIcon(weatherCode: number): string {
  if (weatherCode === 0) return '/weather-icons/Día - Soleado.svg';
  if (weatherCode <= 3) return '/weather-icons/Día - Nube.svg';
  if (weatherCode >= 45 && weatherCode <= 48) return '/weather-icons/Día - Nublado.svg';
  if (weatherCode >= 51 && weatherCode <= 67) return '/weather-icons/Dia y Noche - Lluvia.svg';
  if (weatherCode >= 71 && weatherCode <= 77) return '/weather-icons/Día - Frío.svg';
  if (weatherCode >= 80 && weatherCode <= 86) return '/weather-icons/Día - Lluvia.svg';
  if (weatherCode >= 95) return '/weather-icons/Día y Noche - Lluvia con relámpagos.svg';
  
  return '/weather-icons/Día - Nube.svg';
}
