/**
 * Servicio de API para conectar con el backend
 */

// Obtener la IP del servidor backend dinámicamente
const API_BASE_URL = `http://${window.location.hostname}:8000`;

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
    if (options?.mes) params.append('mes', options.mes.toString());
    if (options?.anio) params.append('anio', options.anio.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/clima?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<ClimateData[]> = await response.json();
    return result.data;
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
  anio?: number
): Promise<ClimateStats> {
  try {
    const params = new URLSearchParams({ estado });
    if (anio) params.append('anio', anio.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/clima/stats?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<ClimateStats> = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching climate stats:', error);
    throw error;
  }
}

/**
 * Obtiene el último dato disponible para un estado
 */
export async function getLatestClimateData(estado: string): Promise<ClimateData | null> {
  try {
    const data = await getClimateData(estado, { limit: 1 });
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching latest climate data:', error);
    return null;
  }
}

/**
 * Obtiene datos climáticos para un año completo
 */
export async function getYearlyClimateData(
  estado: string,
  anio: number
): Promise<ClimateData[]> {
  return getClimateData(estado, { anio, limit: 366 });
}

/**
 * Obtiene datos climáticos para un mes específico
 */
export async function getMonthlyClimateData(
  estado: string,
  mes: number,
  anio: number
): Promise<ClimateData[]> {
  return getClimateData(estado, { mes, anio, limit: 31 });
}
