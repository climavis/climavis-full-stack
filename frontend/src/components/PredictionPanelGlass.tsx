import { Card } from './ui/card';

interface PredictionPanelProps {
  stateName: string;
  temperatureChange: number;
  precipitationChange: number;
}

export function PredictionPanel({ 
  stateName, 
  temperatureChange, 
  precipitationChange 
}: PredictionPanelProps) {
  return (
    <div className="glass-panel animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-heading mb-1">Predicciones Climáticas</h3>
        <p className="text-subheading opacity-80">{stateName}</p>
      </div>

      {/* Info Box - Black with warning icon */}
      <div className="info-box-black mb-6 flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M8 4V8M8 10.5H8.005M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" 
              stroke="#000000" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-caption flex-1 leading-relaxed">
          Los datos mostrados son históricos. Selecciona un año futuro para ver predicciones.
        </p>
      </div>

      {/* Comparison Section */}
      <div className="space-y-3">
        <h4 className="text-body font-medium mb-3">
          Cambios Esperados vs Promedio Histórico
        </h4>

        {/* Temperature Change */}
        <div className="comparison-value">
          <span className="comparison-label">Temperatura</span>
          <span className={`comparison-number ${temperatureChange >= 0 ? 'positive' : 'negative'}`}>
            {temperatureChange >= 0 ? '+' : ''}{temperatureChange.toFixed(1)}°C
          </span>
        </div>

        {/* Precipitation Change */}
        <div className="comparison-value">
          <div className="flex items-center gap-2 flex-1">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path 
                d="M8 2L8 14M5 12L8 14L11 12" 
                stroke="#E67E22" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span className="comparison-label">Precipitación</span>
          </div>
          <span className={`comparison-number ${precipitationChange >= 0 ? 'negative' : 'positive'}`}>
            {precipitationChange >= 0 ? '' : ''}{precipitationChange.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Risk Assessment Section */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h4 className="text-body font-medium mb-4">Evaluación de Riesgos</h4>
        
        <div className="space-y-3">
          {/* Drought Risk */}
          <div className="risk-bar-container">
            <span className="risk-label">Riesgo de Sequía</span>
            <div className="risk-bar">
              <div 
                className="risk-bar-fill bg-yellow-500" 
                style={{ width: '60%' }}
              ></div>
            </div>
            <span className="risk-badge medio">Medio</span>
          </div>

          {/* Flood Risk */}
          <div className="risk-bar-container">
            <span className="risk-label">Riesgo de Inundaciones</span>
            <div className="risk-bar">
              <div 
                className="risk-bar-fill bg-green-500" 
                style={{ width: '30%' }}
              ></div>
            </div>
            <span className="risk-badge bajo">Bajo</span>
          </div>

          {/* Extreme Events */}
          <div className="risk-bar-container">
            <span className="risk-label">Eventos climáticos extremos</span>
            <div className="risk-bar">
              <div 
                className="risk-bar-fill bg-orange-500" 
                style={{ width: '65%' }}
              ></div>
            </div>
            <span className="risk-badge medio">Medio</span>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h4 className="text-body font-medium mb-4">Recomendaciones</h4>
        
        <div className="space-y-3">
          {/* Recommendation 1 */}
          <div className="info-box-black flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black font-bold text-xs">
              1
            </div>
            <p className="text-caption flex-1 leading-relaxed">
              Se espera un aumento significativo de temperatura. Prepara recursos hídricos y sistemas de enfriamiento.
            </p>
          </div>

          {/* Recommendation 2 */}
          <div className="info-box-black flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black font-bold text-xs">
              2
            </div>
            <p className="text-caption flex-1 leading-relaxed">
              Alto riesgo de inundaciones. Revise sistemas de drenaje y planifique evacuaciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
