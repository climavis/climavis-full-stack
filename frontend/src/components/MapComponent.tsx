import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression, Map as LeafletMap } from 'leaflet';
import { Card } from './ui/card';
import { MapFallback } from './MapFallback';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  selectedState: string | null;
  onStateSelect: (state: string) => void;
}

// Mapa de conversión de nombres: UI -> Base de Datos
// Incluye los 32 estados de México
const stateNameMapping: { [key: string]: string } = {
  'Aguascalientes': 'AGUASCALIENTES',
  'Baja California': 'BAJA CALIFORNIA',
  'Baja California Sur': 'BAJA CALIFORNIA SUR',
  'Campeche': 'CAMPECHE',
  'Chiapas': 'CHIAPAS',
  'Chihuahua': 'CHIHUAHUA',
  'Ciudad de México': 'CDMX',
  'Coahuila': 'COAHUILA',
  'Colima': 'COLIMA',
  'Durango': 'DURANGO',
  'Estado de México': 'ESTADO DE MEXICO',
  'Guanajuato': 'GUANAJUATO',
  'Guerrero': 'GUERRERO',
  'Hidalgo': 'HIDALGO',
  'Jalisco': 'JALISCO',
  'Michoacán': 'MICHOACAN',
  'Morelos': 'MORELOS',
  'Nayarit': 'NAYARIT',
  'Nuevo León': 'NUEVO LEON',
  'Oaxaca': 'OAXACA',
  'Puebla': 'PUEBLA',
  'Querétaro': 'QUERETARO',
  'Quintana Roo': 'QUINTANA ROO',
  'San Luis Potosí': 'SAN LUIS POTOSI',
  'Sinaloa': 'SINALOA',
  'Sonora': 'SONORA',
  'Tabasco': 'TABASCO',
  'Tamaulipas': 'TAMAULIPAS',
  'Tlaxcala': 'TLAXCALA',
  'Veracruz': 'VERACRUZ',
  'Yucatán': 'YUCATAN',
  'Zacatecas': 'ZACATECAS'
};

// Capitales de los estados de México con coordenadas exactas
export const stateCapitals = [
  { state: 'Aguascalientes', capital: 'Aguascalientes', lat: 21.8853, lng: -102.2916, hasData: true },
  { state: 'Baja California', capital: 'Mexicali', lat: 32.6245, lng: -115.4523, hasData: true },
  { state: 'Baja California Sur', capital: 'La Paz', lat: 24.1426, lng: -110.3128, hasData: true },
  { state: 'Campeche', capital: 'Campeche', lat: 19.8301, lng: -90.5349, hasData: true },
  { state: 'Chiapas', capital: 'Tuxtla Gutiérrez', lat: 16.7516, lng: -93.1029, hasData: true },
  { state: 'Chihuahua', capital: 'Chihuahua', lat: 28.6353, lng: -106.0889, hasData: true },
  { state: 'Ciudad de México', capital: 'Ciudad de México', lat: 19.4326, lng: -99.1332, hasData: true },
  { state: 'Coahuila', capital: 'Saltillo', lat: 25.4232, lng: -100.9940, hasData: true },
  { state: 'Colima', capital: 'Colima', lat: 19.2452, lng: -103.7240, hasData: true },
  { state: 'Durango', capital: 'Durango', lat: 24.0277, lng: -104.6532, hasData: true },
  { state: 'Guanajuato', capital: 'Guanajuato', lat: 21.0190, lng: -101.2574, hasData: true },
  { state: 'Guerrero', capital: 'Chilpancingo', lat: 17.5506, lng: -99.5005, hasData: true },
  { state: 'Hidalgo', capital: 'Pachuca', lat: 20.0911, lng: -98.7624, hasData: true },
  { state: 'Jalisco', capital: 'Guadalajara', lat: 20.6597, lng: -103.3496, hasData: true },
  { state: 'Estado de México', capital: 'Toluca', lat: 19.2826, lng: -99.6557, hasData: true },
  { state: 'Michoacán', capital: 'Morelia', lat: 19.7060, lng: -101.1949, hasData: true },
  { state: 'Morelos', capital: 'Cuernavaca', lat: 18.9211, lng: -99.2358, hasData: true },
  { state: 'Nayarit', capital: 'Tepic', lat: 21.5041, lng: -104.8945, hasData: true },
  { state: 'Nuevo León', capital: 'Monterrey', lat: 25.6866, lng: -100.3161, hasData: true },
  { state: 'Oaxaca', capital: 'Oaxaca', lat: 17.0732, lng: -96.7266, hasData: true },
  { state: 'Puebla', capital: 'Puebla', lat: 19.0414, lng: -98.2063, hasData: true },
  { state: 'Querétaro', capital: 'Querétaro', lat: 20.5888, lng: -100.3899, hasData: true },
  { state: 'Quintana Roo', capital: 'Chetumal', lat: 18.5001, lng: -88.2960, hasData: true },
  { state: 'San Luis Potosí', capital: 'San Luis Potosí', lat: 22.1565, lng: -100.9855, hasData: true },
  { state: 'Sinaloa', capital: 'Culiacán', lat: 24.8091, lng: -107.3940, hasData: true },
  { state: 'Sonora', capital: 'Hermosillo', lat: 29.0729, lng: -110.9559, hasData: true },
  { state: 'Tabasco', capital: 'Villahermosa', lat: 17.9892, lng: -92.9475, hasData: true },
  { state: 'Tamaulipas', capital: 'Ciudad Victoria', lat: 23.7369, lng: -99.1411, hasData: true },
  { state: 'Tlaxcala', capital: 'Tlaxcala', lat: 19.3139, lng: -98.2404, hasData: true },
  { state: 'Veracruz', capital: 'Xalapa', lat: 19.5438, lng: -96.9102, hasData: true },
  { state: 'Yucatán', capital: 'Mérida', lat: 20.9674, lng: -89.5926, hasData: true },
  { state: 'Zacatecas', capital: 'Zacatecas', lat: 22.7709, lng: -102.5832, hasData: true }
];

