/**
 * Servicio de API para conectar con el backend FastAPI
 */

// Obtener la URL base del backend dinámicamente, permitiendo override via env
const DEFAULT_BACKEND_PORT = 8000;

const resolveApiBaseUrl = (): string => {
  const envUrl = (import.meta as any)?.env?.VITE_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length) {
    return envUrl.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.hostname}:${DEFAULT_BACKEND_PORT}`;
  }
  return `http://localhost:${DEFAULT_BACKEND_PORT}`;
};

const API_BASE_URL = resolveApiBaseUrl();

const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export interface ClimateData {
  fecha: string;
  estado: string;
  temperatura: {
    maxima: number;
    minima: number;
    media: number;
  };
  precipitacion: number;
  viento: {
    maximo: number;
    medio: number;
  };
  humedad: {
    maxima: number;
    minima: number;
    media: number;
  };
}

export interface ClimateStats {
  estado: string;
  anio: number | null;
  mes: number | null;
  total_registros: number;
  temperatura: {
    promedio: number;
    maxima: number;
    minima: number;
  };
  precipitacion: {
    promedio: number;
    total: number;
  };
  humedad_promedio: number;
  viento_promedio: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

/**
 * Obtiene la lista de todos los estados disponibles
 */
export async function getEstados(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/estados`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<string[]> = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching estados:', error);
    throw error;
  }
}

/**
 * Obtiene datos climáticos para un estado específico
 */
export async function getClimateData(
  estado: string,
  options?: {
    fecha?: string;
    mes?: number;
    anio?: number;
    limit?: number;
  }
): Promise<ClimateData[]> {
  try {
    const params = new URLSearchParams({ estado });
    
    if (options?.fecha) params.append('fecha', options.fecha);
    if (options?.mes !== undefined) params.append('mes', options.mes.toString());
    if (options?.anio) params.append('anio', options.anio.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/clima?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<ClimateData[]> = await response.json();
    return result.data.map((item) => ({
      ...item,
      temperatura: {
        maxima: toNumber(item.temperatura?.maxima),
        minima: toNumber(item.temperatura?.minima),
        media: toNumber(item.temperatura?.media),
      },
      precipitacion: toNumber(item.precipitacion),
      viento: {
        maximo: toNumber(item.viento?.maximo),
        medio: toNumber(item.viento?.medio),
      },
      humedad: {
        maxima: toNumber(item.humedad?.maxima),
        minima: toNumber(item.humedad?.minima),
        media: toNumber(item.humedad?.media),
      },
    }));
  } catch (error) {
    console.error('Error fetching climate data:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas climáticas agregadas para un estado
 */
export async function getClimateStats(
  estado: string,
  options?: {
    anio?: number;
    mes?: number;
  }
): Promise<ClimateStats> {
  try {
    const params = new URLSearchParams({ estado });
    
    if (options?.anio) params.append('anio', options.anio.toString());
    if (options?.mes) params.append('mes', options.mes.toString());
    
    const url = `${API_BASE_URL}/api/clima/stats?${params}`;
    console.log('🔍 Fetching climate stats from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<ClimateStats> = await response.json();
    console.log('✅ Climate stats received:', result);

    const data = result.data;
    const normalized: ClimateStats = {
      ...data,
      total_registros: toNumber(data.total_registros),
      temperatura: {
        promedio: toNumber(data.temperatura?.promedio),
        maxima: toNumber(data.temperatura?.maxima),
        minima: toNumber(data.temperatura?.minima),
      },
      precipitacion: {
        promedio: toNumber(data.precipitacion?.promedio),
        total: toNumber(data.precipitacion?.total),
      },
  humedad_promedio: toNumber(data.humedad_promedio),
  viento_promedio: toNumber(data.viento_promedio),
    };

    return normalized;
  } catch (error) {
    console.error('Error fetching climate stats:', error);
    throw error;
  }
}

/**
 * Obtiene datos climáticos mensuales para un año completo
 */
export async function getYearlyMonthlyData(
  estado: string,
  anio: number
): Promise<Array<{
  month: string;
  monthNumber: number;
  temperatura: number;
  precipitacion: number;
}>> {
  try {
    const monthlyData = [];
    
    // Obtener estadísticas para cada mes del año
    for (let mes = 1; mes <= 12; mes++) {
      const params = new URLSearchParams({
        estado: estado,
        anio: anio.toString(),
        mes: mes.toString()
      });
      
      const response = await fetch(`${API_BASE_URL}/api/clima/stats?${params}`);
      
      if (response.ok) {
        const result: ApiResponse<ClimateStats> = await response.json();
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        monthlyData.push({
          month: monthNames[mes - 1],
          monthNumber: mes,
          temperatura: result.data.temperatura?.promedio ? parseFloat(result.data.temperatura.promedio.toFixed(1)) : 0,
          precipitacion: result.data.precipitacion?.promedio ? parseFloat(result.data.precipitacion.promedio.toFixed(1)) : 0
        });
      }
    }
    
    return monthlyData;
  } catch (error) {
    console.error('Error fetching yearly monthly data:', error);
    throw error;
  }
}

/**
 * Verifica que el backend esté disponible
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

/**
 * Calcula las predicciones y riesgos climáticos basados en datos históricos
 */
export async function getClimatePredictions(
  estado: string,
  anio: number,
  mes: number
): Promise<{
  temperatureChange: number;
  precipitationChange: number;
  droughtRisk: number;
  floodRisk: number;
  extremeWeatherRisk: number;
  historicalAverage: {
    temperature: number;
    precipitation: number;
  };
}> {
  try {
    // Obtener datos actuales
    const currentStats = await getClimateStats(estado, { anio, mes });
    
    // Obtener promedio histórico (últimos 5 años anteriores al año seleccionado)
    const historicalYears = Array.from({ length: 5 }, (_, i) => anio - 5 + i).filter(y => y < anio);
    const historicalData = await Promise.all(
      historicalYears.map(year => 
        getClimateStats(estado, { anio: year, mes }).catch(() => null)
      )
    );
    
    // Filtrar datos válidos
    const validHistoricalData = historicalData.filter(d => d !== null) as ClimateStats[];
    
    // Calcular promedios históricos
    const historicalAvgTemp = validHistoricalData.length > 0
      ? validHistoricalData.reduce((sum, d) => sum + d.temperatura.promedio, 0) / validHistoricalData.length
      : currentStats.temperatura.promedio;
    
    const historicalAvgPrecip = validHistoricalData.length > 0
      ? validHistoricalData.reduce((sum, d) => sum + d.precipitacion.promedio, 0) / validHistoricalData.length
      : currentStats.precipitacion.promedio;
    
    // Calcular cambios
    const temperatureChange = currentStats.temperatura.promedio - historicalAvgTemp;
    const precipitationChange = historicalAvgPrecip > 0 
      ? ((currentStats.precipitacion.promedio - historicalAvgPrecip) / historicalAvgPrecip) * 100
      : 0;
    
    // Calcular riesgos
    // Riesgo de sequía: basado en baja precipitación y alta temperatura
    const droughtRisk = Math.min(100, Math.max(0,
      (100 - (currentStats.precipitacion.promedio / Math.max(historicalAvgPrecip, 1)) * 100) * 0.6 +
      (temperatureChange > 0 ? temperatureChange * 10 : 0) * 0.4
    ));
    
    // Riesgo de inundaciones: basado en alta precipitación
    const floodRisk = Math.min(100, Math.max(0,
      currentStats.precipitacion.promedio > historicalAvgPrecip * 1.5 
        ? ((currentStats.precipitacion.promedio / historicalAvgPrecip) - 1) * 50
        : 20
    ));
    
    // Riesgo de eventos extremos: basado en variabilidad de temperatura
    const tempVariability = currentStats.temperatura.maxima - currentStats.temperatura.minima;
    const extremeWeatherRisk = Math.min(100, Math.max(0,
      (tempVariability / 20) * 50 + Math.abs(temperatureChange) * 15
    ));
    
    return {
      temperatureChange,
      precipitationChange,
      droughtRisk,
      floodRisk,
      extremeWeatherRisk,
      historicalAverage: {
        temperature: historicalAvgTemp,
        precipitation: historicalAvgPrecip,
      },
    };
  } catch (error) {
    console.error('Error calculating climate predictions:', error);
    // Retornar valores por defecto en caso de error
    return {
      temperatureChange: 0,
      precipitationChange: 0,
      droughtRisk: 50,
      floodRisk: 50,
      extremeWeatherRisk: 50,
      historicalAverage: {
        temperature: 25,
        precipitation: 50,
      },
    };
  }
}
