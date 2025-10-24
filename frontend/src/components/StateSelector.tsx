import { Card } from './ui/card';
import { stateCapitals } from './MapComponent';
import { AlertCircle } from 'lucide-react';

interface Props {
  selectedState: string | null;
  onStateSelect: (state: string | null) => void;
}

// Native HTML <select> to avoid overlay/portal issues on some UIs
export function StateSelector({ selectedState, onStateSelect }: Props) {
  const states = stateCapitals
    .map((s) => s.state)
    .sort((a, b) => a.localeCompare(b, 'es'));

  return (
    <Card className="p-4">
      <h3 className="font-medium mb-2">Mapa de México - Estados</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Selecciona un estado para ver su ubicación y datos climáticos
      </p>

      <label htmlFor="state-select" className="sr-only">Estado</label>
      <select
        id="state-select"
        value={selectedState ?? ''}
        onChange={(e) => onStateSelect(e.target.value || null)}
        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Seleccionar un estado</option>
        {states.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
        <AlertCircle className="h-3 w-3" />
        <span>También puedes hacer clic en el mapa.</span>
      </div>
    </Card>
  );
}
