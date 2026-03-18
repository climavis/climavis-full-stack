import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { Button } from './ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { getMapSummary, type MapSummary } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import mexicoGeoJSON from '../data/mexicoStates.json';

// Fix para los iconos de Leaflet en producción
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type MapViewType = 'temperatura' | 'topografia' | 'precipitacion' | 'viento' | 'huracanes' | 'monitoreoFenomenos' | 'puntosInundacion' | 'indicadoresMunicipales';

interface MapViewProps {
  selectedState: string | null;
  selectedYear: number;
  selectedMonth: number;
  onStateSelect?: (state: string | null) => void;
}

// Coordenadas de las capitales de los estados (para los marcadores)
const stateCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
  'AGUASCALIENTES': { lat: 21.8853, lng: -102.2916, name: 'Aguascalientes' },
  'BAJA CALIFORNIA': { lat: 32.6245, lng: -115.4523, name: 'Mexicali' },
  'BAJA CALIFORNIA SUR': { lat: 24.1426, lng: -110.3128, name: 'La Paz' },
  'CAMPECHE': { lat: 19.8301, lng: -90.5349, name: 'Campeche' },
  'CHIAPAS': { lat: 16.7516, lng: -93.1029, name: 'Tuxtla Gutiérrez' },
  'CHIHUAHUA': { lat: 28.6353, lng: -106.0889, name: 'Chihuahua' },
  'CDMX': { lat: 19.4326, lng: -99.1332, name: 'Ciudad de México' },
  'COAHUILA': { lat: 25.4232, lng: -100.9946, name: 'Saltillo' },
  'COLIMA': { lat: 19.2452, lng: -103.7241, name: 'Colima' },
  'DURANGO': { lat: 24.0277, lng: -104.6532, name: 'Durango' },
  'ESTADO DE MEXICO': { lat: 19.2826, lng: -99.6557, name: 'Toluca' },
  'GUANAJUATO': { lat: 21.0190, lng: -101.2574, name: 'Guanajuato' },
  'GUERRERO': { lat: 17.5506, lng: -99.5024, name: 'Chilpancingo' },
  'HIDALGO': { lat: 20.1220, lng: -98.7325, name: 'Pachuca' },
  'JALISCO': { lat: 20.6597, lng: -103.3496, name: 'Guadalajara' },
  'MICHOACAN': { lat: 19.7060, lng: -101.1948, name: 'Morelia' },
  'MORELOS': { lat: 18.9261, lng: -99.2336, name: 'Cuernavaca' },
  'NAYARIT': { lat: 21.5088, lng: -104.8941, name: 'Tepic' },
  'NUEVO LEON': { lat: 25.6866, lng: -100.3161, name: 'Monterrey' },
  'OAXACA': { lat: 17.0732, lng: -96.7266, name: 'Oaxaca' },
  'PUEBLA': { lat: 19.0414, lng: -98.2063, name: 'Puebla' },
  'QUERETARO': { lat: 20.5888, lng: -100.3899, name: 'Querétaro' },
  'QUINTANA ROO': { lat: 18.5036, lng: -88.3059, name: 'Chetumal' },
  'SAN LUIS POTOSI': { lat: 22.1565, lng: -100.9855, name: 'San Luis Potosí' },
  'SINALOA': { lat: 24.8091, lng: -107.3940, name: 'Culiacán' },
  'SONORA': { lat: 29.0729, lng: -110.9559, name: 'Hermosillo' },
  'TABASCO': { lat: 17.9892, lng: -92.9475, name: 'Villahermosa' },
  'TAMAULIPAS': { lat: 23.7369, lng: -99.1411, name: 'Ciudad Victoria' },
  'TLAXCALA': { lat: 19.3139, lng: -98.2404, name: 'Tlaxcala' },
  'VERACRUZ': { lat: 19.5438, lng: -96.9102, name: 'Xalapa' },
  'YUCATAN': { lat: 20.9674, lng: -89.5926, name: 'Mérida' },
  'ZACATECAS': { lat: 22.7709, lng: -102.5832, name: 'Zacatecas' },
};

interface StateClimateData {
  estado: string;
  temperatura: number;
  precipitacion: number;
  viento: number;
  humedad: number;
  lat: number;
  lng: number;
}

