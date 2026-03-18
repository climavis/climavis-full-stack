import { useEffect, useState, useMemo } from 'react';

interface NewsEvent {
  state: string;
  description: string;
  icon: string;
}

// ── Generador automático de alertas por mes y estado ─────────────────

/**
 * Devuelve un conjunto de alertas climáticas contextuales según el mes
 * actual del sistema. No requiere cambios manuales: se recalcula
 * automáticamente cada vez que se monta el componente.
 */
function generateSeasonalAlerts(month: number): NewsEvent[] {
  // month: 0-indexed (0 = enero, 11 = diciembre)

  // ── Alertas comunes todo el año ──────────────────────────────────
  const yearRound: NewsEvent[] = [
    { state: 'CDMX', description: 'Monitoreo de calidad del aire – consulta el índice IMECA antes de actividades al aire libre', icon: '🌫️' },
    { state: 'POPOCATÉPETL', description: 'Semáforo de alerta volcánica activo – manténgase informado sobre la actividad del volcán', icon: '🌋' },
  ];

  // ── Alertas por temporada / mes ──────────────────────────────────
  const seasonal: Record<string, NewsEvent[]> = {
    // INVIERNO (dic-feb): frentes fríos, heladas, aire seco
    winter: [
      { state: 'CHIHUAHUA', description: 'Alerta por heladas intensas y temperaturas bajo cero – proteja cultivos y tuberías', icon: '🥶' },
      { state: 'DURANGO', description: 'Frente frío en la Sierra Madre Occidental – se esperan nevadas en zonas altas', icon: '❄️' },
      { state: 'SONORA', description: 'Temperaturas mínimas históricas – abríguese y resguarde a personas vulnerables', icon: '🌡️' },
      { state: 'NUEVO LEÓN', description: 'Nortes con vientos fuertes y descenso brusco de temperatura en la región', icon: '💨' },
      { state: 'TAMAULIPAS', description: 'Vientos del norte superiores a 60 km/h – precaución en carreteras y puertos', icon: '🌬️' },
      { state: 'VERACRUZ', description: 'Rachas de viento y oleaje alto en la costa por influencia de frente frío', icon: '🌊' },
      { state: 'COAHUILA', description: 'Mínimas de -5°C previstas – active protocolo de protección a personas en situación de calle', icon: '🧊' },
    ],
    // PRIMAVERA (mar-may): calor intenso, sequía, incendios, pre-lluvias
    spring: [
      { state: 'JALISCO', description: 'Alerta roja por incendios forestales – evite fogatas y reporte columnas de humo al 911', icon: '🔥' },
      { state: 'GUERRERO', description: 'Ola de calor con sensación térmica superior a 45°C en zonas costeras', icon: '☀️' },
      { state: 'TABASCO', description: 'Temperaturas récord – hidratación constante y evite exposición solar de 11 a 16 hrs', icon: '🌡️' },
      { state: 'SINALOA', description: 'Sequía severa afecta producción agrícola – restricciones de agua en riego', icon: '🏜️' },
      { state: 'MICHOACÁN', description: 'Alerta por incendios forestales activos en la Meseta Purépecha', icon: '🔥' },
      { state: 'OAXACA', description: 'Calor extremo en el Istmo de Tehuantepec – precaución por golpes de calor', icon: '🥵' },
      { state: 'YUCATÁN', description: 'Temporada de calor intenso – temperaturas superiores a 40°C en la península', icon: '☀️' },
      { state: 'CHIAPAS', description: 'Riesgo de incendios y mala calidad del aire por quemas agrícolas', icon: '💨' },
    ],
    // VERANO (jun-sep): temporada de lluvias, huracanes, inundaciones
    summer: [
      { state: 'VERACRUZ', description: 'Lluvias torrenciales e inundaciones – evite cruzar ríos y arroyos crecidos', icon: '🌧️' },
      { state: 'TABASCO', description: 'Nivel de ríos Grijalva y Usumacinta en alerta – monitoreo permanente', icon: '🌊' },
      { state: 'GUERRERO', description: 'Alerta por posible formación de ciclón tropical en el Pacífico – siga indicaciones de Protección Civil', icon: '🌀' },
      { state: 'QUINTANA ROO', description: 'Temporada de huracanes activa en el Caribe – revise su plan de emergencia', icon: '🌀' },
      { state: 'BAJA CALIFORNIA SUR', description: 'Vigilancia por tormenta tropical – asegure embarcaciones y refuerce techos', icon: '⛈️' },
      { state: 'NAYARIT', description: 'Lluvias intensas provocan deslaves en zonas serranas – precaución en carreteras', icon: '⛰️' },
      { state: 'PUEBLA', description: 'Crecidas de ríos en la Sierra Norte – albergues activados en municipios vulnerables', icon: '🏚️' },
      { state: 'CHIAPAS', description: 'Desbordamiento de ríos en la región de la Costa – evacuación preventiva en curso', icon: '🚨' },
      { state: 'COLIMA', description: 'Mar de fondo con olas de hasta 3 metros – bandera roja en playas', icon: '🏖️' },
      { state: 'CDMX', description: 'Lluvias vespertinas con granizo – proteja vehículos y evite zonas de encharcamiento', icon: '🌧️' },
    ],
    // OTOÑO (oct-nov): transición, últimos huracanes, frentes fríos tempranos
    autumn: [
      { state: 'TAMAULIPAS', description: 'Últimos ciclones de la temporada – mantenga kit de emergencia listo', icon: '🌀' },
      { state: 'VERACRUZ', description: 'Lluvias persistentes y nortes – riesgo de inundaciones en zonas bajas', icon: '🌧️' },
      { state: 'TABASCO', description: 'Nivel de presas en capacidad máxima – desfogues controlados en curso', icon: '💧' },
      { state: 'OAXACA', description: 'Frente frío temprano combinado con humedad – lluvias moderadas a fuertes', icon: '🌦️' },
      { state: 'CHIHUAHUA', description: 'Primeras heladas del otoño en la sierra – proteja ganado y cultivos', icon: '🌡️' },
      { state: 'JALISCO', description: 'Lluvias tardías reactivan riesgo de deslaves en la barranca de Huentitán', icon: '⛰️' },
      { state: 'SAN LUIS POTOSÍ', description: 'Transición a temporada seca – descenso gradual de temperaturas en la Huasteca', icon: '🍂' },
    ],
  };

  // ── Alertas específicas por mes ──────────────────────────────────
  const monthSpecific: Partial<Record<number, NewsEvent[]>> = {
    0: [ // Enero
      { state: 'NACIONAL', description: 'Temporada invernal – hasta 50 frentes fríos previstos, manténgase informado', icon: '❄️' },
    ],
    2: [ // Marzo
      { state: 'NACIONAL', description: 'Inicio de temporada de calor – prepare plan de hidratación y protección solar', icon: '☀️' },
    ],
    4: [ // Mayo  
      { state: 'NACIONAL', description: 'Mes más cálido del año en gran parte del país – precaución extrema por golpes de calor', icon: '🔥' },
    ],
    5: [ // Junio
      { state: 'NACIONAL', description: 'Inicio oficial de temporada de lluvias y huracanes – revise su plan de emergencia familiar', icon: '🌀' },
    ],
    8: [ // Septiembre
      { state: 'NACIONAL', description: 'Pico de la temporada de huracanes – máxima vigilancia en costas del Pacífico y Golfo', icon: '🌀' },
      { state: 'NACIONAL', description: 'Mes de la Patria: participa en los simulacros de sismo del 19 de septiembre', icon: '⚠️' },
    ],
    10: [ // Noviembre
      { state: 'NACIONAL', description: 'Fin de temporada de huracanes – inicia temporada de frentes fríos y nortes', icon: '🌬️' },
    ],
    11: [ // Diciembre
      { state: 'NACIONAL', description: 'Frentes fríos intensos – protéjase del frío y revise instalaciones de gas', icon: '🥶' },
    ],
  };

  // ── Seleccionar temporada ────────────────────────────────────────
  let season: string;
  if (month >= 11 || month <= 1) season = 'winter';
  else if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 8) season = 'summer';
  else season = 'autumn';

  // Combinar: año + temporada + específicas del mes
  const all = [
    ...yearRound,
    ...(seasonal[season] || []),
    ...(monthSpecific[month] || []),
  ];

  // Mezclar aleatoriamente (con seed del mes para consistencia durante el mes)
  return shuffleWithSeed(all, month + new Date().getFullYear());
}

