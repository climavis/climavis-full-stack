// Datos específicos y detallados para Yucatán
export interface YucatanClimateData {
  temperature: number;
  precipitation: number;
  humidity: number;
  uvIndex: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  dewPoint: number;
}

export interface DisasterData {
  hurricanes: {
    risk: number;
    season: string;
    lastMajor: string;
    category: number;
  };
  flooding: {
    risk: number;
    areas: string[];
    season: string;
  };
  drought: {
    risk: number;
    duration: number;
    severity: string;
  };
  cenoteImpact: {
    level: number;
    affected: string[];
  };
}

export interface AgriculturalData {
  crops: {
    henequen: { health: number; yield: number };
    corn: { health: number; yield: number };
    citrus: { health: number; yield: number };
    honey: { production: number; quality: number };
  };
  soilMoisture: number;
  pestRisk: number;
}

export interface BiodiversityData {
  flamingos: { population: number; status: string };
  jaguars: { sightings: number; habitat: number };
  butterflies: { species: number; migration: string };
  cenotes: { waterLevel: number; quality: string };
  mangroves: { coverage: number; health: number };
}

export interface TourismData {
  beachConditions: string;
  archeologicalSites: { visitors: number; condition: string };
  ecoTourism: { activity: number; sustainability: number };
  weatherAlerts: string[];
}

// Datos históricos mensuales de Yucatán
export const yucatanHistoricalData: Record<number, Record<number, YucatanClimateData>> = {
  2023: {
    0: { temperature: 24.5, precipitation: 45, humidity: 78, uvIndex: 8, windSpeed: 12, pressure: 1015, visibility: 15, dewPoint: 19.2 },
    1: { temperature: 26.1, precipitation: 32, humidity: 75, uvIndex: 9, windSpeed: 14, pressure: 1013, visibility: 18, dewPoint: 20.8 },
    2: { temperature: 28.3, precipitation: 28, humidity: 72, uvIndex: 10, windSpeed: 16, pressure: 1012, visibility: 20, dewPoint: 22.1 },
    3: { temperature: 30.2, precipitation: 35, humidity: 74, uvIndex: 11, windSpeed: 15, pressure: 1011, visibility: 22, dewPoint: 24.3 },
    4: { temperature: 32.1, precipitation: 95, humidity: 79, uvIndex: 12, windSpeed: 13, pressure: 1009, visibility: 16, dewPoint: 27.5 },
    5: { temperature: 33.8, precipitation: 145, humidity: 82, uvIndex: 12, windSpeed: 11, pressure: 1008, visibility: 12, dewPoint: 29.8 },
    6: { temperature: 34.2, precipitation: 180, humidity: 85, uvIndex: 11, windSpeed: 10, pressure: 1007, visibility: 10, dewPoint: 30.9 },
    7: { temperature: 33.9, precipitation: 165, humidity: 84, uvIndex: 11, windSpeed: 12, pressure: 1008, visibility: 11, dewPoint: 30.2 },
    8: { temperature: 33.5, precipitation: 155, humidity: 83, uvIndex: 10, windSpeed: 13, pressure: 1009, visibility: 13, dewPoint: 29.7 },
    9: { temperature: 32.1, precipitation: 185, humidity: 86, uvIndex: 9, windSpeed: 15, pressure: 1006, visibility: 8, dewPoint: 28.9 },
    10: { temperature: 29.8, precipitation: 125, humidity: 81, uvIndex: 8, windSpeed: 17, pressure: 1010, visibility: 14, dewPoint: 25.4 },
    11: { temperature: 26.9, precipitation: 68, humidity: 77, uvIndex: 7, windSpeed: 14, pressure: 1014, visibility: 17, dewPoint: 21.8 }
  }
};

