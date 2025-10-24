import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';

interface PredictionPanelProps {
  selectedState: string | null;
  selectedYear: number;
  selectedMonth: number;
}

export function PredictionPanel({ selectedState, selectedYear, selectedMonth }: PredictionPanelProps) {
  const currentYear = new Date().getFullYear();
  const isFuture = selectedYear > currentYear;

  if (!selectedState) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selecciona un estado para ver las predicciones climáticas</p>
        </div>
      </Card>
    );
  }

  // Simulación de predicciones climáticas
  const predictions = {
    temperatureChange: Math.random() * 4 - 2, // -2 a +2 grados
    precipitationChange: Math.random() * 40 - 20, // -20% a +20%
    droughtRisk: Math.random() * 100,
    floodRisk: Math.random() * 100,
    extremeWeatherRisk: Math.random() * 100,
  };

  const getRiskLevel = (value: number) => {
    if (value < 30) return { level: 'Bajo', color: 'text-green-600', bg: 'bg-green-100' };
    if (value < 70) return { level: 'Medio', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Alto', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const droughtRisk = getRiskLevel(predictions.droughtRisk);
  const floodRisk = getRiskLevel(predictions.floodRisk);
  const extremeRisk = getRiskLevel(predictions.extremeWeatherRisk);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium">Predicciones Climáticas</h3>
            <p className="text-sm text-muted-foreground">{selectedState}</p>
          </div>
          <Badge variant={isFuture ? "default" : "secondary"}>
            {isFuture ? 'Predicción' : 'Análisis Histórico'}
          </Badge>
        </div>

        {!isFuture && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Los datos mostrados son históricos. Selecciona un año futuro para ver predicciones.
            </AlertDescription>
          </Alert>
        )}

        {/* Cambios esperados */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium">Cambios Esperados vs. Promedio Histórico</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                {predictions.temperatureChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500 dark:text-red-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                )}
                <span className="text-sm">Temperatura</span>
              </div>
              <span className={`font-medium ${predictions.temperatureChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {predictions.temperatureChange > 0 ? '+' : ''}{predictions.temperatureChange.toFixed(1)}°C
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                {predictions.precipitationChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                )}
                <span className="text-sm">Precipitación</span>
              </div>
              <span className={`font-medium ${predictions.precipitationChange > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {predictions.precipitationChange > 0 ? '+' : ''}{predictions.precipitationChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Riesgos climáticos */}
        <div className="space-y-4">
          <h4 className="font-medium">Evaluación de Riesgos</h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Riesgo de Sequía</span>
                <Badge className={`${droughtRisk.bg} ${droughtRisk.color} border-0`}>
                  {droughtRisk.level}
                </Badge>
              </div>
              <Progress value={predictions.droughtRisk} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Riesgo de Inundaciones</span>
                <Badge className={`${floodRisk.bg} ${floodRisk.color} border-0`}>
                  {floodRisk.level}
                </Badge>
              </div>
              <Progress value={predictions.floodRisk} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Eventos Climáticos Extremos</span>
                <Badge className={`${extremeRisk.bg} ${extremeRisk.color} border-0`}>
                  {extremeRisk.level}
                </Badge>
              </div>
              <Progress value={predictions.extremeWeatherRisk} className="h-2" />
            </div>
          </div>
        </div>
      </Card>

      {/* Recomendaciones */}
      <Card className="p-6">
        <h4 className="font-medium mb-4">Recomendaciones</h4>
        <div className="space-y-3">
          {predictions.temperatureChange > 1 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Se espera un aumento significativo de temperatura. Considere medidas de adaptación para cultivos y recursos hídricos.
              </AlertDescription>
            </Alert>
          )}
          
          {predictions.droughtRisk > 70 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Alto riesgo de sequía. Implemente estrategias de conservación de agua y cultivos resistentes.
              </AlertDescription>
            </Alert>
          )}
          
          {predictions.floodRisk > 70 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Alto riesgo de inundaciones. Revise sistemas de drenaje y planificación urbana.
              </AlertDescription>
            </Alert>
          )}

          {predictions.droughtRisk < 30 && predictions.floodRisk < 30 && predictions.extremeWeatherRisk < 50 && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                Condiciones climáticas favorables esperadas para este período.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
}