/** Shuffle determinista basado en un seed numérico */
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let s = seed;
  const random = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function NewsTicker() {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed

  const events = useMemo(() => generateSeasonalAlerts(currentMonth), [currentMonth]);

  if (events.length === 0) return null;

  // Duplicar eventos para crear un loop continuo sin espacios
  const duplicatedEvents = [...events, ...events, ...events];

  return (
    <div className="w-full bg-black py-2.5 overflow-hidden relative border-b border-gray-700">
      {/* Contenedor del ticker con animación */}
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {duplicatedEvents.map((event, index) => (
            <span key={index} className="inline-flex items-center mx-12">
              <span className="font-extrabold text-yellow-400 text-sm tracking-wide">{event.state}</span>
              <span className="mx-2 font-extrabold text-white">:</span>
              <span className="font-normal text-gray-200 text-sm">{event.description}</span>
              <span className="mx-8 text-gray-500">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Estilos para la animación del ticker */}
      <style>{`
        .ticker-wrapper {
          width: 100%;
          overflow: hidden;
        }

        .ticker-content {
          display: inline-block;
          white-space: nowrap;
          animation: ticker 60s linear infinite;
        }

        /* Velocidad ajustada para lectura cómoda a 60Hz */
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        /* Pausar animación al hacer hover para leer mejor */
        .ticker-wrapper:hover .ticker-content {
          animation-play-state: paused;
        }

        /* Optimización para pantallas de alta frecuencia */
        @media (min-resolution: 120dpi) {
          .ticker-content {
            animation: ticker 60s linear infinite;
          }
        }
      `}</style>
    </div>
  );
}
