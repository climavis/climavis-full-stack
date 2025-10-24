import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TimeControlsProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function TimeControls({ selectedYear, selectedMonth, onYearChange, onMonthChange }: TimeControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentYear = new Date().getFullYear();
  const minYear = 2000;
  const maxYear = 2030; // Incluye años futuros para predicciones

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        onMonthChange(selectedMonth === 11 ? 0 : selectedMonth + 1);
        if (selectedMonth === 11) {
          if (selectedYear < maxYear) {
            onYearChange(selectedYear + 1);
          } else {
            setIsPlaying(false);
          }
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, selectedMonth, selectedYear, onMonthChange, onYearChange, maxYear]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    if (selectedMonth === 0) {
      if (selectedYear > minYear) {
        onYearChange(selectedYear - 1);
        onMonthChange(11);
      }
    } else {
      onMonthChange(selectedMonth - 1);
    }
  };

  const handleNext = () => {
    if (selectedMonth === 11) {
      if (selectedYear < maxYear) {
        onYearChange(selectedYear + 1);
        onMonthChange(0);
      }
    } else {
      onMonthChange(selectedMonth + 1);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Controles Temporales</h3>
          <p className="text-sm text-muted-foreground">
            Explora datos históricos y predicciones climáticas
          </p>
        </div>

        {/* Año */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Año: {selectedYear}</Label>
            <div className="text-sm text-muted-foreground">
              {selectedYear > currentYear ? 'Predicción' : 'Histórico'}
            </div>
          </div>
          <Slider
            value={[selectedYear]}
            onValueChange={([value]: number[]) => onYearChange(value)}
            min={minYear}
            max={maxYear}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{minYear}</span>
            <span>Actual: {currentYear}</span>
            <span>{maxYear}</span>
          </div>
        </div>

        {/* Mes */}
        <div className="space-y-3">
          <Label>Mes: {months[selectedMonth]}</Label>
          <Slider
            value={[selectedMonth]}
            onValueChange={([value]: number[]) => onMonthChange(value)}
            min={0}
            max={11}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Ene</span>
            <span>Jun</span>
            <span>Dic</span>
          </div>
        </div>

        {/* Controles de reproducción */}
        <div className="flex items-center justify-center space-x-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {months[selectedMonth]} {selectedYear}
        </div>
      </div>
    </Card>
  );
}