// Función para convertir nombre UI a nombre de BD
export function getDbStateName(uiStateName: string): string {
  return stateNameMapping[uiStateName] || uiStateName.toUpperCase();
}

// Datos de capitales de estados mexicanos
const capitalCities = [
  { state: "Aguascalientes", city: "Aguascalientes", lat: 21.8818, lng: -102.2916 },
  { state: "Baja California", city: "Mexicali", lat: 32.6245, lng: -115.4522 },
  { state: "Baja California Sur", city: "La Paz", lat: 24.1429, lng: -110.3122 },
  { state: "Campeche", city: "Campeche", lat: 19.8301, lng: -90.5349 },
  { state: "Chiapas", city: "Tuxtla Gutiérrez", lat: 16.7516, lng: -93.1029 },
  { state: "Chihuahua", city: "Chihuahua", lat: 28.6353, lng: -106.0889 },
  { state: "Coahuila", city: "Saltillo", lat: 25.4267, lng: -101.0029 },
  { state: "Colima", city: "Colima", lat: 19.2452, lng: -103.7240 },
  { state: "Ciudad de México", city: "Ciudad de México", lat: 19.4326, lng: -99.1332 },
  { state: "Durango", city: "Durango", lat: 24.0277, lng: -104.6531 },
  { state: "Estado de México", city: "Toluca", lat: 19.2826, lng: -99.6557 },
  { state: "Guanajuato", city: "Guanajuato", lat: 21.0190, lng: -101.2574 },
  { state: "Guerrero", city: "Chilpancingo", lat: 17.5506, lng: -99.5018 },
  { state: "Hidalgo", city: "Pachuca", lat: 20.1011, lng: -98.7592 },
  { state: "Jalisco", city: "Guadalajara", lat: 20.6597, lng: -103.3496 },
  { state: "Michoacán", city: "Morelia", lat: 19.7060, lng: -101.1950 },
  { state: "Morelos", city: "Cuernavaca", lat: 18.9217, lng: -99.2344 },
  { state: "Nayarit", city: "Tepic", lat: 21.5042, lng: -104.8946 },
  { state: "Nuevo León", city: "Monterrey", lat: 25.6866, lng: -100.3161 },
  { state: "Oaxaca", city: "Oaxaca", lat: 17.0732, lng: -96.7266 },
  { state: "Puebla", city: "Puebla", lat: 19.0413, lng: -98.2063 },
  { state: "Querétaro", city: "Querétaro", lat: 20.5881, lng: -100.3899 },
  { state: "Quintana Roo", city: "Chetumal", lat: 18.5002, lng: -88.2963 },
  { state: "San Luis Potosí", city: "San Luis Potosí", lat: 22.1566, lng: -100.9855 },
  { state: "Sinaloa", city: "Culiacán", lat: 24.8049, lng: -107.3940 },
  { state: "Sonora", city: "Hermosillo", lat: 29.0729, lng: -110.9559 },
  { state: "Tabasco", city: "Villahermosa", lat: 17.9892, lng: -92.9281 },
  { state: "Tamaulipas", city: "Ciudad Victoria", lat: 23.7369, lng: -99.1411 },
  { state: "Tlaxcala", city: "Tlaxcala", lat: 19.3139, lng: -98.2403 },
  { state: "Veracruz", city: "Xalapa", lat: 19.5438, lng: -96.9102 },
  { state: "Yucatán", city: "Mérida", lat: 20.9674, lng: -89.5926 },
  { state: "Zacatecas", city: "Zacatecas", lat: 22.7709, lng: -102.5832 }
];

