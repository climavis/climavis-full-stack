import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Thermometer, CloudRain, Wind, Droplets } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getYearlyClimateData, getClimateStats, ClimateData, ClimateStats } from '../services/api';
import { getDbStateName, stateCapitals } from './MapComponent';
import { WeatherWidget } from './WeatherWidget';

interface ClimateDataDisplayProps {
  selectedState: string | null;
  selectedYear: number;
  selectedMonth: number;
}

export function ClimateDataDisplay({ selectedState, selectedYear, selectedMonth }: ClimateDataDisplayProps) {
  const [yearlyData, setYearlyData] = useState<ClimateData[]>([]);
  const [stats, setStats] = useState<ClimateStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedState) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Convertir nombre de estado UI a nombre de BD (MAYÚSCULAS)
        const dbStateName = getDbStateName(selectedState);
        console.log('🔍 Fetching data for:', { ui: selectedState, db: dbStateName, year: selectedYear });
        
        // Obtener datos del año completo
        const data = await getYearlyClimateData(dbStateName, selectedYear);
        console.log('✅ Yearly data received:', data.length, 'records');
        setYearlyData(data);

        // Obtener estadísticas
        const statsData = await getClimateStats(dbStateName, selectedYear);
        console.log('✅ Stats received:', statsData);
        setStats(statsData);
      } catch (err) {
        console.error('❌ Error fetching climate data:', err);
        setError(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedState, selectedYear]);

  if (!selectedState) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Thermometer className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selecciona un estado en el mapa para ver los datos climáticos</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p>Cargando datos...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    const isNoDataState = selectedState === 'Michoacán' || selectedState === 'Nayarit';
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-3">
            <p className="text-lg font-medium">⚠️ {isNoDataState ? 'Estado sin datos' : 'Error al cargar datos'}</p>
          </div>
          {isNoDataState ? (
            <div className="text-muted-foreground">
              <p>El estado de <span className="font-medium text-red-600">{selectedState}</span> no tiene datos disponibles en la base de datos.</p>
              <p className="text-sm mt-2">Por favor, selecciona otro estado para ver información climática.</p>
            </div>
          ) : (
            <p className="text-muted-foreground">{error}</p>
          )}
        </div>
      </Card>
    );
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  const isHistorical = selectedYear < currentYear;
  const isCurrentYear = selectedYear === currentYear;

  // Agrupar datos por mes para los gráficos
  const monthlyAggregated = Array.from({ length: 12 }, (_, i) => {
    const monthData = yearlyData.filter(d => {
      const date = new Date(d.fecha);
      return date.getMonth() === i;
    });

    // Si es año futuro o mes futuro en año actual, retornar null
    if (selectedYear > currentYear || (isCurrentYear && i > currentMonth)) {
      return null;
    }

    // Si no hay datos para un mes que ya pasó, retornar null también
    if (monthData.length === 0) {
      return null;
    }

    const avgTemp = monthData.reduce((acc, d) => acc + d.temperatura.media, 0) / monthData.length;
    const totalPrecip = monthData.reduce((acc, d) => acc + d.precipitacion, 0);
    const avgHumidity = monthData.reduce((acc, d) => acc + d.humedad.media, 0) / monthData.length;

    return {
      month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i],
      temperatura: Math.round(avgTemp * 10) / 10,
      precipitacion: Math.round(totalPrecip * 10) / 10,
      humedad: Math.round(avgHumidity * 10) / 10,
    };
  }).filter(month => month !== null); // Filtrar meses sin datos

  // Obtener datos del mes seleccionado
  const currentMonthData = yearlyData.filter(d => {
    const date = new Date(d.fecha);
    return date.getMonth() === selectedMonth;
  });

  const monthlyAvg = currentMonthData.length > 0 ? {
    temperatura: Math.round((currentMonthData.reduce((acc, d) => acc + d.temperatura.media, 0) / currentMonthData.length) * 10) / 10,
    precipitacion: Math.round(currentMonthData.reduce((acc, d) => acc + d.precipitacion, 0) * 10) / 10,
    humedad: Math.round((currentMonthData.reduce((acc, d) => acc + d.humedad.media, 0) / currentMonthData.length) * 10) / 10,
    viento: Math.round((currentMonthData.reduce((acc, d) => acc + d.viento.medio, 0) / currentMonthData.length) * 10) / 10,
  } : null;

  // Encontrar las coordenadas del estado seleccionado
  const stateCoordinates = selectedState 
    ? stateCapitals.find(s => s.state === selectedState) 
    : undefined;

  return (
    <div className="space-y-6">
      {/* Widget de clima en tiempo real */}
      <WeatherWidget 
        selectedState={selectedState} 
        stateCapital={stateCoordinates ? { lat: stateCoordinates.lat, lng: stateCoordinates.lng } : undefined}
      />

      {/* Indicadores principales */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium">{selectedState}</h3>
            <p className="text-sm text-muted-foreground">
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][selectedMonth]} {selectedYear}
            </p>
          </div>
          <Badge variant={isHistorical ? "secondary" : "default"}>
            {isHistorical ? 'Datos Históricos' : isCurrentYear ? 'Año Actual' : 'Predicción'}
          </Badge>
        </div>

        {monthlyAvg ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Thermometer className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm text-muted-foreground">Temperatura</p>
                <p className="text-xl font-medium">{monthlyAvg.temperatura}°C</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CloudRain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Precipitación</p>
                <p className="text-xl font-medium">{monthlyAvg.precipitacion}mm</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Droplets className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-muted-foreground">Humedad</p>
                <p className="text-xl font-medium">{monthlyAvg.humedad}%</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
              <Wind className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
              <div>
                <p className="text-sm text-muted-foreground">Viento</p>
                <p className="text-xl font-medium">{monthlyAvg.viento} km/h</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg mb-2">📅 Datos no disponibles</p>
            <p className="text-sm">
              {isCurrentYear && selectedMonth > currentMonth 
                ? 'Este mes aún no ha ocurrido'
                : selectedYear > currentYear
                ? 'Año futuro - No hay datos disponibles'
                : 'No hay registros para este mes'}
            </p>
          </div>
        )}
      </Card>

      {/* Gráfico anual de temperatura */}
      <Card className="p-6">
        <h4 className="font-medium mb-4">Temperatura Anual ({selectedYear})</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyAggregated}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value: any) => [`${value}°C`, 'Temperatura']}
              labelFormatter={(label) => `Mes: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="temperatura" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Gráfico de precipitación */}
      <Card className="p-6">
        <h4 className="font-medium mb-4">Precipitación Anual ({selectedYear})</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyAggregated}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'mm', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value: any) => [`${value}mm`, 'Precipitación']}
              labelFormatter={(label) => `Mes: ${label}`}
            />
            <Bar dataKey="precipitacion" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}