// Datos de desastres por mes
export const yucatanDisasterData: Record<number, DisasterData> = {
  0: {
    hurricanes: { risk: 5, season: "Baja", lastMajor: "Wilma 2005", category: 0 },
    flooding: { risk: 15, areas: ["Mérida Centro"], season: "Nortes" },
    drought: { risk: 25, duration: 2, severity: "Leve" },
    cenoteImpact: { level: 92, affected: [] }
  },
  5: {
    hurricanes: { risk: 35, season: "Inicio", lastMajor: "Wilma 2005", category: 1 },
    flooding: { risk: 45, areas: ["Costa", "Progreso"], season: "Lluvias" },
    drought: { risk: 10, duration: 0, severity: "Ninguna" },
    cenoteImpact: { level: 95, affected: [] }
  },
  8: {
    hurricanes: { risk: 75, season: "Pico", lastMajor: "Wilma 2005", category: 3 },
    flooding: { risk: 65, areas: ["Costa", "Progreso", "Celestún"], season: "Lluvias" },
    drought: { risk: 5, duration: 0, severity: "Ninguna" },
    cenoteImpact: { level: 98, affected: [] }
  },
  10: {
    hurricanes: { risk: 25, season: "Final", lastMajor: "Wilma 2005", category: 1 },
    flooding: { risk: 35, areas: ["Valladolid"], season: "Nortes" },
    drought: { risk: 15, duration: 1, severity: "Leve" },
    cenoteImpact: { level: 94, affected: [] }
  }
};

// Datos agrícolas por mes
export const yucatanAgriculturalData: Record<number, AgriculturalData> = {
  0: {
    crops: {
      henequen: { health: 85, yield: 75 },
      corn: { health: 70, yield: 45 },
      citrus: { health: 90, yield: 85 },
      honey: { production: 80, quality: 95 }
    },
    soilMoisture: 45,
    pestRisk: 20
  },
  5: {
    crops: {
      henequen: { health: 95, yield: 90 },
      corn: { health: 85, yield: 80 },
      citrus: { health: 88, yield: 75 },
      honey: { production: 95, quality: 90 }
    },
    soilMoisture: 85,
    pestRisk: 45
  }
};

// Datos de biodiversidad
export const yucatanBiodiversityData: Record<number, BiodiversityData> = {
  0: {
    flamingos: { population: 15000, status: "Estable" },
    jaguars: { sightings: 12, habitat: 78 },
    butterflies: { species: 45, migration: "Inactiva" },
    cenotes: { waterLevel: 92, quality: "Excelente" },
    mangroves: { coverage: 85, health: 88 }
  },
  11: {
    flamingos: { population: 18500, status: "Creciendo" },
    jaguars: { sightings: 8, habitat: 80 },
    butterflies: { species: 38, migration: "Activa" },
    cenotes: { waterLevel: 89, quality: "Buena" },
    mangroves: { coverage: 86, health: 90 }
  }
};

// Datos de turismo
export const yucatanTourismData: Record<number, TourismData> = {
  0: {
    beachConditions: "Excelentes",
    archeologicalSites: { visitors: 125000, condition: "Óptima" },
    ecoTourism: { activity: 70, sustainability: 85 },
    weatherAlerts: []
  },
  8: {
    beachConditions: "Variables",
    archeologicalSites: { visitors: 89000, condition: "Limitada" },
    ecoTourism: { activity: 45, sustainability: 80 },
    weatherAlerts: ["Tormenta tropical", "Oleaje alto"]
  }
};

// Ubicaciones importantes en Yucatán
export const yucatanLocations = [
  { name: "Mérida", lat: 20.9674, lng: -89.5926, type: "capital" },
  { name: "Chichen Itzá", lat: 20.6843, lng: -88.5678, type: "archaeological" },
  { name: "Progreso", lat: 21.2830, lng: -89.6650, type: "coastal" },
  { name: "Valladolid", lat: 20.6897, lng: -88.2037, type: "colonial" },
  { name: "Celestún", lat: 20.8586, lng: -90.4014, type: "biosphere" },
  { name: "Río Lagartos", lat: 21.5997, lng: -88.1647, type: "biosphere" },
  { name: "Uxmal", lat: 20.3594, lng: -89.7714, type: "archaeological" },
  { name: "Cenote Dos Ojos", lat: 20.3333, lng: -87.3833, type: "cenote" },
  { name: "Izamal", lat: 20.9308, lng: -89.0225, type: "pueblo_magico" }
];