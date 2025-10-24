// MapFallback.tsx
import { useEffect, useState } from 'react';
import { Card } from './ui/card';

interface MapFallbackProps {
  selectedState: string | null;
  width?: string;
  height?: string;
  className?: string;
}

export function MapFallback({ 
  selectedState, 
  width = "100%", 
  height = "500px", 
  className = "" 
}: MapFallbackProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Simulate a small loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <Card 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        {selectedState ? (
          <div className="text-center p-4">
            <h3 className="text-lg font-medium">
              {selectedState}
            </h3>
            <p className="text-sm text-muted-foreground">
              Mapa estático disponible
            </p>
          </div>
        ) : (
          <div className="text-center p-4">
            <h3 className="text-lg font-medium">Mapa de México</h3>
            <p className="text-sm text-muted-foreground">
              Seleccione un estado para más información
            </p>
          </div>
        )}
      </div>

      <img
        src="/map-fallback.svg"
        alt="Mapa de México"
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
      />

      {/* Loading animation */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}
    </Card>
  );
}