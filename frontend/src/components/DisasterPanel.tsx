import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { yucatanDisasterData } from '../data/yucatanData';
import { 
  CloudRain, 
  Sun, 
  Wind, 
  AlertTriangle, 
  Waves, 
  Droplets,
  Eye
} from 'lucide-react';

interface DisasterPanelProps {
  selectedMonth: number;
  selectedYear: number;
}

export function DisasterPanel({ selectedMonth, selectedYear }: DisasterPanelProps) {
  // Obtener datos del mes seleccionado o usar datos base
  const monthData = yucatanDisasterData[selectedMonth] || yucatanDisasterData[0];

  const getRiskLevel = (risk: number) => {
    if (risk <= 25) return { level: 'Bajo', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' };
    if (risk <= 50) return { level: 'Medio', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/20' };
    if (risk <= 75) return { level: 'Alto', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20' };
    return { level: 'Crítico', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' };
  };

  const hurricaneRisk = getRiskLevel(monthData.hurricanes.risk);
  const floodRisk = getRiskLevel(monthData.flooding.risk);
  const droughtRisk = getRiskLevel(monthData.drought.risk);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Evaluación de Riesgos</h3>
        <Badge variant="outline">
          {new Date(selectedYear, selectedMonth).toLocaleDateString('es-ES', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </Badge>
      </div>

      {/* Huracanes */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Wind className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium">Huracanes</span>
          </div>
          <Badge className={`${hurricaneRisk.bg} ${hurricaneRisk.color} border-0`}>
            {hurricaneRisk.level}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Riesgo</span>
            <span>{monthData.hurricanes.risk}%</span>
          </div>
          <Progress value={monthData.hurricanes.risk} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
            <div>
              <span className="text-muted-foreground">Temporada:</span>
              <p className="font-medium">{monthData.hurricanes.season}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Último mayor:</span>
              <p className="font-medium">{monthData.hurricanes.lastMajor}</p>
            </div>
          </div>
          
          {monthData.hurricanes.category > 0 && (
            <Alert className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Riesgo de huracán categoría {monthData.hurricanes.category} en esta época
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Inundaciones */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Waves className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium">Inundaciones</span>
          </div>
          <Badge className={`${floodRisk.bg} ${floodRisk.color} border-0`}>
            {floodRisk.level}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Riesgo</span>
            <span>{monthData.flooding.risk}%</span>
          </div>
          <Progress value={monthData.flooding.risk} className="h-2" />
          
          <div className="mt-3">
            <span className="text-sm text-muted-foreground">Áreas de riesgo:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {monthData.flooding.areas.map((area, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">Época:</span>
            <span className="ml-2 font-medium">{monthData.flooding.season}</span>
          </div>
        </div>
      </Card>

      {/* Sequía */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sun className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium">Sequía</span>
          </div>
          <Badge className={`${droughtRisk.bg} ${droughtRisk.color} border-0`}>
            {droughtRisk.level}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Riesgo</span>
            <span>{monthData.drought.risk}%</span>
          </div>
          <Progress value={monthData.drought.risk} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
            <div>
              <span className="text-muted-foreground">Duración:</span>
              <p className="font-medium">{monthData.drought.duration} meses</p>
            </div>
            <div>
              <span className="text-muted-foreground">Severidad:</span>
              <p className="font-medium">{monthData.drought.severity}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Impacto en Cenotes */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Droplets className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-medium">Estado de Cenotes</span>
          </div>
          <Badge variant="outline">
            {monthData.cenoteImpact.level}%
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Nivel de agua</span>
            <span>{monthData.cenoteImpact.level}%</span>
          </div>
          <Progress value={monthData.cenoteImpact.level} className="h-2" />
          
          {monthData.cenoteImpact.affected.length > 0 ? (
            <Alert className="mt-3">
              <Eye className="h-4 w-4" />
              <AlertDescription>
                Cenotes afectados: {monthData.cenoteImpact.affected.join(', ')}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-sm text-green-600 dark:text-green-400 mt-3">
              ✓ Todos los cenotes en condiciones normales
            </div>
          )}
        </div>
      </Card>

      {/* Resumen de condiciones */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
        <h4 className="font-medium mb-2">Resumen del Mes</h4>
        <div className="text-sm space-y-1">
          <p>• Temporada de huracanes: <span className="font-medium">{monthData.hurricanes.season}</span></p>
          <p>• Época de lluvias: <span className="font-medium">{monthData.flooding.season}</span></p>
          <p>• Condición general: <span className="font-medium">
            {(monthData.hurricanes.risk + monthData.flooding.risk + monthData.drought.risk) / 3 < 30 
              ? 'Favorable' 
              : (monthData.hurricanes.risk + monthData.flooding.risk + monthData.drought.risk) / 3 < 60 
              ? 'Moderada' 
              : 'Vigilancia'}
          </span></p>
        </div>
      </Card>
    </div>
  );
}