export function MapView({ selectedState, selectedYear, selectedMonth, onStateSelect }: MapViewProps) {
  const SHOW_FULLSCREEN_TOGGLE = false; // Ocultar temporalmente el botón de ampliar
  const [activeView, setActiveView] = useState<MapViewType>('temperatura');
  const [climateData, setClimateData] = useState<StateClimateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // Fullscreen: bloquear scroll y cerrar con ESC
  useEffect(() => {
    // Bloquear scroll del documento cuando está en fullscreen
    try {
      const html = document.documentElement;
      const body = document.body;
      if (isFullscreen) {
        html.classList.add('overflow-hidden');
        body.classList.add('overflow-hidden');
      } else {
        html.classList.remove('overflow-hidden');
        body.classList.remove('overflow-hidden');
      }
    } catch (e) {
      // noop en SSR/errores
    }
    // Cerrar con ESC
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      try {
        const html = document.documentElement;
        const body = document.body;
        html.classList.remove('overflow-hidden');
        body.classList.remove('overflow-hidden');
      } catch {}
    };
  }, [isFullscreen]);

  // Cargar datos de todos los estados con UNA SOLA llamada al backend
  useEffect(() => {
    const fetchAllStatesData = async () => {
      setLoading(true);
      try {
        const summary: MapSummary = await getMapSummary(selectedYear, selectedMonth + 1);

        const data: StateClimateData[] = Object.entries(summary)
          .filter(([estado]) => stateCoordinates[estado])
          .map(([estado, values]) => ({
            estado,
            temperatura: values.temperatura ?? 0,
            precipitacion: values.precipitacion ?? 0,
            viento: values.viento ?? 0,
            humedad: values.humedad ?? 0,
            lat: stateCoordinates[estado].lat,
            lng: stateCoordinates[estado].lng,
          }));

        setClimateData(data.filter(d => d.temperatura > 0 || d.precipitacion > 0));
      } catch (error) {
        console.error('Error fetching map summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStatesData();
  }, [selectedYear, selectedMonth]);

  // Obtener valor según tipo de vista
  const getValue = (data: StateClimateData, type: MapViewType): number => {
    switch (type) {
      case 'temperatura':
        return data.temperatura;
      case 'precipitacion':
        return data.precipitacion;
      case 'viento':
        return data.viento;
      case 'topografia':
        return data.humedad; // Placeholder
      default:
        return 0;
    }
  };

  // Componente para renderizar los estados de México con GeoJSON
  // Alias: el GeoJSON usa "México" para Estado de México
  const GEO_NAME_ALIASES: Record<string, string> = {
    'MEXICO': 'ESTADO DE MEXICO',
  };

  const normalizeStateName = (name: string): string => {
    const n = name.toUpperCase()
      .replace(/Á/g, 'A')
      .replace(/É/g, 'E')
      .replace(/Í/g, 'I')
      .replace(/Ó/g, 'O')
      .replace(/Ú/g, 'U')
      .replace(/Ñ/g, 'N');
    return GEO_NAME_ALIASES[n] || n;
  };

  const findStateData = (data: StateClimateData[], stateName: string): StateClimateData | undefined => {
    const normalizedGeo = normalizeStateName(stateName);
    return data.find(d => {
      const normalizedDb = normalizeStateName(d.estado);
      return normalizedDb === normalizedGeo;
    });
  };

  const StateGeoJSON = ({ data, activeView, onStateSelect }: { data: StateClimateData[], activeView: MapViewType, onStateSelect?: (state: string | null) => void }) => {
    const getColor = (stateName: string): string => {
      const stateData = findStateData(data, stateName);

      if (!stateData) return '#e5e7eb'; // Gris claro si no hay datos
      
      const value = getValue(stateData, activeView);
      if (value === 0) return '#e5e7eb';
      
      switch (activeView) {
        case 'temperatura':
          if (value < 15) return '#3b82f6';
          if (value < 20) return '#22d3ee';
          if (value < 25) return '#10b981';
          if (value < 28) return '#84cc16';
          if (value < 32) return '#fbbf24';
          if (value < 36) return '#f97316';
          return '#ef4444';
          
        case 'precipitacion':
          if (value < 30) return '#fef3c7';
          if (value < 60) return '#fcd34d';
          if (value < 100) return '#93c5fd';
          if (value < 150) return '#60a5fa';
          if (value < 200) return '#3b82f6';
          return '#1e40af';
          
        case 'viento':
          if (value < 10) return '#10b981';
          if (value < 20) return '#84cc16';
          if (value < 30) return '#fbbf24';
          if (value < 45) return '#f97316';
          return '#ef4444';
          
        default:
          return '#9ca3af';
      }
    };

    const onEachFeature = (feature: any, layer: any) => {
      if (feature.properties && feature.properties.name) {
        const stateName = feature.properties.name;
        const stateData = findStateData(data, stateName);

        // Agregar handler de click para seleccionar estado
        layer.on('click', () => {
          if (onStateSelect && stateData) {
            console.debug('[MapView] State clicked:', stateData.estado);
            onStateSelect(stateData.estado);
          }
        });

        // Agregar cursor pointer para indicar que es clickeable
        layer.on('mouseover', () => {
          layer.getElement()?.style && (layer.getElement().style.cursor = 'pointer');
        });

        if (stateData) {
          const value = getValue(stateData, activeView);
          layer.bindTooltip(`
            <div class="text-sm">
              <p class="font-medium">${stateName}</p>
              <p class="text-xs">
                ${activeView === 'temperatura' ? `${value.toFixed(1)}°C` : ''}
                ${activeView === 'precipitacion' ? `${value.toFixed(1)}mm` : ''}
                ${activeView === 'viento' ? `${value.toFixed(1)} km/h` : ''}
                ${activeView === 'topografia' ? `${value.toFixed(1)}%` : ''}
              </p>
            </div>
          `, { sticky: true });
        }
      }
    };

    const style = (feature: any) => {
      const stateName = feature?.properties?.name || '';
      return {
        fillColor: getColor(stateName),
        fillOpacity: 0.7,
        color: '#374151',
        weight: 1,
        opacity: 1
      };
    };

    return <GeoJSON key={`geo-${activeView}-${selectedYear}-${selectedMonth}`} data={mexicoGeoJSON as any} style={style} onEachFeature={onEachFeature} />;
  };

  const mapViews = [
    { id: 'temperatura' as MapViewType, label: 'Temperatura' },
    { id: 'precipitacion' as MapViewType, label: 'Precipitación' },
    { id: 'viento' as MapViewType, label: 'Viento' },
    { id: 'huracanes' as MapViewType, label: 'Huracanes' },
  ];

  const cenapredMapViews = [
    { id: 'monitoreoFenomenos' as MapViewType, label: 'Monitoreo Fenómenos' },
    { id: 'puntosInundacion' as MapViewType, label: 'Puntos Críticos Inundación' },
    { id: 'indicadoresMunicipales' as MapViewType, label: 'Indicadores Municipales' },
  ];

  return (
    <>
      {/* Overlay oscuro cuando está en fullscreen */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      <div className={`
        ${isFullscreen ? 'fixed inset-0 z-[9999] bg-white dark:bg-gray-900 overflow-hidden p-0 rounded-none' : 'p-4 sm:p-6 rounded-3xl glass-card relative overflow-hidden'}
        transition-all duration-500 ease-in-out
      `}>
  <div className="bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 absolute inset-0" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Vista de Mapa
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              Explora diferentes capas de información climática
            </p>
          </div>
          {SHOW_FULLSCREEN_TOGGLE && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="glass-button border-0 flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform self-start"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Minimizar</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Ampliar</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Map View Selector */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {mapViews.map((view) => (
            <Button
              key={view.id}
              variant={activeView === view.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView(view.id)}
              className={`
                rounded-full transition-all
                ${activeView === view.id 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-0' 
                  : 'glass-button'
                }
              `}
            >
              {view.label}
            </Button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-3 sm:mb-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Mapas CENAPRED
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-400 via-gray-300 to-transparent dark:from-gray-600 dark:via-gray-700 dark:to-transparent"></div>
        </div>

        {/* CENAPRED Maps Selector */}
        <div className={`flex flex-wrap gap-1.5 sm:gap-2 ${isFullscreen ? 'mb-2' : 'mb-4 sm:mb-6'}`}>
          {cenapredMapViews.map((view) => (
            <Button
              key={view.id}
              variant={activeView === view.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView(view.id)}
              className={`
                rounded-full transition-all
                ${activeView === view.id 
                  ? 'bg-green-600 hover:bg-green-700 text-white border-0' 
                  : 'glass-button'
                }
              `}
            >
              {view.label}
            </Button>
          ))}
        </div>

        {/* Map Container */}
        <div className={`relative ${isFullscreen ? 'px-0' : ''}`}>
          <div className={`${isFullscreen ? 'h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] rounded-none' : 'aspect-[16/10] rounded-2xl'} overflow-hidden`}>
            {activeView === 'huracanes' ? (
              <iframe
                src="https://www.servir.net/servir_alertas/index-new.php"
                className="w-full h-full border-0"
                title="SERVIR - Alertas de Huracanes"
                allow="geolocation"
              />
            ) : activeView === 'monitoreoFenomenos' ? (
              <iframe
                src="http://www.atlasnacionalderiesgos.gob.mx/portal/MonitoreoSecretarioPublico/"
                className="w-full h-full border-0"
                title="CENAPRED - Monitoreo y Avisos de Fenómenos Naturales"
                allow="geolocation"
              />
            ) : activeView === 'puntosInundacion' ? (
              <iframe
                src="http://www.atlasnacionalderiesgos.gob.mx/portal/CritInundacion/"
                className="w-full h-full border-0"
                title="CENAPRED - Puntos Críticos de Inundación"
                allow="geolocation"
              />
            ) : activeView === 'indicadoresMunicipales' ? (
              <iframe
                src="http://www.atlasnacionalderiesgos.gob.mx/portal/Apps/Municipios"
                className="w-full h-full border-0"
                title="CENAPRED - Indicadores Municipales de Peligro, Exposición y Vulnerabilidad"
                allow="geolocation"
              />
            ) : (
              <MapContainer
                key={activeView} // Forzar re-render cuando cambia la vista
                center={[23.6345, -102.5528]} // Centro de México
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                className={isFullscreen ? '' : 'rounded-2xl'}
              >
                {/* Cambiar capa de tiles según la vista activa */}
                {activeView === 'topografia' ? (
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.tracestrack.com/topo__/{z}/{x}/{y}.png?key=5f4ec5c5b13e7ba4f8e6eb5e00bfcd1b"
                    maxZoom={18}
                  />
                ) : (
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                )}
                
                {/* Marcador del estado seleccionado */}
                {selectedState && stateCoordinates[selectedState] && (
                  <Marker 
                    position={[
                      stateCoordinates[selectedState].lat,
                      stateCoordinates[selectedState].lng
                    ]}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-medium">{selectedState}</p>
                        <p className="text-xs text-gray-600">
                          Capital: {stateCoordinates[selectedState].name}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* GeoJSON con contornos reales de los estados (oculto en topografía) */}
                {!loading && activeView !== 'topografia' && (
                  <StateGeoJSON data={climateData} activeView={activeView} onStateSelect={onStateSelect} />
                )}
              </MapContainer>
            )}
          </div>

          {/* Simbología (oculta para vistas de iframe) */}
          {!isFullscreen && activeView !== 'huracanes' && 
           activeView !== 'monitoreoFenomenos' && 
           activeView !== 'puntosInundacion' && 
           activeView !== 'indicadoresMunicipales' && (
            <div className="mt-4 p-4 rounded-2xl glass-card">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Simbología
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {activeView === 'temperatura' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-blue-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Frío (&lt;15°C)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-green-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Templado (15-25°C)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-yellow-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Cálido (25-35°C)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-red-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Muy cálido (&gt;35°C)</span>
                  </div>
                </>
              )}
              {activeView === 'precipitacion' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-900" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Bajo (&lt;50mm)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-blue-300 dark:bg-blue-800" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Medio (50-150mm)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Alto (150-300mm)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-blue-700 dark:bg-blue-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Muy alto (&gt;300mm)</span>
                  </div>
                </>
              )}
              {activeView === 'topografia' && (
                <div className="col-span-full">
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Mapa topográfico de OpenStreetMap mostrando elevaciones, curvas de nivel y características geográficas del terreno.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded bg-green-700" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">Tierras bajas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded bg-yellow-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">Elevaciones medias</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded bg-orange-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">Montañas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded bg-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">Altas montañas</span>
                    </div>
                  </div>
                </div>
              )}
              {activeView === 'viento' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-green-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Calma (&lt;10 km/h)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-yellow-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Brisa (10-30 km/h)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-orange-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Viento (30-60 km/h)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-red-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Fuerte (&gt;60 km/h)</span>
                  </div>
                </>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
