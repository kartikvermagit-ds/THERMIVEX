export type ClimateCategory = 'ALL' | 'PLUMES' | 'GHG_METHANE' | 'AQI_AIR' | 'THERMAL_FRP' | 'SATELLITE';

export type ClimateSeverity = 'CRITICAL' | 'ALERT' | 'NOMINAL' | 'ADVISORY' | 'INFO';

export interface ClimateUpdateItem {
  id: string;
  category: ClimateCategory;
  severity: ClimateSeverity;
  headline: string;
  corridorName: string;
  corridorCoords: [number, number]; // [lon, lat]
  corridorZoom?: number;
  timestamp: string;
  source: string;
  primaryMetric: {
    label: string;
    value: string;
    delta?: string;
    trend?: 'up' | 'down' | 'stable';
    color?: string;
  };
  details: {
    windVector?: string;
    plumeDispersionKm?: number;
    aqi?: number;
    co2eRateTonnePerHr?: number;
    ch4ColumnPpb?: number;
    stabilityClass?: string;
    inversionHeightM?: number;
    advisoryText: string;
  };
}

export interface ClimateQuickStats {
  windSpeedKmh: number;
  windBearing: string;
  totalEstCo2eFluxTph: number;
  ch4RegionalPpb: number;
  maxFRPAnomalyMw: number;
  activePlumesCount: number;
  glintSuppressionPct: number;
}
