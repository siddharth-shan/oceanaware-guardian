export const API_ENDPOINTS = {
  NIFC_BASE: 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services',
  OPENWEATHER_BASE: 'https://api.openweathermap.org/data/2.5',
  HUGGINGFACE_BASE: 'https://api-inference.huggingface.co/models'
};

export const FIRE_SEVERITY_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  EXTREME: 'Extreme'
};

export const FIRE_WEATHER_INDEX = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  EXTREME: 'EXTREME'
};

export const QUEST_CATEGORIES = {
  PREPARATION: 'preparation',
  PLANNING: 'planning',
  TECHNOLOGY: 'technology',
  ASSESSMENT: 'assessment',
  COMMUNITY: 'community'
};

export const CACHE_TIMEOUTS = {
  WEATHER: 5 * 60 * 1000, // 5 minutes
  FIRE_DATA: 1 * 60 * 1000, // 1 minute
  AI_ANALYSIS: 24 * 60 * 60 * 1000 // 24 hours
};

export const DEFAULT_LOCATIONS = {
  LOS_ANGELES: { lat: 34.0522, lng: -118.2437 },
  SAN_FRANCISCO: { lat: 37.7749, lng: -122.4194 },
  SACRAMENTO: { lat: 38.5816, lng: -121.4944 }
};