import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { getClimatePredictions } from '../services/api';

interface PredictionPanelProps {
  selectedState: string | null;
  selectedYear: number;
  selectedMonth: number;
}

export function PredictionPanel({ selectedState, selectedYear, selectedMonth }: PredictionPanelProps) {
  const currentYear = new Date().getFullYear();
  const isFuture = selectedYear > currentYear;
  
  const [predictions, setPredictions] = useState({
    temperatureChange: 0,
    precipitationChange: 0,
    droughtRisk: 50,
    floodRisk: 50,
    extremeWeatherRisk: 50,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedState) {
      return;
    }

    const fetchPredictions = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`📊 Calculating predictions for ${selectedState}...`);
        
        const data = await getClimatePredictions(selectedState, selectedYear, selectedMonth + 1);
        setPredictions(data);
        
        console.log('✅ Predictions calculated:', data);
      } catch (err) {
        console.error('❌ Error loading predictions:', err);
        setError('Error al cargar predicciones');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [selectedState, selectedYear, selectedMonth]);

  const getRiskLevel = (value: number) => {
    if (value < 30) return { level: 'Bajo', color: 'text-green-600', bg: 'bg-green-100' };
    if (value < 70) return { level: 'Medio', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Alto', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (!selectedState) {
    return (
      <div className="p-8 rounded-3xl glass-card">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selecciona un estado para ver las predicciones climáticas</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 rounded-3xl glass-card">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Calculando predicciones...</p>
        </div>
      </div>
    );
  }

  const droughtRisk = getRiskLevel(predictions.droughtRisk);
  const floodRisk = getRiskLevel(predictions.floodRisk);
  const extremeRisk = getRiskLevel(predictions.extremeWeatherRisk);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl glass-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Predicciones Climáticas</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{selectedState}</p>
          </div>
          <Badge variant={isFuture ? "default" : "secondary"} className="glass-button border-0 shadow-md">
            {isFuture ? 'Predicción' : 'Análisis Histórico'}
          </Badge>
        </div>

        {!isFuture && (
          <div className="mb-6 p-4 rounded-2xl glass-card relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/10" />
            <div className="flex items-start space-x-3 relative z-10">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Los datos mostrados son históricos. Selecciona un año futuro para ver predicciones.
              </p>
            </div>
          </div>
        )}

        {/* Cambios esperados */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white">Cambios Esperados vs. Promedio Histórico</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10" />
              <div className="flex items-center space-x-2 relative z-10">
                {predictions.temperatureChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500 dark:text-red-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">Temperatura</span>
              </div>
              <span className={`font-medium relative z-10 ${predictions.temperatureChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {predictions.temperatureChange > 0 ? '+' : ''}{predictions.temperatureChange.toFixed(1)}°C
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10" />
              <div className="flex items-center space-x-2 relative z-10">
                {predictions.precipitationChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">Precipitación</span>
              </div>
              <span className={`font-medium relative z-10 ${predictions.precipitationChange > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {predictions.precipitationChange > 0 ? '+' : ''}{predictions.precipitationChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Riesgos climáticos */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Evaluación de Riesgos</h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Riesgo de Sequía</span>
                <Badge className={`${droughtRisk.bg} ${droughtRisk.color} border-0 shadow-sm`}>
                  {droughtRisk.level}
                </Badge>
              </div>
              <Progress value={predictions.droughtRisk} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Riesgo de Inundaciones</span>
                <Badge className={`${floodRisk.bg} ${floodRisk.color} border-0 shadow-sm`}>
                  {floodRisk.level}
                </Badge>
              </div>
              <Progress value={predictions.floodRisk} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Eventos Climáticos Extremos</span>
                <Badge className={`${extremeRisk.bg} ${extremeRisk.color} border-0 shadow-sm`}>
                  {extremeRisk.level}
                </Badge>
              </div>
              <Progress value={predictions.extremeWeatherRisk} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="p-6 rounded-3xl glass-card">
        <h4 className="font-medium mb-4 text-gray-900 dark:text-white">Recomendaciones</h4>
        <div className="space-y-3">
          {predictions.temperatureChange > 1 && (
            <div className="p-4 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-yellow-500/10" />
              <div className="flex items-start space-x-3 relative z-10">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Se espera un aumento significativo de temperatura. Considere medidas de adaptación para cultivos y recursos hídricos.
                </p>
              </div>
            </div>
          )}

          {predictions.temperatureChange < -1 && (
            <div className="p-4 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10" />
              <div className="flex items-start space-x-3 relative z-10">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Temperaturas más bajas que el promedio histórico. Proteja cultivos sensibles al frío.
                </p>
              </div>
            </div>
          )}
          
          {predictions.droughtRisk > 70 && (
            <div className="p-4 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-orange-500/10" />
              <div className="flex items-start space-x-3 relative z-10">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Alto riesgo de sequía. Implemente estrategias de conservación de agua y cultivos resistentes.
                </p>
              </div>
            </div>
          )}

          {predictions.droughtRisk >= 30 && predictions.droughtRisk <= 70 && (
            <div className="p-4 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-yellow-500/10" />
              <div className="flex items-start space-x-3 relative z-10">
                <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Riesgo moderado de sequía. Monitoree los niveles de agua y planifique el riego eficiente.
                </p>
              </div>
            </div>
          )}
          
          {predictions.floodRisk > 70 && (
            <div className="p-4 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10" />
              <div className="flex items-start space-x-3 relative z-10">
                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Alto riesgo de inundaciones. Revise sistemas de drenaje y planificación urbana.
                </p>
              </div>
            </div>
          )}

          {predictions.floodRisk >= 30 && predictions.floodRisk <= 70 && (
            <div className="p-4 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10" />
              <div className="flex items-start space-x-3 relative z-10">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Posible aumento de precipitación. Verifique sistemas de drenaje preventivamente.
                </p>
              </div>
            </div>
          )}

          {predictions.extremeWeatherRisk > 70 && (
            <div className="p-4 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/10" />
              <div className="flex items-start space-x-3 relative z-10">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Alto riesgo de eventos climáticos extremos. Refuerce infraestructura y prepare planes de emergencia.
                </p>
              </div>
            </div>
          )}

          {predictions.precipitationChange < -30 && (
            <div className="p-4 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-orange-500/10" />
              <div className="flex items-start space-x-3 relative z-10">
                <Info className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Reducción significativa de precipitación. Considere sistemas de captación de agua de lluvia.
                </p>
              </div>
            </div>
          )}

          {predictions.droughtRisk < 30 && predictions.floodRisk < 30 && predictions.extremeWeatherRisk < 50 && (
            <div className="p-4 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-green-500/10" />
              <div className="flex items-start space-x-3 relative z-10">
                <Info className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  Condiciones climáticas favorables esperadas para este período.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}