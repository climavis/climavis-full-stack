import { useEffect, useRef } from 'react';

interface MapComponentProps {
  selectedState: string | null;
  onStateSelect: (state: string) => void;
  climateData: any;
}

// Estados de México con coordenadas
const mexicanStates = [
  { name: 'Aguascalientes', lat: 21.8853, lng: -102.2916 },
  { name: 'Baja California', lat: 30.8406, lng: -115.2838 },
  { name: 'Baja California Sur', lat: 26.0444, lng: -111.6661 },
  { name: 'Campeche', lat: 19.8301, lng: -90.5349 },
  { name: 'Chiapas', lat: 16.7569, lng: -93.1292 },
  { name: 'Chihuahua', lat: 28.6353, lng: -106.0889 },
  { name: 'Ciudad de México', lat: 19.4326, lng: -99.1332 },
  { name: 'Coahuila', lat: 27.0587, lng: -101.7068 },
  { name: 'Colima', lat: 19.2452, lng: -103.7240 },
  { name: 'Durango', lat: 24.0277, lng: -104.6532 },
  { name: 'Guanajuato', lat: 21.0190, lng: -101.2574 },
  { name: 'Guerrero', lat: 17.4392, lng: -99.5451 },
  { name: 'Hidalgo', lat: 20.0911, lng: -98.7624 },
  { name: 'Jalisco', lat: 20.6597, lng: -103.3496 },
  { name: 'Estado de México', lat: 19.2808, lng: -99.7644 },
  { name: 'Michoacán', lat: 19.5665, lng: -101.7068 },
  { name: 'Morelos', lat: 18.6813, lng: -99.1013 },
  { name: 'Nayarit', lat: 21.7514, lng: -104.8455 },
  { name: 'Nuevo León', lat: 25.5922, lng: -99.9962 },
  { name: 'Oaxaca', lat: 17.0732, lng: -96.7266 },
  { name: 'Puebla', lat: 19.0414, lng: -98.2063 },
  { name: 'Querétaro', lat: 20.5888, lng: -100.3899 },
  { name: 'Quintana Roo', lat: 19.1817, lng: -87.4653 },
  { name: 'San Luis Potosí', lat: 22.1565, lng: -100.9855 },
  { name: 'Sinaloa', lat: 25.1721, lng: -107.4795 },
  { name: 'Sonora', lat: 29.2972, lng: -110.3309 },
  { name: 'Tabasco', lat: 17.8409, lng: -92.6189 },
  { name: 'Tamaulipas', lat: 25.8680, lng: -97.5200 },
  { name: 'Tlaxcala', lat: 19.3139, lng: -98.2404 },
  { name: 'Veracruz', lat: 19.1738, lng: -96.1342 },
  { name: 'Yucatán', lat: 20.7099, lng: -89.0943 },
  { name: 'Zacatecas', lat: 22.7709, lng: -102.5832 }
];

export function MapComponent({ selectedState, onStateSelect, climateData }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    // Crear un mapa SVG simple de México
    const createMap = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 800 600');
      svg.setAttribute('class', 'w-full h-full');

      // Crear círculos para cada estado
      mexicanStates.forEach((state) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        
        // Convertir coordenadas geográficas a coordenadas SVG
        const x = ((state.lng + 118) / 35) * 800;
        const y = 600 - ((state.lat - 14) / 18) * 600;
        
        circle.setAttribute('cx', x.toString());
        circle.setAttribute('cy', y.toString());
        circle.setAttribute('r', selectedState === state.name ? '12' : '8');
        const isDark = document.documentElement.classList.contains('dark');
        circle.setAttribute('class', `cursor-pointer transition-all duration-300 ${
          selectedState === state.name 
            ? (isDark ? 'fill-blue-400 stroke-blue-300' : 'fill-blue-600 stroke-blue-800')
            : (isDark ? 'fill-blue-300 hover:fill-blue-200 stroke-blue-400' : 'fill-blue-400 hover:fill-blue-500 stroke-blue-600')
        }`);
        circle.setAttribute('stroke-width', '2');
        
        // Agregar evento de click
        circle.addEventListener('click', () => onStateSelect(state.name));
        
        // Tooltip con el nombre del estado
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = state.name;
        circle.appendChild(title);
        
        svg.appendChild(circle);
      });

      return svg;
    };

    if (mapRef.current) {
      mapRef.current.innerHTML = '';
      mapRef.current.appendChild(createMap());
    }
  }, [selectedState, onStateSelect]);

  return (
    <div className="p-6 rounded-3xl glass-card">
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white">Mapa de México - Estados</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Haz clic en un estado para ver sus datos climáticos
        </p>
      </div>
      <div 
        ref={mapRef} 
        className="w-full h-80 rounded-2xl overflow-hidden glass relative"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)'
        }}
      />
      {selectedState && (
        <div className="mt-4 p-4 rounded-2xl glass-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20" />
          <p className="text-sm relative z-10 text-gray-900 dark:text-white">
            <span className="font-medium">Estado seleccionado:</span> {selectedState}
          </p>
        </div>
      )}
    </div>
  );
}