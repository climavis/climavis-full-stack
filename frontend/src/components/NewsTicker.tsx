import { useEffect, useState } from 'react';

interface NewsEvent {
  state: string;
  description: string;
}

export default function NewsTicker() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Función para cargar eventos desde el archivo markdown
    const loadEvents = async () => {
      try {
        // Cargar desde el backend API
        const response = await fetch('http://localhost:8000/eventos-climaticos');
        if (!response.ok) {
          throw new Error('No se pudo cargar el archivo');
        }
        const text = await response.text();
        parseMarkdownEvents(text);
      } catch (err) {
        console.error('Error cargando eventos:', err);
        setError(true);
        // Eventos de respaldo en caso de error
        setEvents([
          { state: 'VERACRUZ', description: 'Continúan esfuerzos por brindar apoyos a familias afectadas por inundaciones y lluvias' },
          { state: 'MICHOACÁN', description: 'Monitoreo constante de la actividad del volcán Popocatépetl con semáforo amarillo fase 2' },
          { state: 'JALISCO', description: 'Alerta por altas temperaturas y riesgo de incendios forestales en la región' },
        ]);
      }
    };

    // Parsear el contenido markdown
    const parseMarkdownEvents = (text: string) => {
      const lines = text.split('\n');
      const parsedEvents: NewsEvent[] = [];

      lines.forEach(line => {
        // Buscar líneas con el formato: **ESTADO**: Descripción
        const match = line.match(/\*\*([A-ZÁÉÍÓÚÑ\s]+)\*\*:\s*(.+)/);
        if (match) {
          const state = match[1].trim();
          const description = match[2].trim();
          
          // Ignorar líneas de ejemplo/placeholder
          if (state === 'ESTADO' || description.toLowerCase().includes('nombre del evento')) {
            return;
          }
          
          parsedEvents.push({
            state: state,
            description: description,
          });
        }
      });

      if (parsedEvents.length > 0) {
        setEvents(parsedEvents);
        setError(false);
      }
    };

    loadEvents();

    // Recargar eventos cada 5 minutos para detectar actualizaciones
    const interval = setInterval(loadEvents, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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
