/**
 * Servicio de API para conectar con el backend FastAPI
 * Optimizado: usa endpoints agregados para reducir llamadas al servidor.
 */

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

export const API_BASE_URL = resolveApiBaseUrl();

const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// ── Tipos ──────────────────────────────────────────────────────────

export interface ClimateData {
  fecha: string;
  estado: string;
  temperatura: { maxima: number; minima: number; media: number };
  precipitacion: number;
  viento: { maximo: number; medio: number };
  humedad: { maxima: number; minima: number; media: number };
}

export interface ClimateStats {
  estado: string;
  anio: number | null;
  mes: number | null;
  total_registros: number;
  temperatura: { promedio: number; maxima: number; minima: number };
  precipitacion: { promedio: number; total: number };
  humedad_promedio: number;
  viento_promedio: number;
}

export interface MonthlyData {
  month: string;
  monthNumber: number;
  temperatura: number;
  precipitacion: number;
  humedad: number;
  viento: number;
  registros: number;
}

export interface MapSummary {
  [state: string]: {
    temperatura: number | null;
    precipitacion: number | null;
    viento: number | null;
    humedad: number | null;
    registros: number;
  };
}

export interface AnnualData {
  year: number;
  temperatura: number;
  precipitacion: number;
  registros: number;
}

export interface SyncProgress {
  status: string;
  detail: string;
  progress: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

// ── Cache simple ───────────────────────────────────────────────────

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, ts: Date.now() });
}

// ── Fetch con tipos ────────────────────────────────────────────────

async function apiFetch<T>(path: string, cacheKey?: string): Promise<T> {
  if (cacheKey) {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result: ApiResponse<T> = await response.json();

  if (cacheKey) setCache(cacheKey, result.data);
  return result.data;
}

// ── Endpoints ──────────────────────────────────────────────────────

export async function getEstados(): Promise<string[]> {
  return apiFetch<string[]>('/api/estados', 'estados');
}

export async function getClimateData(
  estado: string,
  options?: { fecha?: string; mes?: number; anio?: number; limit?: number }
): Promise<ClimateData[]> {
  const params = new URLSearchParams({ estado });
  if (options?.fecha) params.append('fecha', options.fecha);
  if (options?.mes !== undefined) params.append('mes', options.mes.toString());
  if (options?.anio) params.append('anio', options.anio.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const data = await apiFetch<ClimateData[]>(`/api/clima?${params}`);
  return data.map(item => ({
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
}

export async function getClimateStats(
  estado: string,
  options?: { anio?: number; mes?: number }
): Promise<ClimateStats> {
  const params = new URLSearchParams({ estado });
  if (options?.anio) params.append('anio', options.anio.toString());
  if (options?.mes) params.append('mes', options.mes.toString());

  const key = `stats-${estado}-${options?.anio}-${options?.mes}`;
  const data = await apiFetch<ClimateStats>(`/api/clima/stats?${params}`, key);

  return {
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
}

/**
 * Obtiene resumen mensual de un año completo EN UNA SOLA LLAMADA.
 * Reemplaza las 12 llamadas individuales del endpoint anterior.
 */
export async function getYearlyMonthlyData(
  estado: string,
  anio: number
): Promise<MonthlyData[]> {
  const params = new URLSearchParams({ estado, anio: anio.toString() });
  const key = `monthly-${estado}-${anio}`;
  return apiFetch<MonthlyData[]>(`/api/clima/monthly?${params}`, key);
}

/**
 * Obtiene métricas de TODOS los estados para colorear el mapa.
 * Reemplaza las 32 llamadas individuales.
 */
export async function getMapSummary(
  anio?: number,
  mes?: number
): Promise<MapSummary> {
  const params = new URLSearchParams();
  if (anio) params.append('anio', anio.toString());
  if (mes) params.append('mes', mes.toString());

  const key = `map-${anio}-${mes}`;
  return apiFetch<MapSummary>(`/api/clima/map-summary?${params}`, key);
}

/**
 * Obtiene datos anuales para un rango de años (gráficas de tendencia).
 */
export async function getAnnualRange(
  estado: string,
  startYear: number,
  endYear: number,
): Promise<AnnualData[]> {
  const params = new URLSearchParams({
    estado,
    start_year: startYear.toString(),
    end_year: endYear.toString(),
  });
  const key = `annual-${estado}-${startYear}-${endYear}`;
  return apiFetch<AnnualData[]>(`/api/clima/annual-range?${params}`, key);
}

/**
 * Obtiene el estado de sincronización de datos.
 */
export async function getSyncStatus(): Promise<{
  progress: SyncProgress;
  states: Array<{
    state: string;
    last_synced_date: string | null;
    status: string;
    records_count: number;
  }>;
}> {
  return apiFetch('/api/sync/status');
}

/**
 * Dispara sincronización manual.
 */
export async function triggerSync(fromDate?: string): Promise<void> {
  const url = fromDate
    ? `${API_BASE_URL}/api/sync/trigger?from_date=${fromDate}`
    : `${API_BASE_URL}/api/sync/trigger`;
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Predicciones calculadas con datos del backend.
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
  historicalAverage: { temperature: number; precipitation: number };
}> {
  try {
    const currentStats = await getClimateStats(estado, { anio, mes });

    // Promedio histórico: 5 años previos
    const historicalYears = Array.from({ length: 5 }, (_, i) => anio - 5 + i).filter(y => y < anio);
    const historicalData = await Promise.all(
      historicalYears.map(y => getClimateStats(estado, { anio: y, mes }).catch(() => null))
    );

    const valid = historicalData.filter(Boolean) as ClimateStats[];

    const historicalAvgTemp = valid.length > 0
      ? valid.reduce((s, d) => s + d.temperatura.promedio, 0) / valid.length
      : currentStats.temperatura.promedio;

    const historicalAvgPrecip = valid.length > 0
      ? valid.reduce((s, d) => s + d.precipitacion.promedio, 0) / valid.length
      : currentStats.precipitacion.promedio;

    const temperatureChange = currentStats.temperatura.promedio - historicalAvgTemp;
    const precipitationChange = historicalAvgPrecip > 0
      ? ((currentStats.precipitacion.promedio - historicalAvgPrecip) / historicalAvgPrecip) * 100
      : 0;

    const droughtRisk = Math.min(100, Math.max(0,
      (100 - (currentStats.precipitacion.promedio / Math.max(historicalAvgPrecip, 1)) * 100) * 0.6 +
      (temperatureChange > 0 ? temperatureChange * 10 : 0) * 0.4
    ));

    const floodRisk = Math.min(100, Math.max(0,
      currentStats.precipitacion.promedio > historicalAvgPrecip * 1.5
        ? ((currentStats.precipitacion.promedio / historicalAvgPrecip) - 1) * 50
        : 20
    ));

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
      historicalAverage: { temperature: historicalAvgTemp, precipitation: historicalAvgPrecip },
    };
  } catch {
    return {
      temperatureChange: 0,
      precipitationChange: 0,
      droughtRisk: 50,
      floodRisk: 50,
      extremeWeatherRisk: 50,
      historicalAverage: { temperature: 25, precipitation: 50 },
    };
  }
}
