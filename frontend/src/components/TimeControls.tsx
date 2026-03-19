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

const shortMonths = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export function TimeControls({ selectedYear, selectedMonth, onYearChange, onMonthChange }: TimeControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const minYear = 2000; // Datos históricos importados desde 2000
  const maxYear = currentYear;
  const maxMonthForSelectedYear = selectedYear === currentYear ? currentMonth : 11;
  const middleMonthForSelectedYear = Math.floor(maxMonthForSelectedYear / 2);

  useEffect(() => {
    // Si cambia el límite (nuevo mes/año), ajusta selección fuera de rango.
    if (selectedYear > maxYear) {
      onYearChange(maxYear);
      onMonthChange(currentMonth);
      return;
    }
    if (selectedMonth > maxMonthForSelectedYear) {
      onMonthChange(maxMonthForSelectedYear);
    }
  }, [selectedYear, selectedMonth, maxYear, currentMonth, maxMonthForSelectedYear, onYearChange, onMonthChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        onMonthChange(selectedMonth === maxMonthForSelectedYear ? 0 : selectedMonth + 1);
        if (selectedMonth === maxMonthForSelectedYear) {
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
    } else if (selectedMonth < maxMonthForSelectedYear) {
      onMonthChange(selectedMonth + 1);
    }
  };

  return (
    <div className="p-6 rounded-3xl glass-card">
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Controles Temporales</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Explora datos históricos hasta la fecha actual
          </p>
        </div>

        {/* Año */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-gray-900 dark:text-white">Año: {selectedYear}</Label>
            <div className="px-3 py-1 rounded-full glass-button border-0 text-xs">
              {selectedYear === currentYear ? 'Año en curso' : 'Histórico'}
            </div>
          </div>
          <Slider
            value={[selectedYear]}
            onValueChange={(values: number[]) => onYearChange(values[0])}
            min={minYear}
            max={maxYear}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{minYear}</span>
            <span>Actual: {currentYear}</span>
            <span>{maxYear}</span>
          </div>
        </div>

        {/* Mes */}
        <div className="space-y-3">
          <Label className="text-gray-900 dark:text-white">Mes: {months[selectedMonth]}</Label>
          <Slider
            value={[selectedMonth]}
            onValueChange={(values: number[]) => onMonthChange(values[0])}
            min={0}
            max={maxMonthForSelectedYear}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{shortMonths[0]}</span>
            <span>{shortMonths[middleMonthForSelectedYear]}</span>
            <span>{shortMonths[maxMonthForSelectedYear]}</span>
          </div>
        </div>

        {/* Controles de reproducción */}
        <div className="flex items-center justify-center space-x-2 pt-4 border-t border-white/20 dark:border-white/10">
          <Button variant="outline" size="sm" onClick={handlePrevious} className="glass-button border-0">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handlePlayPause} className="glass-button border-0">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext} className="glass-button border-0">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center text-sm font-medium text-gray-900 dark:text-white">
          {months[selectedMonth]} {selectedYear}
        </div>
      </div>
    </div>
  );
}