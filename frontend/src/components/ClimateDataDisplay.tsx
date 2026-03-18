import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Thermometer, CloudRain, Wind, Droplets, Sun } from 'lucide-react';
import { getClimateStats, getYearlyMonthlyData, getClimateData, getAnnualRange, type ClimateData } from '../services/api';

interface ClimateDataDisplayProps {
  selectedState: string | null;
  selectedYear: number;
  selectedMonth: number;
}

export function ClimateDataDisplay({ selectedState, selectedYear, selectedMonth }: ClimateDataDisplayProps) {
  const [climateStats, setClimateStats] = useState<any>(null);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [dailyYearData, setDailyYearData] = useState<ClimateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempView, setTempView] = useState<'semanal' | 'mensual' | 'anual'>('mensual');
  const [precipView, setPrecipView] = useState<'semanal' | 'mensual' | 'anual'>('mensual');
  // Rango independiente para vista anual
  const [tempAnnualRange, setTempAnnualRange] = useState<{ start: number; end: number }>({ start: selectedYear, end: selectedYear });
  const [precipAnnualRange, setPrecipAnnualRange] = useState<{ start: number; end: number }>({ start: selectedYear, end: selectedYear });
  const [annualCache, setAnnualCache] = useState<Record<number, { temp?: number | null; precip?: number | null }>>({});
  const [annualLoading, setAnnualLoading] = useState(false);

  useEffect(() => {
    if (!selectedState) {
      setClimateStats(null);
      setYearlyData([]);
      setDailyYearData([]);
      setAnnualCache({});
      setTempAnnualRange({ start: new Date().getFullYear(), end: new Date().getFullYear() });
      setPrecipAnnualRange({ start: new Date().getFullYear(), end: new Date().getFullYear() });
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Obtener estadísticas del mes/año seleccionado
        const stats = await getClimateStats(selectedState, {
          anio: selectedYear,
          mes: selectedMonth + 1 // API usa 1-12, React usa 0-11
        });
        setClimateStats(stats);

        // Obtener datos mensuales de todo el año para las gráficas
        const monthlyData = await getYearlyMonthlyData(selectedState, selectedYear);
        setYearlyData(monthlyData);

        // Obtener datos diarios del año completo para agregaciones semanales/anuales
        const daily = await getClimateData(selectedState, { anio: selectedYear, limit: 400 });
        // Ordenar ascendentemente por fecha por si el backend regresa DESC
        daily.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        setDailyYearData(daily);
      } catch (err) {
        console.error('Error fetching climate data:', err);
        setError('No se pudieron cargar los datos climáticos');
      } finally {
        setLoading(false);
      }
    };

    setTempAnnualRange({ start: selectedYear, end: selectedYear });
    setPrecipAnnualRange({ start: selectedYear, end: selectedYear });
    fetchData();
  }, [selectedState, selectedYear, selectedMonth]);

  // Trae datos anuales en una sola llamada al backend
  const ensureAnnualData = async (years: number[]) => {
    if (!selectedState || !years.length) return;
    const missing = years.filter((y) => annualCache[y] === undefined);
    if (!missing.length) return;
    setAnnualLoading(true);
    try {
      const startY = Math.min(...missing);
      const endY = Math.max(...missing);
      const annualData = await getAnnualRange(selectedState, startY, endY);
      setAnnualCache((prev) => {
        const next = { ...prev } as Record<number, { temp?: number | null; precip?: number | null }>;
        for (const d of annualData) {
          next[d.year] = { temp: d.temperatura, precip: d.precipitacion };
        }
        // Mark years with no data as null so we don't re-fetch
        for (const y of missing) {
          if (next[y] === undefined) next[y] = { temp: null, precip: null };
        }
        return next;
      });
    } catch {
      // Mark all as null on error
      setAnnualCache((prev) => {
        const next = { ...prev } as Record<number, { temp?: number | null; precip?: number | null }>;
        for (const y of missing) next[y] = { temp: null, precip: null };
        return next;
      });
    } finally {
      setAnnualLoading(false);
    }
  };

  // Helper to expand a range of years into an array
  const yearsInRange = (range: { start: number; end: number }) => {
    const start = Math.min(range.start, range.end);
    const end = Math.max(range.start, range.end);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  };

  // Safety: if loading gets stuck for long, clear it (prevents permanent overlay)
  useEffect(() => {
    if (!loading) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      if (loading) {
        console.warn('[ClimateDataDisplay] Loading timed out, forcing false');
        setLoading(false);
      }
    }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [loading]);

  // Traer datos anuales cuando cambie el rango y la vista sea anual
  useEffect(() => {
    if (tempView === 'anual') {
      ensureAnnualData(yearsInRange(tempAnnualRange));
    }
  }, [tempView, tempAnnualRange, selectedState]);

  useEffect(() => {
    if (precipView === 'anual') {
      ensureAnnualData(yearsInRange(precipAnnualRange));
    }
  }, [precipView, precipAnnualRange, selectedState]);

  if (!selectedState) {
    return (
      <div className="p-8 rounded-3xl glass-card">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <Sun className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selecciona un estado en el mapa para ver los datos climáticos</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Encabezado y badge */}
        <div className="p-6 rounded-3xl glass-card">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2 w-1/2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>

          {/* Indicadores principales (4 tarjetas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl glass-card relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 w-24">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico anual de temperatura */}
        <div className="p-6 rounded-3xl glass-card">
          <Skeleton className="h-5 w-64 mb-4" />
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        </div>

        {/* Gráfico de precipitación */}
        <div className="p-6 rounded-3xl glass-card">
          <Skeleton className="h-5 w-64 mb-4" />
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-8 rounded-3xl glass-card">
        <div className="text-center text-red-600 dark:text-red-300">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const isHistorical = selectedYear <= currentYear;

  // Verificar si hay datos válidos (no todos son cero)
  const hasValidData = climateStats && (
    (climateStats.temperatura?.promedio > 0) ||
    (climateStats.precipitacion?.promedio > 0) ||
    (climateStats.humedad_promedio > 0) ||
    (climateStats.total_registros > 0)
  );

  // Valores de temperatura, precipitación y humedad del API (con un decimal)
  const temperatura = climateStats?.temperatura?.promedio?.toFixed(1) || '0.0';
  const precipitacion = climateStats?.precipitacion?.promedio?.toFixed(1) || '0.0';
  const humedad = climateStats?.humedad_promedio?.toFixed(0) || '0';
  const velocidadViento = climateStats?.viento_promedio?.toFixed(1) || '0.0';

  // Filtrar datos del año eliminando meses sin datos (todos ceros)
  const filteredYearlyData = yearlyData.filter(month => 
    month.temperatura > 0 || month.precipitacion > 0
  );

  // Helpers: ISO week number and aggregations
  const getISOWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // 1-7 (Mon-Sun)
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const weeklySeries = (() => {
    const groups = new Map<number, { tempSum: number; precipSum: number; count: number }>();
    for (const rec of dailyYearData) {
      const dt = new Date(rec.fecha + 'T00:00:00');
      const w = getISOWeek(dt);
      const g = groups.get(w) || { tempSum: 0, precipSum: 0, count: 0 };
      g.tempSum += rec.temperatura?.media || 0;
      g.precipSum += rec.precipitacion || 0;
      g.count += 1;
      groups.set(w, g);
    }
    const arr = Array.from(groups.entries()).map(([week, g]) => ({
      label: `S${String(week).padStart(2, '0')}`,
      temperatura: g.count ? parseFloat((g.tempSum / g.count).toFixed(1)) : 0,
      precipitacion: g.count ? parseFloat((g.precipSum / g.count).toFixed(1)) : 0,
      week
    }));
    // sort by week ascending
    arr.sort((a, b) => a.week - b.week);
    return arr;
  })();

  // Serie mensual basada en año global seleccionado (respeta slider de la izquierda)
  const monthlySeries = filteredYearlyData.map((m: any) => ({
    label: m.month,
    temperatura: m.temperatura,
    precipitacion: m.precipitacion,
    monthNumber: m.monthNumber,
  }));

  const avg = (nums: number[]) => nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  const annualAvgTemp = (() => {
    const values = dailyYearData.map(d => d.temperatura.media).filter(v => v && v > 0) as number[];
    const monthlyFallback = monthlySeries.map((m: { temperatura: number }) => m.temperatura).filter((v: number) => v && v > 0);
    const v = values.length ? avg(values) : avg(monthlyFallback);
    return parseFloat((v || 0).toFixed(1));
  })();
  const annualAvgPrecip = (() => {
    const values = dailyYearData.map(d => d.precipitacion).filter(v => v && v > 0) as number[];
    const monthlyFallback = monthlySeries.map((m: { precipitacion: number }) => m.precipitacion).filter((v: number) => v && v > 0);
    const v = values.length ? avg(values) : avg(monthlyFallback);
    return parseFloat((v || 0).toFixed(1));
  })();

  // Construir series anuales a partir del cache
  const annualSeriesTemp = yearsInRange(tempAnnualRange)
    .map((y) => ({ label: String(y), temperatura: annualCache[y]?.temp }))
    .filter((d) => d.temperatura !== null && d.temperatura !== undefined);

  const annualSeriesPrecip = yearsInRange(precipAnnualRange)
    .map((y) => ({ label: String(y), precipitacion: annualCache[y]?.precip }))
    .filter((d) => d.precipitacion !== null && d.precipitacion !== undefined);

  const temperatureData = tempView === 'mensual'
    ? monthlySeries.map(m => ({ label: m.label, temperatura: m.temperatura }))
    : tempView === 'semanal'
      ? weeklySeries.map(w => ({ label: w.label, temperatura: w.temperatura }))
      : annualSeriesTemp;

  const precipitationData = precipView === 'mensual'
    ? monthlySeries.map(m => ({ label: m.label, precipitacion: m.precipitacion }))
    : precipView === 'semanal'
      ? weeklySeries.map(w => ({ label: w.label, precipitacion: w.precipitacion }))
      : annualSeriesPrecip;

  return (
    <div className="space-y-6">
      {/* Mensaje cuando no hay datos */}
      {!hasValidData && (
        <div className="p-6 rounded-3xl glass-card relative overflow-hidden">
          <div className="absolute inset-0 bg-yellow-500/10" />
          <div className="relative z-10 flex items-start space-x-3">
            <Sun className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                No hay datos disponibles
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No se encontraron datos para {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][selectedMonth]} {selectedYear} en {selectedState}.
                {selectedMonth >= new Date().getMonth() && selectedYear >= currentYear && 
                  ' Este periodo aún no tiene datos registrados.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Indicadores principales */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{selectedState}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][selectedMonth]} {selectedYear}
            </p>
          </div>
          <Badge variant={isHistorical ? "secondary" : "default"} className="glass-button border-0 shadow-md">
            {isHistorical ? 'Datos Históricos' : 'Predicción'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-2">
              <Thermometer className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Temperatura</p>
                <p className="text-2xl font-medium text-gray-900 dark:text-white">{temperatura}°C</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-2">
              <CloudRain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Precipitación</p>
                <p className="text-2xl font-medium text-gray-900 dark:text-white">{precipitacion}mm</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-teal-500/20" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-2">
              <Droplets className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Humedad</p>
                <p className="text-2xl font-medium text-gray-900 dark:text-white">{humedad}%</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/20 to-gray-500/20" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-2">
              <Wind className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Velocidad de viento</p>
                <p className="text-2xl font-medium text-gray-900 dark:text-white">{velocidadViento} km/h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de temperatura con vistas */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {tempView === 'anual' ? (
              <>Temperatura promedio — {Math.min(tempAnnualRange.start, tempAnnualRange.end)}–{Math.max(tempAnnualRange.start, tempAnnualRange.end)}</>
            ) : (
              <>Temperatura promedio — {selectedYear}</>
            )}
          </h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">Vista:</span>
            <Button variant={tempView === 'semanal' ? 'default' : 'outline'} size="sm" onClick={() => setTempView('semanal')}>Semanal</Button>
            <Button variant={tempView === 'mensual' ? 'default' : 'outline'} size="sm" onClick={() => setTempView('mensual')}>Mensual</Button>
            <Button variant={tempView === 'anual' ? 'default' : 'outline'} size="sm" onClick={() => setTempView('anual')}>Anual</Button>
          </div>
        </div>
        {tempView === 'anual' && (
          <div className="mb-4 px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>Desde</span>
                  <span className="font-medium">{Math.min(tempAnnualRange.start, tempAnnualRange.end)}</span>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={2030}
                  step={1}
                  value={Math.min(tempAnnualRange.start, tempAnnualRange.end)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setTempAnnualRange((r) => ({ start: v, end: r.end }));
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>Hasta</span>
                  <span className="font-medium">{Math.max(tempAnnualRange.start, tempAnnualRange.end)}</span>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={2030}
                  step={1}
                  value={Math.max(tempAnnualRange.start, tempAnnualRange.end)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setTempAnnualRange((r) => ({ start: r.start, end: v }));
                  }}
                  className="w-full"
                />
              </div>
            </div>
            {annualLoading && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cargando promedios anuales…</p>
            )}
          </div>
        )}
        {temperatureData.length > 0 ? (
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
            <ResponsiveContainer width="100%" height={280} className="min-h-[220px] sm:min-h-[280px] lg:min-h-[320px]">
              <LineChart data={temperatureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
                <XAxis dataKey="label" stroke="currentColor" className="text-gray-600 dark:text-gray-300" />
                <YAxis stroke="currentColor" className="text-gray-600 dark:text-gray-300" />
                <Tooltip 
                  formatter={(value: any) => [`${parseFloat(value).toFixed(1)}°C`, 'Temperatura']}
                  labelFormatter={(label) => `${tempView === 'semanal' ? 'Semana' : tempView === 'mensual' ? 'Mes' : 'Año'}: ${label}`}
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="temperatura" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#dc2626' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-8 backdrop-blur-sm text-center">
            <p className="text-gray-600 dark:text-gray-300">No hay datos disponibles para este año</p>
          </div>
        )}
      </div>

      {/* Gráfico de precipitación con vistas */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {precipView === 'anual' ? (
              <>Precipitación promedio — {Math.min(precipAnnualRange.start, precipAnnualRange.end)}–{Math.max(precipAnnualRange.start, precipAnnualRange.end)}</>
            ) : (
              <>Precipitación promedio — {selectedYear}</>
            )}
          </h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">Vista:</span>
            <Button variant={precipView === 'semanal' ? 'default' : 'outline'} size="sm" onClick={() => setPrecipView('semanal')}>Semanal</Button>
            <Button variant={precipView === 'mensual' ? 'default' : 'outline'} size="sm" onClick={() => setPrecipView('mensual')}>Mensual</Button>
            <Button variant={precipView === 'anual' ? 'default' : 'outline'} size="sm" onClick={() => setPrecipView('anual')}>Anual</Button>
          </div>
        </div>
        {precipView === 'anual' && (
          <div className="mb-4 px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>Desde</span>
                  <span className="font-medium">{Math.min(precipAnnualRange.start, precipAnnualRange.end)}</span>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={2030}
                  step={1}
                  value={Math.min(precipAnnualRange.start, precipAnnualRange.end)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setPrecipAnnualRange((r) => ({ start: v, end: r.end }));
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>Hasta</span>
                  <span className="font-medium">{Math.max(precipAnnualRange.start, precipAnnualRange.end)}</span>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={2030}
                  step={1}
                  value={Math.max(precipAnnualRange.start, precipAnnualRange.end)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setPrecipAnnualRange((r) => ({ start: r.start, end: v }));
                  }}
                  className="w-full"
                />
              </div>
            </div>
            {annualLoading && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cargando promedios anuales…</p>
            )}
          </div>
        )}
        {precipitationData.length > 0 ? (
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
            <ResponsiveContainer width="100%" height={280} className="min-h-[220px] sm:min-h-[280px] lg:min-h-[320px]">
              <BarChart data={precipitationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
                <XAxis dataKey="label" stroke="currentColor" className="text-gray-600 dark:text-gray-300" />
                <YAxis stroke="currentColor" className="text-gray-600 dark:text-gray-300" />
                <Tooltip 
                  formatter={(value: any) => [`${parseFloat(value).toFixed(1)}mm`, 'Precipitación']}
                  labelFormatter={(label) => `${precipView === 'semanal' ? 'Semana' : precipView === 'mensual' ? 'Mes' : 'Año'}: ${label}`}
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
                  }}
                />
                <Bar dataKey="precipitacion" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-8 backdrop-blur-sm text-center">
            <p className="text-gray-600 dark:text-gray-300">No hay datos disponibles para este año</p>
          </div>
        )}
      </div>
    </div>
  );
}