// Icono personalizado para el marcador azul
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para controlar el mapa y reportar su estado
function MapController() {
  const map = useMap();
  
  useEffect(() => {
    console.log("Map instance loaded:", map);
    
    const handleLoad = () => {
      console.log("Map fully loaded");
      
      // Intenta ocultar el mensaje de carga
      const loadingMessage = document.querySelector('.map-loading-message');
      if (loadingMessage) {
        loadingMessage.classList.add('opacity-0');
        setTimeout(() => {
          if (loadingMessage.parentNode) {
            loadingMessage.parentNode.removeChild(loadingMessage);
          }
        }, 500);
      }
    };
    
    const handleError = (e: any) => {
      console.error("Map error:", e);
    };
    
    map.once('load', handleLoad);
    map.on('error', handleError);
    
    // También podemos intentar detectar cuando los tiles se cargan
    map.on('tileload', () => console.log("Tiles loading..."));
    map.on('tileerror', (e: any) => {
      console.error("Tile error:", e);
    });
    
    // Forzar un rerender después de que el mapa se cargue
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    return () => {
      map.off('load', handleLoad);
      map.off('error', handleError);
    };
  }, [map]);
  
  return null;
}

export function MapComponent({ selectedState, onStateSelect }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapError, setMapError] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Encontrar la capital del estado seleccionado
  const selectedCapital = capitalCities.find(city => city.state === selectedState);
  const mapCenter: LatLngExpression = selectedCapital 
    ? [selectedCapital.lat, selectedCapital.lng] 
    : [23.6345, -102.5528]; // Centro de México si no hay estado seleccionado
  
  // Map load/error helpers
  const handleMapError = () => {
    console.error("Map failed to load properly");
    setMapError(true);
  };

  const handleTilesLoad = () => {
    // Any tile layer finishing load means the map is visible
    if (!isMapLoaded) {
      setIsMapLoaded(true);
    }
  };
  
  const handleStateClick = (state: string) => {
    if (onStateSelect) {
      onStateSelect(state);
    }
  };
  
  return (
    <Card className="rounded-xl overflow-hidden shadow-md border dark:border-gray-700">
      <div className="h-[500px] relative">
        {mapError ? (
          // Fallback static map if interactive map fails
          <MapFallback 
            selectedState={selectedState} 
            height="500px" 
            className="rounded-xl"
          />
        ) : (
          <MapContainer 
            center={mapCenter} 
            zoom={selectedCapital ? 8 : 5} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            whenReady={() => setIsMapLoaded(true)}
            ref={(map) => {
              if (map) {
                mapRef.current = map;
              }
            }}
          >
            {/* Primary tile layer - OpenStreetMap (simple and reliable) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{
                load: handleTilesLoad,
                tileerror: handleMapError,
              }}
            />
            
            {/* Fallback tile layer - Stadia Maps */}
            <TileLayer
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
              eventHandlers={{
                load: handleTilesLoad,
                tileerror: handleMapError,
              }}
            />
            
            {/* Second fallback - CartoDB */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              eventHandlers={{
                load: handleTilesLoad,
                tileerror: handleMapError,
              }}
            />

            {selectedCapital && (
              <Marker position={[selectedCapital.lat, selectedCapital.lng]} icon={blueIcon}>
                <Popup>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{selectedCapital.city}</h3>
                    <p>Capital de {selectedCapital.state}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Controller for map events */}
            <MapController />
          </MapContainer>
        )}
        
        {/* Loading indicator while map initializes */}
        {!isMapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm">
            <div className="text-center p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Cargando mapa...</p>
              <div className="h-2 w-24 mx-auto mt-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-pulse rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}