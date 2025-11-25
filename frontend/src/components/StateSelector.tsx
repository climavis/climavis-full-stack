import { useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface StateSelectorProps {
  selectedState: string | null;
  onStateSelect: (state: string) => void;
}

// Mapeo entre nombres amigables y nombres en la base de datos
const mexicanStates = [
  { name: 'Aguascalientes', dbName: 'AGUASCALIENTES', capital: 'Aguascalientes' },
  { name: 'Baja California', dbName: 'BAJA CALIFORNIA', capital: 'Mexicali' },
  { name: 'Baja California Sur', dbName: 'BAJA CALIFORNIA SUR', capital: 'La Paz' },
  { name: 'Campeche', dbName: 'CAMPECHE', capital: 'San Francisco de Campeche' },
  { name: 'Chiapas', dbName: 'CHIAPAS', capital: 'Tuxtla Gutiérrez' },
  { name: 'Chihuahua', dbName: 'CHIHUAHUA', capital: 'Chihuahua' },
  { name: 'Ciudad de México', dbName: 'CDMX', capital: 'Ciudad de México' },
  { name: 'Coahuila', dbName: 'COAHUILA', capital: 'Saltillo' },
  { name: 'Colima', dbName: 'COLIMA', capital: 'Colima' },
  { name: 'Durango', dbName: 'DURANGO', capital: 'Victoria de Durango' },
  { name: 'Estado de México', dbName: 'ESTADO DE MEXICO', capital: 'Toluca de Lerdo' },
  { name: 'Guanajuato', dbName: 'GUANAJUATO', capital: 'Guanajuato' },
  { name: 'Guerrero', dbName: 'GUERRERO', capital: 'Chilpancingo de los Bravo' },
  { name: 'Hidalgo', dbName: 'HIDALGO', capital: 'Pachuca de Soto' },
  { name: 'Jalisco', dbName: 'JALISCO', capital: 'Guadalajara' },
  { name: 'Michoacán', dbName: 'MICHOACAN', capital: 'Morelia' },
  { name: 'Morelos', dbName: 'MORELOS', capital: 'Cuernavaca' },
  { name: 'Nayarit', dbName: 'NAYARIT', capital: 'Tepic' },
  { name: 'Nuevo León', dbName: 'NUEVO LEON', capital: 'Monterrey' },
  { name: 'Oaxaca', dbName: 'OAXACA', capital: 'Oaxaca de Juárez' },
  { name: 'Puebla', dbName: 'PUEBLA', capital: 'Puebla de Zaragoza' },
  { name: 'Querétaro', dbName: 'QUERETARO', capital: 'Santiago de Querétaro' },
  { name: 'Quintana Roo', dbName: 'QUINTANA ROO', capital: 'Chetumal' },
  { name: 'San Luis Potosí', dbName: 'SAN LUIS POTOSI', capital: 'San Luis Potosí' },
  { name: 'Sinaloa', dbName: 'SINALOA', capital: 'Culiacán' },
  { name: 'Sonora', dbName: 'SONORA', capital: 'Hermosillo' },
  { name: 'Tabasco', dbName: 'TABASCO', capital: 'Villahermosa' },
  { name: 'Tamaulipas', dbName: 'TAMAULIPAS', capital: 'Ciudad Victoria' },
  { name: 'Tlaxcala', dbName: 'TLAXCALA', capital: 'Tlaxcala de Xicohténcatl' },
  { name: 'Veracruz', dbName: 'VERACRUZ', capital: 'Xalapa-Enríquez' },
  { name: 'Yucatán', dbName: 'YUCATAN', capital: 'Mérida' },
  { name: 'Zacatecas', dbName: 'ZACATECAS', capital: 'Zacatecas' },
];

export function StateSelector({ selectedState, onStateSelect }: StateSelectorProps) {
  const selectedStateData = mexicanStates.find((s) => s.dbName === selectedState);

  return (
    <div className="p-6 rounded-3xl glass-card">
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          Estados de México
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Selecciona un estado para ver su ubicación y datos climáticos
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estado
          </label>
          <Select value={selectedState || ''} onValueChange={onStateSelect}>
            <SelectTrigger className="w-full glass-card border-gray-200 dark:border-white/10">
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent className="glass-card backdrop-blur-xl border-gray-200 dark:border-white/10">
              {mexicanStates.map((state) => (
                <SelectItem
                  key={state.dbName}
                  value={state.dbName}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedStateData && (
          <div className="p-4 rounded-2xl glass-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20" />
            <div className="relative z-10 flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Capital del estado
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedStateData.capital}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
