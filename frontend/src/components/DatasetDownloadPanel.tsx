import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Button } from './ui/button';
import { downloadClimateDataset, type DatasetFormat, type DatasetGroupBy } from '../services/api';

interface DatasetDownloadPanelProps {
  selectedState: string | null;
  selectedYear: number;
  selectedMonth: number;
}

const monthNames = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

type TemporalMode = 'all' | 'year' | 'month' | 'months';

export function DatasetDownloadPanel({ selectedState, selectedYear, selectedMonth }: DatasetDownloadPanelProps) {
  const currentYear = new Date().getFullYear();
  const [format, setFormat] = useState<DatasetFormat>('csv');
  const [summary, setSummary] = useState(false);
  const [groupBy, setGroupBy] = useState<DatasetGroupBy>('none');
  const [temporalMode, setTemporalMode] = useState<TemporalMode>('year');
  const [yearFilter, setYearFilter] = useState<number>(selectedYear);
  const [monthFilter, setMonthFilter] = useState<number>(selectedMonth + 1);
  const [monthsFilter, setMonthsFilter] = useState<number[]>([selectedMonth + 1]);
  const [allStates, setAllStates] = useState(false);

  useEffect(() => {
    setYearFilter(selectedYear);
    setMonthFilter(selectedMonth + 1);
  }, [selectedYear, selectedMonth]);

  const activeState = useMemo(() => {
    if (allStates) return undefined;
    return selectedState || undefined;
  }, [allStates, selectedState]);

  const toggleMonth = (month: number) => {
    setMonthsFilter((prev: number[]) => {
      if (prev.includes(month)) return prev.filter((m: number) => m !== month);
      return [...prev, month].sort((a, b) => a - b);
    });
  };

  const handleDownload = () => {
    if (temporalMode === 'months' && monthsFilter.length === 0) {
      return;
    }

    const options = {
      format,
      state: activeState,
      summary,
      groupBy,
      year: temporalMode === 'all' ? undefined : yearFilter,
      month: temporalMode === 'month' ? monthFilter : undefined,
      months: temporalMode === 'months' ? monthsFilter : undefined,
    };

    downloadClimateDataset(options);
  };

  return (
    <div className="p-6 rounded-3xl glass-card space-y-4">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-1">Descargar Dataset</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Exporta clima por estado, año, mes o conjunto de meses.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
        <input
          type="checkbox"
          checked={allStates}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAllStates(e.target.checked)}
        />
        Todos los estados
      </label>

      {!allStates && (
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Estado activo: <span className="font-medium">{selectedState || 'ninguno (selecciona en el mapa)'}</span>
        </p>
      )}

      <div className="space-y-2">
        <label className="text-sm text-gray-700 dark:text-gray-200">Filtro temporal</label>
        <select
          value={temporalMode}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setTemporalMode(e.target.value as TemporalMode)}
          className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm"
        >
          <option value="all">Todo el periodo</option>
          <option value="year">Año</option>
          <option value="month">Mes</option>
          <option value="months">Ciertos meses</option>
        </select>
      </div>

      {temporalMode === 'year' && (
        <div className="space-y-1">
          <label className="text-sm text-gray-700 dark:text-gray-200">Año</label>
          <input
            type="number"
            min={2000}
            max={currentYear}
            value={yearFilter}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setYearFilter(Number(e.target.value || currentYear))}
            className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm"
          />
        </div>
      )}

      {temporalMode === 'month' && (
        <div className="space-y-1">
          <label className="text-sm text-gray-700 dark:text-gray-200">Mes</label>
          <select
            value={monthFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setMonthFilter(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm"
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={idx + 1}>{name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400">Usa también el año actual del selector: {yearFilter}</p>
        </div>
      )}

      {temporalMode === 'months' && (
        <div className="space-y-2">
          <label className="text-sm text-gray-700 dark:text-gray-200">Meses</label>
          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((name, idx) => {
              const month = idx + 1;
              const checked = monthsFilter.includes(month);
              return (
                <label key={name} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
                  <input type="checkbox" checked={checked} onChange={() => toggleMonth(month)} />
                  {name}
                </label>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Año aplicado: {yearFilter}</p>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm text-gray-700 dark:text-gray-200">Formato</label>
        <select
          value={format}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormat(e.target.value as DatasetFormat)}
          className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm"
        >
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="txt">TXT</option>
          <option value="xlsx">Excel (.xlsx)</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
        <input
          type="checkbox"
          checked={summary}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const checked = e.target.checked;
            setSummary(checked);
            if (!checked) setGroupBy('none');
          }}
        />
        Descargar tabla de promedios (resumen)
      </label>

      {summary && (
        <div className="space-y-1">
          <label className="text-sm text-gray-700 dark:text-gray-200">Agrupar por</label>
          <select
            value={groupBy}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setGroupBy(e.target.value as DatasetGroupBy)}
            className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm"
          >
            <option value="none">Todo (1 fila)</option>
            <option value="state">Estado</option>
            <option value="year">Año</option>
            <option value="month">Mes</option>
          </select>
        </div>
      )}

      <Button
        onClick={handleDownload}
        className="w-full"
        disabled={temporalMode === 'months' && monthsFilter.length === 0}
      >
        Descargar
      </Button>
    </div>
  );
}
