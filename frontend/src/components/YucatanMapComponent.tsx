import { useEffect, useRef, useState } from 'react';
import { yucatanLocations } from '../data/yucatanData';
import { MapPin, Waves, Mountain, TreePine, Camera, Compass } from 'lucide-react';
import { Badge } from './ui/badge';

interface YucatanMapComponentProps {
  selectedLocation: string | null;
  onLocationSelect: (location: string | null) => void;
}

export function YucatanMapComponent({ selectedLocation, onLocationSelect }: YucatanMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'capital': return <Compass className="h-4 w-4" />;
      case 'coastal': return <Waves className="h-4 w-4" />;
      case 'archaeological': return <Mountain className="h-4 w-4" />;
      case 'biosphere': return <TreePine className="h-4 w-4" />;
      case 'cenote': return <Waves className="h-4 w-4" />;
      case 'pueblo_magico': return <Camera className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getLocationColor = (type: string) => {
    switch (type) {
      case 'capital': return 'bg-red-500';
      case 'coastal': return 'bg-blue-500';
      case 'archaeological': return 'bg-amber-600';
      case 'biosphere': return 'bg-green-500';
      case 'cenote': return 'bg-cyan-500';
      case 'pueblo_magico': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Limpiar el mapa anterior
    mapRef.current.innerHTML = '';

    // Crear SVG del mapa de Yucatán
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 400 300');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    // Forma aproximada de Yucatán
    const yucatanPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const isDark = document.documentElement.classList.contains('dark');
    
    yucatanPath.setAttribute('d', 'M50,200 Q80,150 120,140 Q180,130 220,135 Q280,140 320,160 Q350,180 360,210 Q350,240 320,250 Q280,260 220,255 Q180,250 120,245 Q80,240 50,220 Z');
    yucatanPath.setAttribute('fill', isDark ? '#374151' : '#e5e7eb');
    yucatanPath.setAttribute('stroke', isDark ? '#6b7280' : '#9ca3af');
    yucatanPath.setAttribute('stroke-width', '2');
    yucatanPath.setAttribute('class', 'transition-colors duration-300');

    svg.appendChild(yucatanPath);

    // Agregar ubicaciones como puntos
    yucatanLocations.forEach((location) => {
      // Convertir coordenadas lat/lng a posiciones en el SVG (simplificado)
      const x = ((location.lng + 90.5) / 2.5) * 400;
      const y = 300 - ((location.lat - 20.2) / 1.4) * 300;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', selectedLocation === location.name ? '8' : '6');
      
      const isSelected = selectedLocation === location.name;
      const isHovered = hoveredLocation === location.name;
      
      circle.setAttribute('class', `cursor-pointer transition-all duration-300 ${
        isSelected 
          ? (isDark ? 'fill-blue-400 stroke-blue-300' : 'fill-blue-600 stroke-blue-800')
          : isHovered
          ? (isDark ? 'fill-blue-300 stroke-blue-200' : 'fill-blue-500 stroke-blue-700')
          : (isDark ? 'fill-blue-200 stroke-blue-400' : 'fill-blue-400 stroke-blue-600')
      }`);
      circle.setAttribute('stroke-width', '2');

      // Eventos del círculo
      circle.addEventListener('click', () => {
        onLocationSelect(location.name === selectedLocation ? null : location.name);
      });

      circle.addEventListener('mouseenter', () => {
        setHoveredLocation(location.name);
      });

      circle.addEventListener('mouseleave', () => {
        setHoveredLocation(null);
      });

      svg.appendChild(circle);

      // Etiqueta de texto
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (x + 12).toString());
      text.setAttribute('y', (y + 4).toString());
      text.setAttribute('class', `text-xs ${isDark ? 'fill-gray-300' : 'fill-gray-700'} pointer-events-none`);
      text.textContent = location.name;

      svg.appendChild(text);
    });

    mapRef.current.appendChild(svg);
  }, [selectedLocation, hoveredLocation]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Mapa de Yucatán</h3>
        <Badge variant="outline" className="text-xs">
          {yucatanLocations.length} ubicaciones
        </Badge>
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full h-80 bg-gradient-to-b from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border dark:border-gray-600"
      />
      
      {selectedLocation && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Ubicación seleccionada:</span> {selectedLocation}
          </p>
          {yucatanLocations.find(loc => loc.name === selectedLocation) && (
            <div className="flex items-center mt-2 space-x-2">
              {getLocationIcon(yucatanLocations.find(loc => loc.name === selectedLocation)!.type)}
              <span className="text-xs text-muted-foreground capitalize">
                {yucatanLocations.find(loc => loc.name === selectedLocation)!.type.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Leyenda */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Capital</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Costa</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
          <span>Arqueológico</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Biosfera</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
          <span>Cenote</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span>Pueblo Mágico</span>
        </div>
      </div>
    </div>
  );
}